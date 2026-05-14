/**
 * 任务执行引擎
 * 真正调用 AI API 执行子任务
 */

import { createClientWithConfig } from '@/lib/ai-providers/client'
import { createAndDispatch, completeSubtask, getTask, dispatchReadySubtasks, logEvent } from './dispatcher'
import { getAgentCapability } from './agent-registry'
import { createSuggestion } from '@/lib/workspace-store'
import type { OptimizationSuggestion } from '@/types'
import type { Subtask, DispatchedTask } from './types'

const AGENT_ROLES: Record<string, string> = {
  'ceo-assistant': '你是 CEO 助理，擅长需求分析、任务拆解和决策支持。你的工作风格是高效、精准、全局视角。',
  'project-manager': '你是项目经理，擅长进度跟踪、风险预警和资源协调。你确保项目按时交付，质量达标。',
  'researcher': '你是研究员，擅长市场调研、竞品分析和用户研究。你的分析深入、数据驱动、结论有据。',
  'designer': '你是设计师，擅长 UI 设计、交互设计和品牌设计。你注重视觉美感和用户体验。',
  'engineer': '你是工程师，擅长代码开发、技术方案和系统架构。你写出高质量、可维护的代码。',
  'content-operator': '你是内容运营，擅长文案撰写、内容策划和 SEO 优化。你的文字有感染力、转化率高。',
  'data-analyst': '你是数据分析师，擅长数据分析、数据可视化和 A/B 测试。你用数据说话，洞察深刻。',
  'qa-engineer': '你是测试工程师，擅长功能测试、自动化测试和 Bug 追踪。你细致严谨，不放过任何缺陷。',
  'devops': '你是 DevOps 工程师，擅长 CI/CD、容器化和监控告警。你确保系统稳定、部署高效。',
}

const executionQueue = new Map<string, AbortController>()
let isProcessing = false

function getAIConfig(): { providerId: string; apiKey: string; baseUrl: string; model: string } | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem('opc-os-ai-providers')
    if (!raw) return null
    const store = JSON.parse(raw) as {
      activeProviderId?: string | null
      providers?: Record<string, { enabled?: boolean; apiKey?: string; baseUrl?: string; selectedModel?: string }>
      agentModels?: Record<string, { providerId: string; modelId: string }>
    }
    const active = store.activeProviderId
    if (!active || !store.providers?.[active]) return null
    const inst = store.providers[active]
    if (!inst.enabled || !inst.apiKey) return null
    return { providerId: active, apiKey: inst.apiKey, baseUrl: inst.baseUrl || '', model: inst.selectedModel || '' }
  } catch { return null }
}

function getAgentAIConfig(agentId: string): { providerId: string; apiKey: string; baseUrl: string; model: string } | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem('opc-os-ai-providers')
    if (!raw) return getAIConfig()
    const store = JSON.parse(raw) as {
      activeProviderId?: string | null
      providers?: Record<string, { enabled?: boolean; apiKey?: string; baseUrl?: string; selectedModel?: string }>
      agentModels?: Record<string, { providerId: string; modelId: string }>
    }
    const binding = store.agentModels?.[agentId]
    if (!binding || !binding.providerId) return getAIConfig()
    const inst = store.providers?.[binding.providerId]
    if (!inst || !inst.enabled || !inst.apiKey) return getAIConfig()
    return { providerId: binding.providerId, apiKey: inst.apiKey, baseUrl: inst.baseUrl || '', model: binding.modelId || inst.selectedModel || '' }
  } catch { return getAIConfig() }
}

function buildPrompt(subtask: Subtask, task: DispatchedTask, agentId: string): { system: string; user: string } {
  const agent = getAgentCapability(agentId)
  const role = AGENT_ROLES[agentId] || `你是 ${agent?.agentName || agentId}，负责完成分配给你的任务。`
  const system = `${role}

你正在参与一个团队项目。以下是项目背景：
- 项目名称：${task.title}
- 项目描述：${task.description}

你需要完成的子任务：
- 子任务：${subtask.title}
- 详细描述：${subtask.description}
- 优先级：${subtask.priority}
- 预计工时：${subtask.estimatedMinutes} 分钟

请直接输出你的工作成果。要求：
1. 内容具体、可执行、有实际价值
2. 如果是代码任务，输出完整可用的代码
3. 如果是分析任务，输出结构化的分析结论
4. 如果是设计任务，输出详细的设计方案
5. 不要泛泛而谈，要给出可以直接使用的产出`
  const user = `请完成「${subtask.title}」：${subtask.description}`
  return { system, user }
}

async function executeSubtask(taskId: string, subtask: Subtask, agentId: string): Promise<string> {
  const task = getTask(taskId)
  if (!task) throw new Error('任务不存在')
  const aiConfig = getAgentAIConfig(agentId)
  if (!aiConfig) throw new Error('未配置 AI 平台')

  logEvent('subtask_started', taskId, subtask.id, agentId, `「${subtask.title}」开始执行 (模型: ${aiConfig.model})`)
  const { system, user } = buildPrompt(subtask, task, agentId)

  let providerForClient = aiConfig.providerId
  if (providerForClient.startsWith('custom-')) providerForClient = 'openai'

  const client = createClientWithConfig(aiConfig.apiKey, aiConfig.baseUrl, aiConfig.model)
  const response = await client.chat({
    model: aiConfig.model,
    messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
    maxTokens: 4096,
    temperature: 0.7,
  })
  return response.content
}

async function analyzeOptimizations(
  taskId: string, subtaskId: string, agentId: string,
  subtaskTitle: string, taskTitle: string, result: string
): Promise<void> {
  const aiConfig = getAgentAIConfig(agentId)
  if (!aiConfig) return
  const client = createClientWithConfig(aiConfig.apiKey, aiConfig.baseUrl, aiConfig.model)

  const prompt = `你刚完成了「${subtaskTitle}」这个子任务（属于项目「${taskTitle}」）。

你的工作产出摘要：
${result.slice(0, 1500)}

请从以下角度反思，这个项目/平台有没有可以优化的地方：
1. 性能优化、2. 用户体验、3. 功能缺失、4. Bug或异常、5. 架构改进、6. 工作流优化

请用 JSON 数组格式回答，每个优化点包含：title, description, category(performance/ux/feature/bug/architecture/workflow), priority(critical/high/medium/low), proposedSolution, impact, effort(low/medium/high)。
如果没有发现优化点，返回 []。只返回 JSON。`

  try {
    const response = await client.chat({ model: aiConfig.model, messages: [{ role: 'user', content: prompt }], maxTokens: 2048, temperature: 0.5 })
    let suggestions: Array<{ title: string; description: string; category: string; priority: string; proposedSolution: string; impact: string; effort: string }> = []
    try {
      const jsonMatch = response.content.match(/\[[\s\S]*\]/)
      if (jsonMatch) suggestions = JSON.parse(jsonMatch[0])
    } catch {}

    const validCategories = ['performance', 'ux', 'feature', 'bug', 'architecture', 'workflow']
    const validPriorities = ['critical', 'high', 'medium', 'low']
    const validEfforts = ['low', 'medium', 'high']
    for (const s of suggestions) {
      createSuggestion({
        title: s.title, description: s.description,
        category: (validCategories.includes(s.category) ? s.category : 'feature') as OptimizationSuggestion['category'],
        priority: (validPriorities.includes(s.priority) ? s.priority : 'medium') as OptimizationSuggestion['priority'],
        source: agentId, taskId, subtaskId,
        proposedSolution: s.proposedSolution, impact: s.impact,
        effort: (validEfforts.includes(s.effort) ? s.effort : 'medium') as OptimizationSuggestion['effort'],
      })
    }
    if (suggestions.length > 0) {
      logEvent('subtask_completed', taskId, subtaskId, agentId, `发现 ${suggestions.length} 个优化建议`)
    }
  } catch {}
}

async function processQueue(): Promise<void> {
  if (isProcessing) return
  isProcessing = true
  try {

  while (executionQueue.size > 0) {
    const entries = Array.from(executionQueue.entries())
    executionQueue.clear()
    logEvent('task_created', entries[0]?.[0]?.split('|')[0] || '', null, null, `开始执行 ${entries.length} 个子任务...`)

    await Promise.allSettled(
      entries.map(async ([key, controller]) => {
        const [taskId, subtaskId, agentId] = key.split('|')
        if (controller.signal.aborted) return
        try {
          const t0 = Date.now()
          const curTask = getTask(taskId)
          const subObj = curTask?.subtasks.find(s => s.id === subtaskId)
          if (!subObj) { throw new Error('子任务不存在') }
          const result = await executeSubtask(taskId, subObj, agentId)
          const elapsed = ((Date.now() - t0) / 1000).toFixed(1)
          if (!controller.signal.aborted) {
            completeSubtask(taskId, subtaskId, agentId, result)
            logEvent('subtask_completed', taskId, subtaskId, agentId,
              `「${subObj.title}」完成 (${elapsed}s)`)
            const updatedTask = getTask(taskId)
            if (updatedTask) dispatchReadySubtasks(taskId)
            const updated = getTask(taskId)
            const updatedSub = updated?.subtasks.find(s => s.id === subtaskId)
            if (updated && updatedSub) {
              analyzeOptimizations(taskId, subtaskId, agentId, updatedSub.title, updated.title, result).catch(() => {})
            }
          }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err)
          logEvent('subtask_failed', taskId, subtaskId, agentId, `执行失败: ${errorMsg}`)

          // 自动重试（最多2次）
          const curTask = getTask(taskId)
          const failedSub = curTask?.subtasks.find(s => s.id === subtaskId)
          if (failedSub && failedSub.retryCount < failedSub.maxRetries) {
            failedSub.retryCount++
            failedSub.status = 'assigned'
            logEvent('subtask_retried', taskId, subtaskId, agentId,
              `自动重试 ${failedSub.retryCount}/${failedSub.maxRetries}: ${errorMsg}`)
            if (!executionQueue.has(`${taskId}|${subtaskId}|${agentId}`)) {
              submitForExecution(taskId, failedSub, agentId)
            }
          } else {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('opc-os-executor-error', { detail: { subtaskId, error: errorMsg } }))
            }
          }
        }
      })
    )
  }
  } finally {
    isProcessing = false
  }
}

export function submitForExecution(taskId: string, subtask: Subtask, agentId: string): void {
  const key = `${taskId}|${subtask.id}|${agentId}`
  if (executionQueue.has(key)) return
  executionQueue.set(key, new AbortController())
  processQueue()
}

export function executeAllPending(taskId: string): void {
  const task = getTask(taskId)
  if (!task) return
  for (const subtask of task.subtasks) {
    if (subtask.status === 'assigned' && subtask.assignedAgentId) {
      submitForExecution(taskId, subtask, subtask.assignedAgentId)
    }
  }
}

export function createAndExecute(title: string, description: string): DispatchedTask {
  const task = createAndDispatch(title, description)
  setTimeout(() => executeAllPending(task.id), 500)
  startCascadeWatcher(task.id)
  return task
}

// 级联监听器管理
const cascadeWatchers = new Map<string, ReturnType<typeof setInterval>>()

// 监听取消事件
if (typeof window !== 'undefined') {
  window.addEventListener('opc-os-cancel-task', ((e: CustomEvent) => {
    const taskId = e.detail.taskId
    // 清除执行队列中该任务的所有子任务
    for (const [key, controller] of executionQueue) {
      if (key.startsWith(taskId + '|')) {
        controller.abort()
        executionQueue.delete(key)
      }
    }
    // 停止级联监听器
    const watcher = cascadeWatchers.get(taskId)
    if (watcher) { clearInterval(watcher); cascadeWatchers.delete(taskId) }
  }) as EventListener)
}

function startCascadeWatcher(taskId: string): void {
  // 先清除旧的
  stopCascadeWatcher(taskId)
  const interval = setInterval(() => {
    const task = getTask(taskId)
    if (!task) { stopCascadeWatcher(taskId); return }
    if (task.status === 'completed' || task.status === 'failed') { stopCascadeWatcher(taskId); return }
    for (const subtask of task.subtasks) {
      if (subtask.status === 'assigned' && subtask.assignedAgentId) {
        const key = `${taskId}|${subtask.id}|${subtask.assignedAgentId}`
        if (!executionQueue.has(key)) submitForExecution(taskId, subtask, subtask.assignedAgentId)
      }
    }
  }, 3000)
  cascadeWatchers.set(taskId, interval)
  setTimeout(() => stopCascadeWatcher(taskId), 30 * 60 * 1000)
}

function stopCascadeWatcher(taskId: string): void {
  const watcher = cascadeWatchers.get(taskId)
  if (watcher) { clearInterval(watcher); cascadeWatchers.delete(taskId) }
}
