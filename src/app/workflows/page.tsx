'use client'

import { useState } from 'react'

interface WorkflowTemplate {
  id: string
  name: string
  desc: string
  icon: string
  steps: { name: string; agent: string; agentAvatar: string; status: 'pending' | 'active' | 'done' }[]
}

const templates: WorkflowTemplate[] = [
  {
    id: '1', name: '产品发布流', desc: '从需求到上线的完整产品开发流程', icon: '🚀',
    steps: [
      { name: '需求分析', agent: 'CEO 助理', agentAvatar: '👔', status: 'pending' },
      { name: '竞品调研', agent: '研究员', agentAvatar: '🔬', status: 'pending' },
      { name: '撰写 PRD', agent: 'CEO 助理', agentAvatar: '👔', status: 'pending' },
      { name: 'UI 设计', agent: '设计师', agentAvatar: '🎨', status: 'pending' },
      { name: '技术开发', agent: '工程师', agentAvatar: '⚙️', status: 'pending' },
      { name: '测试验收', agent: '测试工程师', agentAvatar: '🔍', status: 'pending' },
      { name: '发布上线', agent: 'DevOps', agentAvatar: '🚀', status: 'pending' },
      { name: '复盘报告', agent: '项目经理', agentAvatar: '📊', status: 'pending' },
    ],
  },
  {
    id: '2', name: '内容生产流', desc: '从选题到发布的内容创作全流程', icon: '✍️',
    steps: [
      { name: '选题策划', agent: '内容运营', agentAvatar: '✍️', status: 'pending' },
      { name: '大纲撰写', agent: '内容运营', agentAvatar: '✍️', status: 'pending' },
      { name: '内容撰写', agent: '内容运营', agentAvatar: '✍️', status: 'pending' },
      { name: '审校优化', agent: 'CEO 助理', agentAvatar: '👔', status: 'pending' },
      { name: '排版发布', agent: '内容运营', agentAvatar: '✍️', status: 'pending' },
      { name: '数据追踪', agent: '数据分析师', agentAvatar: '📉', status: 'pending' },
    ],
  },
  {
    id: '3', name: '客户服务流', desc: '从接收问题到满意度跟踪', icon: '💬',
    steps: [
      { name: '问题收集', agent: '客服专员', agentAvatar: '💬', status: 'pending' },
      { name: '问题分类', agent: 'CEO 助理', agentAvatar: '👔', status: 'pending' },
      { name: '方案生成', agent: '工程师', agentAvatar: '⚙️', status: 'pending' },
      { name: '回复客户', agent: '客服专员', agentAvatar: '💬', status: 'pending' },
      { name: '满意度跟踪', agent: '数据分析师', agentAvatar: '📉', status: 'pending' },
    ],
  },
  {
    id: '4', name: '财务月度流', desc: '每月财务数据汇总和分析', icon: '📊',
    steps: [
      { name: '数据汇总', agent: '财务助理', agentAvatar: '🧮', status: 'pending' },
      { name: '报表生成', agent: '数据分析师', agentAvatar: '📉', status: 'pending' },
      { name: '预算分析', agent: '财务助理', agentAvatar: '🧮', status: 'pending' },
      { name: '建议输出', agent: 'CEO 助理', agentAvatar: '👔', status: 'pending' },
    ],
  },
  {
    id: '5', name: '竞品监控流', desc: '定期竞品扫描和策略建议', icon: '🔍',
    steps: [
      { name: '定期扫描', agent: '研究员', agentAvatar: '🔬', status: 'pending' },
      { name: '深度分析', agent: '研究员', agentAvatar: '🔬', status: 'pending' },
      { name: '差异报告', agent: '研究员', agentAvatar: '🔬', status: 'pending' },
      { name: '策略建议', agent: 'CEO 助理', agentAvatar: '👔', status: 'pending' },
    ],
  },
]

export default function WorkflowsPage() {
  const [myWorkflows, setMyWorkflows] = useState<WorkflowTemplate[]>([])
  const [runningWorkflow, setRunningWorkflow] = useState<string | null>(null)

  const startWorkflow = (template: WorkflowTemplate) => {
    const wf = { ...template, id: Date.now().toString(), steps: template.steps.map(s => ({ ...s, status: 'pending' as const })) }
    setMyWorkflows(prev => [...prev, wf])
  }

  const runWorkflow = (wfId: string) => {
    const wf = myWorkflows.find(w => w.id === wfId)
    if (!wf) return
    setRunningWorkflow(wfId)

    let step = 0
    const interval = setInterval(() => {
      setMyWorkflows(prev => prev.map(w => {
        if (w.id !== wfId) return w
        return {
          ...w,
          steps: w.steps.map((s, i) => ({
            ...s,
            status: i < step ? 'done' : i === step ? 'active' as const : 'pending' as const,
          })),
        }
      }))
      step++
      if (step > wf.steps.length) {
        clearInterval(interval)
        setRunningWorkflow(null)
        setMyWorkflows(prev => prev.map(w => {
          if (w.id !== wfId) return w
          return { ...w, steps: w.steps.map(s => ({ ...s, status: 'done' as const })) }
        }))
      }
    }, 2000)
  }

  return (
    <div className="space-y-5 max-w-[1600px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">工作流引擎</h1>
          <p className="text-sm text-dark-400 mt-1">把离散任务串成自动化流水线</p>
        </div>
      </div>

      {/* My workflows */}
      <div className="glass-card p-6">
        <h2 className="text-sm font-semibold text-dark-200 mb-4">我的工作流 {myWorkflows.length > 0 && <span className="text-dark-500 font-normal">({myWorkflows.length})</span>}</h2>
        {myWorkflows.length === 0 ? (
          <div className="text-center py-8">
            <span className="text-4xl">🔄</span>
            <p className="text-sm text-dark-400 mt-3">还没有创建工作流</p>
            <p className="text-xs text-dark-500 mt-1">从下方模板开始</p>
          </div>
        ) : (
          <div className="space-y-4">
            {myWorkflows.map(wf => {
              const doneCount = wf.steps.filter(s => s.status === 'done').length
              const isRunning = runningWorkflow === wf.id
              const isComplete = doneCount === wf.steps.length
              return (
                <div key={wf.id} className="p-4 bg-dark-800/40 rounded-xl border border-white/[0.06]">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{wf.icon}</span>
                      <div>
                        <h3 className="text-sm font-semibold text-dark-200">{wf.name}</h3>
                        <p className="text-[11px] text-dark-500">{doneCount}/{wf.steps.length} 步完成</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!isRunning && !isComplete && (
                        <button onClick={() => runWorkflow(wf.id)} className="px-3 py-1.5 text-xs font-medium text-accent-green hover:bg-accent-green/10 border border-accent-green/30 rounded-lg transition-colors">
                          ▶ 运行
                        </button>
                      )}
                      {isRunning && (
                        <span className="px-3 py-1.5 text-xs font-medium text-accent-blue bg-accent-blue/10 border border-accent-blue/30 rounded-lg animate-pulse-soft">
                          ⏳ 运行中...
                        </span>
                      )}
                      {isComplete && (
                        <span className="px-3 py-1.5 text-xs font-medium text-accent-green bg-accent-green/10 border border-accent-green/30 rounded-lg">
                          ✅ 完成
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Steps visualization */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
                    {wf.steps.map((step, i) => (
                      <div key={i} className="flex items-center flex-shrink-0">
                        <div className={`px-3 py-2.5 rounded-xl text-center min-w-[100px] transition-all border ${
                          step.status === 'done' ? 'bg-accent-green/10 border-accent-green/20' :
                          step.status === 'active' ? 'bg-accent-blue/10 border-accent-blue/30 animate-pulse' :
                          'bg-dark-700/30 border-white/[0.04]'
                        }`}>
                          <span className="text-sm block">{step.agentAvatar}</span>
                          <p className={`text-[10px] mt-1 font-medium ${
                            step.status === 'done' ? 'text-accent-green' :
                            step.status === 'active' ? 'text-accent-blue' :
                            'text-dark-500'
                          }`}>{step.name}</p>
                          <p className="text-[9px] text-dark-600">{step.agent}</p>
                        </div>
                        {i < wf.steps.length - 1 && (
                          <span className={`text-xs mx-1 ${step.status === 'done' ? 'text-accent-green' : 'text-dark-600'}`}>
                            →
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Templates */}
      <div>
        <h2 className="text-sm font-semibold text-dark-200 mb-4">推荐模板</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {templates.map((t, i) => (
            <div key={t.id} className={`glass-card-hover p-5 animate-fade-in stagger-${Math.min(i + 1, 5)}`}>
              <div className="flex items-start gap-3 mb-3">
                <span className="text-3xl">{t.icon}</span>
                <div>
                  <h3 className="text-sm font-semibold text-dark-200">{t.name}</h3>
                  <p className="text-[11px] text-dark-500 mt-0.5">{t.steps.length} 个步骤</p>
                </div>
              </div>
              <p className="text-xs text-dark-400 leading-relaxed mb-3">{t.desc}</p>

              {/* Steps preview */}
              <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1">
                {t.steps.map((step, j) => (
                  <div key={j} className="flex items-center flex-shrink-0">
                    <span className="text-[10px] px-2 py-1 bg-dark-700/50 text-dark-400 rounded-md border border-white/[0.03]">{step.name}</span>
                    {j < t.steps.length - 1 && <span className="text-dark-600 text-[10px] mx-0.5">→</span>}
                  </div>
                ))}
              </div>

              <button
                onClick={() => startWorkflow(t)}
                className="w-full py-2.5 text-xs font-medium text-accent-purple hover:text-accent-purple/80 bg-accent-purple/10 hover:bg-accent-purple/15 rounded-xl transition-colors border border-accent-purple/10 hover:border-accent-purple/20"
              >
                使用模板
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
