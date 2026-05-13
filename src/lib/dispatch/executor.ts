/**
 * 任务执行引擎
 * 真正调用 AI API 执行子任务，而不是模拟
 */

import { createClient, createClientWithConfig } from '@/lib/ai-providers/client'
import { completeSubtask, getTask, dispatchReadySubtasks } from './dispatcher'
import { getAgentCapability } from './agent-registry'
import { logEvent } from './dispatcher'
import type { Subtask, DispatchedTask } from './types'

// Agent 角色描述，让 AI 知道自己是谁
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

// 执行队列
const executionQueue = new Map<string, AbortController>()
let isProcessing = false

/**
 * 获取 AI 平台配置
 */
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
    return {
      providerId: active,
      apiKey: inst.apiKey,
      baseUrl: inst.baseUrl || '',
      model: inst.selectedModel || '',
    }
  } catch {
    return null
  }
}

/**
 * 获取 Agent 专属的 AI 配置（如果绑定了特定模型）
 */
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

    return {
      providerId: binding.providerId,
      apiKey: inst.apiKey,
      baseUrl: inst.baseUrl || '',
      model: binding.modelId || inst.selectedModel || '',
    }
  } catch {
    return getAIConfig()
  }
}

/**
 * 构建子任务的执行 prompt
 */
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

/**
 * 执行单个子任务
 */
async function executeSubtask(taskId: string, subtask: Subtask, agentId: string): Promise<string> {
  const task = getTask(taskId)
  if (!task) throw new Error('任务不存在')

  const aiConfig = getAgentAIConfig(agentId)
  if (!aiConfig) throw new Error('未配置 AI 平台')

  logEvent('subtask_started', taskId, subtask.id, agentId, `「${subtask.title}」开始执行 (模型: ${aiConfig.model})`)

  const { system, user } = buildPrompt(subtask, task, agentId)

  // 根据 providerId 选择正确的 provider
  // 对于自定义平台（custom-*），需要使用 'openai' 兼容模式
  let providerForClient = aiConfig.providerId
  if (providerForClient.startsWith('custom-')) {
    providerForClient = 'openai'
  }

  const client = createClientWithConfig(aiConfig.apiKey, aiConfig.baseUrl, aiConfig.model)

  const response = await client.chat({
    model: aiConfig.model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    maxTokens: 4096,
    temperature: 0.7,
  })

  return response.content
}

/**
 * 处理执行队列
 */
async function processQueue(): Promise<void> {
  if (isProcessing) return
  isProcessing = true

  while (executionQueue.size > 0) {
    const entries = Array.from(executionQueue.entries())
    executionQueue.clear()

    await Promise.allSettled(
      entries.map(async ([key, controller]) => {
        const [taskId, subtaskId, agentId] = key.split('|')
        if (controller.signal.aborted) return

        try {
          const result = await executeSubtask(taskId, { id: subtaskId } as Subtask, agentId)
          if (!controller.signal.aborted) {
            completeSubtask(taskId, subtaskId, agentId)
            // 级联分派新就绪的子任务
            const task = getTask(taskId)
            if (task) dispatchReadySubtasks(taskId)
          }
        } catch (err) {
          console.error(`子任务执行失败: ${subtaskId}`, err)
        }
      })
    )
  }

  isProcessing = false
}

/**
 * 提交子任务到执行队列
 */
export function submitForExecution(taskId: string, subtask: Subtask, agentId: string): void {
  const key = `${taskId}|${subtask.id}|${agentId}`
  if (executionQueue.has(key)) return

  executionQueue.set(key, new AbortController())
  processQueue()
}

/**
 * 批量提交所有已分配但未执行的子任务
 */
export function executeAllPending(taskId: string): void {
  const task = getTask(taskId)
  if (!task) return

  for (const subtask of task.subtasks) {
    if (subtask.status === 'assigned' && subtask.assignedAgentId) {
      submitForExecution(taskId, subtask, subtask.assignedAgentId)
    }
  }
}

/**
 * 自动执行模式：创建任务后自动执行所有子任务
 */
export function createAndExecute(title: string, description: string): DispatchedTask {
  const { createAndDispatch } = require('./dispatcher')
  const task = createAndDispatch(title, description)

  // 延迟一下再执行，让 UI 先更新
  setTimeout(() => {
    executeAllPending(task.id)
  }, 500)

  // 启动自动级联执行
  startCascadeWatcher(task.id)

  return task
}

/**
 * 监听任务状态，新分配的子任务自动投入执行
 */
function startCascadeWatcher(taskId: string): void {
  const interval = setInterval(() => {
    const task = getTask(taskId)
    if (!task) { clearInterval(interval); return }
    if (task.status === 'completed') { clearInterval(interval); return }

    // 找到已分配但未执行的子任务
    for (const subtask of task.subtasks) {
      if (subtask.status === 'assigned' && subtask.assignedAgentId) {
        const key = `${taskId}|${subtask.id}|${subtask.assignedAgentId}`
        if (!executionQueue.has(key)) {
          submitForExecution(taskId, subtask, subtask.assignedAgentId)
        }
      }
    }
  }, 3000)

  // 最多监听 30 分钟
  setTimeout(() => clearInterval(interval), 30 * 60 * 1000)
}
