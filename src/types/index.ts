export type TaskStatus = 'completed' | 'in_progress' | 'pending' | 'blocked'
export type TaskPriority = 'high' | 'medium' | 'low'

export interface Task {
  id: string
  title: string
  assignee: string
  assigneeAvatar: string
  priority: TaskPriority
  status: TaskStatus
  dueDate: string
  tags: string[]
  progress: number
}

export interface Agent {
  id: string
  name: string
  role: string
  avatar: string
  status: 'online' | 'offline' | 'busy'
  activity: number
  tasksCompleted: number
  skills: string[]
  level: 'management' | 'execution' | 'professional' | 'support'
}

export interface Output {
  id: string
  title: string
  type: 'prd' | 'wireframe' | 'landing_page' | 'checklist' | 'dashboard' | 'report' | 'code'
  format: string
  createdAt: string
  createdBy: string
  size: string
  status: 'draft' | 'review' | 'approved' | 'published'
}

export interface MemoryEntry {
  id: string
  title: string
  category: 'decision' | 'sop' | 'knowledge' | 'customer' | 'lesson'
  content: string
  tags: string[]
  createdAt: string
  updatedAt: string
  relevance: number
}

export interface KPIData {
  label: string
  value: string
  subValue?: string
  trend?: 'up' | 'down' | 'flat'
  trendValue?: string
  icon: string
  color: string
}

export interface Discussion {
  id: string
  agent: string
  agentAvatar: string
  message: string
  time: string
  taskId?: string
}

export interface Suggestion {
  id: string
  type: 'hire' | 'upgrade' | 'service'
  title: string
  description: string
  icon: string
  action: string
}

// 优化建议
export type OptSuggestionCategory = 'performance' | 'ux' | 'feature' | 'bug' | 'architecture' | 'workflow'
export type OptSuggestionPriority = 'critical' | 'high' | 'medium' | 'low'
export type OptSuggestionStatus = 'new' | 'accepted' | 'implementing' | 'done' | 'dismissed'

export interface OptimizationSuggestion {
  id: string
  title: string
  description: string
  category: OptSuggestionCategory
  priority: OptSuggestionPriority
  status: OptSuggestionStatus
  source: string // 哪个 Agent 提出的
  taskId: string // 来自哪个任务
  subtaskId?: string
  proposedSolution: string
  impact: string // 预期影响
  effort: 'low' | 'medium' | 'high' // 实施难度
  createdAt: string
  updatedAt: string
}
