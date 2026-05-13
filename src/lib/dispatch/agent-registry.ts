/**
 * Agent 能力注册表
 * 维护每个 Agent 的技能、负载、可靠性数据
 */

import { AgentCapability, AgentSkill, AgentWorkload } from './types'

// 每个 Agent 的技能画像 — 模拟真实的能力分布
const AGENT_CAPABILITIES: AgentCapability[] = [
  {
    agentId: 'ceo-assistant',
    agentName: 'CEO 助理',
    avatar: '👔',
    status: 'online',
    reliability: 95,
    avgResponseTime: 3,
    skills: [
      { name: '需求分析', proficiency: 95, taskCount: 48, avgQuality: 92, avgTime: 15 },
      { name: '任务拆解', proficiency: 90, taskCount: 42, avgQuality: 88, avgTime: 10 },
      { name: '优先级排序', proficiency: 88, taskCount: 36, avgQuality: 85, avgTime: 5 },
      { name: '决策支持', proficiency: 92, taskCount: 30, avgQuality: 90, avgTime: 20 },
      { name: '文案撰写', proficiency: 70, taskCount: 12, avgQuality: 75, avgTime: 25 },
    ],
    workload: { agentId: 'ceo-assistant', activeTasks: 2, queuedTasks: 1, totalEstimatedMinutes: 45, utilizationRate: 65, lastActiveAt: new Date().toISOString() },
  },
  {
    agentId: 'project-manager',
    agentName: '项目经理',
    avatar: '📊',
    status: 'online',
    reliability: 90,
    avgResponseTime: 5,
    skills: [
      { name: '进度跟踪', proficiency: 92, taskCount: 35, avgQuality: 90, avgTime: 10 },
      { name: '风险预警', proficiency: 85, taskCount: 20, avgQuality: 82, avgTime: 15 },
      { name: '资源协调', proficiency: 88, taskCount: 25, avgQuality: 85, avgTime: 12 },
      { name: '需求分析', proficiency: 75, taskCount: 15, avgQuality: 78, avgTime: 20 },
      { name: '文档撰写', proficiency: 80, taskCount: 22, avgQuality: 80, avgTime: 30 },
    ],
    workload: { agentId: 'project-manager', activeTasks: 1, queuedTasks: 2, totalEstimatedMinutes: 60, utilizationRate: 50, lastActiveAt: new Date().toISOString() },
  },
  {
    agentId: 'researcher',
    agentName: '研究员',
    avatar: '🔬',
    status: 'online',
    reliability: 88,
    avgResponseTime: 8,
    skills: [
      { name: '市场调研', proficiency: 95, taskCount: 29, avgQuality: 93, avgTime: 40 },
      { name: '竞品分析', proficiency: 92, taskCount: 25, avgQuality: 90, avgTime: 35 },
      { name: '用户研究', proficiency: 85, taskCount: 18, avgQuality: 82, avgTime: 45 },
      { name: '数据分析', proficiency: 78, taskCount: 15, avgQuality: 75, avgTime: 30 },
      { name: '文档撰写', proficiency: 72, taskCount: 10, avgQuality: 70, avgTime: 25 },
    ],
    workload: { agentId: 'researcher', activeTasks: 1, queuedTasks: 0, totalEstimatedMinutes: 30, utilizationRate: 40, lastActiveAt: new Date().toISOString() },
  },
  {
    agentId: 'designer',
    agentName: '设计师',
    avatar: '🎨',
    status: 'online',
    reliability: 85,
    avgResponseTime: 10,
    skills: [
      { name: 'UI设计', proficiency: 95, taskCount: 22, avgQuality: 93, avgTime: 60 },
      { name: '交互设计', proficiency: 90, taskCount: 18, avgQuality: 88, avgTime: 45 },
      { name: '品牌设计', proficiency: 88, taskCount: 12, avgQuality: 85, avgTime: 90 },
      { name: '线框图', proficiency: 92, taskCount: 20, avgQuality: 90, avgTime: 30 },
      { name: '视觉设计', proficiency: 90, taskCount: 15, avgQuality: 88, avgTime: 50 },
    ],
    workload: { agentId: 'designer', activeTasks: 2, queuedTasks: 1, totalEstimatedMinutes: 90, utilizationRate: 75, lastActiveAt: new Date().toISOString() },
  },
  {
    agentId: 'engineer',
    agentName: '工程师',
    avatar: '⚙️',
    status: 'online',
    reliability: 92,
    avgResponseTime: 5,
    skills: [
      { name: '代码开发', proficiency: 95, taskCount: 31, avgQuality: 92, avgTime: 60 },
      { name: '技术方案', proficiency: 90, taskCount: 20, avgQuality: 88, avgTime: 30 },
      { name: '系统架构', proficiency: 85, taskCount: 10, avgQuality: 82, avgTime: 45 },
      { name: '性能优化', proficiency: 82, taskCount: 8, avgQuality: 80, avgTime: 40 },
      { name: 'API设计', proficiency: 88, taskCount: 15, avgQuality: 85, avgTime: 25 },
    ],
    workload: { agentId: 'engineer', activeTasks: 3, queuedTasks: 1, totalEstimatedMinutes: 120, utilizationRate: 80, lastActiveAt: new Date().toISOString() },
  },
  {
    agentId: 'content-operator',
    agentName: '内容运营',
    avatar: '✍️',
    status: 'online',
    reliability: 82,
    avgResponseTime: 6,
    skills: [
      { name: '文案撰写', proficiency: 95, taskCount: 18, avgQuality: 92, avgTime: 20 },
      { name: '内容策划', proficiency: 90, taskCount: 12, avgQuality: 88, avgTime: 15 },
      { name: 'SEO优化', proficiency: 85, taskCount: 10, avgQuality: 80, avgTime: 25 },
      { name: '社媒运营', proficiency: 88, taskCount: 15, avgQuality: 85, avgTime: 10 },
      { name: '数据分析', proficiency: 70, taskCount: 5, avgQuality: 68, avgTime: 20 },
    ],
    workload: { agentId: 'content-operator', activeTasks: 1, queuedTasks: 0, totalEstimatedMinutes: 20, utilizationRate: 35, lastActiveAt: new Date().toISOString() },
  },
  {
    agentId: 'data-analyst',
    agentName: '数据分析师',
    avatar: '📉',
    status: 'online',
    reliability: 86,
    avgResponseTime: 7,
    skills: [
      { name: '数据分析', proficiency: 95, taskCount: 15, avgQuality: 92, avgTime: 30 },
      { name: '数据可视化', proficiency: 90, taskCount: 12, avgQuality: 88, avgTime: 25 },
      { name: 'A/B测试', proficiency: 85, taskCount: 8, avgQuality: 82, avgTime: 20 },
      { name: 'BI报表', proficiency: 88, taskCount: 10, avgQuality: 85, avgTime: 35 },
      { name: '需求分析', proficiency: 70, taskCount: 5, avgQuality: 68, avgTime: 15 },
    ],
    workload: { agentId: 'data-analyst', activeTasks: 1, queuedTasks: 0, totalEstimatedMinutes: 25, utilizationRate: 40, lastActiveAt: new Date().toISOString() },
  },
  {
    agentId: 'qa-engineer',
    agentName: '测试工程师',
    avatar: '🔍',
    status: 'online',
    reliability: 88,
    avgResponseTime: 6,
    skills: [
      { name: '功能测试', proficiency: 95, taskCount: 25, avgQuality: 93, avgTime: 30 },
      { name: '自动化测试', proficiency: 88, taskCount: 15, avgQuality: 85, avgTime: 45 },
      { name: '性能测试', proficiency: 82, taskCount: 8, avgQuality: 80, avgTime: 40 },
      { name: 'Bug追踪', proficiency: 90, taskCount: 20, avgQuality: 88, avgTime: 15 },
      { name: '代码审查', proficiency: 75, taskCount: 10, avgQuality: 72, avgTime: 25 },
    ],
    workload: { agentId: 'qa-engineer', activeTasks: 2, queuedTasks: 0, totalEstimatedMinutes: 55, utilizationRate: 60, lastActiveAt: new Date().toISOString() },
  },
  {
    agentId: 'devops',
    agentName: 'DevOps',
    avatar: '🚀',
    status: 'online',
    reliability: 90,
    avgResponseTime: 4,
    skills: [
      { name: 'CI/CD', proficiency: 95, taskCount: 20, avgQuality: 92, avgTime: 20 },
      { name: '容器化', proficiency: 90, taskCount: 15, avgQuality: 88, avgTime: 30 },
      { name: '监控告警', proficiency: 88, taskCount: 12, avgQuality: 85, avgTime: 15 },
      { name: '自动化运维', proficiency: 85, taskCount: 10, avgQuality: 82, avgTime: 25 },
      { name: '系统架构', proficiency: 78, taskCount: 5, avgQuality: 75, avgTime: 35 },
    ],
    workload: { agentId: 'devops', activeTasks: 1, queuedTasks: 0, totalEstimatedMinutes: 15, utilizationRate: 30, lastActiveAt: new Date().toISOString() },
  },
]

function hasConfiguredAI(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const raw = window.localStorage.getItem('opc-os-ai-providers')
    if (!raw) return false
    const store = JSON.parse(raw) as { activeProviderId?: string | null; providers?: Record<string, { enabled?: boolean; apiKey?: string }> }
    const active = store.activeProviderId
    return Boolean(active && store.providers?.[active]?.apiKey && store.providers[active].enabled !== false)
  } catch {
    return false
  }
}

for (const agent of AGENT_CAPABILITIES) {
  agent.status = 'offline'
  agent.reliability = 0
  agent.avgResponseTime = 0
  agent.workload = {
    ...agent.workload,
    activeTasks: 0,
    queuedTasks: 0,
    totalEstimatedMinutes: 0,
    utilizationRate: 0,
  }
  agent.skills = agent.skills.map(skill => ({
    ...skill,
    taskCount: 0,
    avgQuality: 0,
  }))
}

function withProviderAvailability(agent: AgentCapability): AgentCapability {
  if (!hasConfiguredAI()) return { ...agent, status: 'offline' }
  return {
    ...agent,
    status: agent.workload.activeTasks > 0 ? agent.status : 'online',
    reliability: agent.reliability || 100,
  }
}

// ============ 读取接口 ============

export function getAllCapabilities(): AgentCapability[] {
  return AGENT_CAPABILITIES.map(withProviderAvailability)
}

export function getAgentCapability(agentId: string): AgentCapability | undefined {
  const agent = AGENT_CAPABILITIES.find(a => a.agentId === agentId)
  return agent ? withProviderAvailability(agent) : undefined
}

export function getOnlineAgents(): AgentCapability[] {
  return getAllCapabilities().filter(a => a.status !== 'offline')
}

export function getAgentsWithSkill(skillName: string): AgentCapability[] {
  return getAllCapabilities().filter(a =>
    a.status !== 'offline' && a.skills.some(s => s.name === skillName)
  )
}

// ============ 负载更新 ============

export function updateAgentLoad(agentId: string, delta: number): void {
  const agent = AGENT_CAPABILITIES.find(a => a.agentId === agentId)
  if (!agent) return
  agent.workload.activeTasks = Math.max(0, agent.workload.activeTasks + delta)
  agent.workload.utilizationRate = Math.min(100, Math.max(0,
    Math.round((agent.workload.activeTasks / 5) * 100) // 假设5个并行任务为满载
  ))
  if (agent.workload.activeTasks > 0) {
    agent.status = agent.workload.utilizationRate > 80 ? 'busy' : 'online'
  } else {
    agent.status = 'online'
  }
}

export function setAgentStatus(agentId: string, status: 'online' | 'busy' | 'offline'): void {
  const agent = AGENT_CAPABILITIES.find(a => a.agentId === agentId)
  if (agent) agent.status = status
}
