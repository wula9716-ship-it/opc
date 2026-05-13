'use client'

import { useEffect, useMemo, useState } from 'react'
import KPICards from '@/components/KPICards'
import { ChartsRow } from '@/components/Charts'
import TaskTable from '@/components/TaskTable'
import DiscussionFeed from '@/components/DiscussionFeed'
import RecentOutputs from '@/components/RecentOutputs'
import Suggestions from '@/components/Suggestions'
import QuickDispatch from '@/components/QuickDispatch'
import SystemPulse from '@/components/SystemPulse'
import { loadTasks, onWorkspaceDataChanged } from '@/lib/workspace-store'
import type { Task } from '@/types'

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([])

  useEffect(() => {
    const refresh = () => setTasks(loadTasks())
    refresh()
    return onWorkspaceDataChanged(refresh)
  }, [])

  const focusData = useMemo(() => {
    const blocked = tasks.filter(t => t.status === 'blocked')
    const inProgress = tasks.filter(t => t.status === 'in_progress')
    const highPriority = tasks.filter(t => t.priority === 'high' && t.status !== 'completed')
    const queuedCount = inProgress.length
    const blockedTitle = blocked.length > 0 ? blocked[0].title : null

    return {
      queuedCount,
      blockedCount: blocked.length,
      blockedTitle,
      highPriorityCount: highPriority.length,
      hint: blockedTitle
        ? `建议优先处理「${blockedTitle}」阻塞`
        : highPriority.length > 0
          ? `${highPriority.length} 个高优任务待推进`
          : '当前没有紧急阻塞，保持节奏',
    }
  }, [tasks])

  return (
    <div className="space-y-4 lg:space-y-5 max-w-[1600px]">
      {/* KPI Cards */}
      <KPICards />

      {/* Quick Dispatch + System Pulse + Today Focus */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickDispatch />
        <SystemPulse />
        <div className="glass-card p-5 animate-fade-in flex flex-col items-center justify-center text-center" style={{ borderColor: 'rgba(124, 58, 237, 0.08)' }}>
          <span className="text-3xl mb-2">🎯</span>
          <p className="text-xs font-semibold text-dark-200">今日焦点</p>
          <p className="text-[11px] text-dark-400 mt-1 leading-relaxed">
            {focusData.queuedCount} 个进行中，{focusData.blockedCount} 个阻塞
          </p>
          <p className="text-[10px] text-accent-purple/70 mt-1">
            {focusData.hint}
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <ChartsRow />

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <TaskTable />
        <DiscussionFeed />
        <RecentOutputs />
      </div>

      {/* Suggestions */}
      <Suggestions />
    </div>
  )
}
