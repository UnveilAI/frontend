"use client"

import React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SendIcon } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  code?: {
    language: string
    content: string
  }
}

export function ChatInterface() {
  const [messages, setMessages] = React.useState<Message[]>([])
  const [input, setInput] = React.useState('')
  const scrollRef = React.useRef<HTMLDivElement>(null)

  const handleSend = () => {
    if (!input.trim()) return

    const newMessages = [
      ...messages,
      { role: 'user', content: input },
      // Simulated response - replace with actual API call
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

    // Scroll to bottom
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }
    }, 100)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        {messages.map((message, index) => (
          <Card key={index} className={`mb-4 p-4 ${
            message.role === 'assistant' ? 'bg-accent' : 'bg-muted'
          }`}>
            <p className="mb-2">{message.content}</p>
            {message.code && (
              <pre className="bg-background p-4 rounded-md overflow-x-auto">
                <code>{message.code.content}</code>
              </pre>
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