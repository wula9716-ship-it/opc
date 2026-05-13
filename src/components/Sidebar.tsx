'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { loadMemoryEntries, loadOutputs, loadTasks, onWorkspaceDataChanged } from '@/lib/workspace-store'
import { isAIProviderConfigured } from '@/lib/dispatch/dispatcher'

const baseNavItems = [
  { label: '仪表盘', href: '/', icon: '📊' },
  { label: '调度台', href: '/dispatch', icon: '🎯' },
  { label: '任务', href: '/tasks', icon: '📋', badgeKey: 'tasks' as const },
  { label: 'Agent 库', href: '/agents', icon: '🤖' },
  { label: '工作流', href: '/workflows', icon: '🔄' },
  { label: '产出', href: '/outputs', icon: '📦', badgeKey: 'outputs' as const },
  { label: '记忆库', href: '/memory', icon: '🧠', badgeKey: 'memory' as const },
  { label: '日历', href: '/calendar', icon: '📅' },
  { label: '归档', href: '/archive', icon: '🗄️' },
  { label: '分析报表', href: '/analytics', icon: '📈' },
  { label: '群聊', href: '/chat', icon: '💬' },
  { label: '设置', href: '/settings', icon: '⚙️' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [counts, setCounts] = useState({ tasks: 0, outputs: 0, memory: 0, aiReady: false })

  const refreshCounts = useCallback(() => {
    setCounts({
      tasks: loadTasks().length,
      outputs: loadOutputs().length,
      memory: loadMemoryEntries().length,
      aiReady: isAIProviderConfigured(),
    })
  }, [])

  useEffect(() => {
    setMounted(true)
    setCollapsed(localStorage.getItem('opc-os-sidebar-collapsed') === 'true')
    refreshCounts()
    const unsubscribe = onWorkspaceDataChanged(refreshCounts)
    window.addEventListener('opc-os-ai-provider-changed', refreshCounts)
    return () => {
      unsubscribe()
      window.removeEventListener('opc-os-ai-provider-changed', refreshCounts)
    }
  }, [refreshCounts])

  const toggleCollapsed = useCallback(() => {
    setCollapsed(prev => {
      const next = !prev
      localStorage.setItem('opc-os-sidebar-collapsed', String(next))
      return next
    })
  }, [])

  const openSearch = useCallback(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))
  }, [])

  const navItems = useMemo(() => baseNavItems.map(item => {
    const badgeKey = 'badgeKey' in item ? item.badgeKey : undefined
    if (!badgeKey) return item
    const value = counts[badgeKey]
    return value > 0 ? { ...item, badge: String(value) } : item
  }), [counts])

  if (!mounted) {
    return (
      <aside className="h-screen flex flex-col w-[240px] flex-shrink-0 bg-dark-900/80 border-r border-white/[0.06]">
        <div className="px-4 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-purple to-accent-blue flex items-center justify-center text-white font-bold text-sm" />
            <div><div className="h-4 w-16 bg-dark-700 rounded animate-pulse" /><div className="h-2.5 w-24 bg-dark-800 rounded mt-1 animate-pulse" /></div>
          </div>
        </div>
      </aside>
    )
  }

  return (
    <aside className={cn('h-screen flex flex-col border-r border-white/[0.08] backdrop-blur-xl transition-all duration-300 flex-shrink-0', collapsed ? 'w-[68px]' : 'w-[240px]')} style={{ background: 'rgba(10, 10, 30, 0.92)' }}>
      <div className="px-4 py-4 border-b border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-purple to-accent-blue flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-lg">O</div>
          {!collapsed && <div className="min-w-0"><h1 className="text-sm font-bold text-white tracking-tight">OPC OS</h1><p className="text-[10px] text-dark-300 font-medium">One Person Company</p></div>}
        </div>
        <button onClick={toggleCollapsed} className="w-7 h-7 flex items-center justify-center rounded-lg text-dark-300 hover:text-white hover:bg-white/[0.08] transition-colors text-xs flex-shrink-0" title={collapsed ? '展开侧边栏' : '收起侧边栏'}>{collapsed ? '→' : '←'}</button>
      </div>

      {!collapsed ? (
        <div className="px-3 py-3"><button onClick={openSearch} className="w-full flex items-center gap-2 px-3 py-2 bg-dark-800 rounded-xl border border-white/[0.08] text-dark-300 text-sm hover:border-white/[0.16] hover:bg-dark-700 transition-all group"><span>🔍</span><span className="text-xs">搜索</span><kbd className="ml-auto text-[10px] px-1.5 py-0.5 bg-dark-700 text-dark-300 rounded-md border border-white/[0.08]">⌘K</kbd></button></div>
      ) : (
        <div className="px-2 py-2 flex justify-center"><button onClick={openSearch} className="w-8 h-8 flex items-center justify-center rounded-lg text-dark-300 hover:text-white hover:bg-white/[0.08] transition-colors" title="搜索 (Ctrl+K)">🔍</button></div>
      )}

      <nav className="flex-1 px-2 py-1 overflow-y-auto">
        <div className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
            return (
              <Link key={item.href} href={item.href} className={cn('sidebar-link', collapsed && 'justify-center px-0', isActive && 'active')} title={collapsed ? item.label : undefined}>
                <span className="text-base flex-shrink-0">{item.icon}</span>
                {!collapsed && <span className="text-sm truncate">{item.label}</span>}
                {!collapsed && 'badge' in item && item.badge && <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-accent-blue/20 text-accent-blue">{item.badge}</span>}
              </Link>
            )
          })}
        </div>
      </nav>

      <div className={cn('px-3 py-3 border-t border-white/[0.08] space-y-2', collapsed && 'px-2')}>
        {!collapsed ? (
          <>
            <div className="flex items-center gap-2 text-xs text-dark-300"><span>🤖</span><span>{counts.aiReady ? 'AI 已接入' : 'AI 未接入'}</span></div>
            <div className="flex items-center gap-2 text-xs text-dark-300"><span>📋</span><span>{counts.tasks} 任务 · {counts.outputs} 产出</span></div>
            <p className="text-[10px] text-dark-400 leading-relaxed">本地单机数据，不显示虚构运营指标。</p>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1 text-[10px] text-dark-300"><span>{counts.aiReady ? '🟢' : '⚪'}</span></div>
        )}
      </div>
    </aside>
  )
}
