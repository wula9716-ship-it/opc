'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { agents } from '@/lib/data'
import { getAgentStatusColor } from '@/lib/utils'
import { getAllCapabilities } from '@/lib/dispatch/agent-registry'

const levelLabels: Record<string, string> = {
  management: '管理层',
  execution: '执行层',
  professional: '专业层',
  support: '支援层',
}

const levelColors: Record<string, string> = {
  management: 'bg-accent-purple/20 text-accent-purple',
  execution: 'bg-accent-blue/20 text-accent-blue',
  professional: 'bg-accent-cyan/20 text-accent-cyan',
  support: 'bg-accent-yellow/20 text-accent-yellow',
}

export default function AgentsPage() {
  const [selectedLevel, setSelectedLevel] = useState<string>('all')
  const levels = ['all', 'management', 'execution', 'professional', 'support']
  const capabilities = getAllCapabilities()

  const [, setTick] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 3000)
    return () => clearInterval(interval)
  }, [])

  const filtered = selectedLevel === 'all' ? agents : agents.filter(a => a.level === selectedLevel)

  const stats = {
    total: agents.length,
    online: agents.filter(a => a.status === 'online').length,
    busy: agents.filter(a => a.status === 'busy').length,
    offline: agents.filter(a => a.status === 'offline').length,
  }

  return (
    <div className="space-y-5 max-w-[1600px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Agent 库</h1>
          <p className="text-sm text-dark-400 mt-1">管理你的 AI 团队成员</p>
        </div>
        <Link href="/settings" className="px-4 py-2 bg-accent-purple/15 hover:bg-accent-purple/25 text-accent-purple text-xs font-medium rounded-xl transition-all border border-accent-purple/20 hover:border-accent-purple/30 inline-block">
          + 接入 AI 平台
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: '总 Agent', value: stats.total, icon: '🤖', color: 'text-white' },
          { label: '在线', value: stats.online, icon: '🟢', color: 'text-accent-green' },
          { label: '忙碌', value: stats.busy, icon: '🟡', color: 'text-accent-yellow' },
          { label: '离线', value: stats.offline, icon: '⚫', color: 'text-dark-500' },
        ].map((s) => (
          <div key={s.label} className="glass-card p-4 flex items-center gap-3">
            <span className="text-2xl">{s.icon}</span>
            <div>
              <p className="text-xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-dark-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        {levels.map((level) => (
          <button
            key={level}
            onClick={() => setSelectedLevel(level)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              selectedLevel === level
                ? 'bg-accent-purple/20 text-accent-purple border border-accent-purple/30'
                : 'text-dark-400 hover:text-dark-200 border border-white/[0.06] hover:border-white/[0.12]'
            }`}
          >
            {level === 'all' ? '全部' : levelLabels[level]}
          </button>
        ))}
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((agent, i) => {
          const cap = capabilities.find(c => c.agentName === agent.name)
          const workload = cap?.workload.utilizationRate ?? agent.activity
          const activeTasks = cap?.workload.activeTasks ?? 0
          const reliability = cap?.reliability ?? 85
          const status = cap?.status ?? agent.status

          return (
            <div key={agent.id} className={`glass-card-hover p-5 cursor-pointer group animate-fade-in stagger-${Math.min(i + 1, 8)}`}>
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-dark-700/60 flex items-center justify-center text-2xl border border-white/[0.04]">
                      {agent.avatar}
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-dark-800 ${getAgentStatusColor(status)}`} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-dark-200 group-hover:text-white transition-colors">
                      {agent.name}
                    </h3>
                    <p className="text-xs text-dark-500">{agent.role}</p>
                  </div>
                </div>
                <span className={`badge text-[10px] ${levelColors[agent.level]}`}>
                  {levelLabels[agent.level]}
                </span>
              </div>

              {/* Load bar */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[11px] text-dark-400">负载率</span>
                  <span className="text-[11px] font-semibold text-dark-300">{workload}%</span>
                </div>
                <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${workload}%`,
                      background: workload > 80
                        ? 'linear-gradient(90deg, #ef4444, #f59e0b)'
                        : workload > 50
                          ? 'linear-gradient(90deg, #f59e0b, #10b981)'
                          : 'linear-gradient(90deg, #10b981, #06b6d4)',
                    }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center py-1">
                  <p className="text-lg font-bold text-white">{agent.tasksCompleted}</p>
                  <p className="text-[10px] text-dark-500">已完成</p>
                </div>
                <div className="text-center py-1">
                  <p className="text-lg font-bold text-accent-cyan">{activeTasks}</p>
                  <p className="text-[10px] text-dark-500">进行中</p>
                </div>
                <div className="text-center py-1">
                  <p className="text-lg font-bold text-accent-green">{reliability}%</p>
                  <p className="text-[10px] text-dark-500">可靠性</p>
                </div>
              </div>

              {/* Skills */}
              <div className="flex flex-wrap gap-1.5">
                {agent.skills.map((skill) => (
                  <span key={skill} className="text-[10px] px-2 py-0.5 bg-dark-700/60 text-dark-400 rounded-md border border-white/[0.04]">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
