'use client'

import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import KPICards from '@/components/KPICards'
import TaskTable from '@/components/TaskTable'
import QuickDispatch from '@/components/QuickDispatch'
import SystemPulse from '@/components/SystemPulse'
import DeferredMount from '@/components/DeferredMount'
import { loadTasks, onWorkspaceDataChanged } from '@/lib/workspace-store'
import type { Task } from '@/types'

const ChartsRow = dynamic(() => import('@/components/Charts').then(m => m.ChartsRow), { ssr: false })
const DiscussionFeed = dynamic(() => import('@/components/DiscussionFeed'), { ssr: false })
const RecentOutputs = dynamic(() => import('@/components/RecentOutputs'), { ssr: false })
const Suggestions = dynamic(() => import('@/components/Suggestions'), { ssr: false })
const OptimizationPanel = dynamic(() => import('@/components/OptimizationPanel'), { ssr: false })

function PlaceholderCard({ title, height = 'h-56' }: { title: string; height?: string }) {
  return (
    <div className="glass-card p-5 animate-fade-in">
      <h3 className="text-sm font-semibold text-dark-100 mb-4">{title}</h3>
      <div className={`${height} rounded-xl bg-dark-900/40 border border-white/[0.06] animate-pulse`} />
    </div>
  )
}

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
      <KPICards />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickDispatch />
        <SystemPulse />
        <div className="glass-card p-5 animate-fade-in flex flex-col items-center justify-center text-center" style={{ borderColor: 'rgba(124, 58, 237, 0.08)' }}>
          <span className="text-3xl mb-2">🎯</span>
          <p className="text-xs font-semibold text-dark-200">今日焦点</p>
          <p className="text-[11px] text-dark-400 mt-1 leading-relaxed">
            {focusData.queuedCount} 个进行中，{focusData.blockedCount} 个阻塞
          </p>
          <p className="text-[10px] text-accent-purple/70 mt-1">{focusData.hint}</p>
        </div>
      </div>

      <DeferredMount delay={80} fallback={<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4"><PlaceholderCard title="任务进度" /><PlaceholderCard title="Agent 活跃度" /><PlaceholderCard title="Agent 角色模板" /><PlaceholderCard title="产出趋势" /></div>}>
        <ChartsRow />
      </DeferredMount>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <TaskTable />
        <DeferredMount delay={120} fallback={<PlaceholderCard title="讨论流" height="h-72" />}>
          <DiscussionFeed />
        </DeferredMount>
        <DeferredMount delay={160} fallback={<PlaceholderCard title="最近产出" height="h-72" />}>
          <RecentOutputs />
        </DeferredMount>
      </div>

      <DeferredMount delay={220} fallback={<PlaceholderCard title="优化建议" height="h-48" />}>
        <OptimizationPanel compact={true} maxItems={5} />
      </DeferredMount>

      <DeferredMount delay={260} fallback={<PlaceholderCard title="建议" height="h-36" />}>
        <Suggestions />
      </DeferredMount>
    </div>
  )
}
