import {
  type JsxElement,
  type JsxOpeningElement,
  JsxSelfClosingElement,
  type SourceFile,
  SyntaxKind,
} from 'ts-morph';

export function getNearestElement(sourceFile: SourceFile, cursorOffset: number) {
  const jsxElements = sourceFile.getDescendantsOfKind(SyntaxKind.JsxElement);
  const selfClosingJsxElements = sourceFile.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement);
  const allJsxElements = [...jsxElements, ...selfClosingJsxElements];

  const matchElements: {
    start: number;
    end: number;
    element: JsxOpeningElement | JsxSelfClosingElement;
  }[] = [];

  for (const element of allJsxElements) {
    let targetElement: JsxOpeningElement | JsxSelfClosingElement | null = null;

    const wrappedElement = wrapJsxElement(element);

    if (wrappedElement.getStart() <= cursorOffset && wrappedElement.getEnd() >= cursorOffset) {
      targetElement = wrappedElement;
    }

    if (targetElement) {
      matchElements.push({
        start: targetElement.getStart(),
        end: targetElement.getEnd(),
        element: targetElement,
      });
    }
  }

  if (matchElements.length > 0) {
    matchElements.sort((a, b) => a.end - a.start - (b.end - b.start));
    return matchElements[0].element;
  }

  return null;
}

function wrapJsxElement(element: JsxElement | JsxSelfClosingElement) {
  if (element instanceof JsxSelfClosingElement) {
    return element;
  } else {
    return element.getOpeningElement();
  }
}
