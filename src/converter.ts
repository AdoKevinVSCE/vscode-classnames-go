import { type Node, SyntaxKind, type SourceFile } from 'ts-morph';

export interface ConversionResult {
  shouldConvert: boolean;
  newValue?: string;
  reason?: string;
}

export function analyzeAndConvert(node: Node, functionName: string): ConversionResult {
  const kind = node.getKindName();

  // 检查是否已经是函数调用
  const callExpr = node.getFirstChildByKind(SyntaxKind.CallExpression);
  if (callExpr) {
    const callText = callExpr.getText();
    if (callText.includes(functionName)) {
      return {
        shouldConvert: false,
        reason: `Already using ${functionName} function.`,
      };
    }
  }

  // className="container"
  if (kind === 'StringLiteral') {
    const value = node.getText(); // 包含引号，如 "container"
    return {
      shouldConvert: true,
      newValue: `{${functionName}(${value})}`,
    };
  }

  // className={'aa' + 'bb'}
  if (kind === 'JsxExpression') {
    const expr =
      node.getFirstChildByKind(SyntaxKind.BinaryExpression) ||
      node.getFirstChildByKind(SyntaxKind.StringLiteral) ||
      node.getFirstChildByKind(SyntaxKind.TemplateExpression);

    if (expr) {
      const value = expr.getText();
      return {
        shouldConvert: true,
        newValue: `{${functionName}(${value})}`,
      };
    }

    // fallback to extract inner text
    if (
      node.getFirstChild()?.getKind() === SyntaxKind.OpenBraceToken &&
      node.getLastChild()?.getKind() === SyntaxKind.CloseBraceToken
    ) {
      const value = node.getText();
      return {
        shouldConvert: true,
        newValue: `{${functionName}(${value.slice(1, -1)})}`,
      };
    }

    return {
      shouldConvert: false,
      reason: 'className is a complex expression.',
    };
  }

  return {
    shouldConvert: false,
    reason: 'className is not a simple string literal.',
  };
}

/**
 * 检查是否需要添加 import 语句
 */
export function needsImport(sourceFile: SourceFile, functionName: string): boolean {
  const importDeclarations = sourceFile.getImportDeclarations();

  // 检查是否已经导入了该函数
  for (const importDecl of importDeclarations) {
    // 检查默认导入: import classNames from 'classnames'
    const defaultImport = importDecl.getDefaultImport();
    if (defaultImport && defaultImport.getText() === functionName) {
      return false;
    }

    // 检查命名导入: import { classNames } from 'classnames'
    // 或带别名: import { clsx as classNames } from 'clsx'
    const namedImports = importDecl.getNamedImports();
    for (const namedImport of namedImports) {
      // 检查原始名称
      if (namedImport.getName() === functionName) {
        return false;
      }
      // 检查别名
      const aliasNode = namedImport.getAliasNode();
      if (aliasNode && aliasNode.getText() === functionName) {
        return false;
      }
    }

    // 检查命名空间导入: import * as classNames from 'classnames'
    const namespaceImport = importDecl.getNamespaceImport();
    if (namespaceImport && namespaceImport.getText() === functionName) {
      return false;
    }
  }

  return true;
}

/**
 * 计算添加 import 语句的位置和内容
 */
export interface ImportInsertion {
  line: number;
  statement: string;
}

export function calculateImportInsertion(
  sourceFile: SourceFile,
  functionName: string,
  packageName: string
): ImportInsertion | null {
  // 如果不需要添加 import，返回 null
  if (!needsImport(sourceFile, functionName)) {
    return null;
  }

  // 获取所有 import 声明
  const importDeclarations = sourceFile.getImportDeclarations();

  if (importDeclarations.length === 0) {
    // 没有 import 语句，检查是否有 'use client' / 'use server' 指令
    let insertLine = 0;
    const statements = sourceFile.getStatements();

    for (const statement of statements) {
      // 检查是否是 'use client' 或 'use server' 指令
      if (statement.getKind() === SyntaxKind.ExpressionStatement) {
        const expr = statement.asKind(SyntaxKind.ExpressionStatement);
        if (expr) {
          const stringLiteral = expr.getExpression();
          if (stringLiteral.getKind() === SyntaxKind.StringLiteral) {
            const value = stringLiteral.asKind(SyntaxKind.StringLiteral)?.getLiteralValue();
            if (value === 'use client' || value === 'use server') {
              insertLine = expr.getEndLineNumber();
              continue;
            }
          }
        }
      }
      // 遇到非指令语句就停止
      break;
    }

    return {
      line: insertLine,
      statement: `import ${functionName} from '${packageName}';\n`,
    };
  }

  // 找到最后一个 import 语句的结束位置
  const lastImport = importDeclarations[importDeclarations.length - 1];
  const endLine = lastImport.getEndLineNumber();

  return {
    line: endLine,
    statement: `import ${functionName} from '${packageName}';\n`,
  };
}

/**
 * 在文本中插入 import 语句
 */
export function insertImportStatement(
  sourceFile: SourceFile,
  functionName: string,
  packageName: string
): string {
  const insertion = calculateImportInsertion(sourceFile, functionName, packageName);
  if (!insertion) {
    return sourceFile.getFullText();
  }

  const lines = sourceFile.getFullText().split('\n');
  lines.splice(insertion.line, 0, insertion.statement.trimEnd());
  return lines.join('\n');
}
