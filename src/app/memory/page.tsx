'use client'

import { useEffect, useState } from 'react'
import { createMemoryEntry, loadMemoryEntries, onWorkspaceDataChanged, removeMemoryEntry } from '@/lib/workspace-store'
import { getCategoryColor, getCategoryLabel } from '@/lib/utils'
import MemoryForm from '@/components/MemoryForm'
import type { MemoryEntry } from '@/types'

const categoryFilters = [
  { label: '全部', value: 'all' },
  { label: '决策记录', value: 'decision' },
  { label: '流程文档', value: 'sop' },
  { label: '知识库', value: 'knowledge' },
  { label: '客户信息', value: 'customer' },
  { label: '经验教训', value: 'lesson' },
]

function DetailPanel({ entry, onClose, onDelete }: { entry: MemoryEntry; onClose: () => void; onDelete: () => void }) {
  return (
    <div className="glass-card p-5 lg:p-6 animate-fade-in">
      <div className="flex items-start justify-between gap-3 mb-4">
        <h2 className="text-base lg:text-lg font-bold text-white">{entry.title}</h2>
        <div className="flex items-center gap-2">
          <span className={`badge ${getCategoryColor(entry.category)}`}>{getCategoryLabel(entry.category)}</span>
          <button onClick={onClose} className="lg:hidden w-7 h-7 flex items-center justify-center rounded-lg text-dark-300 hover:text-white hover:bg-dark-700 transition-colors text-xs">✕</button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-4 text-xs text-dark-300">
        <span>创建: {entry.createdAt}</span>
        <span>更新: {entry.updatedAt}</span>
      </div>

      <div className="mb-5"><p className="text-sm text-dark-100 leading-relaxed whitespace-pre-wrap">{entry.content}</p></div>

      <div className="flex flex-wrap gap-1.5 mb-5">
        {entry.tags.map(tag => <span key={tag} className="text-xs px-2.5 py-1 bg-dark-700/80 text-dark-200 rounded-lg border border-white/[0.06]">{tag}</span>)}
        {entry.tags.length === 0 && <span className="text-xs text-dark-300">无标签</span>}
      </div>

      <div className="flex gap-2 pt-4 border-t border-white/[0.08]">
        <button onClick={onDelete} className="px-4 py-2 text-xs font-medium text-accent-red hover:text-accent-red/80 border border-accent-red/40 hover:bg-accent-red/10 rounded-lg transition-colors ml-auto">删除</button>
      </div>
    </div>
  )
}

export default function MemoryPage() {
  const [category, setCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [allEntries, setAllEntries] = useState<MemoryEntry[]>([])

  const refresh = () => setAllEntries(loadMemoryEntries())

  useEffect(() => {
    refresh()
    return onWorkspaceDataChanged(refresh)
  }, [])

  const filtered = allEntries
    .filter(entry => category === 'all' || entry.category === category)
    .filter(entry => {
      const query = searchQuery.trim().toLowerCase()
      if (!query) return true
      return entry.title.toLowerCase().includes(query) || entry.content.toLowerCase().includes(query) || entry.tags.some(tag => tag.toLowerCase().includes(query))
    })

  const selected = allEntries.find(entry => entry.id === selectedEntry) ?? null
  const stats = {
    total: allEntries.length,
    decisions: allEntries.filter(entry => entry.category === 'decision').length,
    sops: allEntries.filter(entry => entry.category === 'sop').length,
    knowledge: allEntries.filter(entry => entry.category === 'knowledge').length,
  }

  function deleteSelected() {
    if (!selected) return
    removeMemoryEntry(selected.id)
    setSelectedEntry(null)
    refresh()
  }

  return (
    <div className="space-y-5 max-w-[1600px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">公司记忆库</h1>
          <p className="text-sm text-dark-300 mt-1">只保存你真实新增的知识、决策和经验。</p>
        </div>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-accent-purple/15 hover:bg-accent-purple/25 text-accent-purple text-xs font-medium rounded-xl transition-all border border-accent-purple/20 hover:border-accent-purple/30">+ 新增条目</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: '总条目', value: stats.total, icon: '🧠', color: 'text-white' },
          { label: '决策记录', value: stats.decisions, icon: '📌', color: 'text-accent-purple' },
          { label: '流程文档', value: stats.sops, icon: '📋', color: 'text-accent-blue' },
          { label: '知识条目', value: stats.knowledge, icon: '📚', color: 'text-accent-cyan' },
        ].map(item => (
          <div key={item.label} className="glass-card p-4 flex items-center gap-3"><span className="text-2xl">{item.icon}</span><div><p className={`text-xl font-bold ${item.color}`}>{item.value}</p><p className="text-xs text-dark-300">{item.label}</p></div></div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex-1 relative w-full">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-300">🔍</span>
          <input placeholder="搜索记忆库..." value={searchQuery} onChange={event => setSearchQuery(event.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-dark-900 border border-white/[0.1] rounded-xl text-sm text-dark-100 placeholder-dark-400 focus:outline-none focus:border-accent-purple/50 transition-colors" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {categoryFilters.map(item => (
            <button key={item.value} onClick={() => setCategory(item.value)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${category === item.value ? 'bg-accent-purple/25 text-white border border-accent-purple/40' : 'text-dark-300 hover:text-white border border-white/[0.08] hover:border-white/[0.16]'}`}>{item.label}</button>
          ))}
        </div>
      </div>

      {allEntries.length === 0 ? (
        <div className="glass-card p-10 text-center"><p className="text-base text-dark-100">记忆库还是空的</p><p className="text-sm text-dark-300 mt-2">新增条目后，Agent 才能基于真实记忆辅助你。</p></div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
          <div className="xl:col-span-2 space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filtered.map(entry => (
              <button key={entry.id} onClick={() => setSelectedEntry(entry.id)} className={`w-full text-left glass-card p-4 cursor-pointer transition-all ${selectedEntry === entry.id ? 'border-accent-purple/40 bg-accent-purple/[0.08]' : 'hover:border-white/[0.16] hover:bg-dark-700/40'}`}>
                <div className="flex items-start justify-between gap-2 mb-2"><h3 className="text-sm font-medium text-dark-100 line-clamp-1">{entry.title}</h3><span className={`badge text-[10px] flex-shrink-0 ${getCategoryColor(entry.category)}`}>{getCategoryLabel(entry.category)}</span></div>
                <p className="text-xs text-dark-300 line-clamp-2 leading-relaxed mb-2">{entry.content}</p>
                <div className="flex items-center justify-between"><div className="flex gap-1">{entry.tags.slice(0, 3).map(tag => <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-dark-700 text-dark-300 rounded">{tag}</span>)}</div><span className="text-[10px] text-dark-400">{entry.createdAt}</span></div>
              </button>
            ))}
            {filtered.length === 0 && <div className="text-center py-12 text-dark-300 text-sm">未找到匹配的记忆条目</div>}
          </div>

          <div className="xl:col-span-3">
            <div className="hidden xl:block">
              {selected ? <DetailPanel entry={selected} onClose={() => setSelectedEntry(null)} onDelete={deleteSelected} /> : <div className="glass-card p-12 flex flex-col items-center justify-center text-center h-full min-h-[400px]"><span className="text-5xl mb-4">🧠</span><h3 className="text-sm font-medium text-dark-100 mb-2">选择一条记忆查看详情</h3><p className="text-xs text-dark-300">点击左侧条目查看完整内容</p></div>}
            </div>
            {selected && <div className="xl:hidden fixed inset-0 z-40 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center" onClick={() => setSelectedEntry(null)}><div className="w-full sm:max-w-lg max-h-[85vh] overflow-y-auto" onClick={event => event.stopPropagation()}><DetailPanel entry={selected} onClose={() => setSelectedEntry(null)} onDelete={deleteSelected} /></div></div>}
          </div>
        </div>
      )}

      <MemoryForm open={showForm} onClose={() => setShowForm(false)} onSubmit={(entry) => { createMemoryEntry(entry); refresh() }} />
    </div>
  )
}
