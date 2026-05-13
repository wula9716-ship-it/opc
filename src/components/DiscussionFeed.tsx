'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getRecentEvents } from '@/lib/dispatch/dispatcher'
import type { DispatchEvent } from '@/lib/dispatch/types'

export default function DiscussionFeed() {
  const [events, setEvents] = useState<DispatchEvent[]>([])

  useEffect(() => {
    const refresh = () => setEvents(getRecentEvents(6))
    refresh()
    const interval = window.setInterval(refresh, 3000)
    return () => window.clearInterval(interval)
  }, [])

  return (
    <div className="glass-card p-5 animate-fade-in stagger-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-dark-100">团队讨论快报</h3>
        <Link href="/chat" className="text-xs text-accent-purple hover:text-accent-purple/80 transition-colors font-medium">打开群聊 →</Link>
      </div>
      {events.length === 0 ? (
        <div className="py-10 text-center rounded-xl border border-dashed border-white/[0.1] bg-dark-900/60">
          <p className="text-sm text-dark-200">暂无讨论或调度事件</p>
          <p className="text-xs text-dark-400 mt-1">真实任务执行后，这里才会出现消息。</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
          {events.map(event => (
            <Link href="/dispatch" key={event.id} className="flex gap-3 group cursor-pointer p-2 -mx-2 rounded-xl hover:bg-white/[0.04] transition-colors">
              <div className="w-8 h-8 rounded-xl bg-dark-700/80 flex items-center justify-center flex-shrink-0">
                <span className="text-base">📌</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-medium text-dark-100">调度器</span>
                  <span className="text-[10px] text-dark-300">{new Date(event.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-xs text-dark-300 leading-relaxed line-clamp-2 group-hover:text-dark-100 transition-colors">{event.message}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
