'use client'

import { useState } from 'react'
import Modal from './Modal'
import { createTask } from '@/lib/workspace-store'
import { isAIProviderConfigured } from '@/lib/dispatch/dispatcher'
import { createAndExecute } from '@/lib/dispatch/executor'

interface TaskFormProps {
  open: boolean
  onClose: () => void
}

const assignees = [
  { name: 'CEO 助理', avatar: '👔' },
  { name: '项目经理', avatar: '📊' },
  { name: '研究员', avatar: '🔬' },
  { name: '设计师', avatar: '🎨' },
  { name: '工程师', avatar: '⚙️' },
  { name: '内容运营', avatar: '✍️' },
  { name: '数据分析师', avatar: '📉' },
  { name: '客服专员', avatar: '💬' },
]

const presetTags = ['设计', '前端', '后端', '产品', '运营', '调研', '技术', '文档', '测试', '品牌', '数据', 'SEO']

export default function TaskForm({ open, onClose }: TaskFormProps) {
  const [title, setTitle] = useState('')
  const [assignee, setAssignee] = useState(assignees[0].name)
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium')
  const [dueDate, setDueDate] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [aiSuggest, setAiSuggest] = useState(false)

  const handleSubmit = () => {
    if (!title.trim()) return
    const taskData = { title: title.trim(), assignee, priority, dueDate, tags }
    createTask(taskData)
    onClose()

    if (isAIProviderConfigured()) {
      try {
        const dispatched = createAndExecute(taskData.title, `分派给: ${taskData.assignee}, 优先级: ${taskData.priority}`)
        const statuses = dispatched.subtasks.map(s => `${s.title}: ${s.status}(${s.assignedAgentId || '无'})`).join('\n')
        setTimeout(() => window.alert(`子任务状态:\n${statuses}`), 300)
      } catch (err) {
        setTimeout(() => window.alert('调度出错: ' + (err instanceof Error ? err.message : String(err))), 200)
      }
    }

    setTitle('')
    setAssignee(assignees[0].name)
    setPriority('medium')
    setDueDate('')
    setTags([])
  }

  const toggleTag = (tag: string) => {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  return (
    <Modal open={open} onClose={onClose} title="新建任务" subtitle="创建一个新任务并分派给 Agent">
      <div className="space-y-4">
        <div>
          <label className="text-xs text-dark-300 mb-1.5 block font-medium">任务标题</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="输入任务描述..." className="w-full px-3 py-2.5 bg-dark-800/60 border border-white/[0.06] rounded-xl text-sm text-dark-200 placeholder-dark-600 focus:outline-none focus:border-accent-purple/40 transition-colors" autoFocus />
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <div className={`w-9 h-5 rounded-full transition-colors relative ${aiSuggest ? 'bg-accent-purple' : 'bg-dark-600'}`} onClick={() => setAiSuggest(!aiSuggest)}>
            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${aiSuggest ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </div>
          <span className="text-xs text-dark-300">让 AI 自动拆解子任务和估算工时</span>
        </label>

        <div>
          <label className="text-xs text-dark-300 mb-1.5 block font-medium">分派给</label>
          <div className="grid grid-cols-4 gap-2">
            {assignees.map(a => (
              <button key={a.name} onClick={() => setAssignee(a.name)} className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs transition-all ${assignee === a.name ? 'bg-accent-purple/15 text-accent-purple border border-accent-purple/30' : 'bg-dark-800/40 text-dark-400 border border-white/[0.04] hover:border-white/[0.1]'}`}>
                <span>{a.avatar}</span><span className="truncate">{a.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-dark-300 mb-1.5 block font-medium">优先级</label>
          <div className="flex gap-2">
            {([
              { value: 'high' as const, label: '高', activeClass: 'bg-accent-red/15 text-accent-red border-accent-red/30' },
              { value: 'medium' as const, label: '中', activeClass: 'bg-accent-yellow/15 text-accent-yellow border-accent-yellow/30' },
              { value: 'low' as const, label: '低', activeClass: 'bg-accent-green/15 text-accent-green border-accent-green/30' },
            ]).map(p => (
              <button key={p.value} onClick={() => setPriority(p.value)} className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all border ${priority === p.value ? p.activeClass : 'bg-dark-800/40 text-dark-400 border-white/[0.04] hover:border-white/[0.1]'}`}>{p.label}</button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-dark-300 mb-1.5 block font-medium">截止日期</label>
          <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full px-3 py-2.5 bg-dark-800/60 border border-white/[0.06] rounded-xl text-sm text-dark-200 focus:outline-none focus:border-accent-purple/40 transition-colors" />
        </div>

        <div>
          <label className="text-xs text-dark-300 mb-1.5 block font-medium">标签</label>
          <div className="flex flex-wrap gap-1.5">
            {presetTags.map(tag => (
              <button key={tag} onClick={() => toggleTag(tag)} className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${tags.includes(tag) ? 'bg-accent-purple/20 text-accent-purple border border-accent-purple/30' : 'bg-dark-700/60 text-dark-500 border border-white/[0.04] hover:text-dark-300'}`}>{tag}</button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 text-xs font-medium text-dark-400 hover:text-dark-200 bg-dark-700/30 hover:bg-dark-700/50 rounded-xl transition-colors">取消</button>
          <button onClick={handleSubmit} disabled={!title.trim()} className="flex-1 py-2.5 text-xs font-medium text-accent-purple bg-accent-purple/15 hover:bg-accent-purple/25 border border-accent-purple/20 hover:border-accent-purple/30 rounded-xl transition-all disabled:opacity-40">创建任务</button>
        </div>
      </div>
    </Modal>
  )
}
