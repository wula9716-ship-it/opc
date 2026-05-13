/**
 * Agent 自动分派系统 — 类型定义
 */

// ============ 任务相关 ============

export type SubtaskStatus = 'queued' | 'assigned' | 'running' | 'blocked' | 'completed' | 'failed'
export type DispatchStrategy = 'skill_match' | 'round_robin' | 'least_load' | 'manual'

export interface SkillRequirement {
  skill: string           // 所需技能标签
  minProficiency: number  // 最低熟练度 0-100
  weight: number          // 权重，用于加权评分
}

export interface Subtask {
  id: string
  parentTaskId: string    // 归属的顶层任务
  title: string
  description: string
  requiredSkills: SkillRequirement[]
  assignedAgentId: string | null
  status: SubtaskStatus
  dependsOn: string[]     // 依赖的子任务 ID（前置完成才能开始）
  blocks: string[]        // 被本任务阻塞的子任务 ID（反向引用）
  priority: 'high' | 'medium' | 'low'
  estimatedMinutes: number
  actualMinutes: number | null
  result: string | null   // Agent 执行结果
  resultArtifacts: string[] // 产出物 ID 列表
  startedAt: string | null
  completedAt: string | null
  retryCount: number
  maxRetries: number
  handoffFrom: string | null // 从哪个 Agent 接手的
  handoffTo: string | null   // 交接给哪个 Agent
}

export interface DispatchedTask {
  id: string
  title: string
  description: string
  createdBy: 'user' | 'agent'
  creatorAgentId: string | null
  strategy: DispatchStrategy
  subtasks: Subtask[]
  status: 'planning' | 'dispatching' | 'executing' | 'completed' | 'failed'
  progress: number        // 0-100
  createdAt: string
  updatedAt: string
  completedAt: string | null
}

// ============ Agent 能力相关 ============

export interface AgentSkill {
  name: string
  proficiency: number     // 0-100 熟练度
  taskCount: number       // 用这个技能完成的任务数
  avgQuality: number      // 平均质量评分 0-100
  avgTime: number         // 平均完成时间（分钟）
}

export interface AgentWorkload {
  agentId: string
  activeTasks: number
  queuedTasks: number
  totalEstimatedMinutes: number
  utilizationRate: number  // 0-100, 负载率
  lastActiveAt: string
}

export interface AgentCapability {
  agentId: string
  agentName: string
  avatar: string
  status: 'online' | 'busy' | 'offline'
  skills: AgentSkill[]
  workload: AgentWorkload
  reliability: number      // 0-100, 历史完成率
  avgResponseTime: number  // 平均响应时间（秒）
}

// ============ 调度决策相关 ============

export interface MatchScore {
  agentId: string
  agentName: string
  totalScore: number       // 综合得分 0-100
  skillScore: number       // 技能匹配分
  loadScore: number        // 负载分（越空闲越高）
  reliabilityScore: number // 可靠性分
  reasons: string[]        // 推荐理由
}

export interface DispatchDecision {
  subtaskId: string
  candidates: MatchScore[]
  selected: MatchScore
  strategy: DispatchStrategy
  timestamp: string
}

// ============ 消息相关 ============

export type MessageType = 'task_assigned' | 'task_started' | 'task_progress' | 'task_completed' | 'task_failed' | 'handoff_request' | 'handoff_accepted' | 'question' | 'answer' | 'info'

export interface AgentMessage {
  id: string
  from: string            // agent ID
  to: string              // agent ID or 'all'
  type: MessageType
  taskId: string
  subtaskId: string | null
  content: string
  metadata: Record<string, unknown>
  timestamp: string
  read: boolean
}

// ============ 调度事件日志 ============

export type EventType = 'task_created' | 'task_decomposed' | 'subtask_assigned' | 'subtask_started' | 'subtask_completed' | 'subtask_failed' | 'subtask_retried' | 'handoff' | 'cascade_triggered' | 'task_completed'

export interface DispatchEvent {
  id: string
  type: EventType
  taskId: string
  subtaskId: string | null
  agentId: string | null
  message: string
  timestamp: string
  metadata: Record<string, unknown>
}
