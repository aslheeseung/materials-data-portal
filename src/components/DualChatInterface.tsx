'use client'

import { useState, useRef, useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatPanelProps {
  title: string
  subtitle: string
  endpoint: string
  placeholder: string
  suggestions: string[]
  accentColor: 'indigo' | 'emerald'
  sendButtonText: string
  askQuestionText: string
  errorText: string
  language: string
}

function ChatPanel({
  title,
  subtitle,
  endpoint,
  placeholder,
  suggestions,
  accentColor,
  sendButtonText,
  askQuestionText,
  errorText,
  language,
}: ChatPanelProps) {
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
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          language,
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
        { role: 'assistant', content: errorText },
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
    return content
      .split('\n')
      .map((line, i) => {
        line = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        line = line.replace(
          /\[(.+?)\]\((.+?)\)/g,
          '<a href="$2" target="_blank" class="text-blue-400 hover:underline">$1</a>'
        )
        return <span key={i} dangerouslySetInnerHTML={{ __html: line }} />
      })
      .reduce((acc: React.ReactNode[], curr, i) => {
        if (i > 0) acc.push(<br key={`br-${i}`} />)
        acc.push(curr)
        return acc
      }, [])
  }

  const bgColor = accentColor === 'indigo' ? 'bg-indigo-600' : 'bg-emerald-600'
  const hoverColor = accentColor === 'indigo' ? 'hover:bg-indigo-700' : 'hover:bg-emerald-700'
  const ringColor = accentColor === 'indigo' ? 'focus:ring-indigo-500' : 'focus:ring-emerald-500'
  const borderColor = accentColor === 'indigo' ? 'border-indigo-500/30' : 'border-emerald-500/30'

  return (
    <div className={`flex flex-col h-[650px] bg-gray-900 rounded-xl overflow-hidden border ${borderColor}`}>
      {/* Header */}
      <div className={`${bgColor} px-4 py-3`}>
        <h2 className="text-white font-semibold">{title}</h2>
        <p className="text-white/70 text-sm">{subtitle}</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-4">
            <p className="mb-4 text-sm">{askQuestionText}</p>
            <div className="space-y-2 text-sm">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setInput(suggestion)}
                  className="block w-full text-left px-3 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-xs"
                >
                  &quot;{suggestion}&quot;
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] px-3 py-2 rounded-xl ${
                message.role === 'user' ? `${bgColor} text-white` : 'bg-gray-800 text-gray-100'
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
            <div className="bg-gray-800 text-gray-100 px-3 py-2 rounded-xl">
              <div className="flex items-center space-x-1">
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
      <div className="p-3 border-t border-gray-700">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`flex-1 px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 ${ringColor} focus:border-transparent text-sm`}
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className={`px-4 py-2 ${bgColor} text-white rounded-lg ${hoverColor} transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm`}
          >
            {sendButtonText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function DualChatInterface() {
  const { language, t } = useLanguage()

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Left Panel - Search */}
      <ChatPanel
        title={t('searchTitle')}
        subtitle={t('searchSubtitle')}
        endpoint="/api/search"
        placeholder={t('searchPlaceholder')}
        suggestions={t('searchSuggestions')}
        accentColor="indigo"
        sendButtonText={t('send')}
        askQuestionText={t('askQuestion')}
        errorText={t('error')}
        language={language}
      />

      {/* Right Panel - Compute */}
      <ChatPanel
        title={t('computeTitle')}
        subtitle={t('computeSubtitle')}
        endpoint="/api/compute"
        placeholder={t('computePlaceholder')}
        suggestions={t('computeSuggestions')}
        accentColor="emerald"
        sendButtonText={t('send')}
        askQuestionText={t('askQuestion')}
        errorText={t('error')}
        language={language}
      />
    </div>
  )
}
