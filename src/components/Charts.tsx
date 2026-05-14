'use client'

import { useEffect, useMemo, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { agents, roleCompositionData } from '@/lib/data'
import { loadOutputs, loadTasks } from '@/lib/workspace-store'
import { getDispatchStats } from '@/lib/dispatch/dispatcher'
import { useHeartbeat } from '@/lib/heartbeat'

type Slice = { name: string; value: number; color: string }

function EmptyBlock({ text }: { text: string }) {
  return (
    <div className="h-44 flex flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.1] bg-dark-900/60 text-center">
      <p className="text-sm text-dark-200">{text}</p>
      <p className="text-xs text-dark-400 mt-1">有真实数据后这里会自动更新</p>
    </div>
  )
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="px-3 py-2 rounded-xl text-xs border border-white/[0.12] bg-dark-900">
      {label && <p className="text-dark-300 mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="text-dark-100 font-medium">{p.name ?? '值'}: <span className="text-white">{p.value}</span></p>
      ))}
    </div>
  )
}

function DonutChart({ data, title, centerLabel }: { data: Slice[]; title: string; centerLabel: string }) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  return (
    <div className="glass-card p-5 animate-fade-in stagger-2">
      <h3 className="text-sm font-semibold text-dark-100 mb-4">{title}</h3>
      {total === 0 ? (
        <EmptyBlock text="暂无任务数据" />
      ) : (
        <div className="flex items-center gap-5">
          <div className="relative w-32 h-32 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} cx="50%" cy="50%" innerRadius={36} outerRadius={56} paddingAngle={3} dataKey="value" strokeWidth={0}>
                  {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold text-white">{total}</span>
              <span className="text-[10px] text-dark-300">{centerLabel}</span>
            </div>
          </div>
          <div className="flex-1 space-y-2.5">
            {data.map(item => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                  <span className="text-xs text-dark-200">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-dark-100">{item.value}</span>
                  <span className="text-[10px] text-dark-300 w-8 text-right">{Math.round((item.value / total) * 100)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function OutputTrendChart({ data }: { data: { date: string; count: number }[] }) {
  return (
    <div className="glass-card p-5 animate-fade-in stagger-3">
      <h3 className="text-sm font-semibold text-dark-100 mb-4">产出趋势 <span className="text-dark-300 font-normal">(真实产出)</span></h3>
      {data.length === 0 ? (
        <EmptyBlock text="暂无产出记录" />
      ) : (
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} width={25} allowDecimals={false} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="count" stroke="#7c3aed" strokeWidth={2.5} dot={{ fill: '#7c3aed', strokeWidth: 0, r: 3 }} activeDot={{ fill: '#7c3aed', strokeWidth: 2, stroke: '#fff', r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

function AgentActivityList() {
  const activeAgents = agents.filter(agent => agent.activity > 0).slice(0, 6)
  return (
    <div className="glass-card p-5 animate-fade-in stagger-2">
      <h3 className="text-sm font-semibold text-dark-100 mb-4">Agent 活跃度 <span className="text-dark-300 font-normal">(真实执行后统计)</span></h3>
      {activeAgents.length === 0 ? (
        <EmptyBlock text="暂无 Agent 执行记录" />
      ) : (
        <div className="space-y-3.5">
          {activeAgents.map(agent => (
            <div key={agent.id} className="flex items-center gap-3">
              <span className="text-lg">{agent.avatar}</span>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs text-dark-100 truncate">{agent.name}</span>
                  <span className="text-xs font-semibold text-dark-200">{agent.activity}%</span>
                </div>
                <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-accent-purple" style={{ width: `${agent.activity}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function RoleTemplateChart() {
  return (
    <div className="glass-card p-5 animate-fade-in stagger-2">
      <h3 className="text-sm font-semibold text-dark-100 mb-4">Agent 角色模板</h3>
      <div className="space-y-2.5">
        {roleCompositionData.map(item => (
          <div key={item.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
              <span className="text-xs text-dark-200">{item.name}</span>
            </div>
            <span className="text-xs text-dark-100">{item.value}</span>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-dark-400 mt-4">这是可用角色模板，不代表已经执行过任务。</p>
    </div>
  )
}

function buildOutputTrend() {
  const grouped = new Map<string, number>()
  for (const output of loadOutputs()) {
    const key = output.createdAt.slice(5)
    grouped.set(key, (grouped.get(key) ?? 0) + 1)
  }
  return Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([date, count]) => ({ date, count }))
}

export function ChartsRow() {
  const [tick, setTick] = useState(0)

  useHeartbeat(() => setTick(t => t + 1))

  const { taskProgress, outputTrend } = useMemo(() => {
    void tick
    const tasks = loadTasks()
    const dispatchStats = getDispatchStats()
    return {
      taskProgress: [
        { name: '已完成', value: tasks.filter(t => t.status === 'completed').length + dispatchStats.completedTasks, color: '#10b981' },
        { name: '进行中', value: tasks.filter(t => t.status === 'in_progress').length + dispatchStats.executingTasks, color: '#3b82f6' },
        { name: '待开始', value: tasks.filter(t => t.status === 'pending').length + dispatchStats.totalTasks, color: '#f59e0b' },
        { name: '已阻塞', value: tasks.filter(t => t.status === 'blocked').length, color: '#ef4444' },
      ],
      outputTrend: buildOutputTrend(),
    }
  }, [tick])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      <DonutChart data={taskProgress} title="任务进度" centerLabel="总任务" />
      <AgentActivityList />
      <RoleTemplateChart />
      <OutputTrendChart data={outputTrend} />
    </div>
  )
}
