'use client'

import { DispatchedTask, Subtask } from '@/lib/dispatch/types'
import { getAgentCapability } from '@/lib/dispatch/agent-registry'

const STATUS_STYLES: Record<string, { bg: string; border: string; text: string; dot: string; label: string }> = {
  queued: { bg: 'bg-dark-700/40', border: 'border-white/[0.06]', text: 'text-dark-500', dot: 'bg-dark-500', label: '排队中' },
  assigned: { bg: 'bg-accent-blue/5', border: 'border-accent-blue/20', text: 'text-accent-blue', dot: 'bg-accent-blue', label: '已分配' },
  running: { bg: 'bg-accent-cyan/5', border: 'border-accent-cyan/30', text: 'text-accent-cyan', dot: 'bg-accent-cyan animate-pulse', label: '执行中' },
  blocked: { bg: 'bg-accent-red/5', border: 'border-accent-red/20', text: 'text-accent-red', dot: 'bg-accent-red', label: '已阻塞' },
  completed: { bg: 'bg-accent-green/5', border: 'border-accent-green/20', text: 'text-accent-green', dot: 'bg-accent-green', label: '已完成' },
  failed: { bg: 'bg-accent-red/5', border: 'border-accent-red/20', text: 'text-accent-red', dot: 'bg-accent-red', label: '失败' },
}

function SubtaskNode({ subtask, onClick }: { subtask: Subtask; onClick?: () => void }) {
  const style = STATUS_STYLES[subtask.status] ?? STATUS_STYLES.queued
  const agent = subtask.assignedAgentId ? getAgentCapability(subtask.assignedAgentId) : null

  return (
    <div
      onClick={onClick}
      className={`p-3 rounded-xl border ${style.bg} ${style.border} cursor-pointer hover:scale-[1.02] transition-all min-w-[160px] max-w-[200px]`}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <div className={`w-2 h-2 rounded-full ${style.dot}`} />
        <span className={`text-[10px] font-medium ${style.text}`}>{style.label}</span>
      </div>
      <p className="text-xs font-semibold text-dark-200 mb-1 line-clamp-1">{subtask.title}</p>
      <p className="text-[10px] text-dark-500 line-clamp-1 mb-2">{subtask.description}</p>
      <div className="flex items-center justify-between">
        {agent ? (
          <div className="flex items-center gap-1">
            <span className="text-sm">{agent.avatar}</span>
            <span className="text-[10px] text-dark-400">{agent.agentName}</span>
          </div>
        ) : (
          <span className="text-[10px] text-dark-600">未分配</span>
        )}
        <span className="text-[10px] text-dark-600">~{subtask.estimatedMinutes}min</span>
      </div>
    </div>
  )
}

export default function TaskDAG({ task, onSelectSubtask }: { task: DispatchedTask; onSelectSubtask?: (subtask: Subtask) => void }) {
  // 按层级排列子任务（拓扑排序）
  const layers: Subtask[][] = []
  const visited = new Set<string>()
  const subtaskMap = new Map(task.subtasks.map(s => [s.id, s]))

  function getLayer(subtask: Subtask): number {
    if (visited.has(subtask.id)) {
      // 已经访问过，返回它所在的层
      for (let i = 0; i < layers.length; i++) {
        if (layers[i].some(s => s.id === subtask.id)) return i
      }
      return 0
    }
    visited.add(subtask.id)

    if (subtask.dependsOn.length === 0) return 0

    const maxDepLayer = Math.max(
      ...subtask.dependsOn.map(depId => {
        const dep = subtaskMap.get(depId)
        return dep ? getLayer(dep) : 0
      })
    )
    return maxDepLayer + 1
  }

  // 计算每个子任务的层
  const subtaskLayers = task.subtasks.map(s => ({ subtask: s, layer: getLayer(s) }))
  const maxLayer = Math.max(...subtaskLayers.map(s => s.layer), 0)

  // 按层分组
  for (let i = 0; i <= maxLayer; i++) {
    layers.push(subtaskLayers.filter(s => s.layer === i).map(s => s.subtask))
  }

  const totalEstimated = task.subtasks.reduce((sum, s) => sum + s.estimatedMinutes, 0)
  const completedCount = task.subtasks.filter(s => s.status === 'completed').length
  const runningCount = task.subtasks.filter(s => s.status === 'running').length

  return (
    <div className="glass-card p-5">
      {/* Task header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-dark-200">{task.title}</h3>
          <p className="text-[11px] text-dark-500 mt-0.5">{task.description}</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-dark-400">{completedCount}/{task.subtasks.length} 完成</span>
          {runningCount > 0 && <span className="text-accent-cyan">{runningCount} 执行中</span>}
          <span className="text-dark-500">预估 {totalEstimated}min</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-5">
        <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent-purple to-accent-cyan rounded-full transition-all duration-700"
            style={{ width: `${task.progress}%` }}
          />
        </div>
      </div>

      {/* DAG visualization */}
      <div className="overflow-x-auto pb-2">
        <div className="flex items-start gap-3 min-w-fit">
          {layers.map((layer, layerIdx) => (
            <div key={layerIdx} className="flex flex-col gap-3">
              {/* Layer label */}
              <div className="text-[10px] text-dark-600 text-center mb-1">
                {layerIdx === 0 ? '起始' : layerIdx === layers.length - 1 ? '收尾' : `阶段 ${layerIdx}`}
              </div>
              {layer.map(subtask => (
                <div key={subtask.id} className="relative">
                  <SubtaskNode
                    subtask={subtask}
                    onClick={() => onSelectSubtask?.(subtask)}
                  />
                </div>
              ))}
              {/* Arrow to next layer */}
              {layerIdx < layers.length - 1 && (
                <div className="flex items-center justify-center text-dark-600 text-lg self-center mt-2">
                  →
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Dependency lines note */}
      <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center gap-4">
        <span className="text-[10px] text-dark-600">状态：</span>
        {Object.entries(STATUS_STYLES).filter(([k]) => k !== 'failed').map(([key, val]) => (
          <div key={key} className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${val.dot.replace('animate-pulse', '')}`} />
            <span className="text-[10px] text-dark-500">{val.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
