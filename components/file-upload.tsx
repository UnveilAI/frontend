"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { UploadIcon } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { processDirectory, isGitRepository, FileNode } from '@/lib/file-processing'

export function FileUpload({ onUpload }: { onUpload: (files: FileNode[]) => void }) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = React.useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsLoading(true)

    try {
      // Check if it's a Git repository
      // if (!isGitRepository(files)) {
      //   toast({
      //     title: "Not a Git repository",
      //     description: "The uploaded folder is not a Git repository. Please upload a valid Git repository.",
      //     variant: "destructive",
      //   })
      //   setIsLoading(false)
      //   return
      // }

      // Process the directory
      const fileTree = await processDirectory(files)
      onUpload(fileTree)

      toast({
        title: "Repository loaded",
        description: "Git repository has been successfully loaded.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred while processing the directory.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-4">
      <label htmlFor="repo-upload">
        <Button className="w-full" asChild disabled={isLoading}>
          <div>
            <UploadIcon className="mr-2 h-4 w-4" />
            {isLoading ? "Loading..." : "Upload Repository"}
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
        multiple
      />
    </div>
  )
}