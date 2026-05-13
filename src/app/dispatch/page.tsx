'use client'

import { useState, useEffect, useCallback } from 'react'
import { createAndDispatch, getAllTasks, getRecentEvents, getTaskEvents, getTaskMessages, getDispatchStats, retrySubtask, reassignSubtask } from '@/lib/dispatch/dispatcher'
import { DispatchedTask, DispatchEvent, Subtask } from '@/lib/dispatch/types'
import { getAgentCapability, getAllCapabilities, getOnlineAgents } from '@/lib/dispatch/agent-registry'
import TaskDAG from '@/components/TaskDAG'
import { EventFeed, MessageFeed, StatsCards } from '@/components/DispatchMonitor'
import Modal from '@/components/Modal'
import { useToast } from '@/components/Toast'

export default function DispatchPage() {
  const [tasks, setTasks] = useState<DispatchedTask[]>([])
  const [selectedTask, setSelectedTask] = useState<DispatchedTask | null>(null)
  const [events, setEvents] = useState<DispatchEvent[]>([])
  const [stats, setStats] = useState(getDispatchStats())
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [selectedSubtask, setSelectedSubtask] = useState<Subtask | null>(null)
  const [tab, setTab] = useState<'dag' | 'events' | 'agents'>('dag')
  const { toast } = useToast()

  // 轮询刷新（模拟实时更新）
  const refresh = useCallback(() => {
    const allTasks = getAllTasks()
    setTasks(allTasks)
    setEvents(getRecentEvents(30))
    setStats(getDispatchStats())
    if (selectedTask) {
      const updated = allTasks.find(t => t.id === selectedTask.id)
      if (updated) setSelectedTask(updated)
    }
  }, [selectedTask])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 2000) // 每2秒刷新
    return () => clearInterval(interval)
  }, [refresh])

  const handleCreate = () => {
    if (!newTitle.trim()) return
    try {
      const task = createAndDispatch(newTitle.trim(), newDesc.trim())
      setTasks(prev => [task, ...prev])
      setSelectedTask(task)
      setNewTitle('')
      setNewDesc('')
      setShowCreate(false)
    } catch (error) {
      toast('无法创建自动分派任务', error instanceof Error ? error.message : '请先完成 AI 接入配置。', 'warning')
    }
  }

  const agentCapabilities = getAllCapabilities()

  return (
    <div className="space-y-4 max-w-[1600px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">🤖 调度台</h1>
          <p className="text-sm text-dark-400 mt-1">Agent 自动分派 · 技能匹配 · 级联触发</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-accent-purple/15 hover:bg-accent-purple/25 text-accent-purple text-xs font-medium rounded-xl transition-all border border-accent-purple/20 hover:border-accent-purple/30">
          + 创建任务（自动分派）
        </button>
      </div>

      {/* Stats */}
      <StatsCards stats={stats} />

      {/* Main layout */}
      <div className="grid grid-cols-12 gap-4">
        {/* Left: task list */}
        <div className="col-span-3 glass-card p-4 flex flex-col max-h-[600px]">
          <h3 className="text-xs font-semibold text-dark-300 mb-3">已分派任务 ({tasks.length})</h3>
          <div className="flex-1 space-y-2 overflow-y-auto pr-1">
            {tasks.length === 0 && (
              <div className="text-center py-8">
                <span className="text-3xl">📭</span>
                <p className="text-xs text-dark-500 mt-2">还没有任务</p>
                <p className="text-[10px] text-dark-600 mt-1">点击右上角创建</p>
              </div>
            )}
            {tasks.map(task => (
              <button
                key={task.id}
                onClick={() => { setSelectedTask(task); setSelectedSubtask(null) }}
                className={`w-full text-left p-3 rounded-xl transition-all border ${
                  selectedTask?.id === task.id
                    ? 'bg-accent-purple/10 border-accent-purple/30'
                    : 'bg-dark-800/40 border-white/[0.04] hover:border-white/[0.1]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-dark-200 line-clamp-1">{task.title}</span>
                  <span className={`badge text-[9px] ${
                    task.status === 'completed' ? 'bg-accent-green/20 text-accent-green' :
                    task.status === 'executing' ? 'bg-accent-cyan/20 text-accent-cyan' :
                    'bg-accent-blue/20 text-accent-blue'
                  }`}>
                    {task.status === 'completed' ? '完成' : task.status === 'executing' ? '执行中' : task.status === 'dispatching' ? '分派中' : '规划中'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 bg-dark-700 rounded-full overflow-hidden">
                    <div className="h-full bg-accent-purple rounded-full transition-all" style={{ width: `${task.progress}%` }} />
                  </div>
                  <span className="text-[10px] text-dark-500">{task.progress}%</span>
                </div>
                <p className="text-[10px] text-dark-600 mt-1">{task.subtasks.length} 个子任务</p>
              </button>
            ))}
          </div>
        </div>

        {/* Right: detail area */}
        <div className="col-span-9 space-y-4">
          {selectedTask ? (
            <>
              {/* Tab bar */}
              <div className="flex gap-1 p-1 bg-dark-800/60 rounded-xl border border-white/[0.06] w-fit">
                {[
                  { key: 'dag' as const, label: '📊 任务依赖图' },
                  { key: 'events' as const, label: '📡 调度事件' },
                  { key: 'agents' as const, label: '🤖 Agent 负载' },
                ].map(t => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                      tab === t.key ? 'bg-accent-purple/20 text-accent-purple' : 'text-dark-400 hover:text-dark-200'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* DAG tab */}
              {tab === 'dag' && (
                <div className="space-y-4">
                  <TaskDAG task={selectedTask} onSelectSubtask={setSelectedSubtask} />

                  {/* Subtask detail panel */}
                  {selectedSubtask && (
                    <div className="glass-card p-5 animate-fade-in">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-sm font-semibold text-dark-200">{selectedSubtask.title}</h3>
                          <p className="text-xs text-dark-500 mt-0.5">{selectedSubtask.description}</p>
                        </div>
                        <button onClick={() => setSelectedSubtask(null)} className="text-dark-500 hover:text-dark-300 text-xs">✕</button>
                      </div>
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <p className="text-[10px] text-dark-500 mb-1">状态</p>
                          <span className={`badge ${
                            selectedSubtask.status === 'completed' ? 'bg-accent-green/20 text-accent-green' :
                            selectedSubtask.status === 'running' ? 'bg-accent-cyan/20 text-accent-cyan' :
                            selectedSubtask.status === 'assigned' ? 'bg-accent-blue/20 text-accent-blue' :
                            'bg-dark-600 text-dark-400'
                          }`}>
                            {selectedSubtask.status === 'completed' ? '已完成' : selectedSubtask.status === 'running' ? '执行中' : selectedSubtask.status === 'assigned' ? '已分配' : '排队中'}
                          </span>
                        </div>
                        <div>
                          <p className="text-[10px] text-dark-500 mb-1">分配给</p>
                          {selectedSubtask.assignedAgentId ? (
                            <div className="flex items-center gap-1">
                              <span className="text-sm">{getAgentCapability(selectedSubtask.assignedAgentId)?.avatar}</span>
                              <span className="text-xs text-dark-300">{getAgentCapability(selectedSubtask.assignedAgentId)?.agentName}</span>
                            </div>
                          ) : <span className="text-xs text-dark-500">待分配</span>}
                        </div>
                        <div>
                          <p className="text-[10px] text-dark-500 mb-1">预估耗时</p>
                          <span className="text-xs text-dark-300">{selectedSubtask.estimatedMinutes} 分钟</span>
                        </div>
                        <div>
                          <p className="text-[10px] text-dark-500 mb-1">所需技能</p>
                          <div className="flex flex-wrap gap-1">
                            {selectedSubtask.requiredSkills.map(s => (
                              <span key={s.skill} className="text-[9px] px-1.5 py-0.5 bg-dark-700 text-dark-400 rounded">{s.skill}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      {selectedSubtask.result && (
                        <div className="mt-3 p-3 bg-accent-green/5 rounded-lg border border-accent-green/10">
                          <p className="text-[10px] text-dark-500 mb-1">执行结果</p>
                          <p className="text-xs text-dark-300">{selectedSubtask.result}</p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 mt-4 pt-3 border-t border-white/[0.04]">
                        {(selectedSubtask.status === 'failed' || selectedSubtask.status === 'blocked') && selectedSubtask.retryCount < selectedSubtask.maxRetries && (
                          <button
                            onClick={() => { retrySubtask(selectedTask.id, selectedSubtask.id); refresh() }}
                            className="px-3 py-1.5 text-xs font-medium text-accent-yellow hover:bg-accent-yellow/10 border border-accent-yellow/30 rounded-lg transition-colors"
                          >
                            🔄 重试 ({selectedSubtask.retryCount}/{selectedSubtask.maxRetries})
                          </button>
                        )}
                        {selectedSubtask.status !== 'completed' && (
                          <div className="relative group">
                            <button className="px-3 py-1.5 text-xs font-medium text-dark-300 hover:text-white bg-dark-700/50 hover:bg-dark-700 rounded-lg transition-colors">
                              👤 改派
                            </button>
                            <div className="absolute left-0 top-full mt-1 hidden group-hover:block w-48 bg-dark-800 border border-white/[0.1] rounded-xl shadow-xl p-2 z-10">
                              {getOnlineAgents().filter(a => a.agentId !== selectedSubtask.assignedAgentId).map(a => (
                                <button
                                  key={a.agentId}
                                  onClick={() => { reassignSubtask(selectedTask.id, selectedSubtask.id, a.agentId); refresh() }}
                                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-dark-300 hover:bg-dark-700 transition-colors"
                                >
                                  <span>{a.avatar}</span>
                                  <span>{a.agentName}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      {selectedSubtask.dependsOn.length > 0 && (
                        <div className="mt-3">
                          <p className="text-[10px] text-dark-500 mb-1">依赖任务</p>
                          <div className="flex gap-1.5">
                            {selectedSubtask.dependsOn.map(depId => {
                              const dep = selectedTask.subtasks.find(s => s.id === depId)
                              return dep ? (
                                <span key={depId} className={`text-[9px] px-1.5 py-0.5 rounded ${
                                  dep.status === 'completed' ? 'bg-accent-green/10 text-accent-green' : 'bg-dark-700 text-dark-500'
                                }`}>
                                  {dep.status === 'completed' ? '✅' : '⏳'} {dep.title}
                                </span>
                              ) : null
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Events tab */}
              {tab === 'events' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="glass-card p-5">
                    <h3 className="text-sm font-semibold text-dark-200 mb-4">📡 调度事件流</h3>
                    <EventFeed events={getTaskEvents(selectedTask.id)} />
                  </div>
                  <div className="glass-card p-5">
                    <h3 className="text-sm font-semibold text-dark-200 mb-4">💬 Agent 消息</h3>
                    <MessageFeed messages={getTaskMessages(selectedTask.id)} />
                  </div>
                </div>
              )}

              {/* Agents tab */}
              {tab === 'agents' && (
                <div className="glass-card p-5">
                  <h3 className="text-sm font-semibold text-dark-200 mb-4">Agent 负载状态</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {agentCapabilities.map(agent => (
                      <div key={agent.agentId} className="p-3 bg-dark-800/40 rounded-xl border border-white/[0.04]">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{agent.avatar}</span>
                          <div>
                            <p className="text-xs font-medium text-dark-200">{agent.agentName}</p>
                            <p className={`text-[10px] ${agent.status === 'online' ? 'text-accent-green' : agent.status === 'busy' ? 'text-accent-yellow' : 'text-dark-500'}`}>
                              {agent.status === 'online' ? '在线' : agent.status === 'busy' ? '忙碌' : '离线'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[10px] text-dark-500">负载</span>
                          <div className="flex-1 h-1.5 bg-dark-700 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${agent.workload.utilizationRate}%`,
                                background: agent.workload.utilizationRate > 80 ? '#ef4444' : agent.workload.utilizationRate > 50 ? '#f59e0b' : '#10b981',
                              }}
                            />
                          </div>
                          <span className="text-[10px] text-dark-500 w-6 text-right">{agent.workload.utilizationRate}%</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-dark-500">活跃任务: {agent.workload.activeTasks}</span>
                          <span className="text-dark-500">可靠性: {agent.reliability}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="glass-card p-12 flex flex-col items-center justify-center text-center h-[500px]">
              <span className="text-6xl mb-4">🤖</span>
              <h3 className="text-lg font-bold text-white mb-2">Agent 调度台</h3>
              <p className="text-sm text-dark-300 max-w-md mb-4">
                接入 AI 平台后，系统才会真实拆解和分派任务。未接入时这里保持空态，不伪造进度。
              </p>
              <button onClick={() => setShowCreate(true)} className="px-5 py-2.5 bg-accent-purple/15 hover:bg-accent-purple/25 text-accent-purple text-sm font-medium rounded-xl transition-all border border-accent-purple/20 hover:border-accent-purple/30">
                创建第一个任务
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create task modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="创建任务（自动分派）" subtitle="输入任务描述，系统自动拆解并分派给合适的 Agent">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-dark-300 mb-1.5 block font-medium">任务标题</label>
            <input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="例如：做一个产品 Landing Page"
              className="w-full px-3 py-2.5 bg-dark-800/60 border border-white/[0.06] rounded-xl text-sm text-dark-200 placeholder-dark-600 focus:outline-none focus:border-accent-purple/40 transition-colors"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs text-dark-300 mb-1.5 block font-medium">详细描述（可选）</label>
            <textarea
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              placeholder="补充需求细节，帮助系统更精准地拆解..."
              rows={3}
              className="w-full px-3 py-2.5 bg-dark-800/60 border border-white/[0.06] rounded-xl text-sm text-dark-200 placeholder-dark-600 focus:outline-none focus:border-accent-purple/40 transition-colors resize-none"
            />
          </div>
          <div className="p-3 bg-accent-purple/5 rounded-lg border border-accent-purple/10">
            <p className="text-[11px] text-dark-300">
              💡 只有接入 AI 平台后，系统才会创建真实调度任务。未接入时不会生成假任务或假进度。
            </p>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 text-xs font-medium text-dark-400 bg-dark-700/30 hover:bg-dark-700/50 rounded-xl transition-colors">取消</button>
            <button onClick={handleCreate} disabled={!newTitle.trim()} className="flex-1 py-2.5 text-xs font-medium text-accent-purple bg-accent-purple/15 hover:bg-accent-purple/25 border border-accent-purple/20 hover:border-accent-purple/30 rounded-xl transition-all disabled:opacity-40">
              🚀 拆解并自动分派
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
