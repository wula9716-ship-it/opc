'use client'

import { useEffect, useState } from 'react'
import { getDispatchStats, isAIProviderConfigured } from '@/lib/dispatch/dispatcher'
import { useHeartbeat } from '@/lib/heartbeat'

export default function SystemPulse() {
  const [pulse, setPulse] = useState({
    providerReady: false,
    totalTasks: 0,
    runningSubtasks: 0,
    queuedSubtasks: 0,
    completedSubtasks: 0,
  })

  useHeartbeat(() => {
    const stats = getDispatchStats()
    setPulse({
      providerReady: isAIProviderConfigured(),
      totalTasks: stats.totalTasks,
      runningSubtasks: stats.runningSubtasks,
      queuedSubtasks: stats.queuedSubtasks,
      completedSubtasks: stats.completedSubtasks,
    })
  })

  return (
    <div className="glass-card p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-dark-100">系统状态</h3>
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${pulse.providerReady ? 'text-accent-green' : 'text-accent-yellow'}`}>
          <span className={`w-2 h-2 rounded-full ${pulse.providerReady ? 'bg-accent-green' : 'bg-accent-yellow'}`} />
          {pulse.providerReady ? 'AI 可用' : '待接入'}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: '调度任务', value: String(pulse.totalTasks), color: 'text-dark-100', icon: '📋' },
          { label: '执行中', value: String(pulse.runningSubtasks), color: 'text-accent-cyan', icon: '⚡' },
          { label: '排队', value: String(pulse.queuedSubtasks), color: 'text-dark-200', icon: '⏳' },
          { label: '已完成', value: String(pulse.completedSubtasks), color: 'text-accent-green', icon: '✅' },
        ].map(item => (
          <div key={item.label} className="text-center rounded-xl bg-dark-900/60 border border-white/[0.08] py-3">
            <span className="text-base block mb-1 opacity-80">{item.icon}</span>
            <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
            <p className="text-[10px] text-dark-300">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
