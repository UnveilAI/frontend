"use client"

import React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SendIcon } from 'lucide-react'
import { questionApi } from '@/api'

interface Message {
  role: "user" | "assistant"
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

  // Modified handleSend with explicit type assertions for role
  const handleSend = async () => {
    if (!input.trim()) return

    // Append the user's message immediately with role as "user"
    setMessages(prevMessages => [
      ...prevMessages,
      { role: "user", content: input } as Message
    ])

    try {
      // Prepare the payload (update repository_id as needed)
      const questionPayload = { repository_id: "repo-123", question: input }
      const questionData = await questionApi.askQuestion(questionPayload)

      // Extract the answer text, using a fallback if not provided
      const answerText = questionData.response?.text_response || "No answer received from the server."

      // Optionally attach the first code snippet if available
      let codeSnippet = undefined
      if (
        questionData.response?.code_snippets &&
        questionData.response.code_snippets.length > 0
      ) {
        codeSnippet = {
          language: questionData.response.code_snippets[0].language,
          content: questionData.response.code_snippets[0].code,
        }
      }

      // Append the assistant's response with the solid answer and role as "assistant"
      const assistantMessage: Message = {
        role: "assistant",
        content: answerText,
        code: codeSnippet
      }
      setMessages(prevMessages => [...prevMessages, assistantMessage])

      // Scroll to the bottom of the chat area
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
      }, 100)
    } catch (error: any) {
      console.error("Error asking question:", error)
      setMessages(prevMessages => [
        ...prevMessages,
        { role: "assistant", content: "Error retrieving answer. Please try again." } as Message
      ])
    }

    setInput('')
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