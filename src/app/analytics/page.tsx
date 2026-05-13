'use client'

import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getDispatchStats } from '@/lib/dispatch/dispatcher'
import { getAllCapabilities } from '@/lib/dispatch/agent-registry'
import { loadOutputs, loadTasks, onWorkspaceDataChanged } from '@/lib/workspace-store'
import OptimizationPanel from '@/components/OptimizationPanel'
import type { Output, Task } from '@/types'

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color?: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="px-3 py-2 rounded-xl text-xs border border-white/[0.12] bg-dark-900 shadow-2xl">
      {label && <p className="text-dark-300 mb-1">{label}</p>}
      {payload.map((item, index) => (
        <p key={index} className="text-dark-100 font-medium"><span style={{ color: item.color }}>●</span> {item.name}: <span className="text-white">{item.value}</span></p>
      ))}
    </div>
  )
}

function buildDailyData(tasks: Task[], outputs: Output[]) {
  const grouped = new Map<string, { day: string; tasks: number; outputs: number }>()
  for (const task of tasks) {
    if (!task.dueDate) continue
    const key = task.dueDate.slice(5)
    grouped.set(key, { day: key, tasks: (grouped.get(key)?.tasks ?? 0) + 1, outputs: grouped.get(key)?.outputs ?? 0 })
  }
  for (const output of outputs) {
    if (!output.createdAt) continue
    const key = output.createdAt.slice(5)
    grouped.set(key, { day: key, tasks: grouped.get(key)?.tasks ?? 0, outputs: (grouped.get(key)?.outputs ?? 0) + 1 })
  }
  return Array.from(grouped.values()).sort((a, b) => a.day.localeCompare(b.day)).slice(-14)
}

export default function AnalyticsPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [outputs, setOutputs] = useState<Output[]>([])
  const [stats, setStats] = useState(getDispatchStats())
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const refresh = () => {
      setTasks(loadTasks())
      setOutputs(loadOutputs())
      setStats(getDispatchStats())
      setTick(t => t + 1)
    }
    refresh()
    const unsubscribe = onWorkspaceDataChanged(refresh)
    const interval = window.setInterval(refresh, 3000)
    return () => {
      unsubscribe()
      window.clearInterval(interval)
    }
  }, [])

  const agentCaps = useMemo(() => {
    void tick
    return getAllCapabilities()
  }, [tick])
  const dailyData = useMemo(() => buildDailyData(tasks, outputs), [tasks, outputs])
  const completionRate = tasks.length > 0 ? Math.round((tasks.filter(task => task.status === 'completed').length / tasks.length) * 100) : 0
  const avgLoad = agentCaps.length > 0 ? Math.round(agentCaps.reduce((sum, agent) => sum + agent.workload.utilizationRate, 0) / agentCaps.length) : 0

  const summaryCards = [
    { label: '真实任务', value: String(tasks.length), change: `${tasks.filter(task => task.status === 'completed').length} 已完成`, color: 'text-white' },
    { label: '手动/导入产出', value: String(outputs.length), change: outputs.length > 0 ? '可在产出中心查看' : '暂无', color: 'text-accent-blue' },
    { label: '调度任务', value: String(stats.totalTasks), change: stats.totalTasks > 0 ? `${stats.runningSubtasks} 子任务执行中` : '未产生调度', color: 'text-accent-cyan' },
    { label: '完成率', value: tasks.length > 0 ? `${completionRate}%` : '-', change: tasks.length > 0 ? '基于真实任务' : '暂无任务', color: 'text-accent-green' },
  ]

  return (
    <div className="space-y-5 max-w-[1600px]">
      <div>
        <h1 className="text-xl font-bold text-white">分析报表</h1>
        <p className="text-sm text-dark-300 mt-1">只统计真实创建、导入或真实调度产生的数据。</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((item, i) => (
          <div key={item.label} className={`glass-card p-5 animate-fade-in stagger-${i + 1}`}>
            <p className="text-xs text-dark-300 mb-2 font-medium">{item.label}</p>
            <p className={`text-2xl font-bold ${item.color} tracking-tight`}>{item.value}</p>
            <p className="text-xs text-dark-300 mt-1.5">{item.change}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-5 animate-fade-in stagger-2">
          <h3 className="text-sm font-semibold text-dark-100 mb-4">任务 / 产出时间分布</h3>
          {dailyData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center border border-dashed border-white/[0.1] rounded-xl bg-dark-900/60">
              <p className="text-sm text-dark-200">暂无趋势数据</p>
              <p className="text-xs text-dark-400 mt-1">创建任务或产出后这里才会出现图表。</p>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} width={25} allowDecimals={false} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="tasks" fill="#3b82f6" radius={[4, 4, 0, 0]} name="任务" />
                  <Bar dataKey="outputs" fill="#7c3aed" radius={[4, 4, 0, 0]} name="产出" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="glass-card p-5 animate-fade-in stagger-3">
          <h3 className="text-sm font-semibold text-dark-100 mb-4">Agent 状态</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-dark-900/60 border border-white/[0.08]">
              <p className="text-xs text-dark-300">平均负载</p>
              <p className="text-2xl font-bold text-white mt-1">{avgLoad}%</p>
            </div>
            <div className="p-4 rounded-xl bg-dark-900/60 border border-white/[0.08]">
              <p className="text-xs text-dark-300">在线 Agent</p>
              <p className="text-2xl font-bold text-accent-green mt-1">{agentCaps.filter(agent => agent.status !== 'offline').length}</p>
            </div>
          </div>
          <p className="text-xs text-dark-400 mt-4">未接入 AI 时 Agent 保持离线，接入后才显示可用状态。</p>
        </div>
      </div>

      <div className="glass-card p-5 animate-fade-in stagger-4">
        <h3 className="text-sm font-semibold text-dark-100 mb-4">Agent 实时状态</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.08]">
                <th className="text-left pb-3 text-xs font-medium text-dark-300">Agent</th>
                <th className="text-left pb-3 text-xs font-medium text-dark-300">负载</th>
                <th className="text-left pb-3 text-xs font-medium text-dark-300">可靠性</th>
                <th className="text-left pb-3 text-xs font-medium text-dark-300">活跃任务</th>
                <th className="text-left pb-3 text-xs font-medium text-dark-300">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {agentCaps.map(agent => (
                <tr key={agent.agentId} className="hover:bg-white/[0.03] transition-colors">
                  <td className="py-3 text-xs text-dark-100">{agent.avatar} {agent.agentName}</td>
                  <td className="py-3 text-xs text-dark-200">{agent.workload.utilizationRate}%</td>
                  <td className="py-3 text-xs text-dark-200">{agent.reliability}%</td>
                  <td className="py-3 text-xs text-dark-200">{agent.workload.activeTasks}</td>
                  <td className="py-3"><span className={`badge text-[10px] ${agent.status === 'online' ? 'bg-accent-green/20 text-accent-green' : agent.status === 'busy' ? 'bg-accent-yellow/20 text-accent-yellow' : 'bg-dark-700 text-dark-200'}`}>{agent.status === 'online' ? '在线' : agent.status === 'busy' ? '忙碌' : '离线'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 优化建议 */}
      <OptimizationPanel compact={false} maxItems={50} />
    </div>
  )
}
