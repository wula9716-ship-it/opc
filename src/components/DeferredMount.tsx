'use client'

import { ReactNode, useEffect, useState } from 'react'

interface Props {
  children: ReactNode
  delay?: number
  fallback?: ReactNode
}

export default function DeferredMount({ children, delay = 0, fallback = null }: Props) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    const mount = () => {
      if (!cancelled) setReady(true)
    }

    const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback
    if (idle) {
      const id = idle(() => {
        if (delay > 0) {
          setTimeout(mount, delay)
        } else {
          mount()
        }
      })
      return () => { cancelled = true; if ((window as Window & { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback) (window as Window & { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback?.(id) }
    }

    const timer = window.setTimeout(mount, delay || 16)
    return () => { cancelled = true; window.clearTimeout(timer) }
  }, [delay])

  return ready ? <>{children}</> : <>{fallback}</>
}
