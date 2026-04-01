# ClassNames Go

[![PRS Welcome](https://img.shields.io/badge/PRs-welcome-blue)](https://github.com/AdoKevinVSCE/vscode-classnames-go/pulls)
[![Stars Welcome](https://img.shields.io/badge/Stars%20Welcome-8A2BE2)](https://github.com/AdoKevinVSCE/vscode-classnames-go)

<p align="center">
  <a href="https://github.com/AdoKevinVSCE/vscode-classnames-go">
    <img width="200" src="https://raw.githubusercontent.com/AdoKevinVSCE/vscode-classnames-go/main/res/icon-2x.png">
  </a>
</p>

**Language / 语言:** [English](#english) | [中文](#中文)

---

# English

## Introduction

**ClassNames Go** is a VS Code extension designed to assist developers in wrapping classname strings or to classNames() or clsx() or adding className attribute with classnames or clsx in React files.

It simplifies the process of wrapping class strings with the `classnames` or `clsx` library, allowing you to easily combine static Tailwind classes with dynamic CSS Module classes.

## Features

- **🔄 One-Command Conversion**: Convert `className="..."` to `className={classNames("...")}` or `className={clsx("...")}` instantly.
- **📦 Auto Import**: Automatically detects if `classnames` or `clsx` is imported. If not, it adds `import classNames from 'classnames'` to the top of your file.
- **🎯 Migration Ready**: Perfect for projects introducing Tailwind CSS into an existing CSS Modules architecture.

## Usage

1. Open a React file (`.tsx` or `.jsx`).
2. Select the `className` attribute or place your cursor on it.

   ```jsx
   // Before
   <div className="container flex-row"></div>
   ```

3. Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`).
4. Search and select **`ClassNames Go: Convert to ClassNames`** (Command ID: `classnames-go.go`).
5. The code will be transformed, and the import will be added if missing.

   ```jsx
   // After
   import classNames from 'classnames';

   // ...
   <div className={classNames('container flex-row')}></div>;
   ```

## Commands

| Command            | Description                                                      |
| :----------------- | :--------------------------------------------------------------- |
| `classnames-go.go` | Convert selected className string to classNames function wrapper |

## Requirements

- Make sure the `classnames` package is installed in your project:

  ```bash
  npm install classnames
  # or
  yarn add classnames
  ```

---

# 中文

## 简介

**ClassNames Go** 是一款 VS Code 插件，旨在帮助开发者为 React 文件添加 className 属性，将 classname 字符串包裹为 `classNames()` 或者 `clsx()` 或者添加 className 并使用 `classnames` 或者 `clsx`。

它简化了使用 `classnames` 库包裹类名字符串的过程，让您可以轻松地将静态 Tailwind 类与动态 CSS Module 类结合起来。

## 功能特性

- **🔄 一键转换**：瞬间将 `className="..."` 转换为 `className={classNames("...")}` 或者 ``className={clsx("...")}`。
- **📦 自动导入**：自动检测是否已导入 `classnames`。如果没有，它会自动在文件顶部添加 `import classNames from 'classnames'`。
- **🎯 迁移就绪**：非常适合在现有的 CSS Modules 架构中引入 Tailwind CSS 的项目。

## 使用方法

1. 打开一个 React 文件 (`.tsx` 或 `.jsx`)。
2. 选中 `className` 属性或将光标放在该属性上。

   ```jsx
   // 转换前
   <div className="container flex-row"></div>
   ```

3. 打开命令面板 (`Ctrl+Shift+P` / `Cmd+Shift+P`)。
4. 搜索并选择 **`ClassNames Go: Convert to ClassNames`** (命令 ID: `classnames-go.go`)。
5. 代码将被转换，如果缺少导入语句，插件会自动添加。

   ```jsx
   // 转换后
   import classNames from 'classnames';

   // ...
   <div className={classNames('container flex-row')}></div>;
   ```

## 命令列表

| 命令               | 描述                                                    |
| :----------------- | :------------------------------------------------------ |
| `classnames-go.go` | 将选中的 className 字符串转换为 classNames 函数包裹形式 |

## 前置要求

- 请确保您的项目中已安装 `classnames` 包：

  ```bash
  npm install classnames
  # 或
  yarn add classnames
  ```

## License

[MIT](./LICENSE) License © 2026 [Kevin Law](https://github.com/AdoKevin)

## Links

- [Repository](https://github.com/AdoKevinVSCE/classnames-go)
- [Issues](https://github.com/AdoKevinVSCE/classnames-go/issues)
- [Marketplace](https://marketplace.visualstudio.com/items?itemName=classnames-go)
