import type { MemoryEntry, Output, Task, TaskPriority } from '@/types'

const TASKS_KEY = 'opc-os-user-tasks'
const OUTPUTS_KEY = 'opc-os-user-outputs'
const MEMORY_KEY = 'opc-os-user-memory'
const SETTINGS_KEY = 'opc-os-settings'
const DATA_CHANGED_EVENT = 'opc-os-data-changed'

export interface UserSettings {
  profileName: string
  profileRole: string
  monthlyBudget: number
  budgetLimitAction: 'notify' | 'downgrade' | 'pause'
  freeQuotaAction: 'switch_free' | 'use_paid' | 'pause'
}

export const DEFAULT_SETTINGS: UserSettings = {
  profileName: '老板',
  profileRole: '创始人 / CEO',
  monthlyBudget: 0,
  budgetLimitAction: 'notify',
  freeQuotaAction: 'switch_free',
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify(value))
  window.dispatchEvent(new CustomEvent(DATA_CHANGED_EVENT, { detail: { key } }))
}

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function avatarForAssignee(name: string): string {
  const map: Record<string, string> = {
    'CEO 助理': '👔',
    '项目经理': '📊',
    '研究员': '🔬',
    '设计师': '🎨',
    '工程师': '⚙️',
    '内容运营': '✍️',
    '数据分析师': '📉',
    '客服专员': '💬',
    '法务顾问': '⚖️',
    '财务助理': '🧮',
    '测试工程师': '🔍',
    DevOps: '🚀',
  }
  return map[name] ?? '👤'
}

export function onWorkspaceDataChanged(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(DATA_CHANGED_EVENT, callback)
  window.addEventListener('storage', callback)
  return () => {
    window.removeEventListener(DATA_CHANGED_EVENT, callback)
    window.removeEventListener('storage', callback)
  }
}

export function loadTasks(): Task[] {
  return readJson<Task[]>(TASKS_KEY, [])
}

export function saveTasks(tasks: Task[]): void {
  writeJson(TASKS_KEY, tasks)
}

export function createTask(input: {
  title: string
  assignee?: string
  priority?: string
  dueDate?: string
  tags?: string[]
}): Task {
  const task: Task = {
    id: makeId('task'),
    title: input.title,
    assignee: input.assignee || '未分派',
    assigneeAvatar: input.assignee ? avatarForAssignee(input.assignee) : '👤',
    priority: (input.priority || 'medium') as TaskPriority,
    status: 'pending',
    dueDate: input.dueDate || '',
    tags: input.tags ?? [],
    progress: 0,
  }
  saveTasks([task, ...loadTasks()])
  return task
}

export function updateTask(updated: Task): void {
  saveTasks(loadTasks().map(task => task.id === updated.id ? updated : task))
}

export function removeTask(id: string): void {
  saveTasks(loadTasks().filter(task => task.id !== id))
}

export function loadOutputs(): Output[] {
  return readJson<Output[]>(OUTPUTS_KEY, [])
}

export function saveOutputs(outputs: Output[]): void {
  writeJson(OUTPUTS_KEY, outputs)
}

export function createOutput(input: { title: string; type: string; format: string }): Output {
  const output: Output = {
    id: makeId('output'),
    title: input.title,
    type: input.type as Output['type'],
    format: input.format,
    createdAt: today(),
    createdBy: '手动创建',
    size: '-',
    status: 'draft',
  }
  saveOutputs([output, ...loadOutputs()])
  return output
}

export function importOutputs(outputs: Output[]): void {
  saveOutputs([...outputs, ...loadOutputs()])
}

export function removeOutput(id: string): void {
  saveOutputs(loadOutputs().filter(output => output.id !== id))
}

export function loadMemoryEntries(): MemoryEntry[] {
  return readJson<MemoryEntry[]>(MEMORY_KEY, [])
}

export function saveMemoryEntries(entries: MemoryEntry[]): void {
  writeJson(MEMORY_KEY, entries)
}

export function createMemoryEntry(input: { title: string; category: string; content: string; tags: string[] }): MemoryEntry {
  const entry: MemoryEntry = {
    id: makeId('memory'),
    title: input.title,
    category: input.category as MemoryEntry['category'],
    content: input.content,
    tags: input.tags,
    createdAt: today(),
    updatedAt: today(),
    relevance: 0,
  }
  saveMemoryEntries([entry, ...loadMemoryEntries()])
  return entry
}

export function removeMemoryEntry(id: string): void {
  saveMemoryEntries(loadMemoryEntries().filter(entry => entry.id !== id))
}

export function loadSettings(): UserSettings {
  return { ...DEFAULT_SETTINGS, ...readJson<Partial<UserSettings>>(SETTINGS_KEY, {}) }
}

export function saveSettings(settings: UserSettings): void {
  writeJson(SETTINGS_KEY, settings)
}

export function resetWorkspaceData(): void {
  saveTasks([])
  saveOutputs([])
  saveMemoryEntries([])
}
