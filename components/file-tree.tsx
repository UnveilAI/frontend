"use client"

import React from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FileIcon, FolderIcon } from 'lucide-react'

interface FileTreeProps {
  files: FileNode[]
  onSelect: (path: string) => void
}

interface FileNode {
  name: string
  path: string
  type: 'file' | 'directory'
  children?: FileNode[]
}

const FileTreeNode = ({ node, depth = 0, onSelect }: { node: FileNode; depth?: number; onSelect: (path: string) => void }) => {
  const [isOpen, setIsOpen] = React.useState(false)

  const handleClick = () => {
    if (node.type === 'directory') {
      setIsOpen(!isOpen)
    } else {
      onSelect(node.path)
    }
  }

  return (
    <div>
      <div
        className={`flex items-center gap-2 px-2 py-1 hover:bg-accent cursor-pointer`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleClick}
      >
        {node.type === 'directory' ? (
          <FolderIcon className="h-4 w-4 text-yellow-500" />
        ) : (
          <FileIcon className="h-4 w-4 text-blue-500" />
        )}
        <span className="text-sm">{node.name}</span>
      </div>
      {node.type === 'directory' && isOpen && node.children?.map((child, index) => (
        <FileTreeNode
          key={index}
          node={child}
          depth={depth + 1}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}

export function FileTree({ files, onSelect }: FileTreeProps) {
  return (
    <ScrollArea className="h-[calc(100vh-4rem)]">
      <div className="p-2">
        {files.map((file, index) => (
          <FileTreeNode key={index} node={file} onSelect={onSelect} />
        ))}
      </div>
    </ScrollArea>
  )
}