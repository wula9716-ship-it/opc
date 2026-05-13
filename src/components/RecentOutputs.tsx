'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { loadOutputs, onWorkspaceDataChanged } from '@/lib/workspace-store'
import { getFileIcon } from '@/lib/utils'
import type { Output } from '@/types'

export default function RecentOutputs() {
  const [outputs, setOutputs] = useState<Output[]>([])

  useEffect(() => {
    const refresh = () => setOutputs(loadOutputs())
    refresh()
    return onWorkspaceDataChanged(refresh)
  }, [])

  const recent = outputs.slice(0, 4)

  return (
    <div className="glass-card p-5 animate-fade-in stagger-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-dark-200">最近产出</h3>
        <Link href="/outputs" className="text-xs text-accent-purple hover:text-accent-purple/80 transition-colors font-medium">全部产出 →</Link>
      </div>
      {recent.length === 0 ? (
        <div className="py-10 text-center rounded-xl border border-dashed border-white/[0.1] bg-dark-900/60">
          <p className="text-sm text-dark-200">还没有产出</p>
          <p className="text-xs text-dark-400 mt-1">创建或导入产出后可点击查看。</p>
        </div>
      ) : (
      <div className="space-y-1.5">
        {recent.map((item) => (
          <Link
            href="/outputs"
            key={item.id}
            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.03] transition-all cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-dark-700/50 flex items-center justify-center text-lg flex-shrink-0">
              {getFileIcon(item.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-dark-200 truncate group-hover:text-white transition-colors">
                {item.title}
              </p>
              <p className="text-[10px] text-dark-500">
                {item.createdBy} · {item.format} · {item.size}
              </p>
            </div>
            <span className={`badge text-[10px] flex-shrink-0 ${
              item.status === 'published' ? 'bg-accent-green/20 text-accent-green' :
              item.status === 'approved' ? 'bg-accent-blue/20 text-accent-blue' :
              item.status === 'review' ? 'bg-accent-yellow/20 text-accent-yellow' :
              'bg-dark-600 text-dark-400'
            }`}>
              {item.status === 'published' ? '已发布' : item.status === 'approved' ? '已批准' : item.status === 'review' ? '审核中' : '草稿'}
            </span>
          </Link>
        ))}
      </div>
      )}
    </div>
  )
}
