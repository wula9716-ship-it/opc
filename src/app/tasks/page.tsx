'use client'

import { useEffect, useMemo, useState } from 'react'
import TaskForm from '@/components/TaskForm'
import Modal from '@/components/Modal'
import { createTask, loadTasks, onWorkspaceDataChanged, removeTask, updateTask } from '@/lib/workspace-store'
import { getPriorityColor, getStatusBg } from '@/lib/utils'
import type { Task, TaskStatus } from '@/types'

const statusFilters: { label: string; value: TaskStatus | 'all' }[] = [
  { label: '全部', value: 'all' },
  { label: '待开始', value: 'pending' },
  { label: '进行中', value: 'in_progress' },
  { label: '已完成', value: 'completed' },
  { label: '已阻塞', value: 'blocked' },
]

const statusLabels: Record<TaskStatus, string> = {
  pending: '待开始',
  in_progress: '进行中',
  completed: '已完成',
  blocked: '已阻塞',
}

export default function TasksPage() {
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all')
  const [view, setView] = useState<'list' | 'board'>('list')
  const [tasks, setTasks] = useState<Task[]>([])
  const [showForm, setShowForm] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const refresh = () => setTasks(loadTasks())

  useEffect(() => {
    refresh()
    return onWorkspaceDataChanged(refresh)
  }, [])

  const filteredTasks = useMemo(() => filter === 'all' ? tasks : tasks.filter(task => task.status === filter), [filter, tasks])
  const groupedByStatus = useMemo(() => ({
    pending: tasks.filter(task => task.status === 'pending'),
    in_progress: tasks.filter(task => task.status === 'in_progress'),
    blocked: tasks.filter(task => task.status === 'blocked'),
    completed: tasks.filter(task => task.status === 'completed'),
  }), [tasks])

  function changeStatus(task: Task, status: TaskStatus) {
    const progress = status === 'completed' ? 100 : status === 'pending' ? 0 : task.progress
    const updated = { ...task, status, progress }
    updateTask(updated)
    setSelectedTask(updated)
    refresh()
  }

  function deleteSelected() {
    if (!selectedTask) return
    removeTask(selectedTask.id)
    setSelectedTask(null)
    refresh()
  }

  return (
    <div className="space-y-5 max-w-[1600px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">任务中心</h1>
          <p className="text-sm text-dark-300 mt-1">管理你手动创建或真实调度产生的任务。</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-dark-800 rounded-lg p-0.5 border border-white/[0.08]">
            <button onClick={() => setView('list')} className={`px-3 py-1.5 rounded-md text-xs font-medium ${view === 'list' ? 'bg-accent-purple/25 text-white' : 'text-dark-300 hover:text-white'}`}>列表</button>
            <button onClick={() => setView('board')} className={`px-3 py-1.5 rounded-md text-xs font-medium ${view === 'board' ? 'bg-accent-purple/25 text-white' : 'text-dark-300 hover:text-white'}`}>看板</button>
          </div>
          <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-accent-purple hover:bg-accent-purple/90 text-white text-xs font-medium rounded-xl transition-all">
            + 新建任务
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {statusFilters.map(item => (
          <button key={item.value} onClick={() => setFilter(item.value)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === item.value ? 'bg-accent-purple/25 text-white border border-accent-purple/40' : 'text-dark-300 hover:text-white border border-white/[0.08] hover:border-white/[0.16]'}`}>
            {item.label}
            {item.value !== 'all' && <span className="ml-1 text-dark-300">({tasks.filter(task => task.status === item.value).length})</span>}
          </button>
        ))}
      </div>

      {tasks.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <p className="text-base text-dark-100">还没有任务</p>
          <p className="text-sm text-dark-300 mt-2">点击“新建任务”创建第一条，或在接入 AI 后使用调度台自动拆解。</p>
        </div>
      ) : view === 'list' ? (
        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.08]">
                <th className="text-left px-5 py-3 text-xs font-medium text-dark-300">任务</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-dark-300">负责人</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-dark-300">优先级</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-dark-300">截止日期</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-dark-300">进度</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-dark-300">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {filteredTasks.map(task => (
                <tr key={task.id} onClick={() => setSelectedTask(task)} className="hover:bg-white/[0.04] transition-colors cursor-pointer group">
                  <td className="px-5 py-3"><span className="text-sm text-dark-100 group-hover:text-white">{task.title}</span></td>
                  <td className="px-5 py-3"><span className="text-xs text-dark-200">{task.assigneeAvatar} {task.assignee}</span></td>
                  <td className="px-5 py-3"><span className={`text-xs font-medium ${getPriorityColor(task.priority)}`}>● {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}</span></td>
                  <td className="px-5 py-3 text-xs text-dark-200">{task.dueDate || '-'}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 bg-dark-700 rounded-full overflow-hidden"><div className="h-full bg-accent-purple rounded-full" style={{ width: `${task.progress}%` }} /></div>
                      <span className="text-[10px] text-dark-300">{task.progress}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3"><span className={`badge ${getStatusBg(task.status)}`}>{statusLabels[task.status]}</span></td>
                </tr>
              ))}
              {filteredTasks.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-dark-300 text-sm">没有符合条件的任务</td></tr>}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {(['pending', 'in_progress', 'blocked', 'completed'] as TaskStatus[]).map(status => (
            <div key={status} className="glass-card p-4">
              <h3 className="text-sm font-semibold text-dark-100 mb-3">{statusLabels[status]} <span className="text-dark-300 font-normal">({groupedByStatus[status].length})</span></h3>
              <div className="space-y-2">
                {groupedByStatus[status].map(task => (
                  <button key={task.id} onClick={() => setSelectedTask(task)} className="w-full p-3 bg-dark-800 hover:bg-dark-700 border border-white/[0.08] rounded-xl text-left transition-colors">
                    <p className="text-xs font-medium text-dark-100">{task.title}</p>
                    <p className="text-[10px] text-dark-300 mt-1">{task.assignee || '未分派'} · {task.dueDate || '无截止日'}</p>
                  </button>
                ))}
                {groupedByStatus[status].length === 0 && <p className="text-xs text-dark-400 py-5 text-center">空</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      <TaskForm open={showForm} onClose={() => setShowForm(false)} onSubmit={(task) => { createTask(task); refresh() }} />

      <Modal open={Boolean(selectedTask)} onClose={() => setSelectedTask(null)} title={selectedTask?.title || '任务详情'} subtitle="真实任务记录">
        {selectedTask && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-dark-800 rounded-lg"><p className="text-dark-300">负责人</p><p className="text-dark-100 mt-1">{selectedTask.assigneeAvatar} {selectedTask.assignee}</p></div>
              <div className="p-3 bg-dark-800 rounded-lg"><p className="text-dark-300">截止日期</p><p className="text-dark-100 mt-1">{selectedTask.dueDate || '-'}</p></div>
              <div className="p-3 bg-dark-800 rounded-lg"><p className="text-dark-300">优先级</p><p className={`${getPriorityColor(selectedTask.priority)} mt-1`}>{selectedTask.priority === 'high' ? '高' : selectedTask.priority === 'medium' ? '中' : '低'}</p></div>
              <div className="p-3 bg-dark-800 rounded-lg"><p className="text-dark-300">状态</p><p className="text-dark-100 mt-1">{statusLabels[selectedTask.status]}</p></div>
            </div>
            <div className="flex flex-wrap gap-2">
              {(['pending', 'in_progress', 'blocked', 'completed'] as TaskStatus[]).map(status => (
                <button key={status} onClick={() => changeStatus(selectedTask, status)} className="px-3 py-2 text-xs text-dark-100 bg-dark-700 hover:bg-dark-600 rounded-lg">
                  标记为{statusLabels[status]}
                </button>
              ))}
              <button onClick={deleteSelected} className="ml-auto px-3 py-2 text-xs text-accent-red border border-accent-red/40 hover:bg-accent-red/10 rounded-lg">
                删除
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
