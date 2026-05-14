/**
 * 全局心跳 - 合并所有轮询为一个定时器
 */

import { useEffect, useRef } from 'react'

let heartbeatInterval: ReturnType<typeof setInterval> | null = null
let listenerCount = 0

function startHeartbeat() {
  if (heartbeatInterval) return
  heartbeatInterval = setInterval(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('opc-os-heartbeat'))
    }
  }, 3000)
}

function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval)
    heartbeatInterval = null
  }
}

export function useHeartbeat(callback: () => void) {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handler = () => callbackRef.current()
    listenerCount++
    if (listenerCount === 1) startHeartbeat()
    window.addEventListener('opc-os-heartbeat', handler)
    handler() // 首次立即执行

    return () => {
      window.removeEventListener('opc-os-heartbeat', handler)
      listenerCount--
      if (listenerCount <= 0) stopHeartbeat()
    }
  }, [])
}
