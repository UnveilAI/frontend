"use client"

import React from 'react'
import { FileTree } from '@/components/file-tree'
import { ChatInterface } from '@/components/chat-interface'
import { FileUpload } from '@/components/file-upload'
import { Separator } from '@/components/ui/separator'
import { FileNode } from '@/lib/file-processing'
import { Toaster } from '@/components/ui/toaster'
import { Button } from '@/components/ui/button'
import { ShareNetwork } from 'phosphor-react'
import { ShareOptionsModal } from '@/components/share-options-modal'
import { WelcomeModal } from '@/components/welcome-modal'
        
export default function Home() {
  const [files, setFiles] = React.useState([])
  const [isShareModalOpen, setShareModalOpen] = React.useState(false)
  const [showWelcome, setShowWelcome] = React.useState(true)
  const handleFileSelect = (path: string) => {
    console.log('Selected file:', path)
  }

  const handleShare = () => {
    setShareModalOpen(true)
  }

  const closeShareModal = () => {
    setShareModalOpen(false)
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
    <div className="flex flex-col h-screen relative">
      {showWelcome && <WelcomeModal onClose={() => setShowWelcome(false)} />}
      <header className="px-4 py-2 bg-card border-b">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Unveil AI</h1>
            <p className="text-sm text-muted-foreground">
              AI in Software Engineering – Upload your repository and get your code explained line by line.
            </p>
          </div>
          <Button onClick={handleShare} variant="ghost">
            <ShareNetwork size={32} />
          </Button>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <div className="w-80 border-r bg-card">
          <FileUpload onUpload={setFiles} />
          <Separator />
          <FileTree 
            files={files} 
            onSelect={handleFileSelect} 
            onToggleSelect={handleToggleSelect} 
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          <ChatInterface />
        </div>
      </div>
      <ShareOptionsModal isOpen={isShareModalOpen} onClose={closeShareModal} />
      <Toaster />
    </div>
  )
}