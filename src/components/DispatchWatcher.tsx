'use client'

import { useEffect, useRef } from 'react'
import { useToast } from '@/components/Toast'
import { getRecentEvents } from '@/lib/dispatch/dispatcher'
import { useHeartbeat } from '@/lib/heartbeat'
import type { DispatchEvent } from '@/lib/dispatch/types'

export default function DispatchWatcher() {
  const { toast } = useToast()
  const lastEventIdRef = useRef<string | null>(null)

  useHeartbeat(() => {
    const events = getRecentEvents(5)
    if (events.length === 0) return

    const latestId = events[0].id
    if (latestId === lastEventIdRef.current) return

    const newEvents: DispatchEvent[] = []
    for (const evt of events) {
      if (evt.id === lastEventIdRef.current) break
      newEvents.push(evt)
    }
    lastEventIdRef.current = latestId

    for (const evt of newEvents.reverse()) {
      switch (evt.type) {
        case 'task_completed':
          toast('🎉 任务完成', evt.message, 'success', 6000); break
        case 'subtask_completed':
          toast('✅ 子任务完成', evt.message, 'success', 3000); break
        case 'subtask_started':
          toast('▶️ 开始执行', evt.message, 'info', 2000); break
        case 'cascade_triggered':
          toast('⚡ 级联触发', evt.message, 'info', 3000); break
        case 'subtask_failed':
          toast('❌ 子任务失败', evt.message, 'error', 5000); break
      }
    }
  })

  // 监听执行错误
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail?.error) {
        toast('❌ 执行出错', `子任务 ${detail.subtaskId}: ${detail.error}`, 'error', 8000)
      }
    }
    window.addEventListener('opc-os-executor-error', handler)
    return () => window.removeEventListener('opc-os-executor-error', handler)
  }, [toast])

  return null
}
