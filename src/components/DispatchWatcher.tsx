'use client'

import { useEffect, useRef } from 'react'
import { useToast } from '@/components/Toast'
import { getRecentEvents } from '@/lib/dispatch/dispatcher'
import type { DispatchEvent } from '@/lib/dispatch/types'

/**
 * 全局调度事件监听器
 * 挂载在 layout 中，轮询新事件并触发 toast 通知
 */
export default function DispatchWatcher() {
  const { toast } = useToast()
  const lastEventIdRef = useRef<string | null>(null)

  useEffect(() => {
    const poll = () => {
      const events = getRecentEvents(5)
      if (events.length === 0) return

      const latestId = events[0].id
      if (latestId === lastEventIdRef.current) return

      // 找出新事件
      const newEvents: DispatchEvent[] = []
      for (const evt of events) {
        if (evt.id === lastEventIdRef.current) break
        newEvents.push(evt)
      }
      lastEventIdRef.current = latestId

      // 只通知关键事件
      for (const evt of newEvents.reverse()) {
        switch (evt.type) {
          case 'task_completed':
            toast('🎉 任务完成', evt.message, 'success', 6000)
            break
          case 'subtask_completed':
            toast('✅ 子任务完成', evt.message, 'success', 3000)
            break
          case 'subtask_started':
            toast('▶️ 开始执行', evt.message, 'info', 2000)
            break
          case 'cascade_triggered':
            toast('⚡ 级联触发', evt.message, 'info', 3000)
            break
          case 'subtask_failed':
            toast('❌ 子任务失败', evt.message, 'error', 5000)
            break
        }
      }
    }

    // 初始化
    const events = getRecentEvents(1)
    if (events.length > 0) lastEventIdRef.current = events[0].id

    const interval = setInterval(poll, 3000)
    return () => clearInterval(interval)
  }, [toast])

  return null // 无 UI，纯逻辑
}
