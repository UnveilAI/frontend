"use client"

import React, { useEffect } from 'react'
import { FileTree } from '@/components/file-tree'
import { ChatInterface } from '@/components/chat-interface'
import { FileUpload } from '@/components/file-upload'
import { Separator } from '@/components/ui/separator'
import { FileNode } from '@/lib/file-processing'
import { Toaster } from '@/components/ui/toaster'
import { Button } from '@/components/ui/button'
import { ShareNetwork, Trash } from 'phosphor-react'
import { ShareOptionsModal } from '@/components/share-options-modal'
import { WelcomeModal } from '@/components/welcome-modal'
import ImportGithubRepo from "@/components/ImportGithubRepo" 



export default function Home() {
  const [files, setFiles] = React.useState<FileNode[]>([])
  const [selectedFile, setSelectedFile] = React.useState<FileNode | null>(null)
  const [isShareModalOpen, setShareModalOpen] = React.useState(false)
  const [showWelcome, setShowWelcome] = React.useState(true)

  const LOCAL_STORAGE_FILES_KEY = 'uploadedFiles'
  const LOCAL_STORAGE_SELECTED_KEY = 'selectedFilePath'
  const LOCAL_STORAGE_WELCOME_KEY = 'hasSeenWelcome'

  const handleFileSelect = (path: string) => {
    const findFile = (nodes: FileNode[]): FileNode | null => {
      for (const node of nodes) {
        if (node.path === path && node.type === 'file') return node
        if (node.children) {
          const result = findFile(node.children)
          if (result) return result
        }
      }
      return null
    }

    const selected = findFile(files)
    setSelectedFile(selected)
    localStorage.setItem(LOCAL_STORAGE_SELECTED_KEY, path)
  }

  const handleShare = () => {
    setShareModalOpen(true)
  }

  const closeShareModal = () => {
    setShareModalOpen(false)
  }
  
  const clearAllFiles = () => {
    setFiles([])
    setSelectedFile(null)
    localStorage.removeItem(LOCAL_STORAGE_FILES_KEY)
    localStorage.removeItem(LOCAL_STORAGE_SELECTED_KEY)
  }

  const handleToggleSelect = (node: FileNode, selected: boolean) => {
    const updateNodeSelection = (nodes: FileNode[]): FileNode[] => {
      return nodes.map(n => {
        if (n === node) {
          return { ...n, selected }
        }
        if (n.children) {
          return {
            ...n,
            children: updateNodeSelection(n.children)
          }
        }
        return n
      })
    }

    const updated = updateNodeSelection(files)
    setFiles(updated)
    localStorage.setItem(LOCAL_STORAGE_FILES_KEY, JSON.stringify(updated))
  }

  useEffect(() => {
    const savedFiles = localStorage.getItem(LOCAL_STORAGE_FILES_KEY)
    const savedPath = localStorage.getItem(LOCAL_STORAGE_SELECTED_KEY)
    const hasSeenWelcome = localStorage.getItem(LOCAL_STORAGE_WELCOME_KEY)

    if (!hasSeenWelcome) {
      setShowWelcome(true)
    }

    if (savedFiles) {
      const parsed: FileNode[] = JSON.parse(savedFiles)
      setFiles(parsed)

      if (savedPath) {
        const findFile = (nodes: FileNode[]): FileNode | null => {
          for (const node of nodes) {
            if (node.path === savedPath && node.type === 'file') return node
            if (node.children) {
              const result = findFile(node.children)
              if (result) return result
            }
          }
          return null
        }

        const file = findFile(parsed)
        if (file) setSelectedFile(file)
      }
    }
  }, [])

  const handleUpload = (newFiles: FileNode[]) => {
    setFiles(newFiles)
    localStorage.setItem(LOCAL_STORAGE_FILES_KEY, JSON.stringify(newFiles))
  }

  const handleCloseWelcome = () => {
    localStorage.setItem(LOCAL_STORAGE_WELCOME_KEY, 'true')
    setShowWelcome(false)
  }

  return (
    <div className="flex flex-col h-screen relative">
      {showWelcome && <WelcomeModal onClose={handleCloseWelcome} />}

      <header className="px-4 py-2 bg-card border-b">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Unveil AI</h1>
            <p className="text-sm text-muted-foreground">
              AI in Software Engineering – Upload your repository and get your code explained line by line.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              className="animate-glow-border flex items-center gap-2 px-4" 
              variant="ghost" 
              title="Call Bland AI"
            >
              <span className="font-medium">Call Bland</span>
              <img 
                src="https://cdn.theorg.com/eb9f3655-a024-4d54-a028-337b508d2aef_thumb.jpg" 
                alt="Bland AI Logo" 
                width={32} 
                height={32} 
                className="rounded-full"
              />
            </Button>
            <Button onClick={clearAllFiles} variant="ghost" title="Clear all folders">
              <Trash size={32} />
            </Button>
            <Button onClick={handleShare} variant="ghost">
              <ShareNetwork size={32} />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-80 border-r bg-card">
        <ImportGithubRepo onUpload={handleUpload} />
        <Separator />
        <FileUpload onUpload={handleUpload} />
        <Separator />
        <FileTree
          files={files}
          onSelect={handleFileSelect}
          onToggleSelect={handleToggleSelect}
        />

        </div>

        <div className="flex-1 overflow-y-auto">
          <ChatInterface selectedFile={selectedFile} />
        </div>
      </div>

      <ShareOptionsModal isOpen={isShareModalOpen} onClose={closeShareModal} />
      <Toaster />
    </div>
  )
}