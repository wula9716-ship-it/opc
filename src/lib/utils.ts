import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function getStatusColor(status: string) {
  switch (status) {
    case 'completed': return 'text-accent-green'
    case 'in_progress': return 'text-accent-blue'
    case 'pending': return 'text-accent-yellow'
    case 'blocked': return 'text-accent-red'
    default: return 'text-dark-300'
  }
}

export function getStatusBg(status: string) {
  switch (status) {
    case 'completed': return 'bg-accent-green/20 text-accent-green'
    case 'in_progress': return 'bg-accent-blue/20 text-accent-blue'
    case 'pending': return 'bg-accent-yellow/20 text-accent-yellow'
    case 'blocked': return 'bg-accent-red/20 text-accent-red'
    default: return 'bg-dark-600 text-dark-300'
  }
}

export function getPriorityColor(priority: string) {
  switch (priority) {
    case 'high': return 'text-accent-red'
    case 'medium': return 'text-accent-yellow'
    case 'low': return 'text-accent-green'
    default: return 'text-dark-300'
  }
}

export function getAgentStatusColor(status: string) {
  switch (status) {
    case 'online': return 'bg-accent-green'
    case 'busy': return 'bg-accent-yellow'
    case 'offline': return 'bg-dark-500'
    default: return 'bg-dark-500'
  }
}

export function getFileIcon(type: string) {
  switch (type) {
    case 'prd': return '📄'
    case 'wireframe': return '🎨'
    case 'landing_page': return '🌐'
    case 'checklist': return '✅'
    case 'dashboard': return '📊'
    case 'report': return '📈'
    case 'code': return '💻'
    default: return '📁'
  }
}

export function getCategoryColor(category: string) {
  switch (category) {
    case 'decision': return 'bg-accent-purple/20 text-accent-purple'
    case 'sop': return 'bg-accent-blue/20 text-accent-blue'
    case 'knowledge': return 'bg-accent-cyan/20 text-accent-cyan'
    case 'customer': return 'bg-accent-pink/20 text-accent-pink'
    case 'lesson': return 'bg-accent-yellow/20 text-accent-yellow'
    default: return 'bg-dark-600 text-dark-300'
  }
}

export function getCategoryLabel(category: string) {
  switch (category) {
    case 'decision': return '决策记录'
    case 'sop': return '流程文档'
    case 'knowledge': return '知识库'
    case 'customer': return '客户信息'
    case 'lesson': return '经验教训'
    default: return category
  }
}
