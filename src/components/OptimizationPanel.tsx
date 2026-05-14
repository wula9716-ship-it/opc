'use client'

import { useState, useEffect } from 'react'
import { loadSuggestions, updateSuggestionStatus, removeSuggestion } from '@/lib/workspace-store'
import { onWorkspaceDataChanged } from '@/lib/workspace-store'
import type { OptimizationSuggestion } from '@/types'

const CATEGORY_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  performance: { label: '性能', icon: '⚡', color: 'text-accent-yellow' },
  ux: { label: '体验', icon: '🎨', color: 'text-accent-pink' },
  feature: { label: '功能', icon: '✨', color: 'text-accent-blue' },
  bug: { label: 'Bug', icon: '🐛', color: 'text-accent-red' },
  architecture: { label: '架构', icon: '🏗️', color: 'text-accent-purple' },
  workflow: { label: '流程', icon: '🔄', color: 'text-accent-green' },
}

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'bg-accent-red/20 text-accent-red border-accent-red/30',
  high: 'bg-accent-yellow/20 text-accent-yellow border-accent-yellow/30',
  medium: 'bg-accent-blue/20 text-accent-blue border-accent-blue/30',
  low: 'bg-dark-700 text-dark-300 border-white/[0.08]',
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  new: { label: '新发现', color: 'bg-accent-purple/20 text-accent-purple' },
  accepted: { label: '已采纳', color: 'bg-accent-blue/20 text-accent-blue' },
  implementing: { label: '实施中', color: 'bg-accent-yellow/20 text-accent-yellow' },
  done: { label: '已完成', color: 'bg-accent-green/20 text-accent-green' },
  dismissed: { label: '已忽略', color: 'bg-dark-700 text-dark-400' },
}

interface Props {
  compact?: boolean // 仪表盘用的紧凑模式
  maxItems?: number
}

export default function OptimizationPanel({ compact = false, maxItems = 5 }: Props) {
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([])
  const [filter, setFilter] = useState<'all' | 'new' | 'accepted'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    const refresh = () => {
      setSuggestions(loadSuggestions())
    }
    refresh()
    const unsub = onWorkspaceDataChanged(refresh)
    const interval = setInterval(refresh, 5000)
    return () => { unsub(); clearInterval(interval) }
  }, [])

  const filtered = suggestions
    .filter(s => filter === 'all' || s.status === filter)
    .slice(0, maxItems)

  const newCount = suggestions.filter(s => s.status === 'new').length

  // 导出为 Markdown 文件
  function exportAsMarkdown() {
    const lines: string[] = [
      '# OPC OS 优化建议',
      '',
      `> 共 ${suggestions.length} 条建议，导出时间：${new Date().toLocaleString('zh-CN')}`,
      '',
      '---',
      '',
    ]
    for (const s of suggestions) {
      const cat = CATEGORY_LABELS[s.category] || CATEGORY_LABELS.feature
      const priorityLabel = { critical: '🔴 紧急', high: '🟠 高', medium: '🟡 中', low: '🟢 低' }[s.priority] || s.priority
      const statusLabel = { new: '新发现', accepted: '已采纳', implementing: '实施中', done: '已完成', dismissed: '已忽略' }[s.status] || s.status
      lines.push(
        `## ${cat.icon} ${s.title}`,
        '',
        `- **分类**: ${cat.label}`,
        `- **优先级**: ${priorityLabel}`,
        `- **状态**: ${statusLabel}`,
        `- **来源**: ${s.source} (任务: ${s.taskId})`,
        `- **影响**: ${s.impact}`,
        `- **实施难度**: ${s.effort === 'low' ? '低' : s.effort === 'medium' ? '中' : '高'}`,
        '',
        '### 描述',
        '',
        s.description,
        '',
        '### 建议方案',
        '',
        s.proposedSolution,
        '',
        '---',
        '',
      )
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `OPC-OS-优化建议-${new Date().toISOString().slice(0, 10)}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (compact) {
    // 仪表盘紧凑模式
    return (
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">💡</span>
            <h3 className="text-sm font-semibold text-dark-100">优化建议</h3>
            {newCount > 0 && (
              <span className="text-[10px] bg-accent-purple/20 text-accent-purple px-1.5 py-0.5 rounded-full">{newCount} 条新</span>
            )}
          </div>
          <a href="/analytics" className="text-[10px] text-accent-purple hover:text-accent-purple/80">查看全部 →</a>
          <button onClick={exportAsMarkdown} className="text-[10px] px-2 py-1 bg-accent-purple/15 text-accent-purple hover:bg-accent-purple/25 rounded">📥 导出</button>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-4">
            <span className="text-xl">🧠</span>
            <p className="text-xs text-dark-400 mt-1">Agent 执行任务时会自动发现优化点</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(s => {
              const cat = CATEGORY_LABELS[s.category] || CATEGORY_LABELS.feature
              return (
                <div key={s.id} className="flex items-start gap-2.5 p-2.5 bg-dark-800/60 rounded-lg hover:bg-dark-800 transition-colors cursor-pointer" onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}>
                  <span className="text-base flex-shrink-0">{cat.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-dark-100 truncate">{s.title}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full border ${PRIORITY_COLORS[s.priority]}`}>{s.priority}</span>
                    </div>
                    {expandedId === s.id && (
                      <div className="mt-2 space-y-1.5">
                        <p className="text-[11px] text-dark-300">{s.description}</p>
                        <p className="text-[11px] text-accent-green">💡 {s.proposedSolution}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] text-dark-400">影响: {s.impact}</span>
                          <span className="text-[9px] text-dark-400">难度: {s.effort}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {s.status === 'new' && (
                      <button onClick={e => { e.stopPropagation(); updateSuggestionStatus(s.id, 'accepted') }} className="text-[9px] px-2 py-1 bg-accent-blue/10 text-accent-blue rounded hover:bg-accent-blue/20">采纳</button>
                    )}
                    <button onClick={e => { e.stopPropagation(); removeSuggestion(s.id) }} className="text-[9px] px-2 py-1 bg-dark-700 text-dark-400 rounded hover:text-dark-200">✕</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // 完整模式（分析页面用）
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">💡</span>
          <h2 className="text-base font-bold text-dark-100">优化建议</h2>
          <span className="text-xs text-dark-400">Agent 在执行任务时自动发现</span>
          <button onClick={exportAsMarkdown} className="ml-auto px-4 py-2 text-xs font-medium text-white bg-accent-purple hover:bg-accent-purple/90 rounded-lg">
            📥 导出 Markdown
          </button>
        </div>
        <div className="flex gap-1 p-0.5 bg-dark-800 rounded-lg border border-white/[0.08]">
          {[
            { key: 'all' as const, label: '全部' },
            { key: 'new' as const, label: `新发现 (${newCount})` },
            { key: 'accepted' as const, label: '已采纳' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} className={`px-3 py-1 rounded-md text-[11px] font-medium ${filter === f.key ? 'bg-dark-600 text-white' : 'text-dark-300 hover:text-white'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <span className="text-3xl">🧠</span>
          <p className="text-sm text-dark-300 mt-3">还没有优化建议</p>
          <p className="text-xs text-dark-400 mt-1">创建任务让 Agent 执行，它们会自动发现平台可优化的地方</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(s => {
            const cat = CATEGORY_LABELS[s.category] || CATEGORY_LABELS.feature
            const status = STATUS_LABELS[s.status] || STATUS_LABELS.new
            return (
              <div key={s.id} className="glass-card p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{cat.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-dark-100">{s.title}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${PRIORITY_COLORS[s.priority]}`}>{s.priority}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${status.color}`}>{status.label}</span>
                    </div>
                    <p className="text-xs text-dark-300 mb-2">{s.description}</p>
                    <div className="bg-dark-900/60 rounded-lg p-3 mb-2">
                      <p className="text-xs text-accent-green font-medium mb-1">💡 建议方案</p>
                      <p className="text-xs text-dark-200">{s.proposedSolution}</p>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] text-dark-400">
                      <span>来源: {s.source}</span>
                      <span>影响: {s.impact}</span>
                      <span>难度: {s.effort === 'low' ? '低' : s.effort === 'medium' ? '中' : '高'}</span>
                      <span>{cat.label}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    {s.status === 'new' && (
                      <>
                        <button onClick={() => updateSuggestionStatus(s.id, 'accepted')} className="px-3 py-1.5 text-[11px] text-accent-blue bg-accent-blue/10 hover:bg-accent-blue/20 rounded-lg">采纳</button>
                        <button onClick={() => updateSuggestionStatus(s.id, 'dismissed')} className="px-3 py-1.5 text-[11px] text-dark-400 bg-dark-700/60 hover:bg-dark-700 rounded-lg">忽略</button>
                      </>
                    )}
                    {s.status === 'accepted' && (
                      <button onClick={() => updateSuggestionStatus(s.id, 'implementing')} className="px-3 py-1.5 text-[11px] text-accent-yellow bg-accent-yellow/10 hover:bg-accent-yellow/20 rounded-lg">开始实施</button>
                    )}
                    {s.status === 'implementing' && (
                      <button onClick={() => updateSuggestionStatus(s.id, 'done')} className="px-3 py-1.5 text-[11px] text-accent-green bg-accent-green/10 hover:bg-accent-green/20 rounded-lg">标记完成</button>
                    )}
                    <button onClick={() => removeSuggestion(s.id)} className="px-3 py-1.5 text-[11px] text-dark-400 bg-dark-700/60 hover:bg-dark-700 rounded-lg">删除</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
