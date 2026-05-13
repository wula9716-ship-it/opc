'use client'

import { useState, useEffect, useCallback, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface Command {
  id: string
  label: string
  description: string
  icon: string
  shortcut: string
  action: () => void
  category: 'navigate' | 'create' | 'action'
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const router = useRouter()

  const commands: Command[] = [
    { id: 'dash', label: '仪表盘', description: '返回主页', icon: '📊', shortcut: 'G D', category: 'navigate', action: () => router.push('/') },
    { id: 'dispatch', label: '调度台', description: 'Agent 自动分派控制中心', icon: '🎯', shortcut: 'G P', category: 'navigate', action: () => router.push('/dispatch') },
    { id: 'tasks', label: '任务', description: '管理所有任务', icon: '📋', shortcut: 'G T', category: 'navigate', action: () => router.push('/tasks') },
    { id: 'agents', label: 'Agent 库', description: '管理 AI 团队成员', icon: '🤖', shortcut: 'G A', category: 'navigate', action: () => router.push('/agents') },
    { id: 'workflows', label: '工作流', description: '自动化流程引擎', icon: '🔄', shortcut: 'G W', category: 'navigate', action: () => router.push('/workflows') },
    { id: 'outputs', label: '产出', description: '管理交付物', icon: '📦', shortcut: 'G O', category: 'navigate', action: () => router.push('/outputs') },
    { id: 'memory', label: '记忆库', description: '知识沉淀检索', icon: '🧠', shortcut: 'G M', category: 'navigate', action: () => router.push('/memory') },
    { id: 'chat', label: '群聊', description: 'Agent 团队沟通', icon: '💬', shortcut: 'G C', category: 'navigate', action: () => router.push('/chat') },
    { id: 'settings', label: '设置', description: 'AI 平台配置', icon: '⚙️', shortcut: 'G S', category: 'navigate', action: () => router.push('/settings') },
    { id: 'new-task', label: '新建任务', description: '创建并自动分派任务', icon: '📋', shortcut: 'N', category: 'create', action: () => router.push('/dispatch') },
    { id: 'new-output', label: '新建产出', description: '创建交付物', icon: '📦', shortcut: 'O', category: 'create', action: () => router.push('/outputs') },
    { id: 'sidebar', label: '折叠侧边栏', description: '切换侧边栏宽度', icon: '📐', shortcut: 'B', category: 'action', action: () => {
      const state = localStorage.getItem('opc-os-sidebar-collapsed') === 'true'
      localStorage.setItem('opc-os-sidebar-collapsed', String(!state))
      window.location.reload()
    }},
  ]

  const filtered = query.trim()
    ? commands.filter(c => c.label.toLowerCase().includes(query.toLowerCase()) || c.description.toLowerCase().includes(query.toLowerCase()))
    : commands

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K / Cmd+K 打开命令面板
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(prev => !prev)
        setQuery('')
        return
      }

      // Escape 关闭
      if (e.key === 'Escape' && open) {
        setOpen(false)
        return
      }

      if (!open) return

      // 键盘导航
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(i => Math.min(i + 1, filtered.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(i => Math.max(i - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].action()
          setOpen(false)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, filtered, selectedIndex])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh]">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-lg glass-card p-3 animate-fade-in shadow-2xl">
        <div className="flex items-center gap-2 px-1 mb-2">
          <span className="text-dark-500">🔍</span>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="输入命令搜索... (Ctrl+K)"
            className="flex-1 bg-transparent text-sm text-dark-200 placeholder-dark-600 focus:outline-none"
            autoFocus
          />
          <kbd className="text-[10px] px-1.5 py-0.5 bg-dark-700 text-dark-500 rounded">↵</kbd>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {/* Navigate */}
          {filtered.some(c => c.category === 'navigate') && (
            <div className="mb-2">
              <span className="text-[10px] text-dark-600 px-1 block mb-1">导航</span>
              {filtered.filter(c => c.category === 'navigate').map((cmd, i) => {
                const globalIdx = filtered.indexOf(cmd)
                return (
                  <button
                    key={cmd.id}
                    onClick={() => { cmd.action(); setOpen(false) }}
                    className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left transition-colors ${
                      selectedIndex === globalIdx ? 'bg-accent-purple/10' : 'hover:bg-white/[0.03]'
                    }`}
                  >
                    <span className="text-lg">{cmd.icon}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-dark-200">{cmd.label}</span>
                      <span className="text-[10px] text-dark-500 ml-2">{cmd.description}</span>
                    </div>
                    <kbd className="text-[10px] px-1.5 py-0.5 bg-dark-700 text-dark-500 rounded">{cmd.shortcut}</kbd>
                  </button>
                )
              })}
            </div>
          )}

          {/* Create */}
          {filtered.some(c => c.category === 'create') && (
            <div className="mb-2">
              <span className="text-[10px] text-dark-600 px-1 block mb-1">创建</span>
              {filtered.filter(c => c.category === 'create').map((cmd, i) => {
                const globalIdx = filtered.indexOf(cmd)
                return (
                  <button
                    key={cmd.id}
                    onClick={() => { cmd.action(); setOpen(false) }}
                    className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left transition-colors ${
                      selectedIndex === globalIdx ? 'bg-accent-purple/10' : 'hover:bg-white/[0.03]'
                    }`}
                  >
                    <span className="text-lg">{cmd.icon}</span>
                    <div className="flex-1">
                      <span className="text-xs text-dark-200">{cmd.label}</span>
                    </div>
                    <kbd className="text-[10px] px-1.5 py-0.5 bg-dark-700 text-dark-500 rounded">{cmd.shortcut}</kbd>
                  </button>
                )
              })}
            </div>
          )}

          {/* Actions */}
          {filtered.some(c => c.category === 'action') && (
            <div>
              <span className="text-[10px] text-dark-600 px-1 block mb-1">操作</span>
              {filtered.filter(c => c.category === 'action').map((cmd, i) => {
                const globalIdx = filtered.indexOf(cmd)
                return (
                  <button
                    key={cmd.id}
                    onClick={() => { cmd.action(); setOpen(false) }}
                    className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left transition-colors ${
                      selectedIndex === globalIdx ? 'bg-accent-purple/10' : 'hover:bg-white/[0.03]'
                    }`}
                  >
                    <span className="text-lg">{cmd.icon}</span>
                    <div className="flex-1">
                      <span className="text-xs text-dark-200">{cmd.label}</span>
                    </div>
                    <kbd className="text-[10px] px-1.5 py-0.5 bg-dark-700 text-dark-500 rounded">{cmd.shortcut}</kbd>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-6">
            <p className="text-sm text-dark-500">未找到匹配命令</p>
          </div>
        )}

        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-white/[0.06] px-1">
          <kbd className="text-[9px] px-1 py-0.5 bg-dark-700 text-dark-600 rounded">↑↓</kbd>
          <span className="text-[9px] text-dark-600">导航</span>
          <kbd className="text-[9px] px-1 py-0.5 bg-dark-700 text-dark-600 rounded ml-2">↵</kbd>
          <span className="text-[9px] text-dark-600">选择</span>
          <kbd className="text-[9px] px-1 py-0.5 bg-dark-700 text-dark-600 rounded ml-2">Esc</kbd>
          <span className="text-[9px] text-dark-600">关闭</span>
        </div>
      </div>
    </div>
  )
}
