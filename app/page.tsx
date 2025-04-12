"use client"

import React from 'react'
import { FileTree } from '@/components/file-tree'
import { ChatInterface } from '@/components/chat-interface'
import { FileUpload } from '@/components/file-upload'
import { Separator } from '@/components/ui/separator'
import { FileNode } from '@/lib/file-processing'
import { Toaster } from '@/components/ui/toaster'

export default function Home() {
  const [files, setFiles] = React.useState<FileNode[]>([])
  
  const handleFileSelect = (path: string) => {
    console.log('Selected file:', path)
    // Here you would typically load the file contents and update the chat context
  }
  
  const handleToggleSelect = (node: FileNode, selected: boolean) => {
    // Create a deep copy of the files array
    const updateNodeSelection = (nodes: FileNode[]): FileNode[] => {
      return nodes.map(n => {
        if (n === node) {
          return { ...n, selected };
        }
        if (n.children) {
          return {
            ...n,
            children: updateNodeSelection(n.children)
          };
        }
        return n;
      });
    };
    
    setFiles(updateNodeSelection(files));
  }

  return (
    <div className="flex h-screen">
      <div className="w-80 border-r bg-card">
        <FileUpload onUpload={setFiles} />
        <Separator />
        <FileTree 
          files={files} 
          onSelect={handleFileSelect} 
          onToggleSelect={handleToggleSelect} 
        />
      </div>
      <div className="flex-1">
        <ChatInterface />
      </div>
      <Toaster />
    </div>
  )
}