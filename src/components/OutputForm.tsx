'use client'

import { useState } from 'react'
import Modal from './Modal'

interface OutputFormProps {
  open: boolean
  onClose: () => void
  onSubmit?: (output: { title: string; type: string; format: string }) => void
}

const outputTypes = [
  { value: 'prd', label: '产品需求文档', icon: '📄', format: 'Markdown' },
  { value: 'wireframe', label: '线框图 / 设计稿', icon: '🎨', format: 'Figma' },
  { value: 'landing_page', label: '落地页', icon: '🌐', format: 'HTML' },
  { value: 'report', label: '分析报告', icon: '📈', format: 'PDF' },
  { value: 'dashboard', label: '数据看板', icon: '📊', format: 'Dashboard' },
  { value: 'checklist', label: '清单 / 排期表', icon: '✅', format: 'Markdown' },
  { value: 'code', label: '代码 / SDK', icon: '💻', format: 'TypeScript' },
]

export default function OutputForm({ open, onClose, onSubmit }: OutputFormProps) {
  const [title, setTitle] = useState('')
  const [selectedType, setSelectedType] = useState(outputTypes[0])
  const [generateWithAI, setGenerateWithAI] = useState(false)

  const handleSubmit = () => {
    if (!title.trim()) return
    onSubmit?.({ title: title.trim(), type: selectedType.value, format: selectedType.format })
    setTitle('')
    setSelectedType(outputTypes[0])
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="新建产出" subtitle="创建一个新的交付物">
      <div className="space-y-4">
        <div>
          <label className="text-xs text-dark-300 mb-1.5 block font-medium">产出名称</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="输入产出名称..."
            className="w-full px-3 py-2.5 bg-dark-800/60 border border-white/[0.06] rounded-xl text-sm text-dark-200 placeholder-dark-600 focus:outline-none focus:border-accent-purple/40 transition-colors"
            autoFocus
          />
        </div>

        <div>
          <label className="text-xs text-dark-300 mb-1.5 block font-medium">产出类型</label>
          <div className="grid grid-cols-2 gap-2">
            {outputTypes.map(t => (
              <button
                key={t.value}
                onClick={() => setSelectedType(t)}
                className={`flex items-center gap-2.5 p-3 rounded-xl text-left transition-all ${
                  selectedType.value === t.value
                    ? 'bg-accent-purple/15 border border-accent-purple/30'
                    : 'bg-dark-800/40 border border-white/[0.04] hover:border-white/[0.1]'
                }`}
              >
                <span className="text-xl">{t.icon}</span>
                <div>
                  <p className="text-xs font-medium text-dark-200">{t.label}</p>
                  <p className="text-[10px] text-dark-500">{t.format}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <div className={`w-9 h-5 rounded-full transition-colors relative ${generateWithAI ? 'bg-accent-purple' : 'bg-dark-600'}`} onClick={() => setGenerateWithAI(!generateWithAI)}>
            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${generateWithAI ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </div>
          <span className="text-xs text-dark-300">由 AI 自动生成初稿</span>
        </label>

        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 text-xs font-medium text-dark-400 hover:text-dark-200 bg-dark-700/30 hover:bg-dark-700/50 rounded-xl transition-colors">
            取消
          </button>
          <button onClick={handleSubmit} disabled={!title.trim()} className="flex-1 py-2.5 text-xs font-medium text-accent-purple bg-accent-purple/15 hover:bg-accent-purple/25 border border-accent-purple/20 hover:border-accent-purple/30 rounded-xl transition-all disabled:opacity-40">
            创建产出
          </button>
        </div>
      </div>
    </Modal>
  )
}
