'use client'

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react'

interface Toast {
  id: string
  title: string
  message: string
  type: 'success' | 'info' | 'warning' | 'error'
  duration: number
}

interface ToastContextType {
  toast: (title: string, message: string, type?: Toast['type'], duration?: number) => void
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((title: string, message: string, type: Toast['type'] = 'info', duration = 4000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    setToasts(prev => [...prev, { id, title, message, type, duration }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const typeStyles: Record<Toast['type'], string> = {
    success: 'bg-accent-green/10 border-accent-green/20',
    error: 'bg-accent-red/10 border-accent-red/20',
    warning: 'bg-accent-yellow/10 border-accent-yellow/20',
    info: 'bg-dark-800/90 border-white/[0.1]',
  }

  const typeIcons: Record<Toast['type'], string> = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  }

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`pointer-events-auto w-80 p-4 rounded-xl border backdrop-blur-xl shadow-2xl animate-slide-in cursor-pointer ${typeStyles[t.type]}`}
            onClick={() => removeToast(t.id)}
          >
            <div className="flex items-start gap-3">
              <span className="text-lg flex-shrink-0">{typeIcons[t.type]}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-dark-200">{t.title}</p>
                <p className="text-[11px] text-dark-400 mt-0.5 line-clamp-2">{t.message}</p>
              </div>
              <button className="text-dark-500 hover:text-dark-300 text-xs flex-shrink-0">✕</button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
