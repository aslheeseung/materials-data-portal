'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = { role: 'user', content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      const data = await response.json()

      if (data.message) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.message },
        ])
      }
    } catch (error) {
      console.error('Error:', error)
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '오류가 발생했습니다. 다시 시도해주세요.' },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatMessage = (content: string) => {
    // Simple markdown-like formatting
    return content
      .split('\n')
      .map((line, i) => {
        // Bold
        line = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        // Links
        line = line.replace(
          /\[(.+?)\]\((.+?)\)/g,
          '<a href="$2" target="_blank" class="text-blue-400 hover:underline">$1</a>'
        )
        return (
          <span key={i} dangerouslySetInnerHTML={{ __html: line }} />
        )
      })
      .reduce((acc: React.ReactNode[], curr, i) => {
        if (i > 0) acc.push(<br key={`br-${i}`} />)
        acc.push(curr)
        return acc
      }, [])
  }

  return (
    <div className="flex flex-col h-[600px] bg-gray-900 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-3 border-b border-gray-700">
        <h2 className="text-white font-semibold">Materials AI Agent</h2>
        <p className="text-gray-400 text-sm">Materials Project + AFLOW + OQMD + COD 통합 검색</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <p className="mb-4">재료에 대해 질문해보세요!</p>
            <div className="space-y-2 text-sm">
              <button
                onClick={() => setInput('SiO2를 모든 데이터베이스에서 검색해줘')}
                className="block w-full text-left px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
              >
                &quot;SiO2를 모든 데이터베이스에서 검색해줘&quot;
              </button>
              <button
                onClick={() => setInput('band gap이 1~2 eV인 반도체를 AFLOW에서 찾아줘')}
                className="block w-full text-left px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
              >
                &quot;band gap이 1~2 eV인 반도체를 AFLOW에서 찾아줘&quot;
              </button>
              <button
                onClick={() => setInput('Fm-3m space group을 가진 결정구조를 COD에서 찾아줘')}
                className="block w-full text-left px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
              >
                &quot;Fm-3m space group을 가진 결정구조를 COD에서 찾아줘&quot;
              </button>
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                message.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-800 text-gray-100'
              }`}
            >
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {formatMessage(message.content)}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 text-gray-100 px-4 py-3 rounded-2xl">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="재료에 대해 질문하세요... (예: IrPt 합금 찾아줘)"
            className="flex-1 px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            전송
          </button>
        </div>
      </div>
    </div>
  )
}
