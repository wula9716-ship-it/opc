'use client'

import { useEffect, useMemo, useState } from 'react'
import { getDispatchStats, isAIProviderConfigured } from '@/lib/dispatch/dispatcher'
import { loadOutputs, loadTasks, onWorkspaceDataChanged } from '@/lib/workspace-store'
import type { KPIData } from '@/types'

const accentMap: Record<string, string> = {
  blue: '#3b82f6',
  purple: '#7c3aed',
  cyan: '#06b6d4',
  amber: '#f59e0b',
  emerald: '#10b981',
  pink: '#ec4899',
}

function getAccentColor(colorStr: string): string {
  for (const [key, val] of Object.entries(accentMap)) {
    if (colorStr.includes(key)) return val
  }
  return '#7c3aed'
}

const PLACEHOLDER: KPIData[] = [
  { label: '任务', value: '-', subValue: '', icon: '📋', color: 'from-blue-500 to-blue-600' },
  { label: 'AI 接入', value: '-', subValue: '', icon: '🤖', color: 'from-purple-500 to-purple-600' },
  { label: '产出', value: '-', subValue: '', icon: '📦', color: 'from-cyan-500 to-cyan-600' },
  { label: '进行中', value: '-', subValue: '', icon: '⚡', color: 'from-amber-500 to-amber-600' },
  { label: '数据源', value: '-', subValue: '', icon: '📈', color: 'from-emerald-500 to-emerald-600' },
  { label: '预算使用', value: '-', subValue: '', icon: '💰', color: 'from-pink-500 to-pink-600' },
]

export default function KPICards() {
  const [mounted, setMounted] = useState(false)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    setMounted(true)
    const refresh = () => setTick(t => t + 1)
    const unsubscribe = onWorkspaceDataChanged(refresh)
    window.addEventListener('opc-os-ai-provider-changed', refresh)
    const interval = window.setInterval(refresh, 3000)
    return () => {
      unsubscribe()
      window.removeEventListener('opc-os-ai-provider-changed', refresh)
      window.clearInterval(interval)
    }
  }, [])

  const kpiData = useMemo<KPIData[]>(() => {
    if (!mounted) return PLACEHOLDER
    void tick
    const tasks = loadTasks()
    const outputs = loadOutputs()
    const dispatchStats = getDispatchStats()
    const aiReady = isAIProviderConfigured()
    const activeTasks = tasks.filter(task => task.status === 'in_progress').length + dispatchStats.executingTasks
    const pendingTasks = tasks.filter(task => task.status === 'pending').length + dispatchStats.totalTasks
    return [
      { label: '任务', value: String(tasks.length + dispatchStats.totalTasks), subValue: pendingTasks > 0 ? `${pendingTasks} 待处理` : '空', icon: '📋', color: 'from-blue-500 to-blue-600' },
      { label: 'AI 接入', value: aiReady ? '已接入' : '未接入', subValue: aiReady ? '可调度' : '先配置平台', icon: '🤖', color: 'from-purple-500 to-purple-600' },
      { label: '产出', value: String(outputs.length), subValue: outputs.length > 0 ? '可查看' : '空', icon: '📦', color: 'from-cyan-500 to-cyan-600' },
      { label: '进行中', value: String(activeTasks), subValue: activeTasks > 0 ? '真实任务' : '无', icon: '⚡', color: 'from-amber-500 to-amber-600' },
      { label: '数据源', value: '-', subValue: '未接入', icon: '📈', color: 'from-emerald-500 to-emerald-600' },
      { label: '预算使用', value: '¥0', subValue: '未产生调用', icon: '💰', color: 'from-pink-500 to-pink-600' },
    ]
  }, [mounted, tick])

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
      {kpiData.map((kpi, i) => {
        const accentColor = getAccentColor(kpi.color)
        return (
          <div
            key={kpi.label}
            className={`kpi-card animate-fade-in stagger-${i + 1}`}
            style={{ '--accent-from': accentColor } as React.CSSProperties}
          >
            <div className="flex items-start justify-between mb-2 lg:mb-3">
              <span className="text-xl lg:text-2xl">{kpi.icon}</span>
              {kpi.trend && (
                <span className={`text-[10px] lg:text-xs font-medium flex items-center gap-0.5 ${kpi.trend === 'up' ? 'text-accent-green' : kpi.trend === 'down' ? 'text-accent-red' : 'text-dark-400'}`}>
                  {kpi.trend === 'up' ? '↑' : kpi.trend === 'down' ? '↓' : '→'}
                  {kpi.trendValue}
                </span>
              )}
            </div>
            <p className="text-xl lg:text-2xl font-bold text-white mb-1 tracking-tight">{kpi.value}</p>
            <div className="flex items-center gap-1">
              <p className="text-[10px] lg:text-xs text-dark-400 truncate">{kpi.label}</p>
              {kpi.subValue && <span className="text-[10px] lg:text-xs text-dark-500 hidden sm:inline">{kpi.subValue}</span>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
