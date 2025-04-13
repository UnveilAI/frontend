"use client"

import React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SendIcon } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface Message {
  role: 'user' | 'assistant'
  content: string
  code?: {
    language: string
    content: string
  }
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

  const handleSend = () => {
    if (!input.trim()) return

    const newMessages = [
      ...messages,
      { role: 'user', content: input },
      {
        role: 'assistant',
        content: 'Here\'s an example response with some code:',
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

      <div className="p-4 border-t">
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
      </div>
    </div>
  )
}