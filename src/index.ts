import { JsxAttribute, type SourceFile } from 'ts-morph';
import * as vscode from 'vscode';
import { Selection } from 'vscode';
import { getNearestElement } from './astHelper';
import { analyzeAndConvert, calculateImportInsertion } from './converter';
import { createSourceFile } from './project';

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('classnames-go.go', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showInformationMessage('No active editor found.');
      return;
    }

    const document = editor.document;
    const cursorPosition = editor.selection.active;
    const cursorOffset = document.offsetAt(cursorPosition);
    const fileText = document.getText();

    try {
      const sourceFile = createSourceFile(fileText);
      const nearestElement = getNearestElement(sourceFile, cursorOffset);

      if (nearestElement) {
        const targetAttribute = nearestElement
          .getAttributes()
          .find(
            (attr) => attr instanceof JsxAttribute && attr.getNameNode().getText() === 'className'
          ) as JsxAttribute | undefined;

        const config = vscode.workspace.getConfiguration('classnames-go');
        const functionName = config.get<string>('functionName') || 'classNames';
        const packageName = config.get<string>('packageName') || 'classnames';
        const autoImport = config.get<boolean>('autoImport') ?? true;

        if (!targetAttribute) {
          if (autoImport) {
            const position = document.positionAt(nearestElement.getTagNameNode().getEnd());
            await editor.edit((editBuilder) => {
              editBuilder.insert(position, ` className={${functionName}("")}`);
            });
            editor.selection = new Selection(
              position.translate(0, 12 + functionName.length + 2),
              position.translate(0, 12 + functionName.length + 2)
            );
            await addClassNamesImport(editor, functionName, packageName, sourceFile);
          }
          return;
        } else {
          // 分析 className 的值
          const initializer = targetAttribute.getInitializer();
          if (!initializer) {
            vscode.window.showWarningMessage('className attribute has no value.');
            return;
          }

          const conversionResult = analyzeAndConvert(initializer, functionName);

          if (!conversionResult.shouldConvert) {
            vscode.window.showInformationMessage(
              conversionResult.reason || 'No conversion needed.'
            );
            return;
          }

          // 执行替换
          const editStart = initializer.getPos();
          const editEnd = initializer.getEnd();
          const range = new vscode.Range(
            document.positionAt(editStart),
            document.positionAt(editEnd)
          );

          await editor.edit((editBuilder) => {
            if (conversionResult.newValue) {
              editBuilder.replace(range, conversionResult.newValue);
            }
          });

          if (conversionResult.newValue) {
            const newAnchorPosition = editStart + conversionResult.newValue.length - 2;
            editor.selection = new Selection(
              document.positionAt(newAnchorPosition),
              document.positionAt(newAnchorPosition)
            );

            // 自动添加 import
            if (autoImport) {
              await addClassNamesImport(editor, functionName, packageName, sourceFile);
            }
          }
        }
      } else {
        vscode.window.showInformationMessage('No nearest element found.');
      }
    } catch (error) {
      console.error('Conversion error:', error);
      vscode.window.showErrorMessage(
        'Failed to convert className. Check output panel for details.'
      );
    }
  });

  context.subscriptions.push(disposable);
}

async function addClassNamesImport(
  editor: vscode.TextEditor,
  functionName: string,
  packageName: string,
  sourceFile: SourceFile
) {
  const insertion = calculateImportInsertion(sourceFile, functionName, packageName);

  if (!insertion) {
    return;
  }

  const position = new vscode.Position(insertion.line, 0);
  await editor.edit((editBuilder) => {
    editBuilder.insert(position, insertion.statement);
  });
}
