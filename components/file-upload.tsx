"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { UploadIcon } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { processDirectory, isGitRepository, FileNode } from '@/lib/file-processing'
import { repositoryApi} from '@/api'

export function FileUpload({ onUpload }: { onUpload: (files: FileNode[]) => void }) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsLoading(true);

    try {
      // Process directory *including content*
      // Assuming processDirectory returns FileNode[] with content
      const fileTreeWithContent = await processDirectory(files);

      if (!fileTreeWithContent || fileTreeWithContent.length === 0) {
        throw new Error("No processable files found in the directory.");
      }

      // --- Send JSON to backend ---
      // Extract repository name (e.g., from the common base path or prompt user)
      const repoName = files[0]?.webkitRelativePath.split('/')[0] || 'Uploaded Repository';
      const payload = {
        name: repoName,
        description: "Uploaded via JSON",
        source: "JSON", // Might need a new source type
        codebase: fileTreeWithContent // The juicy stuff
      };

      // Call a new or modified API endpoint
      const createdRepo = await repositoryApi.uploadCodebaseJson(payload);
      // -----------------------------

      // Update frontend state for FileTree (remove content if not needed for display)
      const fileTreeForDisplay = fileTreeWithContent.map(node => {
        // Recursively remove content if large and not needed for FileTree display
        const removeContent = (n: FileNode): FileNode => ({
          ...n,
          content: undefined, // Remove content for UI state
          children: n.children?.map(removeContent)
        });
        return removeContent(node);
      });
      onUpload(fileTreeForDisplay); // Update FileTree UI

      toast({
        title: "Codebase processed",
        description: `Repository "${createdRepo.name}" ready for questions.`,
      });

    } catch (error: any) {
      console.error("Error processing/uploading directory:", error);
      toast({
        title: "Error",
        description: error.message || "An error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      // Reset file input if needed
      if (e.target) e.target.value = '';
    }
  };

  return (
      <div className="p-4">
        {/* ... Input element ... */}
        <input
            id="repo-upload"
            type="file"
            className="hidden"
            onChange={handleFileSelect} // Create JSON
            webkitdirectory=""
            directory=""
            multiple
            accept="*" // Consider limiting accepted types if needed
        />
        {/* ... Button ... */}
      </div>
  );
}
