"use client"

import React, { useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChevronDown, ChevronRight, FileIcon, SendIcon } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { geminiApi } from '@/api'  // Added import for Gemini integration

interface CodeSnippet {
  language: string
  content: string
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  code?: CodeSnippet
}

interface FileNode {
  name: string
  path: string
  type: 'file' | 'directory'
  content?: string
  children?: FileNode[]
}
interface ChatInterfaceProps {
  selectedFiles: FileNode[]
}

export function ChatInterface({ selectedFiles }: ChatInterfaceProps) {
  const [messages, setMessages] = React.useState<Message[]>([])
  const [input, setInput] = React.useState('')
  const [expandedFiles, setExpandedFiles] = React.useState<string[]>([])
  const scrollRef = React.useRef<HTMLDivElement>(null)

  // Toggle file expansion in the accordion
  const toggleFileExpansion = (path: string) => {
    setExpandedFiles(prev => 
      prev.includes(path) 
        ? prev.filter(p => p !== path) 
        : [...prev, path]
    )
  }

  // Modified to call Gemini API for code explanation if requested
  const handleExplainCode = async () => {
    if (selectedFiles.length === 0) return
    try {
      // For simplicity, explain the first selected file
      const fileToExplain = selectedFiles[0]
      if (!fileToExplain.content) return
      
      const result = await geminiApi.explainCode(fileToExplain.content)
      const explanationMessage: Message = {
        role: "assistant",
        content: result.explanation
      }
      setMessages(prev => [...prev, explanationMessage])
      // Auto-scroll after adding new message
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
      }, 100)
    } catch (error) {
      console.error("Error explaining code:", error)
    }
  }
  const handleSend = () => {
    if (!input.trim()) return

    const newMessages: Message[] = [
      ...messages,
      {
        role: 'user',         // Make sure it's all lowercase if that's how your type is defined
        content: input
      },
      {
        role: 'assistant',    // again, must match 'assistant' exactly
        content: "Here's an example response with some code:",
        code: {
          language: 'typescript',
          content: 'function example() {\n  console.log("Hello!");\n}'
        }
      }
    ]
    
    setMessages(newMessages)
    setInput('')

    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }
    }, 100)
  }

  const getLanguage = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'py':
        return 'python'
      case 'js':
        return 'javascript'
      case 'ts':
        return 'typescript'
      case 'tsx':
        return 'tsx'
      case 'jsx':
        return 'jsx'
      case 'json':
        return 'json'
      case 'html':
        return 'html'
      case 'css':
        return 'css'
      case 'md':
        return 'markdown'
      default:
        return 'text'
    }
  }

  // Automatically expand the first file when files are loaded
  useEffect(() => {
    if (selectedFiles.length > 0 && expandedFiles.length === 0) {
      setExpandedFiles([selectedFiles[0].path]);
    }
  }, [selectedFiles]);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <ScrollArea ref={scrollRef} className="flex-1 p-4 space-y-4">
        {/* Display selected files in an accordion */}
        {selectedFiles.length > 0 && (
          <Card className="mb-4 overflow-hidden">
            <div className="bg-card px-4 py-3 border-b">
              <p className="font-medium">Selected Files ({selectedFiles.length})</p>
            </div>
            
            <div className="divide-y">
              {selectedFiles.map((file, index) => (
                <div key={file.path} className="overflow-hidden">
                  <div 
                    className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => toggleFileExpansion(file.path)}
                  >
                    <div className="flex items-center gap-2">
                      <FileIcon className="h-4 w-4 text-blue-500" />
                      <span className="font-medium text-sm">{file.name}</span>
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <div className="transition-transform duration-200 ease-in-out">
                        {expandedFiles.includes(file.path) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {expandedFiles.includes(file.path) && file.content && (
                    <div className="border-t bg-muted/40">
                      <SyntaxHighlighter
                        language={getLanguage(file.name)}
                        style={vscDarkPlus}
                        wrapLongLines
                        customStyle={{ 
                          borderRadius: '0',
                          padding: '1rem',
                          margin: '0',
                          backgroundColor: 'transparent'
                        }}
                      >
                        {file.content}
                      </SyntaxHighlighter>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}
  
        {messages.map((message, index) => (
          <Card key={index} className={`mb-4 p-4 ${message.role === 'assistant' ? 'bg-accent' : 'bg-muted'}`}>
            <p className="mb-2">{message.content}</p>
            {message.code && (
              <SyntaxHighlighter
                language={message.code.language}
                style={vscDarkPlus}
                wrapLongLines
                customStyle={{ borderRadius: '0.5rem', padding: '1rem' }}
              >
                {message.code.content}
              </SyntaxHighlighter>
            )}
          </Card>
        ))}
      </ScrollArea>
  
      <div className="p-4 border-t flex flex-col gap-2">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about your code..."
            className="flex-1"
          />
          <Button onClick={handleSend}>
            <SendIcon className="h-4 w-4" />
          </Button>
        </div>
        {/* Explain Code button */}
        <div className="flex justify-end">
          <Button onClick={handleExplainCode}>
            Explain Code
          </Button>
        </div>
      </div>
    </div>
  )
}