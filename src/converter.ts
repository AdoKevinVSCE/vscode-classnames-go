import { type Node, SyntaxKind } from 'ts-morph';

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
export function needsImport(text: string, functionName: string): boolean {
  const importPatterns = [
    new RegExp(`import\\s+.*${functionName}.*from`, 'i'),
    new RegExp(`import\\s+{.*${functionName}.*}\\s+from`, 'i'),
    new RegExp(`import\\s+${functionName}\\s+from`, 'i'),
  ];

  return !importPatterns.some((pattern) => pattern.test(text));
}

/**
 * 计算添加 import 语句的位置和内容
 */
export interface ImportInsertion {
  line: number;
  statement: string;
}

export function calculateImportInsertion(
  text: string,
  functionName: string,
  packageName: string
): ImportInsertion | null {
  // 如果不需要添加 import，返回 null
  if (!needsImport(text, functionName)) {
    return null;
  }

  const lines = text.split('\n');
  let insertLine = 0;

  // 跳过 'use client' / 'use server' 指令
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    if (lines[i].trim().startsWith("'use ") || lines[i].trim().startsWith('"use ')) {
      insertLine = i + 1;
    } else if (lines[i].trim().startsWith('import')) {
      insertLine = i + 1;
    } else {
      break;
    }
  }

  return {
    line: insertLine,
    statement: `import ${functionName} from '${packageName}';\n`,
  };
}

/**
 * 在文本中插入 import 语句
 */
export function insertImportStatement(
  text: string,
  functionName: string,
  packageName: string
): string {
  const insertion = calculateImportInsertion(text, functionName, packageName);
  if (!insertion) {
    return text;
  }

  const lines = text.split('\n');
  lines.splice(insertion.line, 0, insertion.statement.trimEnd());
  return lines.join('\n');
}
