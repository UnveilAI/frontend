"use client"

import React from 'react'
import { FileTree } from '@/components/file-tree'
import { ChatInterface } from '@/components/chat-interface'
import { FileUpload } from '@/components/file-upload'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { ShareNetwork } from 'phosphor-react'
import { ShareOptionsModal } from '@/components/share-options-modal'

export default function Home() {
  const [files, setFiles] = React.useState([])
  const [isShareModalOpen, setShareModalOpen] = React.useState(false)

  const handleFileSelect = (path: string) => {
    console.log('Selected file:', path)
    // Here you would typically load the file contents and update the chat context
  }

  const handleShare = () => {
    setShareModalOpen(true)
  }

  const closeShareModal = () => {
    setShareModalOpen(false)
  }

  return (
    <div className="flex flex-col h-screen">
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
        <div className="w-80 border-r bg-card overflow-y-auto">
          <FileUpload onUpload={setFiles} />
          <Separator />
          <FileTree files={files} onSelect={handleFileSelect} />
        </div>
        <div className="flex-1 overflow-y-auto">
          <ChatInterface />
        </div>
      </div>
      <ShareOptionsModal isOpen={isShareModalOpen} onClose={closeShareModal} />
    </div>
  )
}
