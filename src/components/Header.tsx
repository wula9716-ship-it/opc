'use client'

import { useEffect, useState } from 'react'
import TaskForm from './TaskForm'
import NotificationCenter from './NotificationCenter'
import { createTask, loadSettings, loadTasks, onWorkspaceDataChanged } from '@/lib/workspace-store'
import { getDispatchStats, isAIProviderConfigured } from '@/lib/dispatch/dispatcher'
import { createAndExecute } from '@/lib/dispatch/executor'
import { useToast } from './Toast'

export default function Header() {
  const { toast } = useToast()
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [taskCount, setTaskCount] = useState(0)
  const [providerReady, setProviderReady] = useState(false)
  const [profile, setProfile] = useState({ name: '老板', role: '创始人 / CEO' })

  useEffect(() => {
    const refresh = () => {
      const localTasks = loadTasks()
      const dispatchStats = getDispatchStats()
      setTaskCount(localTasks.filter(task => task.status !== 'completed').length + dispatchStats.totalTasks)
      setProviderReady(isAIProviderConfigured())
      const settings = loadSettings()
      setProfile({ name: settings.profileName, role: settings.profileRole })
    }
    refresh()
    const unsubscribe = onWorkspaceDataChanged(refresh)
    window.addEventListener('opc-os-ai-provider-changed', refresh)
    const interval = window.setInterval(refresh, 3000)
    return () => {
      unsubscribe()
      window.removeEventListener('opc-os-ai-provider-changed', refresh)
      window.clearInterval(interval)
    }
  }, [])

  return (
    <>
      <header className="h-14 border-b border-white/[0.08] flex items-center justify-between px-6 flex-shrink-0" style={{ background: 'rgba(10, 10, 30, 0.92)', backdropFilter: 'blur(16px)' }}>
        {/* Left side */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="relative flex w-2 h-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-green opacity-60" />
              <span className="relative inline-flex rounded-full w-2 h-2 bg-accent-green" />
            </span>
            <span className="text-sm text-dark-100">{providerReady ? 'AI 已接入' : '未接入 AI'}</span>
            <span className="text-dark-300 text-sm font-medium">{taskCount} 个任务</span>
          </div>
          <div className="w-px h-4 bg-white/[0.06]" />
          <button
            onClick={() => setShowTaskForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-purple/15 hover:bg-accent-purple/25 text-accent-purple text-xs font-medium rounded-lg transition-all border border-accent-purple/20 hover:border-accent-purple/30"
          >
            <span className="text-sm">+</span>
            <span>新建任务</span>
          </button>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <NotificationCenter />
          <div className="w-px h-4 bg-white/[0.06]" />
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-dark-100">{profile.name}</p>
              <p className="text-[10px] text-dark-300">{profile.role}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center text-white text-xs font-bold" style={{ boxShadow: '0 0 12px rgba(124, 58, 237, 0.15)' }}>
              S
            </div>
          </div>
        </div>
      </header>

      <TaskForm
        open={showTaskForm}
        onClose={() => setShowTaskForm(false)}
        onSubmit={(task) => {
          // 先检查 AI 状态，再保存任务
          const aiReady = isAIProviderConfigured()

          // 保存任务
          createTask(task)

          // 用 setTimeout 让调度在下一个事件循环执行，避免被重渲染冲掉
          if (aiReady) {
            setTimeout(() => {
              try {
                const dispatched = createAndExecute(task.title, `分派给: ${task.assignee}, 优先级: ${task.priority}`)
                window.alert(`✅ 任务已创建并开始执行！\n\n「${task.title}」已拆解为 ${dispatched.subtasks.length} 个子任务。`)
              } catch (err) {
                window.alert(`❌ 调度失败: ${err instanceof Error ? err.message : '未知错误'}`)
              }
            }, 100)
          } else {
            setTimeout(() => {
              window.alert('⚠️ AI 未接入！请先去「设置 → AI 平台」接入。')
            }, 100)
          }
        }}
      />
    </>
  )
}
