'use client'

import { useEffect, useMemo, useState } from 'react'
import { loadMemoryEntries, loadOutputs, loadTasks, onWorkspaceDataChanged } from '@/lib/workspace-store'
import type { MemoryEntry, Output, Task } from '@/types'

type ArchiveTab = 'tasks' | 'outputs' | 'decisions'

function monthOf(date: string): string {
  return date ? date.slice(0, 7) : '未设置'
}

export default function ArchivePage() {
  const [tab, setTab] = useState<ArchiveTab>('tasks')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('all')
  const [tasks, setTasks] = useState<Task[]>([])
  const [outputs, setOutputs] = useState<Output[]>([])
  const [memoryEntries, setMemoryEntries] = useState<MemoryEntry[]>([])

  useEffect(() => {
    const refresh = () => {
      setTasks(loadTasks())
      setOutputs(loadOutputs())
      setMemoryEntries(loadMemoryEntries())
    }
    refresh()
    return onWorkspaceDataChanged(refresh)
  }, [])

  const completedTasks = tasks.filter(task => task.status === 'completed')
  const archivedOutputs = outputs.filter(output => output.status === 'published' || output.status === 'approved')
  const decisions = memoryEntries.filter(entry => entry.category === 'decision' || entry.category === 'lesson')

  const months = useMemo(() => {
    const all = [
      ...completedTasks.map(task => monthOf(task.dueDate)),
      ...archivedOutputs.map(output => monthOf(output.createdAt)),
      ...decisions.map(entry => monthOf(entry.createdAt)),
    ].filter(Boolean)
    return ['all', ...Array.from(new Set(all)).sort().reverse()]
  }, [completedTasks, archivedOutputs, decisions])

  const inMonth = (date: string) => selectedMonth === 'all' || monthOf(date) === selectedMonth
  const search = searchTerm.trim().toLowerCase()

  const filteredTasks = completedTasks.filter(task => inMonth(task.dueDate) && (!search || task.title.toLowerCase().includes(search)))
  const filteredOutputs = archivedOutputs.filter(output => inMonth(output.createdAt) && (!search || output.title.toLowerCase().includes(search)))
  const filteredDecisions = decisions.filter(entry => inMonth(entry.createdAt) && (!search || entry.title.toLowerCase().includes(search) || entry.content.toLowerCase().includes(search)))

  const stats = {
    completedTasks: completedTasks.length,
    archivedOutputs: archivedOutputs.length,
    decisions: decisions.length,
    totalItems: completedTasks.length + archivedOutputs.length + decisions.length,
  }

  return (
    <div className="space-y-5 max-w-[1600px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">归档</h1>
          <p className="text-sm text-dark-300 mt-1">只归档真实完成任务、已发布/已批准产出和真实记忆条目。</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={selectedMonth} onChange={event => setSelectedMonth(event.target.value)} className="px-3 py-2 bg-dark-900 border border-white/[0.1] rounded-xl text-xs text-dark-100 focus:outline-none focus:border-accent-purple/50">
            {months.map(month => <option key={month} value={month}>{month === 'all' ? '全部月份' : month}</option>)}
          </select>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-300 text-xs">🔍</span>
            <input value={searchTerm} onChange={event => setSearchTerm(event.target.value)} placeholder="搜索归档..." className="w-56 pl-9 pr-3 py-2 bg-dark-900 border border-white/[0.1] rounded-xl text-xs text-dark-100 placeholder-dark-400 focus:outline-none focus:border-accent-purple/50" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: '已完成任务', value: stats.completedTasks, icon: '📋', color: 'text-accent-green' },
          { label: '已归档产出', value: stats.archivedOutputs, icon: '📦', color: 'text-accent-blue' },
          { label: '决策/教训', value: stats.decisions, icon: '📌', color: 'text-accent-purple' },
          { label: '总计条目', value: stats.totalItems, icon: '🗄️', color: 'text-white' },
        ].map(item => (
          <div key={item.label} className="glass-card p-4 flex items-center gap-3">
            <span className="text-2xl">{item.icon}</span>
            <div>
              <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
              <p className="text-xs text-dark-300">{item.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 p-1 bg-dark-800 rounded-xl border border-white/[0.08] w-fit">
        {[
          { key: 'tasks' as const, label: '已完成任务', count: filteredTasks.length },
          { key: 'outputs' as const, label: '历史产出', count: filteredOutputs.length },
          { key: 'decisions' as const, label: '决策与教训', count: filteredDecisions.length },
        ].map(item => (
          <button key={item.key} onClick={() => setTab(item.key)} className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${tab === item.key ? 'bg-accent-purple/25 text-white' : 'text-dark-300 hover:text-white'}`}>
            {item.label}<span className="ml-1.5 text-[10px] bg-dark-700 px-1.5 py-0.5 rounded-full">{item.count}</span>
          </button>
        ))}
      </div>

      <div className="glass-card overflow-hidden">
        {tab === 'tasks' && (
          <div className="p-5 space-y-3">
            {filteredTasks.map(task => (
              <div key={task.id} className="flex items-center gap-3 p-4 bg-dark-800/60 rounded-xl border border-white/[0.06]">
                <span className="text-accent-green">✅</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-dark-100 font-medium">{task.title}</p>
                  <p className="text-xs text-dark-300 mt-1">{task.assigneeAvatar} {task.assignee} · {task.dueDate || '无截止日'}</p>
                </div>
                <span className="text-[10px] text-dark-300">已完成</span>
              </div>
            ))}
            {filteredTasks.length === 0 && <div className="text-center py-12 text-dark-300 text-sm">暂无真实归档任务</div>}
          </div>
        )}

        {tab === 'outputs' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-5">
            {filteredOutputs.map(output => (
              <div key={output.id} className="flex items-start gap-4 p-4 bg-dark-800/60 rounded-xl border border-white/[0.06]">
                <div className="w-12 h-12 rounded-xl bg-dark-700 flex items-center justify-center text-2xl flex-shrink-0">📦</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-dark-100">{output.title}</p>
                  <p className="text-[11px] text-dark-300 mt-1">{output.format} · {output.size} · {output.createdBy}</p>
                  <p className="text-[10px] text-dark-400 mt-0.5">{output.createdAt}</p>
                </div>
                <span className="badge bg-accent-green/20 text-accent-green text-[10px]">已归档</span>
              </div>
            ))}
            {filteredOutputs.length === 0 && <div className="lg:col-span-2 text-center py-12 text-dark-300 text-sm">暂无真实归档产出</div>}
          </div>
        )}

        {tab === 'decisions' && (
          <div className="space-y-3 p-5">
            {filteredDecisions.map(entry => (
              <div key={entry.id} className="flex items-start gap-4 p-4 bg-dark-800/60 rounded-xl border border-white/[0.06]">
                <div className="w-10 h-10 rounded-xl bg-dark-700 flex items-center justify-center text-xl flex-shrink-0">{entry.category === 'decision' ? '📌' : '💡'}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-dark-100">{entry.title}</p>
                  <p className="text-xs text-dark-300 leading-relaxed line-clamp-2 mt-1">{entry.content}</p>
                  <p className="text-[10px] text-dark-400 mt-2">{entry.createdAt}</p>
                </div>
              </div>
            ))}
            {filteredDecisions.length === 0 && <div className="text-center py-12 text-dark-300 text-sm">暂无真实决策或教训条目</div>}
          </div>
        )}
      </div>
    </div>
  )
}
