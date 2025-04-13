export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  content?: string;
  selected?: boolean;
}

// Check if a directory is a Git repository
export function isGitRepository(fileList: FileList): boolean {
  // Look for a .git directory
  return Array.from(fileList).some(file =>
    file.webkitRelativePath.split('/')[1] === '.git'
  );
}

const DEFAULT_IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  '.DS_Store',
  '*.log',
  '.env',
  '.env.local',
  '.env.development',
  '.env.test',
  '.env.production',
  'dist',
  'build',
  'coverage',
  '.next',
  '.cache',
  '.idea',
  '.vscode',
  '*.min.js',
  '*.min.css',
  '*.lock',
  'package-lock.json',
  'yarn.lock',
  'npm-debug.log*',
  'yarn-debug.log*',
  'yarn-error.log*',
  '*.tsbuildinfo',
  '*.swp',
  '*.bak',
  '*.tmp'
];

// Parse gitignore file
export async function parseGitignore(fileList: FileList): Promise<string[]> {
  const gitignoreFile = Array.from(fileList).find(file =>
    file.webkitRelativePath.endsWith('/.gitignore')
  );

  let ignorePatterns = [...DEFAULT_IGNORE_PATTERNS];

  if (gitignoreFile) {
    const content = await readFileContent(gitignoreFile);
    const customPatterns = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));

    // Combine default patterns with patterns from .gitignore
    ignorePatterns = [...ignorePatterns, ...customPatterns];
  }

  return ignorePatterns;
}

function shouldIgnore(path: string, ignorePatterns: string[]): boolean {
  const normalizedPath = path.startsWith('/') ? path.substring(1) : path;

  // Special case: always ignore node_modules and .git directories
  if (
    normalizedPath === 'node_modules' || 
    normalizedPath.startsWith('node_modules/') ||
    normalizedPath === '.git' || 
    normalizedPath.startsWith('.git/')
  ) {
    return true;
  }

  return ignorePatterns.some(pattern => {
    const cleanPattern = pattern.replace(/^\/|\/$/g, '');
    if (normalizedPath === cleanPattern) {
      return true;
    }
    if (pattern.endsWith('/') && normalizedPath.startsWith(cleanPattern)) {
      return true;
    }
    if (pattern.startsWith('*.')) {
      const extension = pattern.substring(1);
      return normalizedPath.endsWith(extension);
    }
    if (pattern.startsWith('**/')) {
      const subPattern = pattern.substring(3);
      return normalizedPath.includes(subPattern) || normalizedPath.endsWith(subPattern);
    }
    if (pattern.endsWith('/**')) {
      const subPattern = pattern.substring(0, pattern.length - 3);
      return normalizedPath.startsWith(subPattern);
    }
    return normalizedPath.includes(cleanPattern) || 
           normalizedPath.startsWith(cleanPattern + '/');
  });
}

export async function processDirectory(fileList: FileList): Promise<FileNode[]> {
  if (!isGitRepository(fileList)) {
    throw new Error('Not a Git repository');
  }

  const ignorePatterns = await parseGitignore(fileList);

  const files = Array.from(fileList).sort((a, b) =>
    a.webkitRelativePath.localeCompare(b.webkitRelativePath)
  );

  const rootName = files[0]?.webkitRelativePath.split('/')[0] || '';

  const fileMap = new Map<string, File>();
  for (const file of files) {
    const path = file.webkitRelativePath.split('/').slice(1).join('/');
    if (path) fileMap.set(path, file);
  }

  async function buildTree(path: string = '', depth: number = 0): Promise<FileNode[]> {
    const result: FileNode[] = [];
    const pathPrefix = path ? path + '/' : '';

    const children = new Set<string>();

    for (const filePath of fileMap.keys()) {
      if (!filePath.startsWith(pathPrefix)) continue;

      const remainingPath = filePath.slice(pathPrefix.length);
      const firstSegment = remainingPath.split('/')[0];
      if (firstSegment) {
        children.add(firstSegment);
      }
    }

    for (const child of children) {
      const childPath = path ? `${path}/${child}` : child;
      if (shouldIgnore(childPath, ignorePatterns)) {
        continue;
      }

      const isFile = !Array.from(fileMap.keys()).some(
        p => p.startsWith(`${childPath}/`)
      );

      if (isFile) {
        const file = fileMap.get(childPath);
        if (file) {
          const content = await readFileContent(file);
          result.push({
            name: child,
            path: childPath,
            type: 'file',
            content,
            selected: false
          });
        }
      } else {
        const subTree = await buildTree(childPath, depth + 1);
        result.push({
          name: child,
          path: childPath,
          type: 'directory',
          children: subTree,
          selected: false
        });
      }
    }

    return result;
  }

  return buildTree();
}

function isFileTypeSupported(fileName: string): boolean {
  const textFileExtensions = [
    '.txt', '.js', '.jsx', '.ts', '.tsx', '.md', '.json', '.yaml', '.yml',
    '.html', '.css', '.scss', '.less', '.py', '.java', '.rb', '.php', '.go',
    '.rust', '.c', '.cpp', '.h', '.hpp', '.cs', '.swift', '.kt', '.rs',
    '.vue', '.svelte', '.config', '.env', '.gitignore', '.dockerignore',
    '.sh', '.bash', '.zsh', '.fish', '.ps1', '.bat', '.cmd'
  ];
  
  return textFileExtensions.some(ext => 
    fileName.toLowerCase().endsWith(ext) || !fileName.includes('.')
  );
}

async function readFileContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
}