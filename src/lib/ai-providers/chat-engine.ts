/**
 * Agent 对话引擎 v2
 * 修复：系统提示词每次调用时动态生成（不再模块级固化）
 * 集成分派系统：CEO 助理可以触发任务拆解和自动分派
 */

import { AIMessage } from './types'
import { getProvider } from './registry'
import { AIClient } from './client'
import { createAndDispatch, getAllTasks, getDispatchStats } from '@/lib/dispatch/dispatcher'

const STORAGE_KEY = 'opc-os-ai-providers'

interface StoreData {
  providers: Record<string, { providerId: string; apiKey: string; selectedModel: string; baseUrl?: string; enabled: boolean }>
  activeProviderId: string | null
}

function getStore(): StoreData {
  if (typeof window === 'undefined') return { providers: {}, activeProviderId: null }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : { providers: {}, activeProviderId: null }
  } catch {
    return { providers: {}, activeProviderId: null }
  }
}

function getClient(): AIClient | null {
  const store = getStore()
  const id = store.activeProviderId
  if (!id) return null
  const inst = store.providers[id]
  if (!inst || !inst.enabled) return null
  const config = getProvider(id)
  if (!config) return null
  return new AIClient({
    provider: {
      ...config,
      baseUrl: inst.baseUrl?.trim() || config.baseUrl,
    },
    apiKey: inst.apiKey,
  })
}

function getActiveModel(): string | null {
  const store = getStore()
  const id = store.activeProviderId
  if (!id) return null
  return store.providers[id]?.selectedModel ?? null
}

export function isProviderConfigured(): boolean {
  const store = getStore()
  return !!store.activeProviderId && !!store.providers[store.activeProviderId]?.enabled
}

// ============ 动态生成系统提示词（每次调用时刷新） ============

function getDispatchContext(): string {
  const stats = getDispatchStats()
  const tasks = getAllTasks()
  if (tasks.length === 0) return '当前没有已分派的任务。用户可以让你创建任务，你会自动拆解并分派。'
  const recent = tasks.slice(0, 3).map(t => `  ·「${t.title}」进度 ${t.progress}%，${t.status === 'completed' ? '已完成' : t.status === 'executing' ? '执行中' : '分派中'}`).join('\n')
  return `当前有 ${stats.totalTasks} 个任务（${stats.executingTasks} 执行中，${stats.completedTasks} 已完成），${stats.runningSubtasks} 个子任务执行中，${stats.queuedSubtasks} 个排队。\n最近任务：\n${recent}`
}

function buildSystemPrompt(agentName: string): string {
  const dispatchContext = getDispatchContext()

  const basePrompts: Record<string, string> = {
    'CEO 助理': `你是 OPC OS 的 CEO 助理，负责全局统筹。你的职责包括需求分析、任务拆解、优先级排序和决策支持。

你有一个特殊能力：当用户描述一个任务时，系统会自动拆解并分派给团队 Agent。

你说话简洁、有条理，善于从全局视角分析问题。
当用户给你一个任务需求时，你应该：
1. 先确认理解需求
2. 系统会自动拆解分派，你向用户说明分工安排
3. 如果用户只是聊天，正常回复即可

当前调度状态：
${dispatchContext}`,

    '项目经理': `你是 OPC OS 的项目经理，负责进度跟踪和团队协调。你关注截止日期、风险预警和资源分配。你用数据说话，善于发现瓶颈。

当前调度状态：${dispatchContext}`,

    '研究员': '你是 OPC OS 的研究员，擅长市场调研、竞品分析和用户研究。你思维严谨，善于用数据和事实支撑观点，会主动搜索和分析信息。',
    '设计师': '你是 OPC OS 的设计师，负责 UI/UX 和品牌视觉。你有很好的审美，关注用户体验细节，善于用视觉语言表达想法。',
    '工程师': '你是 OPC OS 的工程师，负责技术实现。你精通多种编程语言和技术栈，善于解决技术难题，写代码注重质量和性能。',
    '内容运营': '你是 OPC OS 的内容运营，负责文案撰写和社媒运营。你文笔流畅，善于讲故事，了解 SEO 和内容营销策略。',
  }

  return basePrompts[agentName] ?? `你是 OPC OS 的 ${agentName}，负责相关专业领域的工作。`
}

// ============ 任务意图识别 ============

const TASK_PATTERNS = [
  /(?:帮我|请|麻烦|能不能).{0,8}(?:做|写|设计|开发|创建|搭建|策划|分析|调研|整理|准备)/,
  /(?:我需要|我想要|我想).{0,5}(?:一个|一份|一套)/,
  /(?:做一个|写一个|设计一个|开发一个|搭建一个)/,
  /(?:任务|需求|项目)[:：]/,
  /(?:帮我搞|帮我弄|帮我出)/,
]

function detectTaskIntent(message: string): { isTask: boolean; confidence: number } {
  for (const pattern of TASK_PATTERNS) {
    if (pattern.test(message)) {
      return { isTask: true, confidence: 0.8 }
    }
  }
  // 较弱的信号
  if (message.length > 10 && message.match(/页面|报告|文档|方案|海报|logo|落地页|小程序|后台/)) {
    return { isTask: true, confidence: 0.5 }
  }
  return { isTask: false, confidence: 0 }
}

// ============ 核心发送函数 ============

export async function sendMessage(
  agentName: string,
  userMessage: string,
  history: { role: 'user' | 'assistant'; content: string }[]
): Promise<string> {
  const client = getClient()
  const model = getActiveModel()
  if (!client || !model) {
    throw new Error('请先在设置中接入至少一个 AI 平台')
  }

  // CEO 助理特殊处理：检测任务意图，自动分派
  if (agentName === 'CEO 助理') {
    const intent = detectTaskIntent(userMessage)
    if (intent.isTask) {
      const task = createAndDispatch(userMessage.slice(0, 50), userMessage)
      const subtaskSummary = task.subtasks
        .slice(0, 6)
        .map(s => {
          const agentName = s.assignedAgentId ?? '排队中'
          return `  · ${s.title}（~${s.estimatedMinutes}min）→ ${agentName}`
        })
        .join('\n')

      const systemPrompt = buildSystemPrompt(agentName)
      const contextMessage = `用户下达了任务：「${userMessage}」。系统已自动将其拆解为 ${task.subtasks.length} 个子任务并分派：\n${subtaskSummary}\n${task.subtasks.length > 6 ? `  ...共 ${task.subtasks.length} 个子任务` : ''}\n\n请用简洁自然的语言向用户确认这次分派，说明任务拆解逻辑和分工。如果可以的话加上一句鼓励的话。`

      const messages: AIMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: contextMessage },
      ]

      try {
        const response = await client.chat({ model, messages, temperature: 0.7, maxTokens: 1024 })
        return response.content
      } catch {
        return formatFallbackDispatch(task.title, task.subtasks)
      }
    }
  }

  // 普通对话
  const systemPrompt = buildSystemPrompt(agentName)
  const messages: AIMessage[] = [
    { role: 'system', content: systemPrompt },
    ...history.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user', content: userMessage },
  ]

  const response = await client.chat({ model, messages, temperature: 0.7, maxTokens: 2048 })
  return response.content
}

export async function* sendMessageStream(
  agentName: string,
  userMessage: string,
  history: { role: 'user' | 'assistant'; content: string }[]
): AsyncGenerator<string> {
  const client = getClient()
  const model = getActiveModel()
  if (!client || !model) {
    throw new Error('请先在设置中接入至少一个 AI 平台')
  }

  // CEO 助理：检测任务意图
  if (agentName === 'CEO 助理') {
    const intent = detectTaskIntent(userMessage)
    if (intent.isTask) {
      const task = createAndDispatch(userMessage.slice(0, 50), userMessage)
      const subtaskSummary = task.subtasks
        .slice(0, 6)
        .map(s => `  · ${s.title} → ${s.assignedAgentId ?? '排队中'}`)
        .join('\n')

      const systemPrompt = buildSystemPrompt(agentName)
      const contextMessage = `用户下达了任务：「${userMessage}」。已拆解为 ${task.subtasks.length} 个子任务：\n${subtaskSummary}\n\n请向用户确认分派结果。`

      const messages: AIMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: contextMessage },
      ]

      try {
        for await (const chunk of client.chatStream({ model, messages, temperature: 0.7, maxTokens: 1024 })) {
          if (chunk.content) yield chunk.content
        }
      } catch {
        yield formatFallbackDispatch(task.title, task.subtasks)
      }
      return
    }
  }

  // 普通对话流式输出
  const systemPrompt = buildSystemPrompt(agentName)
  const messages: AIMessage[] = [
    { role: 'system', content: systemPrompt },
    ...history.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user', content: userMessage },
  ]

  for await (const chunk of client.chatStream({ model, messages, temperature: 0.7, maxTokens: 2048 })) {
    if (chunk.content) yield chunk.content
  }
}

function formatFallbackDispatch(title: string, subtasks: { title: string; estimatedMinutes: number; assignedAgentId: string | null }[]): string {
  const lines = subtasks.map(s => `· ${s.title}（${s.estimatedMinutes}min）→ ${s.assignedAgentId ?? '待分配'}`)
  return `✅ 已自动拆解并分派任务「${title}」\n\n拆解为 ${subtasks.length} 个子任务：\n${lines.join('\n')}\n\n前往调度台查看实时进度 →`
}
