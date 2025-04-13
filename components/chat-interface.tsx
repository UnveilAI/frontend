"use client"

import React, { useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SendIcon } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import ReactMarkdown from 'react-markdown'
import { geminiApi } from '@/api'  // Added import for Gemini integration

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
  selectedFile?: FileNode | null
}

export function ChatInterface({ selectedFile }: ChatInterfaceProps) {
  const [messages, setMessages] = React.useState<Message[]>([])
  const [input, setInput] = React.useState('')
  const scrollRef = React.useRef<HTMLDivElement>(null)

  // Reset messages when selected file changes
  useEffect(() => {
    setMessages([]);
  }, [selectedFile]);

  // Parse JSON response if it's a string
  const parseGeminiResponse = (response: string): any => {
    try {
      // First, check if the response contains JSON wrapped in code blocks
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/)
      if (jsonMatch && jsonMatch[1]) {
        return JSON.parse(jsonMatch[1])
      }

      // Then check if the entire response is JSON
      if (response.trim().startsWith('{') && response.trim().endsWith('}')) {
        return JSON.parse(response)
      }

      // If response is just text
      return { text_response: response }
    } catch (error) {
      console.error("Error parsing Gemini response:", error)
      return { text_response: response }
    }
  }

  // Format the Gemini response into a readable message
  const formatGeminiResponse = (responseData: any): Message => {
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

  // Modified to call Gemini API for code explanation if requested
  const handleExplainCode = async () => {
    if (!selectedFile) return

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

      // Using the repositoryId if available - you'll need to get this from props or context
      const repositoryId = "current"; // Replace with actual repository ID if available

      // Call the Gemini API
      const result = await geminiApi.explainCode(selectedFile.content)

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
      // Send message to the backend if repository and file are selected
      if (selectedFile && selectedFile.content) {
        const repositoryId = "current" // You'd need to get the actual repository ID

        // Show loading message
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: "Thinking..."
        }])

        // Call the backend API to get a response
        // This uses the updated geminiApi.explainCode that accepts a question parameter
        const response = await geminiApi.explainCode(selectedFile.content, input)

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

  return (
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        <ScrollArea ref={scrollRef} className="flex-1 p-4 space-y-4">
          {/* Display selected file content */}
          {selectedFile && selectedFile.content && (
              <Card className="mb-4 p-4 bg-muted">
                <p className="mb-2 font-semibold">{selectedFile.name}</p>
                <SyntaxHighlighter
                    language={getLanguage(selectedFile.name)}
                    style={vscDarkPlus}
                    wrapLongLines
                    customStyle={{ borderRadius: '0.5rem', padding: '1rem' }}
                >
                  {selectedFile.content}
                </SyntaxHighlighter>
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
          {/* New Explain Code button */}
          <div className="flex justify-end">
            <Button onClick={handleExplainCode} disabled={!selectedFile}>
              Explain Code
            </Button>
          </div>
        </div>
      </div>
  )
}
