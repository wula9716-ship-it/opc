'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { agents } from '@/lib/data'
import { isProviderConfigured, sendMessageStream } from '@/lib/ai-providers/chat-engine'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  agent?: string
  agentAvatar?: string
  time: string
  streaming?: boolean
}

export default function ChatPage() {
  const [selectedAgent, setSelectedAgent] = useState(agents[0])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [providerReady, setProviderReady] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setProviderReady(isProviderConfigured())
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = useCallback(async () => {
    if (!input.trim() || isSending) return
    if (!providerReady) return

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    }

    const assistantMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      agent: selectedAgent.name,
      agentAvatar: selectedAgent.avatar,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      streaming: true,
    }

    setMessages(prev => [...prev, userMsg, assistantMsg])
    setInput('')
    setIsSending(true)

    try {
      const history = [...messages, userMsg].map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }))

      let fullContent = ''
      for await (const chunk of sendMessageStream(selectedAgent.name, input.trim(), history)) {
        fullContent += chunk
        setMessages(prev => prev.map(m =>
          m.id === assistantMsg.id ? { ...m, content: fullContent } : m
        ))
      }

      setMessages(prev => prev.map(m =>
        m.id === assistantMsg.id ? { ...m, streaming: false } : m
      ))
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '发送失败'
      setMessages(prev => prev.map(m =>
        m.id === assistantMsg.id ? { ...m, content: `❌ ${errorMsg}`, streaming: false } : m
      ))
    } finally {
      setIsSending(false)
      inputRef.current?.focus()
    }
  }, [input, isSending, providerReady, selectedAgent, messages])

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4 max-w-[1600px]">
      {/* Agent sidebar */}
      <div className="hidden md:flex w-56 flex-shrink-0 glass-card p-4 flex-col">
        <h2 className="text-xs font-semibold text-dark-300 mb-3 px-1">选择 Agent</h2>
        <div className="flex-1 space-y-1 overflow-y-auto">
          {agents.filter(a => a.status !== 'offline').map(agent => (
            <button
              key={agent.id}
              onClick={() => {
                setSelectedAgent(agent)
                setMessages([])
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all ${
                selectedAgent.id === agent.id
                  ? 'bg-accent-purple/15 text-white border border-accent-purple/20'
                  : 'text-dark-300 hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-dark-700/50 flex items-center justify-center text-base flex-shrink-0">
                {agent.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{agent.name}</p>
                <p className="text-[10px] text-dark-500 truncate">{agent.role}</p>
              </div>
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${agent.status === 'online' ? 'bg-accent-green' : 'bg-accent-yellow'}`} />
            </button>
          ))}
        </div>
        {!providerReady && (
          <div className="mt-3 p-2.5 bg-accent-yellow/10 rounded-lg border border-accent-yellow/20">
            <p className="text-[10px] text-accent-yellow font-medium">⚠️ 未配置 AI 平台</p>
            <p className="text-[10px] text-dark-500 mt-0.5">请先在设置中接入</p>
          </div>
        )}
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col glass-card overflow-hidden">
        {/* Chat header */}
        <div className="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-dark-700/50 flex items-center justify-center text-xl">
              {selectedAgent.avatar}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-dark-200">{selectedAgent.name}</h3>
              <p className="text-[10px] text-dark-500">{selectedAgent.role} · {selectedAgent.skills.slice(0, 3).join('、')}</p>
            </div>
          </div>
          <button onClick={() => setMessages([])} className="text-xs text-dark-500 hover:text-dark-300 transition-colors px-3 py-1.5 hover:bg-dark-700/50 rounded-lg">
            清空对话
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-2xl bg-dark-700/40 flex items-center justify-center text-4xl mb-4 border border-white/[0.04]">
                {selectedAgent.avatar}
              </div>
              <h3 className="text-sm font-medium text-dark-300 mb-1">与 {selectedAgent.name} 开始对话</h3>
              <p className="text-xs text-dark-500 max-w-xs leading-relaxed">
                {selectedAgent.name} 是你的 {selectedAgent.role}，擅长 {selectedAgent.skills[0]}、{selectedAgent.skills[1]} 等。
                {!providerReady && ' 请先在设置中接入 AI 平台。'}
              </p>
            </div>
          )}

          {messages.map(msg => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-fade-in`}>
              {msg.role === 'assistant' ? (
                <div className="w-8 h-8 rounded-xl bg-dark-700/60 flex items-center justify-center text-base flex-shrink-0 border border-white/[0.04]">
                  {msg.agentAvatar}
                </div>
              ) : (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  S
                </div>
              )}
              <div className={`max-w-[70%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                <div className={`inline-block p-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-accent-purple/20 text-dark-200 rounded-br-md'
                    : 'bg-dark-700/40 text-dark-300 rounded-bl-md border border-white/[0.04]'
                }`}>
                  {msg.content || (msg.streaming ? <span className="animate-pulse-soft">思考中...</span> : '')}
                  {msg.streaming && msg.content && <span className="animate-pulse-soft">▋</span>}
                </div>
                <p className="text-[10px] text-dark-600 mt-1 px-1">{msg.time}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-5 py-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder={providerReady ? `对 ${selectedAgent.name} 说些什么...` : '请先在设置中接入 AI 平台'}
              disabled={!providerReady}
              className="flex-1 px-4 py-2.5 bg-dark-800/60 border border-white/[0.06] rounded-xl text-sm text-dark-200 placeholder-dark-500 focus:outline-none focus:border-accent-purple/40 transition-colors disabled:opacity-40"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isSending || !providerReady}
              className="px-5 py-2.5 bg-accent-purple hover:bg-accent-purple/90 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSending ? '发送中...' : '发送'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
