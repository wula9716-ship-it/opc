'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createAndDispatch, isAIProviderConfigured } from '@/lib/dispatch/dispatcher'
import { useToast } from './Toast'

const QUICK_TASKS = [
  { title: '做一个 Landing Page', desc: '产品落地页设计+开发+上线', icon: '🚀' },
  { title: '写一篇竞品分析报告', desc: '竞品筛选→功能对比→策略建议', icon: '📊' },
  { title: '做一个数据看板', desc: '数据收集→分析→可视化', icon: '📈' },
  { title: '策划内容营销方案', desc: '选题→撰写→SEO→分发', icon: '✍️' },
]

export default function QuickDispatch() {
  const [input, setInput] = useState('')
  const router = useRouter()
  const { toast } = useToast()

  const requireAI = () => {
    if (isAIProviderConfigured()) return true
    toast('还不能分派任务', '请先在设置中接入 AI 平台，系统不会在未接入时伪造执行。', 'warning')
    router.push('/settings')
    return false
  }

  const handleQuick = (title: string) => {
    if (!requireAI()) return
    createAndDispatch(title, '')
    router.push('/dispatch')
  }

  const handleSubmit = () => {
    if (!input.trim()) return
    if (!requireAI()) return
    setInput('')
    createAndDispatch(input.trim(), '')
    router.push('/dispatch')
  }

  return (
    <div className="glass-card p-5 animate-fade-in">
      <h3 className="text-sm font-semibold text-dark-200 mb-3">⚡ 快速分派</h3>

      {/* Input */}
      <div className="flex items-center gap-2 mb-3">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="接入 AI 后输入任务并自动拆解..."
          className="flex-1 px-3 py-2.5 bg-dark-800/60 border border-white/[0.06] rounded-xl text-xs text-dark-200 placeholder-dark-600 focus:outline-none focus:border-accent-purple/40 transition-colors"
        />
        <button
          onClick={handleSubmit}
          disabled={!input.trim()}
          className="px-4 py-2.5 bg-accent-purple hover:bg-accent-purple/90 text-white text-xs font-medium rounded-xl transition-colors disabled:opacity-40"
        >
          🚀
        </button>
      </div>

      {/* Quick templates */}
      <div className="grid grid-cols-2 gap-2">
        {QUICK_TASKS.map(t => (
          <button
            key={t.title}
            onClick={() => handleQuick(t.title)}
            className="flex items-center gap-2 p-2.5 bg-dark-800/40 hover:bg-dark-700/50 border border-white/[0.04] hover:border-white/[0.1] rounded-xl text-left transition-all group"
          >
            <span className="text-lg">{t.icon}</span>
            <div>
              <p className="text-[11px] font-medium text-dark-300 group-hover:text-white transition-colors">{t.title}</p>
              <p className="text-[9px] text-dark-600">{t.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
