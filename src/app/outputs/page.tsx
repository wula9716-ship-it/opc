'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createOutput, importOutputs, loadOutputs, onWorkspaceDataChanged, removeOutput } from '@/lib/workspace-store'
import { getFileIcon } from '@/lib/utils'
import OutputForm from '@/components/OutputForm'
import Modal from '@/components/Modal'
import { useToast } from '@/components/Toast'
import type { Output } from '@/types'

const typeFilters = [
  { label: '全部', value: 'all' },
  { label: '文档', value: 'prd' },
  { label: '设计', value: 'wireframe' },
  { label: '网页', value: 'landing_page' },
  { label: '清单', value: 'checklist' },
  { label: '数据', value: 'dashboard' },
  { label: '报告', value: 'report' },
  { label: '代码', value: 'code' },
]

const statusLabels: Record<string, string> = {
  draft: '草稿',
  review: '审核中',
  approved: '已批准',
  published: '已发布',
}

const statusColors: Record<string, string> = {
  draft: 'bg-dark-600/80 text-dark-100',
  review: 'bg-accent-yellow/20 text-accent-yellow',
  approved: 'bg-accent-blue/20 text-accent-blue',
  published: 'bg-accent-green/20 text-accent-green',
}

function isOutputArray(value: unknown): value is Output[] {
  return Array.isArray(value) && value.every(item => typeof item === 'object' && item !== null && 'title' in item && 'type' in item)
}

export default function OutputsPage() {
  const { toast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [typeFilter, setTypeFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [allOutputs, setAllOutputs] = useState<Output[]>([])
  const [selectedOutput, setSelectedOutput] = useState<Output | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const refresh = () => setAllOutputs(loadOutputs())

  useEffect(() => {
    refresh()
    return onWorkspaceDataChanged(refresh)
  }, [])

  const filtered = useMemo(
    () => (typeFilter === 'all' ? allOutputs : allOutputs.filter(output => output.type === typeFilter)),
    [allOutputs, typeFilter]
  )

  const selectedItems = useMemo(
    () => allOutputs.filter(item => selectedIds.includes(item.id)),
    [allOutputs, selectedIds]
  )

  async function handleImport(file: File | undefined) {
    if (!file) return
    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      if (!isOutputArray(parsed)) throw new Error('文件内容不是产出数组')
      const normalized = parsed.map((item, index) => ({
        id: item.id || `imported-output-${Date.now()}-${index}`,
        title: item.title,
        type: item.type,
        format: item.format || 'Unknown',
        content: item.content || '',
        createdAt: item.createdAt || new Date().toISOString().slice(0, 10),
        createdBy: item.createdBy || '导入',
        size: item.size || '-',
        status: item.status || 'draft',
      })) as Output[]
      importOutputs(normalized)
      refresh()
      toast('导入成功', `已导入 ${normalized.length} 个产出。`, 'success')
    } catch (error) {
      toast('导入失败', error instanceof Error ? error.message : '无法解析文件。', 'error')
    } finally {
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function deleteSelected() {
    if (!selectedOutput) return
    removeOutput(selectedOutput.id)
    setSelectedOutput(null)
    setSelectedIds(prev => prev.filter(id => id !== selectedOutput.id))
    refresh()
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]))
  }

  function selectAllCurrent() {
    setSelectedIds(filtered.map(item => item.id))
  }

  function clearSelection() {
    setSelectedIds([])
  }

  function batchDelete() {
    if (selectedIds.length === 0) return
    if (!window.confirm(`确定删除选中的 ${selectedIds.length} 个产出吗？`)) return
    selectedIds.forEach(id => removeOutput(id))
    setSelectedIds([])
    if (selectedOutput && selectedIds.includes(selectedOutput.id)) setSelectedOutput(null)
    refresh()
    toast('批量删除成功', `已删除 ${selectedIds.length} 个产出。`, 'success')
  }

  function exportJson(items: Output[], filename: string) {
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  function batchExport() {
    if (selectedItems.length === 0) return
    exportJson(selectedItems, `OPC-OS-产出-${new Date().toISOString().slice(0, 10)}.json`)
    toast('批量导出成功', `已导出 ${selectedItems.length} 个产出。`, 'success')
  }

  return (
    <div className="space-y-5 max-w-[1600px]">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-white">产出中心</h1>
          <p className="text-sm text-dark-300 mt-1">管理真实创建或导入的交付物。</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <input ref={inputRef} type="file" accept="application/json,.json" className="hidden" onChange={event => handleImport(event.target.files?.[0])} />
          <button onClick={() => inputRef.current?.click()} className="px-4 py-2 border border-white/[0.12] hover:border-white/[0.2] text-dark-100 text-xs rounded-xl transition-colors">
            导入 JSON
          </button>
          <button onClick={() => exportJson(filtered, `OPC-OS-全部产出-${new Date().toISOString().slice(0, 10)}.json`)} className="px-4 py-2 border border-accent-purple/30 text-accent-purple hover:bg-accent-purple/10 text-xs rounded-xl transition-colors">
            导出当前筛选
          </button>
          <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-accent-purple hover:bg-accent-purple/90 text-white text-xs font-medium rounded-xl transition-all">
            + 新建产出
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: '总产出', value: allOutputs.length, color: 'text-white' },
          { label: '已发布', value: allOutputs.filter(output => output.status === 'published').length, color: 'text-accent-green' },
          { label: '审核中', value: allOutputs.filter(output => output.status === 'review').length, color: 'text-accent-yellow' },
          { label: '草稿', value: allOutputs.filter(output => output.status === 'draft').length, color: 'text-dark-100' },
        ].map(item => (
          <div key={item.label} className="glass-card p-4 text-center">
            <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
            <p className="text-xs text-dark-300 mt-1">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {typeFilters.map(item => (
          <button key={item.value} onClick={() => setTypeFilter(item.value)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${typeFilter === item.value ? 'bg-accent-purple/25 text-white border border-accent-purple/40' : 'text-dark-300 hover:text-white border border-white/[0.08] hover:border-white/[0.16]'}`}>
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap glass-card p-3">
        <div className="text-xs text-dark-300">已选中 {selectedIds.length} / {filtered.length}</div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={selectAllCurrent} className="px-3 py-1.5 text-xs rounded-lg border border-white/[0.1] text-dark-200 hover:bg-white/[0.06]">全选当前筛选</button>
          <button onClick={clearSelection} className="px-3 py-1.5 text-xs rounded-lg border border-white/[0.1] text-dark-200 hover:bg-white/[0.06]">清空选择</button>
          <button onClick={batchExport} disabled={selectedIds.length === 0} className="px-3 py-1.5 text-xs rounded-lg border border-accent-purple/30 text-accent-purple disabled:opacity-40 hover:bg-accent-purple/10">批量导出</button>
          <button onClick={batchDelete} disabled={selectedIds.length === 0} className="px-3 py-1.5 text-xs rounded-lg border border-accent-red/30 text-accent-red disabled:opacity-40 hover:bg-accent-red/10">批量删除</button>
        </div>
      </div>

      {allOutputs.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <p className="text-base text-dark-100">还没有产出</p>
          <p className="text-sm text-dark-300 mt-2">可以新建一条产出记录，或导入 JSON。系统不会预置虚构文件。</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((item, i) => (
            <button key={item.id} onClick={() => setSelectedOutput(item)} className={`glass-card-hover p-5 text-left group animate-fade-in stagger-${Math.min(i + 1, 6)} ${selectedIds.includes(item.id) ? 'border-accent-purple/40 bg-accent-purple/[0.06]' : ''}`}>
              <div className="flex items-start gap-4">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(item.id)}
                  onClick={e => e.stopPropagation()}
                  onChange={() => toggleSelect(item.id)}
                  className="mt-1"
                />
                <div className="w-14 h-14 rounded-2xl bg-dark-700/80 flex items-center justify-center text-3xl flex-shrink-0 border border-white/[0.08]">
                  {getFileIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-dark-100 group-hover:text-white transition-colors truncate">{item.title}</h3>
                    <span className={`badge text-[10px] flex-shrink-0 ${statusColors[item.status]}`}>{statusLabels[item.status]}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="text-[11px] text-dark-300">{item.format}</span>
                    <span className="text-dark-400">·</span>
                    <span className="text-[11px] text-dark-300">{item.size}</span>
                    <span className="text-dark-400">·</span>
                    <span className="text-[11px] text-dark-300">{item.createdBy}</span>
                  </div>
                  <p className="text-[11px] text-dark-300 mt-1">创建于 {item.createdAt}</p>
                </div>
              </div>
            </button>
          ))}
          {filtered.length === 0 && <div className="glass-card p-10 text-center text-sm text-dark-300 lg:col-span-2">没有符合条件的产出</div>}
        </div>
      )}

      <OutputForm open={showForm} onClose={() => setShowForm(false)} onSubmit={(output) => { createOutput(output); refresh() }} />

      <Modal open={Boolean(selectedOutput)} onClose={() => setSelectedOutput(null)} title={selectedOutput?.title || '产出详情'} subtitle="真实产出记录">
        {selectedOutput && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-dark-800 rounded-lg"><p className="text-dark-300">类型</p><p className="text-dark-100 mt-1">{selectedOutput.type}</p></div>
              <div className="p-3 bg-dark-800 rounded-lg"><p className="text-dark-300">格式</p><p className="text-dark-100 mt-1">{selectedOutput.format}</p></div>
              <div className="p-3 bg-dark-800 rounded-lg"><p className="text-dark-300">创建人</p><p className="text-dark-100 mt-1">{selectedOutput.createdBy}</p></div>
              <div className="p-3 bg-dark-800 rounded-lg"><p className="text-dark-300">大小</p><p className="text-dark-100 mt-1">{selectedOutput.size}</p></div>
            </div>
            {selectedOutput.content && (
              <div className="p-4 bg-dark-900/60 rounded-xl border border-white/[0.06] max-h-[400px] overflow-y-auto">
                <p className="text-[10px] text-dark-400 mb-2">产出内容</p>
                <div className="text-xs text-dark-100 whitespace-pre-wrap leading-relaxed">{selectedOutput.content}</div>
              </div>
            )}
            <div className="flex justify-end">
              <button onClick={deleteSelected} className="px-3 py-2 text-xs text-accent-red border border-accent-red/40 hover:bg-accent-red/10 rounded-lg">删除</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
