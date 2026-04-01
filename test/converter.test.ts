import { describe, it, expect } from 'vitest';
import { createSourceFile } from '../src/project';
import {
  analyzeAndConvert,
  needsImport,
  calculateImportInsertion,
  insertImportStatement,
} from '../src/converter';
import { JsxAttribute, JsxElement, SyntaxKind, type Node } from 'ts-morph';

// Helper function to get className initializer node from code
function getClassNameInitializer(code: string): Node | null {
  const sourceFile = createSourceFile(code);
  const jsxElements = [
    ...sourceFile.getDescendantsOfKind(SyntaxKind.JsxElement),
    ...sourceFile.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement),
  ];

  for (const element of jsxElements) {
    const openingElement = element instanceof JsxElement ? element.getOpeningElement() : element;
    const attributes = openingElement.getAttributes();

    for (const attr of attributes) {
      if (attr instanceof JsxAttribute) {
        const nameNode = attr.getFirstChildByKind(SyntaxKind.Identifier);
        if (nameNode?.getText() === 'className') {
          const initializer = attr.getInitializer();
          if (initializer) {
            return initializer;
          }
        }
      }
    }
  }
  return null;
}

describe('analyzeAndConvert', () => {
  describe('string literal conversion', () => {
    it('should convert simple string literal className', () => {
      const code = `<div className="container">Text</div>`;
      const node = getClassNameInitializer(code);
      const result = analyzeAndConvert(node!, 'classNames');

      expect(result.shouldConvert).toBe(true);
      expect(result.newValue).toBe('{classNames("container")}');
    });

    it('should convert string literal with multiple classes', () => {
      const code = `<div className="container flex-row bg-blue-500">Text</div>`;
      const node = getClassNameInitializer(code);
      const result = analyzeAndConvert(node!, 'classNames');

      expect(result.shouldConvert).toBe(true);
      expect(result.newValue).toBe('{classNames("container flex-row bg-blue-500")}');
    });

    it('should convert empty string className', () => {
      const code = `<div className="">Text</div>`;
      const node = getClassNameInitializer(code);
      const result = analyzeAndConvert(node!, 'classNames');

      expect(result.shouldConvert).toBe(true);
      expect(result.newValue).toBe('{classNames("")}');
    });

    it('should convert single quotes string literal', () => {
      const code = `<div className='container'>Text</div>`;
      const node = getClassNameInitializer(code);
      const result = analyzeAndConvert(node!, 'classNames');

      expect(result.shouldConvert).toBe(true);
      expect(result.newValue).toBe("{classNames('container')}");
    });
  });

  describe('JSX expression conversion', () => {
    it('should convert string expression className', () => {
      const code = `<div className={"container"}>Text</div>`;
      const node = getClassNameInitializer(code);
      const result = analyzeAndConvert(node!, 'classNames');

      expect(result.shouldConvert).toBe(true);
      expect(result.newValue).toBe('{classNames("container")}');
    });

    it('should convert binary expression className', () => {
      const code = `<div className={'foo' + 'bar'}>Text</div>`;
      const node = getClassNameInitializer(code);
      const result = analyzeAndConvert(node!, 'classNames');

      expect(result.shouldConvert).toBe(true);
      expect(result.newValue).toBe("{classNames('foo' + 'bar')}");
    });

    it('should convert template expression className', () => {
      const code = '<div className={`container ${dynamic}`}>Text</div>';
      const node = getClassNameInitializer(code);
      const result = analyzeAndConvert(node!, 'classNames');

      expect(result.shouldConvert).toBe(true);
      expect(result.newValue).toBe('{classNames(`container ${dynamic}`)}');
    });
  });

  describe('already using function', () => {
    it('should not convert if already using classNames', () => {
      const code = `<div className={classNames('container')}>Text</div>`;
      const node = getClassNameInitializer(code);
      const result = analyzeAndConvert(node!, 'classNames');

      expect(result.shouldConvert).toBe(false);
      expect(result.reason).toBe('Already using classNames function.');
    });

    it('should not convert if using clsx and function name is clsx', () => {
      const code = `<div className={clsx('container')}>Text</div>`;
      const node = getClassNameInitializer(code);
      const result = analyzeAndConvert(node!, 'clsx');

      expect(result.shouldConvert).toBe(false);
      expect(result.reason).toBe('Already using clsx function.');
    });

    it('should convert if using different function name (classNames -> clsx)', () => {
      const code = `<div className={classNames('container')}>Text</div>`;
      const node = getClassNameInitializer(code);
      const result = analyzeAndConvert(node!, 'clsx');

      // Should convert since classNames is not clsx
      expect(result.shouldConvert).toBe(true);
      expect(result.newValue).toBe("{clsx(classNames('container'))}");
    });
  });

  describe('complex expressions', () => {
    it('should handle conditional expression inside className', () => {
      const code = `<div className={isActive ? 'active' : 'inactive'}>Text</div>`;
      const node = getClassNameInitializer(code);
      const result = analyzeAndConvert(node!, 'classNames');

      expect(result.shouldConvert).toBe(true);
    });

    it('should handle variable reference', () => {
      const code = `<div className={myClassName}>Text</div>`;
      const node = getClassNameInitializer(code);
      const result = analyzeAndConvert(node!, 'classNames');

      expect(result.shouldConvert).toBe(true);
      expect(result.newValue).toBe('{classNames(myClassName)}');
    });

    it('should handle object expression', () => {
      const code = `<div className={{ active: true }}>Text</div>`;
      const node = getClassNameInitializer(code);
      const result = analyzeAndConvert(node!, 'classNames');

      expect(result.shouldConvert).toBe(true);
      expect(result.newValue).toBe('{classNames({ active: true })}');
    });

    it('should handle array expression', () => {
      const code = `<div className={['foo', 'bar']}>Text</div>`;
      const node = getClassNameInitializer(code);
      const result = analyzeAndConvert(node!, 'classNames');

      expect(result.shouldConvert).toBe(true);
      expect(result.newValue).toBe("{classNames(['foo', 'bar'])}");
    });
  });

  describe('custom function name', () => {
    it('should use custom function name "clsx" in conversion', () => {
      const code = `<div className="container">Text</div>`;
      const node = getClassNameInitializer(code);
      const result = analyzeAndConvert(node!, 'clsx');

      expect(result.shouldConvert).toBe(true);
      expect(result.newValue).toBe('{clsx("container")}');
    });

    it('should use custom function name "cn"', () => {
      const code = `<div className="container">Text</div>`;
      const node = getClassNameInitializer(code);
      const result = analyzeAndConvert(node!, 'cn');

      expect(result.shouldConvert).toBe(true);
      expect(result.newValue).toBe('{cn("container")}');
    });
  });

  describe('edge cases', () => {
    it('should handle className with special characters (Tailwind)', () => {
      const code = `<div className="text-2xl hover:bg-blue-500 dark:text-white">Text</div>`;
      const node = getClassNameInitializer(code);
      const result = analyzeAndConvert(node!, 'classNames');

      expect(result.shouldConvert).toBe(true);
      expect(result.newValue).toBe('{classNames("text-2xl hover:bg-blue-500 dark:text-white")}');
    });

    it('should handle className with CSS modules', () => {
      const code = `<div className={styles.container}>Text</div>`;
      const node = getClassNameInitializer(code);
      const result = analyzeAndConvert(node!, 'classNames');

      expect(result.shouldConvert).toBe(true);
      expect(result.newValue).toBe('{classNames(styles.container)}');
    });
  });
});

describe('needsImport', () => {
  it('should return true when no import exists', () => {
    const code = `const App = () => <div>Text</div>`;
    const sourceFile = createSourceFile(code);
    expect(needsImport(sourceFile, 'classNames')).toBe(true);
  });

  it('should return false when default import exists', () => {
    const code = `import classNames from 'classnames';
const App = () => <div>Text</div>`;
    const sourceFile = createSourceFile(code);
    expect(needsImport(sourceFile, 'classNames')).toBe(false);
  });

  it('should return false when named import exists', () => {
    const code = `import { classNames } from 'classnames';
const App = () => <div>Text</div>`;
    const sourceFile = createSourceFile(code);
    expect(needsImport(sourceFile, 'classNames')).toBe(false);
  });

  it('should return false when import with alias exists', () => {
    const code = `import { clsx as classNames } from 'clsx';
const App = () => <div>Text</div>`;
    const sourceFile = createSourceFile(code);
    expect(needsImport(sourceFile, 'classNames')).toBe(false);
  });
});

describe('calculateImportInsertion', () => {
  it('should return null when import already exists', () => {
    const code = `import classNames from 'classnames';
const App = () => <div>Text</div>`;
    const sourceFile = createSourceFile(code);
    const result = calculateImportInsertion(sourceFile, 'classNames', 'classnames');
    expect(result).toBeNull();
  });

  it('should insert at line 0 for simple file', () => {
    const code = `const App = () => <div>Text</div>`;
    const sourceFile = createSourceFile(code);
    const result = calculateImportInsertion(sourceFile, 'classNames', 'classnames');
    expect(result).not.toBeNull();
    expect(result!.line).toBe(0);
    expect(result!.statement).toBe("import classNames from 'classnames';\n");
  });

  it('should insert after existing imports', () => {
    const code = `import React from 'react';
import { useState } from 'react';

const App = () => <div>Text</div>`;
    const sourceFile = createSourceFile(code);
    const result = calculateImportInsertion(sourceFile, 'classNames', 'classnames');
    expect(result).not.toBeNull();
    expect(result!.line).toBe(2);
  });

  it('should insert after "use client" directive', () => {
    const code = `'use client';

const App = () => <div>Text</div>`;
    const sourceFile = createSourceFile(code);
    const result = calculateImportInsertion(sourceFile, 'classNames', 'classnames');
    expect(result).not.toBeNull();
    expect(result!.line).toBe(1);
  });

  it('should insert after "use server" directive', () => {
    const code = `"use server";

const App = () => <div>Text</div>`;
    const sourceFile = createSourceFile(code);
    const result = calculateImportInsertion(sourceFile, 'classNames', 'classnames');
    expect(result).not.toBeNull();
    expect(result!.line).toBe(1);
  });

  it('should insert after directive and existing imports', () => {
    const code = `'use client';
import React from 'react';

const App = () => <div>Text</div>`;
    const sourceFile = createSourceFile(code);
    const result = calculateImportInsertion(sourceFile, 'classNames', 'classnames');
    expect(result).not.toBeNull();
    expect(result!.line).toBe(2);
  });

  it('should use custom function and package names', () => {
    const code = `const App = () => <div>Text</div>`;
    const sourceFile = createSourceFile(code);
    const result = calculateImportInsertion(sourceFile, 'clsx', 'clsx');
    expect(result).not.toBeNull();
    expect(result!.statement).toBe("import clsx from 'clsx';\n");
  });
});

describe('insertImportStatement', () => {
  it('should insert import at the beginning of file', () => {
    const code = `const App = () => <div>Text</div>`;
    const sourceFile = createSourceFile(code);
    const result = insertImportStatement(sourceFile, 'classNames', 'classnames');
    expect(result).toBe(`import classNames from 'classnames';
const App = () => <div>Text</div>`);
  });

  it('should not duplicate import if already exists', () => {
    const code = `import classNames from 'classnames';
const App = () => <div>Text</div>`;
    const sourceFile = createSourceFile(code);
    const result = insertImportStatement(sourceFile, 'classNames', 'classnames');
    expect(result).toBe(code);
  });

  it('should insert after existing imports', () => {
    const code = `import React from 'react';

const App = () => <div>Text</div>`;
    const sourceFile = createSourceFile(code);
    const result = insertImportStatement(sourceFile, 'classNames', 'classnames');
    expect(result).toBe(`import React from 'react';
import classNames from 'classnames';

const App = () => <div>Text</div>`);
  });

  it('should insert after "use client" directive', () => {
    const code = `'use client';

const App = () => <div>Text</div>`;
    const sourceFile = createSourceFile(code);
    const result = insertImportStatement(sourceFile, 'classNames', 'classnames');
    expect(result).toBe(`'use client';
import classNames from 'classnames';

const App = () => <div>Text</div>`);
  });

  it('should handle multiple existing imports', () => {
    const code = `import React from 'react';
import { useState, useEffect } from 'react';
import styles from './styles.module.css';

const App = () => <div>Text</div>`;
    const sourceFile = createSourceFile(code);
    const result = insertImportStatement(sourceFile, 'classNames', 'classnames');
    expect(result).toBe(`import React from 'react';
import { useState, useEffect } from 'react';
import styles from './styles.module.css';
import classNames from 'classnames';

const App = () => <div>Text</div>`);
  });
});
