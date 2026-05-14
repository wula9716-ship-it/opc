/**
 * 调度器核心
 * 协调任务拆解 → 技能匹配 → 分派 → 执行 → 级联触发的全链路
 */

import { DispatchedTask, Subtask, DispatchEvent, AgentMessage, MatchScore, SkillRequirement } from './types'
import { decomposeTask, getReadySubtasks, updateTaskProgress } from './decomposer'
import { matchAgents, findBestAgent, batchAssign } from './skill-matcher'
import { updateAgentLoad, getAgentCapability } from './agent-registry'
import type { Output, Task } from '@/types'

// ============ 内存状态 ============

const dispatchedTasks = new Map<string, DispatchedTask>()
const eventLog: DispatchEvent[] = []
const messageLog: AgentMessage[] = []

let eventCounter = 0
let msgCounter = 0

function nextEventId(): string { return `evt-${Date.now()}-${++eventCounter}` }
function nextMsgId(): string { return `msg-${Date.now()}-${++msgCounter}` }

export function isAIProviderConfigured(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const raw = window.localStorage.getItem('opc-os-ai-providers')
    if (!raw) return false
    const store = JSON.parse(raw) as { activeProviderId?: string | null; providers?: Record<string, { enabled?: boolean; apiKey?: string }> }
    const active = store.activeProviderId
    if (!active || !store.providers?.[active]) return false
    return store.providers[active].enabled !== false && Boolean(store.providers[active].apiKey)
  } catch {
    return false
  }
}

// ============ 事件和消息 ============

export function logEvent(type: DispatchEvent['type'], taskId: string, subtaskId: string | null, agentId: string | null, message: string, metadata: Record<string, unknown> = {}): DispatchEvent {
  const evt: DispatchEvent = { id: nextEventId(), type, taskId, subtaskId, agentId, message, timestamp: new Date().toISOString(), metadata }
  eventLog.unshift(evt) // 最新的在前
  return evt
}

function sendMessage(from: string, to: string, type: AgentMessage['type'], taskId: string, subtaskId: string | null, content: string, metadata: Record<string, unknown> = {}): AgentMessage {
  const msg: AgentMessage = { id: nextMsgId(), from, to, type, taskId, subtaskId, content, metadata, timestamp: new Date().toISOString(), read: false }
  messageLog.unshift(msg)
  return msg
}

// ============ 核心 API ============

/**
 * 创建并分派一个新任务
 * 1. 拆解为子任务 DAG
 * 2. 识别就绪子任务
 * 3. 为就绪子任务匹配 Agent 并分派
 */
export function createAndDispatch(title: string, description: string): DispatchedTask {
  if (!isAIProviderConfigured()) {
    throw new Error('请先在设置中接入 AI 平台，再创建自动分派任务。')
  }

  const taskId = `task-${Date.now()}`
  const task = decomposeTask(taskId, title, description)
  task.status = 'dispatching'
  dispatchedTasks.set(taskId, task)

  logEvent('task_created', taskId, null, null, `创建任务「${title}」`)
  logEvent('task_decomposed', taskId, null, null, `拆解为 ${task.subtasks.length} 个子任务`)

  // 分派第一批就绪的子任务
  dispatchReadySubtasks(taskId)

  return task
}

/**
 * 为就绪的子任务自动匹配并分派 Agent
 */
export function dispatchReadySubtasks(taskId: string): void {
  const task = dispatchedTasks.get(taskId)
  if (!task) return

  const ready = getReadySubtasks(task)
  if (ready.length === 0) return

  // 批量分配
  const assignments = batchAssign(
    ready.map(s => ({ id: s.id, requirements: s.requiredSkills }))
  )

  for (const subtask of ready) {
    const agentId = assignments.get(subtask.id)
    if (!agentId) {
      logEvent('subtask_failed', taskId, subtask.id, null, `无法为「${subtask.title}」找到合适的 Agent`)
      continue
    }

    assignSubtask(task, subtask, agentId)
  }

  updateTaskProgress(task)
}

/**
 * 将一个子任务分配给指定 Agent
 */
function assignSubtask(task: DispatchedTask, subtask: Subtask, agentId: string): void {
  subtask.assignedAgentId = agentId
  subtask.status = 'assigned'

  const agent = getAgentCapability(agentId)
  updateAgentLoad(agentId, 1)

  logEvent('subtask_assigned', task.id, subtask.id, agentId,
    `将「${subtask.title}」分配给 ${agent?.agentName ?? agentId}`)

  sendMessage('dispatcher', agentId, 'task_assigned', task.id, subtask.id,
    `你被分配了新任务：${subtask.title}\n${subtask.description}`)

  updateTaskProgress(task)
}

/**
 * 标记子任务完成，触发级联分派
 */
export function completeSubtask(taskId: string, subtaskId: string, agentId: string, result?: string): void {
  const task = dispatchedTasks.get(taskId)
  if (!task) return
  const subtask = task.subtasks.find(s => s.id === subtaskId)
  if (!subtask) return

  subtask.status = 'completed'
  subtask.completedAt = new Date().toISOString()
  const resultContent = result || `「${subtask.title}」已完成`
  subtask.result = resultContent
  subtask.actualMinutes = subtask.startedAt
    ? Math.round((Date.now() - new Date(subtask.startedAt).getTime()) / 60000)
    : null

  // 创建产出
  if (typeof window !== 'undefined') {
    const { createOutput, loadTasks, saveTasks } = require('@/lib/workspace-store')
    createOutput({
      title: subtask.title,
      type: 'report' as Output['type'],
      format: 'text',
    })
    // 同步任务状态到任务列表
    const tasks = loadTasks() as Task[]
    const matched = tasks.find(t => t.title === task.title)
    if (matched) {
      const progress = task.subtasks.filter(s => s.status === 'completed').length / task.subtasks.length
      matched.progress = Math.round(progress * 100)
      matched.status = task.status === 'completed' ? 'completed' : progress > 0 ? 'in_progress' : 'pending'
      saveTasks(tasks)
    }
  }

  updateAgentLoad(agentId, -1)

  logEvent('subtask_completed', taskId, subtaskId, agentId, `完成「${subtask.title}」`)
  sendMessage(agentId, 'dispatcher', 'task_completed', taskId, subtaskId, `已完成：${subtask.title}`)

  updateTaskProgress(task)

  // 检查是否有被阻塞的子任务现在可以开始了
  const unblocked = task.subtasks.filter(s =>
    s.status === 'queued' &&
    s.dependsOn.includes(subtaskId) &&
    s.dependsOn.every(depId => {
      const dep = task.subtasks.find(ds => ds.id === depId)
      return dep?.status === 'completed'
    })
  )

  if (unblocked.length > 0) {
    logEvent('cascade_triggered', taskId, subtaskId, null,
      `「${subtask.title}」完成后解锁了 ${unblocked.length} 个后续任务`)
  }

  // 级联分派新就绪的子任务
  dispatchReadySubtasks(taskId)

  // 检查整体任务是否完成
  if (task.status === 'completed') {
    logEvent('task_completed', taskId, null, null, `任务「${task.title}」全部完成！🎉`)
    sendMessage('dispatcher', 'all', 'info', taskId, null, `🎉 任务「${task.title}」的所有子任务已完成！`)
  }
}

/**
 * 重试失败的子任务
 */
export function retrySubtask(taskId: string, subtaskId: string): boolean {
  const task = dispatchedTasks.get(taskId)
  if (!task) return false
  const subtask = task.subtasks.find(s => s.id === subtaskId)
  if (!subtask || (subtask.status !== 'failed' && subtask.status !== 'blocked')) return false
  if (subtask.retryCount >= subtask.maxRetries) return false

  subtask.retryCount++
  subtask.status = 'queued'
  subtask.assignedAgentId = null
  subtask.result = null
  subtask.startedAt = null
  subtask.completedAt = null

  logEvent('subtask_retried', taskId, subtaskId, null, `重试「${subtask.title}」(${subtask.retryCount}/${subtask.maxRetries})`)

  // 立即尝试重新分派
  dispatchReadySubtasks(taskId)
  return true
}

/**
 * 手动改派子任务给另一个 Agent
 */
export function reassignSubtask(taskId: string, subtaskId: string, newAgentId: string): boolean {
  const task = dispatchedTasks.get(taskId)
  if (!task) return false
  const subtask = task.subtasks.find(s => s.id === subtaskId)
  if (!subtask || subtask.status === 'completed') return false

  const oldAgentId = subtask.assignedAgentId
  if (oldAgentId) updateAgentLoad(oldAgentId, -1)

  subtask.assignedAgentId = newAgentId
  if (subtask.status === 'queued') subtask.status = 'assigned'

  updateAgentLoad(newAgentId, 1)

  logEvent('handoff', taskId, subtaskId, newAgentId,
    `手动改派「${subtask.title}」${oldAgentId ? ` 从 ${oldAgentId}` : ''} → ${newAgentId}`)

  return true
}

/**
 * 批量取消任务的所有排队子任务
 */
/**
 * 取消整个任务（包括运行中的子任务）
 */
export function cancelTask(taskId: string): number {
  const task = dispatchedTasks.get(taskId)
  if (!task) return 0

  // 触发执行引擎停止
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('opc-os-cancel-task', { detail: { taskId } }))
  }

  let count = 0
  for (const s of task.subtasks) {
    if (s.status === 'queued' || s.status === 'assigned' || s.status === 'running') {
      s.status = 'failed'
      s.result = '已取消'
      count++
    }
  }
  task.status = 'failed'
  updateTaskProgress(task)
  logEvent('task_created', taskId, null, null, `任务「${task.title}」已取消 (${count} 个子任务)`)

  // 同步到任务列表
  if (typeof window !== 'undefined') {
    try {
      const { loadTasks, saveTasks } = require('@/lib/workspace-store')
      const tasks = loadTasks() as Task[]
      const matched = tasks.find(t => t.title === task.title)
      if (matched) { matched.status = 'blocked'; saveTasks(tasks) }
    } catch {}
  }

  return count
}

/**
 * 批量取消任务的所有排队子任务
 * @deprecated 请使用 cancelTask
 */
export function cancelQueuedSubtasks(taskId: string): number {
  const task = dispatchedTasks.get(taskId)
  if (!task) return 0
  let count = 0
  for (const s of task.subtasks) {
    if (s.status === 'queued') {
      s.status = 'failed'
      s.result = '已取消'
      count++
    }
  }
  updateTaskProgress(task)
  return count
}

/**
 * Agent 间交接
 */
export function handoffSubtask(taskId: string, subtaskId: string, fromAgentId: string, toAgentId: string, reason: string): boolean {
  const task = dispatchedTasks.get(taskId)
  if (!task) return false
  const subtask = task.subtasks.find(s => s.id === subtaskId)
  if (!subtask || subtask.status !== 'running') return false

  subtask.handoffFrom = fromAgentId
  subtask.handoffTo = toAgentId
  subtask.assignedAgentId = toAgentId

  updateAgentLoad(fromAgentId, -1)
  updateAgentLoad(toAgentId, 1)

  logEvent('handoff', taskId, subtaskId, fromAgentId,
    `从 ${fromAgentId} 交接给 ${toAgentId}，原因：${reason}`)

  sendMessage(fromAgentId, toAgentId, 'handoff_request', taskId, subtaskId,
    `请求交接任务「${subtask.title}」，原因：${reason}`)
  sendMessage(toAgentId, fromAgentId, 'handoff_accepted', taskId, subtaskId,
    `已接受交接「${subtask.title}」`)

  return true
}

// ============ 查询接口 ============

export function getTask(taskId: string): DispatchedTask | undefined {
  return dispatchedTasks.get(taskId)
}

export function getAllTasks(): DispatchedTask[] {
  return Array.from(dispatchedTasks.values()).sort((a, b) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )
}

export function getTaskEvents(taskId: string): DispatchEvent[] {
  return eventLog.filter(e => e.taskId === taskId)
}

export function getRecentEvents(limit: number = 20): DispatchEvent[] {
  return eventLog.slice(0, limit)
}

export function getTaskMessages(taskId: string): AgentMessage[] {
  return messageLog.filter(m => m.taskId === taskId)
}

export function getAgentMessages(agentId: string): AgentMessage[] {
  return messageLog.filter(m => m.to === agentId || m.to === 'all')
}

export function getMatchScores(subtaskId: string, requirements: SkillRequirement[]): MatchScore[] {
  return matchAgents(requirements)
}

export function getDispatchStats() {
  const tasks = Array.from(dispatchedTasks.values())
  const totalSubtasks = tasks.reduce((sum, t) => sum + t.subtasks.length, 0)
  const completedSubtasks = tasks.reduce((sum, t) => sum + t.subtasks.filter(s => s.status === 'completed').length, 0)
  const runningSubtasks = tasks.reduce((sum, t) => sum + t.subtasks.filter(s => s.status === 'running').length, 0)
  const queuedSubtasks = tasks.reduce((sum, t) => sum + t.subtasks.filter(s => s.status === 'queued').length, 0)

  return {
    totalTasks: tasks.length,
    completedTasks: tasks.filter(t => t.status === 'completed').length,
    executingTasks: tasks.filter(t => t.status === 'executing').length,
    totalSubtasks,
    completedSubtasks,
    runningSubtasks,
    queuedSubtasks,
    recentEvents: eventLog.slice(0, 10),
  }
}
