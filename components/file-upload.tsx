"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { UploadIcon } from 'lucide-react'

export function FileUpload({ onUpload }: { onUpload: (files: FileNode[]) => void }) {
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    // Simulate processing the uploaded files
    // In a real implementation, you'd process the Git repository here
    const fileTree = [{
      name: 'example-repo',
      path: '/',
      type: 'directory' as const,
      children: [
        {
          name: 'src',
          path: '/src',
          type: 'directory' as const,
          children: [
            {
              name: 'index.ts',
              path: '/src/index.ts',
              type: 'file' as const,
            }
          ]
        }
      ]
    }]

    onUpload(fileTree)
  }

  return (
    <div className="p-4">
      <label htmlFor="repo-upload">
        <Button className="w-full" asChild>
          <div>
            <UploadIcon className="mr-2 h-4 w-4" />
            Upload Repository
          </div>
        </Button>
      </label>
      <input
        id="repo-upload"
        type="file"
        className="hidden"
        onChange={handleUpload}
        webkitdirectory=""
        directory=""
      />
    </div>
  )
}