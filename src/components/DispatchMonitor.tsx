'use client'

import { DispatchEvent, AgentMessage } from '@/lib/dispatch/types'

const EVENT_ICONS: Record<string, string> = {
  task_created: '📋',
  task_decomposed: '🧩',
  subtask_assigned: '👤',
  subtask_started: '▶️',
  subtask_completed: '✅',
  subtask_failed: '❌',
  subtask_retried: '🔄',
  handoff: '🤝',
  cascade_triggered: '⚡',
  task_completed: '🎉',
}

const EVENT_COLORS: Record<string, string> = {
  task_created: 'text-accent-blue',
  task_decomposed: 'text-accent-purple',
  subtask_assigned: 'text-accent-cyan',
  subtask_started: 'text-accent-blue',
  subtask_completed: 'text-accent-green',
  subtask_failed: 'text-accent-red',
  handoff: 'text-accent-yellow',
  cascade_triggered: 'text-accent-purple',
  task_completed: 'text-accent-green',
}

export function EventFeed({ events }: { events: DispatchEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="text-center py-8">
        <span className="text-3xl">📡</span>
        <p className="text-xs text-dark-500 mt-2">暂无调度事件</p>
      </div>
    )
  }

  return (
    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
      {events.map(evt => {
        const time = new Date(evt.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        return (
          <div key={evt.id} className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-white/[0.02] transition-colors animate-fade-in">
            <span className="text-base flex-shrink-0 mt-0.5">{EVENT_ICONS[evt.type] ?? '📌'}</span>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-medium ${EVENT_COLORS[evt.type] ?? 'text-dark-300'}`}>
                {evt.message}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-dark-600">{time}</span>
                {evt.agentId && <span className="text-[10px] text-dark-500">Agent: {evt.agentId}</span>}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function MessageFeed({ messages }: { messages: AgentMessage[] }) {
  if (messages.length === 0) {
    return (
      <div className="text-center py-8">
        <span className="text-3xl">💬</span>
        <p className="text-xs text-dark-500 mt-2">暂无 Agent 消息</p>
      </div>
    )
  }

  const MSG_TYPE_LABELS: Record<string, { label: string; color: string }> = {
    task_assigned: { label: '分派', color: 'bg-accent-blue/20 text-accent-blue' },
    task_started: { label: '开始', color: 'bg-accent-cyan/20 text-accent-cyan' },
    task_completed: { label: '完成', color: 'bg-accent-green/20 text-accent-green' },
    task_failed: { label: '失败', color: 'bg-accent-red/20 text-accent-red' },
    handoff_request: { label: '交接', color: 'bg-accent-yellow/20 text-accent-yellow' },
    handoff_accepted: { label: '接受', color: 'bg-accent-green/20 text-accent-green' },
    question: { label: '提问', color: 'bg-accent-purple/20 text-accent-purple' },
    answer: { label: '回答', color: 'bg-accent-purple/20 text-accent-purple' },
    info: { label: '通知', color: 'bg-dark-600 text-dark-400' },
  }

  return (
    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
      {messages.map(msg => {
        const time = new Date(msg.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
        const typeInfo = MSG_TYPE_LABELS[msg.type] ?? { label: msg.type, color: 'bg-dark-600 text-dark-400' }
        return (
          <div key={msg.id} className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-white/[0.02] transition-colors">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`badge text-[9px] ${typeInfo.color}`}>{typeInfo.label}</span>
                <span className="text-[10px] text-dark-500">{msg.from} → {msg.to}</span>
                <span className="text-[10px] text-dark-600 ml-auto">{time}</span>
              </div>
              <p className="text-xs text-dark-300">{msg.content}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function StatsCards({ stats }: { stats: { totalTasks: number; completedTasks: number; executingTasks: number; totalSubtasks: number; completedSubtasks: number; runningSubtasks: number; queuedSubtasks: number } }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {[
        { label: '总任务', value: stats.totalTasks, color: 'text-white' },
        { label: '执行中', value: stats.executingTasks, color: 'text-accent-cyan' },
        { label: '已完成子任务', value: `${stats.completedSubtasks}/${stats.totalSubtasks}`, color: 'text-accent-green' },
        { label: '排队中', value: stats.queuedSubtasks, color: 'text-accent-yellow' },
      ].map(s => (
        <div key={s.label} className="glass-card p-3 text-center">
          <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          <p className="text-[10px] text-dark-400 mt-0.5">{s.label}</p>
        </div>
      ))}
    </div>
  )
}
