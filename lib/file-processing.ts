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

  // export async function processDirectory(fileList: FileList): Promise<FileNode[]> {
  //   // Check if it's a Git repository
  //   const isGitRepo = isGitRepository(fileList);
  //   if (!isGitRepo) {
  //     throw new Error('Not a Git repository');
  //   }
    
  //   // Parse gitignore patterns
  //   const ignorePatterns = await parseGitignore(fileList);
    
  //   // Create a map to store all directories by their path
  //   const dirMap: { [path: string]: FileNode } = {};
    
  //   // Function to get or create a directory node
  //   const getOrCreateDir = (path: string, name: string): FileNode => {
  //     if (!dirMap[path]) {
  //       dirMap[path] = {
  //         name,
  //         path,
  //         type: 'directory',
  //         children: [],
  //         selected: false
  //       };
  //     }
  //     return dirMap[path];
  //   };
    
  //   // Convert FileList to array and sort by path
  //   const files = Array.from(fileList).sort((a, b) => 
  //     a.webkitRelativePath.localeCompare(b.webkitRelativePath)
  //   );
    
  //   // First pass: create directory structure
  //   for (const file of files) {
  //     const pathParts = file.webkitRelativePath.split('/');
  //     // Skip the root directory name (first part)
  //     pathParts.shift();
      
  //     // Build directory tree
  //     let currentPath = '';
  //     for (let i = 0; i < pathParts.length - 1; i++) {
  //       const part = pathParts[i];
  //       const parentPath = currentPath;
  //       currentPath = currentPath ? `${currentPath}/${part}` : part;
        
  //       // Skip if this path should be ignored
  //       if (shouldIgnore(currentPath, ignorePatterns)) {
  //         break;
  //       }
        
  //       // Create directory node
  //       const dirNode = getOrCreateDir(currentPath, part);
        
  //       // Link to parent directory
  //       if (parentPath) {
  //         const parentNode = dirMap[parentPath];
  //         if (parentNode && !parentNode.children?.some(child => child.path === currentPath)) {
  //           parentNode.children?.push(dirNode);
  //         }
  //       }
  //     }
  //   }
    
  //   // Second pass: add files to directories
  //   for (const file of files) {
  //     const pathParts = file.webkitRelativePath.split('/');
  //     // Skip the root directory name (first part)
  //     pathParts.shift();
      
  //     const fileName = pathParts[pathParts.length - 1];
  //     const parentPath = pathParts.slice(0, -1).join('/');
  //     const filePath = pathParts.join('/');
      
  //     // Skip if this file should be ignored
  //     if (shouldIgnore(filePath, ignorePatterns)) {
  //       continue;
  //     }
      
  //     // Only process text files
  //     if (isFileTypeSupported(fileName)) {
  //       const content = await readFileContent(file);
        
  //       // Create file node
  //       const fileNode: FileNode = {
  //         name: fileName,
  //         path: filePath,
  //         type: 'file',
  //         content,
  //         selected: false
  //       };
        
  //       // Add to parent directory
  //       if (parentPath && dirMap[parentPath]) {
  //         dirMap[parentPath].children?.push(fileNode);
  //       } else if (!parentPath) {
  //         // It's a root-level file, add it to dirMap
  //         dirMap[fileName] = fileNode;
  //       }
  //     }
  //   }
    
  //   // Return only root-level nodes
  //   return Object.values(dirMap).filter(node => {
  //     const pathParts = node.path.split('/');
  //     return pathParts.length === 1;
  //   });
  // }
  export async function processDirectory(fileList: FileList): Promise<FileNode[]> {
    // Verify it's a Git repository
    if (!isGitRepository(fileList)) {
      throw new Error('Not a Git repository');
    }
    
    // Get ignore patterns
    const ignorePatterns = await parseGitignore(fileList);
    
    // Create sorted array of files
    const files = Array.from(fileList).sort((a, b) => 
      a.webkitRelativePath.localeCompare(b.webkitRelativePath)
    );
    
    // Extract root directory name
    const rootName = files[0]?.webkitRelativePath.split('/')[0] || '';
    
    // Build path to file map for quick lookups
    const fileMap = new Map<string, File>();
    for (const file of files) {
      // Remove root dir and get relative path
      const path = file.webkitRelativePath.split('/').slice(1).join('/');
      if (path) fileMap.set(path, file);
    }
    
    // Recursive function to build directory structure
    async function buildTree(path: string = '', depth: number = 0): Promise<FileNode[]> {
      const result: FileNode[] = [];
      const pathPrefix = path ? path + '/' : '';
      
      // Find all immediate children (files and directories)
      const children = new Set<string>();
      
      for (const filePath of fileMap.keys()) {
        if (!filePath.startsWith(pathPrefix)) continue;
        
        const remainingPath = filePath.slice(pathPrefix.length);
        const firstSegment = remainingPath.split('/')[0];
        
        if (firstSegment) {
          children.add(firstSegment);
        }
      }
      
      // Process each child
      for (const child of children) {
        const childPath = path ? `${path}/${child}` : child;
        
        // Skip if should be ignored
        if (shouldIgnore(childPath, ignorePatterns)) {
          continue;
        }
        
        // Check if it's a file or directory
        const isFile = !Array.from(fileMap.keys()).some(
          p => p.startsWith(`${childPath}/`)
        );
        
        if (isFile) {
          // It's a file
          const file = fileMap.get(childPath);
          // if (file && isFileTypeSupported(child)) {
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
          // It's a directory - recurse
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
    
    // Start the recursive build
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