'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'

// Agent types
type AgentType = 'master' | 'database' | 'synthesis' | 'compute' | 'research'
type Mode = 'master' | 'single' | 'research'

interface AgentMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  thinking?: string
}

interface AgentState {
  messages: AgentMessage[]
  isLoading: boolean
}

// Agent configuration
const agentConfig: Record<AgentType, {
  name: string
  nameEn: string
  icon: string
  color: string
  bgColor: string
  borderColor: string
  description: string
  descriptionEn: string
}> = {
  master: {
    name: 'Master Agent',
    nameEn: 'Master Agent',
    icon: '🤖',
    color: 'text-purple-400',
    bgColor: 'bg-purple-900/30',
    borderColor: 'border-purple-500/50',
    description: '모든 Agent를 조율합니다',
    descriptionEn: 'Orchestrates all agents'
  },
  database: {
    name: 'Database Agent',
    nameEn: 'Database Agent',
    icon: '🔍',
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/30',
    borderColor: 'border-blue-500/50',
    description: 'MP, AFLOW, OQMD, COD',
    descriptionEn: 'MP, AFLOW, OQMD, COD'
  },
  synthesis: {
    name: 'Synthesis Agent',
    nameEn: 'Synthesis Agent',
    icon: '🧪',
    color: 'text-green-400',
    bgColor: 'bg-green-900/30',
    borderColor: 'border-green-500/50',
    description: '합성 레시피 검색/생성',
    descriptionEn: 'Recipe search/generation'
  },
  compute: {
    name: 'Compute Agent',
    nameEn: 'Compute Agent',
    icon: '⚡',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-900/30',
    borderColor: 'border-yellow-500/50',
    description: 'Pymatgen/ASE 계산',
    descriptionEn: 'Pymatgen/ASE calculations'
  },
  research: {
    name: 'Research Agent',
    nameEn: 'Research Agent',
    icon: '🔬',
    color: 'text-pink-400',
    bgColor: 'bg-pink-900/30',
    borderColor: 'border-pink-500/50',
    description: '조합 스크리닝/후보 탐색',
    descriptionEn: 'Combination screening'
  },
}

function AgentPanel({
  agent,
  state,
  isSelected,
  onClick,
  mode,
  language
}: {
  agent: AgentType
  state: AgentState
  isSelected: boolean
  onClick: () => void
  mode: Mode
  language: string
}) {
  const config = agentConfig[agent]
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [state.messages])

  const isClickable = mode === 'single' && agent !== 'master' && agent !== 'research'

  return (
    <div
      className={`flex flex-col h-full rounded-xl border-2 transition-all duration-200 ${config.bgColor} ${
        isSelected && mode === 'single'
          ? `${config.borderColor} ring-2 ring-offset-2 ring-offset-gray-900 ring-${config.color.replace('text-', '')}`
          : 'border-gray-700'
      } ${isClickable ? 'cursor-pointer hover:border-gray-500' : ''}`}
      onClick={isClickable ? onClick : undefined}
    >
      {/* Header */}
      <div className={`px-3 py-2 border-b border-gray-700/50 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <span className="text-lg">{config.icon}</span>
          <div>
            <span className={`font-semibold text-sm ${config.color}`}>{config.name}</span>
            <p className="text-xs text-gray-500">{language === 'ko' ? config.description : config.descriptionEn}</p>
          </div>
        </div>
        {state.isLoading && (
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-0">
        {state.messages.length === 0 && (
          <div className="text-center text-gray-600 text-xs py-4">
            {mode === 'single' && agent !== 'master'
              ? (language === 'ko' ? '클릭하여 선택' : 'Click to select')
              : (language === 'ko' ? '대기 중...' : 'Waiting...')
            }
          </div>
        )}
        {state.messages.map((msg) => (
          <div key={msg.id} className={`text-xs ${msg.role === 'user' ? 'text-right' : ''}`}>
            {msg.thinking && (
              <div className="text-gray-500 italic mb-1 text-xs">
                💭 {msg.thinking}
              </div>
            )}
            <div className={`inline-block max-w-full px-2 py-1.5 rounded-lg ${
              msg.role === 'user'
                ? 'bg-gray-700 text-gray-200'
                : `${config.bgColor} text-gray-100 border border-gray-700`
            }`}>
              <div
                className="whitespace-pre-wrap break-words"
                dangerouslySetInnerHTML={{
                  __html: msg.content
                    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\n/g, '<br/>')
                }}
              />
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}

export default function LabPage() {
  const { language } = useLanguage()
  const [mode, setMode] = useState<Mode>('master')
  const [selectedAgent, setSelectedAgent] = useState<AgentType>('database')
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  // Agent states
  const [agentStates, setAgentStates] = useState<Record<AgentType, AgentState>>({
    master: { messages: [], isLoading: false },
    database: { messages: [], isLoading: false },
    synthesis: { messages: [], isLoading: false },
    compute: { messages: [], isLoading: false },
    research: { messages: [], isLoading: false },
  })

  const generateId = () => Math.random().toString(36).substring(7)

  const addMessage = (agent: AgentType, role: 'user' | 'assistant', content: string, thinking?: string) => {
    setAgentStates(prev => ({
      ...prev,
      [agent]: {
        ...prev[agent],
        messages: [...prev[agent].messages, { id: generateId(), role, content, thinking }]
      }
    }))
  }

  const setAgentLoading = (agent: AgentType, isLoading: boolean) => {
    setAgentStates(prev => ({
      ...prev,
      [agent]: { ...prev[agent], isLoading }
    }))
  }

  const clearAllMessages = () => {
    setAgentStates({
      master: { messages: [], isLoading: false },
      database: { messages: [], isLoading: false },
      synthesis: { messages: [], isLoading: false },
      compute: { messages: [], isLoading: false },
      research: { messages: [], isLoading: false },
    })
  }

  const sendMessage = async () => {
    if (!input.trim() || isProcessing) return

    const userInput = input.trim()
    setInput('')
    setIsProcessing(true)

    if (mode === 'master') {
      // Master mode: orchestrate through all agents
      addMessage('master', 'user', userInput)
      setAgentLoading('master', true)

      try {
        const response = await fetch('/api/lab', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: userInput, language }),
        })

        const data = await response.json()
        setAgentLoading('master', false)

        if (data.error) {
          addMessage('master', 'assistant', `오류: ${data.error}`)
        } else {
          // Process each step and display in appropriate agent panel
          for (const step of data.steps || []) {
            const agent = step.agent as AgentType
            setAgentLoading(agent, true)
            await new Promise(r => setTimeout(r, 300)) // Visual delay
            addMessage(agent, 'assistant', step.content, step.thinking)
            setAgentLoading(agent, false)
          }
        }
      } catch (error) {
        console.error('Lab API error:', error)
        setAgentLoading('master', false)
        addMessage('master', 'assistant', '오류가 발생했습니다.')
      }
    } else if (mode === 'research') {
      // Research mode: systematic screening
      addMessage('research', 'user', userInput)
      setAgentLoading('research', true)

      try {
        const response = await fetch('/api/lab/research', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: userInput, language }),
        })

        const data = await response.json()
        setAgentLoading('research', false)

        if (data.error) {
          addMessage('research', 'assistant', `오류: ${data.error}`)
        } else {
          // Display each step
          for (const step of data.steps || []) {
            addMessage('research', 'assistant', step.content)
            await new Promise(r => setTimeout(r, 200))
          }
        }
      } catch (error) {
        console.error('Research API error:', error)
        setAgentLoading('research', false)
        addMessage('research', 'assistant', '오류가 발생했습니다.')
      }
    } else {
      // Single mode: direct interaction with selected agent
      addMessage(selectedAgent, 'user', userInput)
      setAgentLoading(selectedAgent, true)

      try {
        const response = await fetch('/api/lab/single', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userInput,
            agent: selectedAgent,
            language
          }),
        })

        const data = await response.json()
        setAgentLoading(selectedAgent, false)

        if (data.error) {
          addMessage(selectedAgent, 'assistant', `오류: ${data.error}`)
        } else {
          addMessage(selectedAgent, 'assistant', data.content, data.thinking)
        }
      } catch (error) {
        console.error('Single agent error:', error)
        setAgentLoading(selectedAgent, false)
        addMessage(selectedAgent, 'assistant', '오류가 발생했습니다.')
      }
    }

    setIsProcessing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const getPlaceholder = () => {
    if (mode === 'master') {
      return language === 'ko'
        ? 'Master Agent에게 질문하세요... (예: LiCoO2 찾아서 합성 레시피도 알려줘)'
        : 'Ask Master Agent... (e.g., Find LiCoO2 and show synthesis recipes)'
    } else if (mode === 'research') {
      return language === 'ko'
        ? '연구 쿼리 입력... (예: 전이금속 3원계 합금 후보 찾아줘)'
        : 'Enter research query... (e.g., Find ternary alloy candidates from transition metals)'
    } else {
      const agentName = agentConfig[selectedAgent].name
      return language === 'ko'
        ? `${agentName}에게 직접 질문하세요...`
        : `Ask ${agentName} directly...`
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                ← Back
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  🧪 Materials Lab
                </h1>
              </div>
            </div>

            {/* Mode Toggle */}
            <div className="flex items-center gap-2">
              <div className="flex bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setMode('master')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    mode === 'master'
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  🤖 Master
                </button>
                <button
                  onClick={() => setMode('single')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    mode === 'single'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  🎯 Single
                </button>
                <button
                  onClick={() => setMode('research')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    mode === 'research'
                      ? 'bg-pink-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  🔬 Research
                </button>
              </div>
              <button
                onClick={clearAllMessages}
                className="px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-4 w-full flex flex-col">
        {/* Research Mode - Full width panel */}
        {mode === 'research' && (
          <div className="flex-1 mb-4" style={{ height: 'calc(100vh - 200px)' }}>
            <AgentPanel
              agent="research"
              state={agentStates.research}
              isSelected={false}
              onClick={() => {}}
              mode={mode}
              language={language}
            />
          </div>
        )}

        {/* Master/Single Mode Layout */}
        {mode !== 'research' && (
          <>
            {/* Master Agent Panel (Top) */}
            <div className={`mb-4 transition-all duration-300 ${mode === 'master' ? 'h-40' : 'h-20 opacity-50'}`}>
              <AgentPanel
                agent="master"
                state={agentStates.master}
                isSelected={false}
                onClick={() => {}}
                mode={mode}
                language={language}
              />
            </div>

            {/* Connection Arrow */}
            {mode === 'master' && (
              <div className="flex justify-center mb-4">
                <div className="flex flex-col items-center text-gray-600">
                  <div className="w-0.5 h-4 bg-gray-700" />
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-0.5 bg-gray-700" />
                    <span className="text-xs">orchestrates</span>
                    <div className="w-32 h-0.5 bg-gray-700" />
                  </div>
                  <div className="flex justify-center gap-32">
                    <div className="w-0.5 h-4 bg-gray-700" />
                    <div className="w-0.5 h-4 bg-gray-700" />
                    <div className="w-0.5 h-4 bg-gray-700" />
                  </div>
                </div>
              </div>
            )}

            {/* Three Agent Panels (Bottom Row) */}
            <div className="flex-1 grid grid-cols-3 gap-4 min-h-0" style={{ height: 'calc(100vh - 380px)' }}>
              <AgentPanel
                agent="database"
                state={agentStates.database}
                isSelected={selectedAgent === 'database'}
                onClick={() => setSelectedAgent('database')}
                mode={mode}
                language={language}
              />
              <AgentPanel
                agent="synthesis"
                state={agentStates.synthesis}
                isSelected={selectedAgent === 'synthesis'}
                onClick={() => setSelectedAgent('synthesis')}
                mode={mode}
                language={language}
              />
              <AgentPanel
                agent="compute"
                state={agentStates.compute}
                isSelected={selectedAgent === 'compute'}
                onClick={() => setSelectedAgent('compute')}
                mode={mode}
                language={language}
              />
            </div>
          </>
        )}

        {/* Input Area */}
        <div className="mt-4 bg-gray-900 rounded-xl border border-gray-700 p-4">
          <div className="flex gap-3">
            {mode === 'single' && (
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${agentConfig[selectedAgent].bgColor} border ${agentConfig[selectedAgent].borderColor}`}>
                <span>{agentConfig[selectedAgent].icon}</span>
                <span className={`text-sm font-medium ${agentConfig[selectedAgent].color}`}>
                  {agentConfig[selectedAgent].name}
                </span>
              </div>
            )}
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={getPlaceholder()}
              className="flex-1 px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={isProcessing}
            />
            <button
              onClick={sendMessage}
              disabled={isProcessing || !input.trim()}
              className={`px-6 py-3 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium ${
                mode === 'master'
                  ? 'bg-purple-600 hover:bg-purple-700'
                  : mode === 'research'
                  ? 'bg-pink-600 hover:bg-pink-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {mode === 'research' ? (language === 'ko' ? '스크리닝' : 'Screen') : (language === 'ko' ? '전송' : 'Send')}
            </button>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
            <span>
              {mode === 'master'
                ? (language === 'ko' ? 'Master Agent가 적절한 Agent에게 작업을 분배합니다' : 'Master Agent distributes tasks to appropriate agents')
                : mode === 'research'
                ? (language === 'ko' ? '원소 조합을 스크리닝하여 후보 재료를 찾습니다' : 'Screen element combinations to find candidate materials')
                : (language === 'ko' ? '선택한 Agent와 직접 대화합니다' : 'Chat directly with selected agent')
              }
            </span>
            <span>Enter to send</span>
          </div>
        </div>
      </main>
    </div>
  )
}
