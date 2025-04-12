"use client"

import React from 'react'
import { FileTree } from '@/components/file-tree'
import { ChatInterface } from '@/components/chat-interface'
import { FileUpload } from '@/components/file-upload'
import { Separator } from '@/components/ui/separator'

export default function Home() {
  const [files, setFiles] = React.useState([])

  const handleFileSelect = (path: string) => {
    console.log('Selected file:', path)
    // Here you would typically load the file contents and update the chat context
  }

  return (
    <div className="flex h-screen">
      <div className="w-80 border-r bg-card">
        <FileUpload onUpload={setFiles} />
        <Separator />
        <FileTree files={files} onSelect={handleFileSelect} />
      </div>
      <div className="flex-1">
        <ChatInterface />
      </div>
    </div>
  )
}