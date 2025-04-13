"use client"

import React, { useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChevronDown, ChevronRight, FileIcon, SendIcon } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import ReactMarkdown from 'react-markdown'
import { geminiApi } from '@/api'  // Added import for Gemini integration
import { safeJsonParse } from '@/lib/json-utils' // Import our enhanced JSON parser

interface CodeSnippet {
  language: string
  content: string
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  code?: CodeSnippet
  codeSnippets?: Array<{
    language: string
    code: string
    explanation?: string
  }>
  references?: Array<{
    type: string
    name: string
    description: string
  }>
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

  // Reset messages when selected files change
  useEffect(() => {
    setMessages([]);
  }, [selectedFiles]);

  // Parse JSON response if it's a string
  const parseGeminiResponse = (response: string): any => {
    // Use our enhanced JSON parser to handle potentially malformed JSON
    return safeJsonParse(response);
  }

  // Format the Gemini response into a readable message
  const formatGeminiResponse = (responseData: any): Message => {
    // Check if there was a parse error and handle it appropriately
    if (responseData.parse_error) {
      return {
        role: 'assistant',
        content: responseData.text_response
      };
    }

    // For the overview-style responses (with overview, key_components, etc.)
    if (responseData.overview) {
      let formattedContent = `**Overview:**\n${responseData.overview}\n\n`

      if (responseData.key_components && responseData.key_components.length > 0) {
        formattedContent += "**Key Components:**\n"
        responseData.key_components.forEach((component: any) => {
          formattedContent += `- **${component.name}** (${component.type}): ${component.purpose}\n`
        })
        formattedContent += "\n"
      }

      if (responseData.potential_issues && responseData.potential_issues.length > 0) {
        formattedContent += "**Potential Issues:**\n"
        responseData.potential_issues.forEach((issue: string) => {
          formattedContent += `- ${issue}\n`
        })
        formattedContent += "\n"
      }

      if (responseData.suggested_improvements && responseData.suggested_improvements.length > 0) {
        formattedContent += "**Suggested Improvements:**\n"
        responseData.suggested_improvements.forEach((improvement: string) => {
          formattedContent += `- ${improvement}\n`
        })
      }

      return {
        role: 'assistant',
        content: formattedContent
      }
    }

    // For the text_response style responses
    return {
      role: 'assistant',
      content: responseData.text_response || "No explanation provided",
      codeSnippets: responseData.code_snippets || [],
      references: responseData.references || []
    }
  }

  // Add this helper function to combine multiple file contents
const combineSelectedFiles = (files) => {
  return files.map(file => {
    // Create a header for each file to identify it in the combined content
    const fileHeader = `\n\n// FILE: ${file.path}\n`;
    return fileHeader + (file.content || '');
  }).join('\n');
};

// Update the handleExplainCode function
const handleExplainCode = async () => {
  if (selectedFiles.length === 0) return
  try {
    // Add a user message showing what's being explained
    setMessages(prev => [...prev, {
      role: 'user',
      content: `Explain this codebase`
    }])

    // Show loading message
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: "Analyzing codebase..."
    }])

    // Combine all selected files instead of just taking the first one
    const combinedContent = combineSelectedFiles(selectedFiles);
    if (!combinedContent) return;
    
    // Using the repositoryId if available
    const repositoryId = "current"; // Replace with actual repository ID if available

    // Call the Gemini API with combined content
    const result = await geminiApi.explainCode(combinedContent)

    // Remove the loading message
    setMessages(prev => prev.slice(0, -1))

    // Parse the response if it's a JSON string
    const parsedResponse = parseGeminiResponse(result.explanation)

    // Format the response into a readable message
    const explanationMessage = formatGeminiResponse(parsedResponse)

    setMessages(prev => [...prev, explanationMessage])

    // Auto-scroll after adding new message
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }
    }, 100)
  } catch (error) {
    console.error("Error explaining code:", error)
    // Replace the loading message with an error message
    setMessages(prev => {
      const newMessages = [...prev]
      // If there's a loading message, replace it, otherwise add new error message
      if (newMessages[newMessages.length - 1].content === "Analyzing codebase...") {
        newMessages[newMessages.length - 1] = {
          role: 'assistant',
          content: "Sorry, I encountered an error while trying to explain this codebase."
        }
        return newMessages
      } else {
        return [...prev, {
          role: 'assistant',
          content: "Sorry, I encountered an error while trying to explain this codebase."
        }]
      }
    })
  }
}

// Update the handleSend function
const handleSend = async () => {
  if (!input.trim()) return

  // Add user message
  const userMessage: Message = {
    role: 'user',
    content: input
  }

  setMessages(prev => [...prev, userMessage])
  setInput('')

  // Auto-scroll after adding user message
  setTimeout(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, 100)

  try {
    // Send message to the backend if files are selected
    if (selectedFiles.length > 0) {
      const repositoryId = "current" // You'd need to get the actual repository ID

      // Show loading message
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Thinking..."
      }])

      // Combine all selected files instead of just taking the first one
      const combinedContent = combineSelectedFiles(selectedFiles);
      if (!combinedContent) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: "No valid content found in the selected files."
        }])
        return;
      }

      // Call the backend API with combined content
      const response = await geminiApi.explainCode(combinedContent, input)

      // Remove the loading message
      setMessages(prev => prev.slice(0, -1))

      // Parse and format the response
      const parsedResponse = parseGeminiResponse(response.explanation)
      const explanationMessage = formatGeminiResponse(parsedResponse)

      // Add the response message
      setMessages(prev => [...prev, explanationMessage])
    } else {
      // If no file is selected, provide a generic response
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Please select a file first for me to analyze and answer questions about."
      }])
    }
  } catch (error) {
    console.error("Error sending message:", error)
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: "Sorry, I encountered an error while processing your question."
    }])
  }

  // Auto-scroll after adding response
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
            {/* Check if it's a loading message for styling differently */}
            {message.content === "Analyzing codebase..." || message.content === "Thinking..." || message.content === "Analyzing code..." ? (
              <div className="italic text-muted-foreground">{message.content}</div>
            ) : (
              <div className="markdown-content">
                <ReactMarkdown
                  components={{
                    code({node, inline, className, children, ...props}) {
                      const match = /language-(\w+)/.exec(className || '')
                      return !inline && match ? (
                        <SyntaxHighlighter
                          language={match[1]}
                          style={vscDarkPlus}
                          wrapLongLines
                          customStyle={{ borderRadius: '0.5rem', padding: '1rem', marginTop: '0.5rem' }}
                          {...props}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      ) : (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      )
                    }
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            )}

            {/* Display code snippets if available */}
            {message.codeSnippets && message.codeSnippets.length > 0 && (
              <div className="mt-4">
                {message.codeSnippets.map((snippet, snippetIndex) => (
                  <div key={snippetIndex} className="mt-3">
                    {snippet.explanation && <p className="mb-2">{snippet.explanation}</p>}
                    <SyntaxHighlighter
                      language={snippet.language}
                      style={vscDarkPlus}
                      wrapLongLines
                      customStyle={{ borderRadius: '0.5rem', padding: '1rem' }}
                    >
                      {snippet.code}
                    </SyntaxHighlighter>
                  </div>
                ))}
              </div>
            )}

            {/* Display references if available */}
            {message.references && message.references.length > 0 && (
              <div className="mt-4">
                <p className="font-medium">References:</p>
                <ul className="list-disc pl-5 mt-1">
                  {message.references.map((ref, refIndex) => (
                    <li key={refIndex}>
                      <strong>{ref.name}</strong> ({ref.type}): {ref.description}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {message.code && (
              <SyntaxHighlighter
                language={message.code.language}
                style={vscDarkPlus}
                wrapLongLines
                customStyle={{ borderRadius: '0.5rem', padding: '1rem', marginTop: '0.5rem' }}
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
          <Button onClick={handleExplainCode} disabled={selectedFiles.length === 0}>
            Explain Code
          </Button>
        </div>
      </div>
    </div>
  )
}