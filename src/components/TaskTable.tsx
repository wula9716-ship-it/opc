'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { loadTasks, onWorkspaceDataChanged } from '@/lib/workspace-store'
import { getStatusBg, getPriorityColor } from '@/lib/utils'
import type { Task } from '@/types'

export default function TaskTable() {
  const [allTasks, setAllTasks] = useState<Task[]>([])

  useEffect(() => {
    const refresh = () => setAllTasks(loadTasks())
    refresh()
    return onWorkspaceDataChanged(refresh)
  }, [])

  const todayTasks = allTasks.filter(t => t.status !== 'completed').slice(0, 6)

  return (
    <div className="glass-card p-5 animate-fade-in stagger-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-dark-200">今日重点任务</h3>
        <Link href="/tasks" className="text-xs text-accent-purple hover:text-accent-purple/80 transition-colors font-medium">查看全部 →</Link>
      </div>
      {todayTasks.length === 0 ? (
        <div className="py-10 text-center rounded-xl border border-dashed border-white/[0.1] bg-dark-900/60">
          <p className="text-sm text-dark-200">还没有任务</p>
          <p className="text-xs text-dark-400 mt-1">新建任务后会出现在这里。</p>
        </div>
      ) : (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left">
              <th className="pb-3 text-xs font-medium text-dark-500 pr-4">任务</th>
              <th className="pb-3 text-xs font-medium text-dark-500 pr-4">负责人</th>
              <th className="pb-3 text-xs font-medium text-dark-500 pr-4">优先级</th>
              <th className="pb-3 text-xs font-medium text-dark-500 pr-4">截止</th>
              <th className="pb-3 text-xs font-medium text-dark-500">状态</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {todayTasks.map((task) => (
              <tr key={task.id} className="group hover:bg-white/[0.02] transition-colors">
                <td className="py-2.5 pr-4">
                  <Link href="/tasks" className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-dark-500 group-hover:bg-accent-purple transition-colors" />
                    <span className="text-xs text-dark-200 truncate max-w-[180px] group-hover:text-white transition-colors">{task.title}</span>
                  </Link>
                </td>
                <td className="py-2.5 pr-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{task.assigneeAvatar}</span>
                    <span className="text-xs text-dark-400">{task.assignee}</span>
                  </div>
                </td>
                <td className="py-2.5 pr-4">
                  <span className={`text-xs font-medium ${getPriorityColor(task.priority)}`}>
                    {task.priority === 'high' ? '● 高' : task.priority === 'medium' ? '● 中' : '● 低'}
                  </span>
                </td>
                <td className="py-2.5 pr-4">
                  <span className="text-xs text-dark-400">{task.dueDate}</span>
                </td>
                <td className="py-2.5">
                  <span className={`badge ${getStatusBg(task.status)}`}>
                    {task.status === 'in_progress' ? '进行中' : task.status === 'pending' ? '待开始' : task.status === 'blocked' ? '阻塞' : '已完成'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </div>
  )
}
