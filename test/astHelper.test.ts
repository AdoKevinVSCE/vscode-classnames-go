import { JsxAttribute } from 'ts-morph';
import { describe, expect, it } from 'vitest';
import { getNearestElement } from '../src/astHelper';
import { createSourceFile } from '../src/project';

describe('getNearestElement', () => {
  describe('basic JSX element detection', () => {
    it('should find a simple JSX element at cursor position', () => {
      const code = `const App = () => <div className="container">Hello</div>`;
      const sourceFile = createSourceFile(code);
      const element = getNearestElement(sourceFile, code.indexOf('className'));
      expect(element).not.toBeNull();
      expect(element?.getTagNameNode().getText()).toBe('div');
    });

    it('should find self-closing JSX element', () => {
      const code = `const App = () => <input className="input" />`;
      const sourceFile = createSourceFile(code);
      const element = getNearestElement(sourceFile, code.indexOf('className'));
      expect(element).not.toBeNull();
      expect(element?.getTagNameNode().getText()).toBe('input');
    });

    it('should return null when no element at cursor position', () => {
      const code = `const x = 1;`;
      const sourceFile = createSourceFile(code);
      const element = getNearestElement(sourceFile, 5);
      expect(element).toBeNull();
    });
  });

  describe('nested JSX elements', () => {
    it('should find the innermost nested element', () => {
      const code = `<div><span className="text">Hello</span></div>`;
      const sourceFile = createSourceFile(code);
      const element = getNearestElement(sourceFile, code.indexOf('className'));
      expect(element?.getTagNameNode().getText()).toBe('span');
    });

    it('should find outer element when cursor is outside inner element', () => {
      const code = `<div className="outer"><span>Hello</span></div>`;
      const sourceFile = createSourceFile(code);
      const element = getNearestElement(sourceFile, code.indexOf('outer'));
      expect(element?.getTagNameNode().getText()).toBe('div');
    });

    it('should handle deeply nested elements', () => {
      const code = `<div><section><article><p className="deep">Text</p></article></section></div>`;
      const sourceFile = createSourceFile(code);
      const element = getNearestElement(sourceFile, code.indexOf('deep'));
      expect(element?.getTagNameNode().getText()).toBe('p');
    });
  });

  describe('multiple JSX elements', () => {
    it('should find the correct element among siblings', () => {
      const code = `<div className="first" /><div className="second" />`;
      const sourceFile = createSourceFile(code);
      const element = getNearestElement(sourceFile, code.indexOf('second'));
      expect(element?.getTagNameNode().getText()).toBe('div');
      const attr = element?.getAttributes().find((a) => a.getText().includes('second'));
      expect(attr).toBeDefined();
    });
  });

  describe('JSX elements without className', () => {
    it('should find element even without className attribute', () => {
      const code = `<div>Hello World</div>`;
      const sourceFile = createSourceFile(code);
      const element = getNearestElement(sourceFile, code.indexOf('Hello'));
      expect(element).not.toBeNull();
      expect(element?.getTagNameNode().getText()).toBe('div');
    });
  });

  describe('edge cases', () => {
    it('should handle cursor at element start', () => {
      const code = `<div className="test">Content</div>`;
      const sourceFile = createSourceFile(code);
      const element = getNearestElement(sourceFile, code.indexOf('<div'));
      expect(element).not.toBeNull();
    });

    it('should handle cursor inside element content', () => {
      const code = `<div className="test">Content</div>`;
      const sourceFile = createSourceFile(code);
      const element = getNearestElement(sourceFile, code.indexOf('Content'));
      expect(element).not.toBeNull();
    });

    it('should handle JSX with custom components', () => {
      const code = `<CustomComponent className="custom" />`;
      const sourceFile = createSourceFile(code);
      const element = getNearestElement(sourceFile, code.indexOf('className'));
      expect(element?.getTagNameNode().getText()).toBe('CustomComponent');
    });
  });
});

describe('getNearestElement with className attribute access', () => {
  it('should be able to access className attribute from found element', () => {
    const code = `<div className="test-class">Content</div>`;
    const sourceFile = createSourceFile(code);
    const element = getNearestElement(sourceFile, code.indexOf('className'));

    const classNameAttr = element
      ?.getAttributes()
      .find(
        (attr) => attr instanceof JsxAttribute && attr.getNameNode().getText() === 'className'
      ) as JsxAttribute | undefined;

    expect(classNameAttr).toBeDefined();
    expect(classNameAttr?.getInitializer()?.getText()).toBe('"test-class"');
  });

  it('should return undefined for className when not present', () => {
    const code = `<div>Content</div>`;
    const sourceFile = createSourceFile(code);
    const element = getNearestElement(sourceFile, 0);

    const classNameAttr = element
      ?.getAttributes()
      .find(
        (attr) => attr instanceof JsxAttribute && attr.getNameNode().getText() === 'className'
      ) as JsxAttribute | undefined;

    expect(classNameAttr).toBeUndefined();
  });

  it('should access multiple attributes correctly', () => {
    const code = `<div id="main" className="container" data-testid="test">Content</div>`;
    const sourceFile = createSourceFile(code);
    const element = getNearestElement(sourceFile, 0);

    const attributes = element?.getAttributes() ?? [];
    expect(attributes.length).toBe(3);

    const idAttr = attributes.find(
      (attr) => attr instanceof JsxAttribute && attr.getNameNode().getText() === 'id'
    ) as JsxAttribute | undefined;
    expect(idAttr?.getInitializer()?.getText()).toBe('"main"');

    const classNameAttr = attributes.find(
      (attr) => attr instanceof JsxAttribute && attr.getNameNode().getText() === 'className'
    ) as JsxAttribute | undefined;
    expect(classNameAttr?.getInitializer()?.getText()).toBe('"container"');
  });
});
