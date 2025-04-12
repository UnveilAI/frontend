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
  
  // Check if a file should be ignored based on gitignore patterns
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
      // Remove leading and trailing slashes for consistency
      const cleanPattern = pattern.replace(/^\/|\/$/g, '');
      
      // Exact match
      if (normalizedPath === cleanPattern) {
        return true;
      }
      
      // Directory match (pattern ending with /)
      if (pattern.endsWith('/') && normalizedPath.startsWith(cleanPattern)) {
        return true;
      }
      
      // File extension wildcard (e.g., *.js)
      if (pattern.startsWith('*.')) {
        const extension = pattern.substring(1);
        return normalizedPath.endsWith(extension);
      }
      
      // General wildcard at start (e.g., **/logs)
      if (pattern.startsWith('**/')) {
        const subPattern = pattern.substring(3);
        return normalizedPath.includes(subPattern) || normalizedPath.endsWith(subPattern);
      }
      
      // General wildcard at end (e.g., logs/**)
      if (pattern.endsWith('/**')) {
        const subPattern = pattern.substring(0, pattern.length - 3);
        return normalizedPath.startsWith(subPattern);
      }
      
      // Path includes the pattern or starts with pattern + /
      return normalizedPath.includes(cleanPattern) || 
             normalizedPath.startsWith(cleanPattern + '/');
    });
  }
  
export async function processDirectory(fileList: FileList): Promise<FileNode[]> {
    // Check if it's a Git repository
    const isGitRepo = isGitRepository(fileList);
    if (!isGitRepo) {
      throw new Error('Not a Git repository');
    }
    
    // Parse gitignore patterns
    const ignorePatterns = await parseGitignore(fileList);
    
    const root: { [key: string]: FileNode } = {};
    
    // Convert FileList to array and sort by path to ensure parent directories are processed first
    const files = Array.from(fileList).sort((a, b) => 
      a.webkitRelativePath.localeCompare(b.webkitRelativePath)
    );
    
    for (const file of files) {
      const pathParts = file.webkitRelativePath.split('/');
      // Skip the root directory name (first part)
      pathParts.shift();
      
      // Skip files/directories that match gitignore patterns
      if (shouldIgnore(pathParts.join('/'), ignorePatterns)) {
        continue;
      }
      
      const fileName = pathParts.pop() || '';
      let currentPath = '';
      let currentLevel = root;
      
      // Process each directory in the path
      for (const part of pathParts) {
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        
        if (shouldIgnore(currentPath, ignorePatterns)) {
          // Skip this directory and all its children
          currentLevel = {}; // Empty object to effectively skip processing
          break;
        }
        
        if (!currentLevel[part]) {
          currentLevel[part] = {
            name: part,
            path: currentPath,
            type: 'directory',
            children: [],
            selected: false // Initialize as not selected
          };
        }
        
        const currentNode = currentLevel[part];
        currentLevel = currentNode.children?.reduce((acc: any, child) => {
          acc[child.name] = child;
          return acc;
        }, {}) || {};
        
        if (!currentNode.children) {
          currentNode.children = [];
        }
      }
      
      // Skip if we've determined to ignore this path
      if (Object.keys(currentLevel).length === 0) {
        continue;
      }
      
      // Add the file
      const filePath = currentPath ? `${currentPath}/${fileName}` : fileName;
      
      // Skip if the file itself should be ignored
      if (shouldIgnore(filePath, ignorePatterns)) {
        continue;
      }
      
      // Only process text files
      const isTextFile = isFileTypeSupported(fileName);
      if (isTextFile) {
        const content = await readFileContent(file);
        const fileNode = {
          name: fileName,
          path: filePath,
          type: 'file' as const,
          content,
          selected: false
        };
        
        // Add file to the current directory's children
        if (pathParts.length > 0) {
          let currentDir = null;
          let path = '';
          
          // Find the parent directory
          for (const part of pathParts) {
            path = path ? `${path}/${part}` : part;
            if (!currentDir) {
              currentDir = root[part];
            } else {
              currentDir = currentDir.children?.find(child => child.name === part) as FileNode;
            }
            
            if (!currentDir) break;
          }
          
          if (currentDir) {
            currentDir.children?.push(fileNode);
          }
        } else {
          root[fileName] = fileNode;
        }
      }
    }
    
    return Object.values(root);
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