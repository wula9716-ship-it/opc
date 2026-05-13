'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getRecentEvents } from '@/lib/dispatch/dispatcher'
import type { DispatchEvent } from '@/lib/dispatch/types'

const EVENT_ICONS: Record<string, string> = {
  task_completed: '🎉',
  subtask_completed: '✅',
  subtask_started: '▶️',
  subtask_assigned: '👤',
  cascade_triggered: '⚡',
  subtask_failed: '❌',
  task_decomposed: '🧩',
  task_created: '📋',
}

export default function NotificationCenter() {
  const [open, setOpen] = useState(false)
  const [dispatchEvents, setDispatchEvents] = useState<DispatchEvent[]>([])

  useEffect(() => {
    const poll = () => {
      const events = getRecentEvents(5)
      setDispatchEvents(events)
    }
    poll()
    const interval = setInterval(poll, 5000)
    return () => clearInterval(interval)
  }, [])

  const unreadCount = dispatchEvents.length
  const liveEvents = dispatchEvents.map((evt, i) => ({
    id: evt.id,
    icon: EVENT_ICONS[evt.type] ?? '📌',
    title: evt.type === 'task_completed' ? '任务完成' : evt.type === 'subtask_completed' ? '子任务完成' : evt.type === 'task_created' ? '任务创建' : evt.type === 'task_decomposed' ? '任务拆解' : '调度事件',
    desc: evt.message,
    time: new Date(evt.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    read: i > 0,
  }))

  const allItems = liveEvents

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-dark-400 hover:text-dark-200 hover:bg-dark-700/50 rounded-lg transition-all"
      >
        <span className="text-lg">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-accent-red rounded-full text-[9px] font-bold text-white flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
          <div className="fixed right-4 top-14 w-96 p-4 z-[9999] animate-fade-in shadow-2xl rounded-2xl border border-white/[0.16] bg-dark-950" style={{ boxShadow: '0 24px 80px rgba(0,0,0,0.65)' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-dark-100">通知中心</h3>
              <span className="text-[10px] text-dark-300">真实调度事件</span>
            </div>

            <div className="space-y-1 max-h-[400px] overflow-y-auto">
              {allItems.length === 0 && (
                <div className="text-center py-6">
                  <span className="text-2xl">🔕</span>
                  <p className="text-xs text-dark-300 mt-2">还没有通知</p>
                  <p className="text-[10px] text-dark-400 mt-1">执行真实调度后才会产生记录</p>
                </div>
              )}

              {allItems.map(item => (
                <div
                  key={item.id}
                  className={`flex items-start gap-2.5 p-2.5 rounded-lg transition-colors cursor-pointer ${
                    item.read ? 'hover:bg-dark-700/80' : 'bg-accent-purple/[0.12] hover:bg-accent-purple/[0.18]'
                  }`}
                >
                  <span className="text-base flex-shrink-0">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="text-[11px] font-medium text-dark-100">{item.title}</span>
                      <span className="text-[9px] text-dark-300 flex-shrink-0">{item.time}</span>
                    </div>
                    <p className="text-[10px] text-dark-300 line-clamp-2">{item.desc}</p>
                  </div>
                  {!item.read && <div className="w-1.5 h-1.5 rounded-full bg-accent-purple flex-shrink-0 mt-1" />}
                </div>
              ))}
            </div>

            <div className="mt-3 pt-3 border-t border-white/[0.06]">
              <Link href="/dispatch" onClick={() => setOpen(false)} className="block w-full text-center text-[10px] text-accent-purple hover:text-accent-purple/80 transition-colors">
                前往调度台查看事件
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
