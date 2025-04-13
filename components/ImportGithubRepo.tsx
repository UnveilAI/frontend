'use client'

import { useState } from 'react'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { toast } from './ui/use-toast'
import { FileNode } from '../lib/file-processing'

interface ImportGithubRepoProps {
  onUpload: (files: FileNode[]) => void
}

export default function ImportGithubRepo({ onUpload }: ImportGithubRepoProps) {
  const [repoUrl, setRepoUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleImport = async () => {
    if (!repoUrl.trim()) {
      toast({
        title: 'Missing URL',
        description: 'Please enter a valid GitHub repository URL',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/github-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ repoUrl }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Import failed')
      }

      if (Array.isArray(data.files)) {
        onUpload(data.files)
        toast({
          title: 'Repository Imported ✅',
          description: 'Files have been loaded into the app.',
        })
      } else {
        throw new Error('Invalid file format from server')
      }
    } catch (err: any) {
      toast({
        title: 'Import Error ❌',
        description: err.message || 'Something went wrong.',
        variant: 'destructive',
      })
      console.error('[Import Error]', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-4 space-y-2">
      <Input
        placeholder="Paste GitHub repo URL"
        value={repoUrl}
        onChange={(e) => setRepoUrl(e.target.value)}
      />
      <Button
        onClick={handleImport}
        disabled={!repoUrl.trim() || isLoading}
        className="w-full flex items-center justify-center gap-2"
      >
        <img
          src="https://static.vecteezy.com/system/resources/previews/016/833/872/non_2x/github-logo-git-hub-icon-on-white-background-free-vector.jpg"
          alt="GitHub Logo"
          className="w-5 h-5 rounded"
        />
        {isLoading ? 'Importing...' : 'Import Repository'}
      </Button>
    </div>
  )
}