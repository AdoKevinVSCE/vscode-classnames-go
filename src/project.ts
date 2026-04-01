import { Project } from 'ts-morph';

// 缓存 Project 实例，避免重复创建
let project: Project | null = null;

export function createSourceFile(text: string) {
  const project = getProject();
  // 添加或更新文件到内存文件系统
  const sourceFile = project.createSourceFile('index.tsx', text, { overwrite: true });
  return sourceFile;
}

function getProject(): Project {
  if (!project) {
    project = new Project({
      useInMemoryFileSystem: true,
      compilerOptions: {
        jsx: 2, // JSX Preserve
        esModuleInterop: true,
        allowJs: true,
      },
    });
  }
  return project;
}
