'use client'

import { useState } from 'react'
import Modal from './Modal'

interface MemoryFormProps {
  open: boolean
  onClose: () => void
  onSubmit?: (entry: { title: string; category: string; content: string; tags: string[] }) => void
}

const categories = [
  { value: 'decision', label: '决策记录', icon: '📌', desc: '重要的选择和理由' },
  { value: 'sop', label: '流程文档', icon: '📋', desc: '标准操作流程' },
  { value: 'knowledge', label: '知识库', icon: '📚', desc: '行业和产品知识' },
  { value: 'customer', label: '客户信息', icon: '👤', desc: '用户画像和反馈' },
  { value: 'lesson', label: '经验教训', icon: '💡', desc: '踩过的坑和收获' },
]

export default function MemoryForm({ open, onClose, onSubmit }: MemoryFormProps) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('decision')
  const [content, setContent] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])

  const addTag = () => {
    const t = tagInput.trim()
    if (t && !tags.includes(t)) {
      setTags([...tags, t])
      setTagInput('')
    }
  }

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) return
    onSubmit?.({ title: title.trim(), category, content: content.trim(), tags })
    setTitle('')
    setCategory('decision')
    setContent('')
    setTags([])
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="新增记忆条目" subtitle="沉淀知识、决策和经验供 Agent 检索" maxWidth="max-w-xl">
      <div className="space-y-4">
        <div>
          <label className="text-xs text-dark-300 mb-1.5 block font-medium">标题</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="简明扼要地描述这条记忆..."
            className="w-full px-3 py-2.5 bg-dark-800/60 border border-white/[0.06] rounded-xl text-sm text-dark-200 placeholder-dark-600 focus:outline-none focus:border-accent-purple/40 transition-colors"
            autoFocus
          />
        </div>

        <div>
          <label className="text-xs text-dark-300 mb-1.5 block font-medium">分类</label>
          <div className="grid grid-cols-5 gap-2">
            {categories.map(c => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={`p-2.5 rounded-xl text-center transition-all ${
                  category === c.value
                    ? 'bg-accent-purple/15 border border-accent-purple/30'
                    : 'bg-dark-800/40 border border-white/[0.04] hover:border-white/[0.1]'
                }`}
              >
                <span className="text-lg block">{c.icon}</span>
                <span className="text-[10px] text-dark-300 block mt-1">{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-dark-300 mb-1.5 block font-medium">内容</label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="详细描述决策背景、流程步骤、知识要点..."
            rows={5}
            className="w-full px-3 py-2.5 bg-dark-800/60 border border-white/[0.06] rounded-xl text-sm text-dark-200 placeholder-dark-600 focus:outline-none focus:border-accent-purple/40 transition-colors resize-none"
          />
        </div>

        <div>
          <label className="text-xs text-dark-300 mb-1.5 block font-medium">标签</label>
          <div className="flex items-center gap-2 mb-2">
            <input
              type="text"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
              placeholder="输入标签后回车"
              className="flex-1 px-3 py-2 bg-dark-800/60 border border-white/[0.06] rounded-lg text-xs text-dark-200 placeholder-dark-600 focus:outline-none focus:border-accent-purple/40 transition-colors"
            />
            <button onClick={addTag} className="px-3 py-2 text-xs text-dark-300 bg-dark-700/50 hover:bg-dark-700 rounded-lg transition-colors">添加</button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 bg-accent-purple/10 text-accent-purple rounded-md">
                  {tag}
                  <button onClick={() => setTags(tags.filter(t => t !== tag))} className="hover:text-white">×</button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 text-xs font-medium text-dark-400 hover:text-dark-200 bg-dark-700/30 hover:bg-dark-700/50 rounded-xl transition-colors">
            取消
          </button>
          <button onClick={handleSubmit} disabled={!title.trim() || !content.trim()} className="flex-1 py-2.5 text-xs font-medium text-accent-purple bg-accent-purple/15 hover:bg-accent-purple/25 border border-accent-purple/20 hover:border-accent-purple/30 rounded-xl transition-all disabled:opacity-40">
            保存记忆
          </button>
        </div>
      </div>
    </Modal>
  )
}
