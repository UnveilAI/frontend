"use client"

import React from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FileIcon, FolderIcon, ChevronRight, ChevronDown } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'

interface FileTreeProps {
  files: FileNode[]
  onSelect: (path: string) => void
  onToggleSelect: (node: FileNode, selected: boolean) => void
}

interface FileNode {
  name: string
  path: string
  type: 'file' | 'directory'
  children?: FileNode[]
  selected?: boolean
}
const FileTreeNode = ({ 
  node, 
  depth = 0, 
  onSelect, 
  onToggleSelect 
}: { 
  node: FileNode; 
  depth?: number; 
  onSelect: (path: string) => void;
  onToggleSelect: (node: FileNode, selected: boolean) => void;
}) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const hasChildren = node.children && node.children.length > 0

  const handleClick = (e: React.MouseEvent) => {
    if (node.type === 'file') {
      onSelect(node.path)
    }
    if (node.type === 'directory') {
      setIsOpen(!isOpen)
      console.log(`Directory ${node.name} clicked, isOpen: ${!isOpen}`)
    }
  }

  const handleCheckboxChange = (checked: boolean | 'indeterminate') => {
    onToggleSelect(node, checked === true)
    
    // If it's a file and it's being checked, also display it in chat
    if (node.type === 'file' && checked === true) {
      onSelect(node.path)
    }
  }

  return (
    <div>
      <div
        className={`flex items-center gap-2 px-2 py-1 hover:bg-accent cursor-pointer ${node.type === 'file' ? 'text-blue-500' : ''}`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleClick}
      >
        <Checkbox 
          checked={node.selected}
          onCheckedChange={handleCheckboxChange}
          onClick={(e) => e.stopPropagation()}
          className="mr-1"
        />

        {node.type === 'directory' ? (
          <>
            {isOpen ? (
              <ChevronDown className="h-4 w-4 mr-1" />
            ) : (
              <ChevronRight className="h-4 w-4 mr-1" />
            )}
            <FolderIcon className="h-4 w-4 text-yellow-500" />
          </>
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
          onToggleSelect={onToggleSelect}
        />
      ))}
    </div>
  )
}

export function FileTree({ files, onSelect, onToggleSelect }: FileTreeProps) {
  return (
    <ScrollArea className="h-[calc(100vh-4rem)]">
      <div className="p-2">
        {files.map((file, index) => (
          <FileTreeNode 
            key={index} 
            node={file} 
            onSelect={onSelect} 
            onToggleSelect={onToggleSelect} 
          />
        ))}
      </div>
    </ScrollArea>
  )
}