'use client'

import { useEffect, useState, useCallback } from 'react'
import { PROVIDER_REGISTRY, getFreeModels, getProvider } from '@/lib/ai-providers'
import { createClient } from '@/lib/ai-providers/client'
import type { AIStore } from '@/lib/ai-providers/store'
import { DEFAULT_SETTINGS, loadSettings, saveSettings, resetWorkspaceData, type UserSettings } from '@/lib/workspace-store'
import { useToast } from '@/components/Toast'

const STORAGE_KEY = 'opc-os-ai-providers'
const DEFAULT_STORE: AIStore = { providers: {}, activeProviderId: null, defaultForTasks: {}, agentModels: {} }

type TabType = 'providers' | 'agents' | 'general' | 'budget' | 'danger'

const AGENT_LIST = [
  { id: 'ceo-assistant', name: 'CEO 助理', avatar: '👔' },
  { id: 'project-manager', name: '项目经理', avatar: '📊' },
  { id: 'researcher', name: '研究员', avatar: '🔬' },
  { id: 'designer', name: '设计师', avatar: '🎨' },
  { id: 'engineer', name: '工程师', avatar: '⚙️' },
  { id: 'content-operator', name: '内容运营', avatar: '✍️' },
  { id: 'data-analyst', name: '数据分析师', avatar: '📉' },
  { id: 'qa-engineer', name: '测试工程师', avatar: '🔍' },
  { id: 'devops', name: 'DevOps', avatar: '🚀' },
]

function loadStore(): AIStore {
  if (typeof window === 'undefined') return DEFAULT_STORE
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_STORE
    return { ...DEFAULT_STORE, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_STORE
  }
}

function saveStore(store: AIStore) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  window.dispatchEvent(new CustomEvent('opc-os-ai-provider-changed'))
}

function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, '')
}

export default function SettingsPage() {
  const { toast } = useToast()
  const [tab, setTab] = useState<TabType>('providers')
  const [store, setStore] = useState<AIStore>(DEFAULT_STORE)
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS)
  const [setupProvider, setSetupProvider] = useState<string | null>(null)
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [baseUrlInput, setBaseUrlInput] = useState('')
  const [selectedModel, setSelectedModel] = useState('')
  const [manualModelInput, setManualModelInput] = useState('')
  const [useManualModel, setUseManualModel] = useState(false)
  const [customNameInput, setCustomNameInput] = useState('')
  const [testResult, setTestResult] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [testMessage, setTestMessage] = useState('')
  const [regionFilter, setRegionFilter] = useState<'all' | 'china' | 'global'>('all')
  const [mounted, setMounted] = useState(false)
  const [fetchedModels, setFetchedModels] = useState<string[]>([])
  const [fetchingModels, setFetchingModels] = useState(false)

  useEffect(() => {
    setMounted(true)
    setStore(loadStore())
    setSettings(loadSettings())
  }, [])

  const configuredIds = Object.keys(store.providers)
  const providerToSetup = setupProvider ? getProvider(setupProvider) : null
  const freeModels = getFreeModels()
  const filteredProviders = regionFilter === 'all'
    ? PROVIDER_REGISTRY.filter(p => p.id !== 'custom')
    : PROVIDER_REGISTRY.filter(p => p.id !== 'custom' && (p.region === regionFilter || p.region === 'both'))

  const getDisplayModel = useCallback(() => {
    if (useManualModel) return manualModelInput.trim()
    return selectedModel
  }, [useManualModel, manualModelInput, selectedModel])

  function openSetup(id: string, model?: string) {
    const provider = getProvider(id)
    if (!provider) return
    setSetupProvider(id)
    setSelectedModel(model || provider.defaultModel)
    setManualModelInput(model || '')
    setUseManualModel(false)
    setBaseUrlInput(provider.baseUrl)
    setApiKeyInput('')
    setCustomNameInput('')
    setTestResult('idle')
    setTestMessage('')
    setFetchedModels([])
  }

  function openCustomSetup() {
    setSetupProvider('custom')
    setSelectedModel('')
    setManualModelInput('')
    setUseManualModel(true)
    setBaseUrlInput('')
    setApiKeyInput('')
    setCustomNameInput('')
    setTestResult('idle')
    setTestMessage('')
    setFetchedModels([])
  }

  // 通过 /models 端点自动拉取可用模型
  async function fetchModels() {
    const baseUrl = normalizeBaseUrl(baseUrlInput)
    if (!baseUrl || !apiKeyInput.trim()) {
      toast('需要 Base URL 和 Key', '填写后才能拉取模型列表。', 'warning')
      return
    }
    setFetchingModels(true)
    setFetchedModels([])
    try {
      const res = await fetch(`${baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${apiKeyInput.trim()}` },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const ids: string[] = (data.data || data.models || []).map((m: { id: string }) => m.id).filter(Boolean)
      if (ids.length === 0) {
        toast('未获取到模型', 'API 返回了空列表，可能需要手动输入模型 ID。', 'warning')
      } else {
        setFetchedModels(ids)
        toast('模型列表已获取', `发现 ${ids.length} 个可用模型，点击选择。`, 'success')
      }
    } catch (err) {
      toast('拉取失败', err instanceof Error ? err.message : '无法获取模型列表，请手动输入。', 'error')
    } finally {
      setFetchingModels(false)
    }
  }

  function handleAdd() {
    if (!setupProvider || !apiKeyInput.trim()) return
    const model = getDisplayModel()
    if (!model) {
      toast('请选择或输入模型', '需要指定一个模型 ID 才能接入。', 'warning')
      return
    }

    if (setupProvider === 'custom') {
      // 自定义平台：生成唯一 ID
      const customId = `custom-${Date.now()}`
      const customName = customNameInput.trim() || `自定义平台`
      const baseUrl = normalizeBaseUrl(baseUrlInput)
      if (!baseUrl) {
        toast('需要 Base URL', '自定义平台必须填写 API 地址。', 'warning')
        return
      }

      // 动态注册到 registry
      const { registerCustomProvider } = require('@/lib/ai-providers/registry')
      registerCustomProvider({
        id: customId,
        name: customName,
        icon: '🔧',
        description: `自定义 OpenAI 兼容平台 (${baseUrl})`,
        baseUrl,
        apiKeyPlaceholder: 'sk-...',
        apiKeyHeader: 'Authorization: Bearer {key}',
        compatible: 'openai',
        docsUrl: '',
        defaultModel: model,
        region: 'both',
        features: { streaming: true, functionCalling: false, vision: false, maxContextWindow: 128000 },
        models: [{ id: model, name: model, contextWindow: 128000, maxOutput: 4096, pricing: { input: 0, output: 0 }, capabilities: ['chat', 'code'] }],
      })

      const newStore = { ...store, providers: { ...store.providers } }
      newStore.providers[customId] = {
        providerId: customId,
        apiKey: apiKeyInput.trim(),
        selectedModel: model,
        baseUrl,
        enabled: true,
        addedAt: new Date().toISOString(),
      }
      if (!newStore.activeProviderId) newStore.activeProviderId = customId
      saveStore(newStore)
      setStore(newStore)
      setSetupProvider(null)
      toast('自定义平台已接入', `${customName} (${model}) 已保存。`, 'success')
    } else {
      // 内置平台
      const provider = getProvider(setupProvider)
      if (!provider) return
      const newStore = { ...store, providers: { ...store.providers } }
      newStore.providers[setupProvider] = {
        providerId: setupProvider,
        apiKey: apiKeyInput.trim(),
        selectedModel: model,
        baseUrl: normalizeBaseUrl(baseUrlInput || provider.baseUrl),
        enabled: true,
        addedAt: new Date().toISOString(),
      }
      if (!newStore.activeProviderId) newStore.activeProviderId = setupProvider
      saveStore(newStore)
      setStore(newStore)
      setSetupProvider(null)
      toast('AI 平台已接入', `${provider.name} (${model}) 已保存。`, 'success')
    }
  }

  async function handleTestApi() {
    if (!setupProvider || !apiKeyInput.trim()) return
    const model = getDisplayModel()
    if (!model) return
    const baseUrl = normalizeBaseUrl(baseUrlInput || (setupProvider !== 'custom' ? getProvider(setupProvider)?.baseUrl || '' : ''))
    if (!baseUrl) return

    setTestResult('testing')
    setTestMessage('正在发送最小请求验证连接...')
    try {
      const testId = setupProvider === 'custom' ? 'openai' : setupProvider
      const client = createClient(testId, apiKeyInput.trim(), baseUrl)
      await client.chat({
        model,
        messages: [{ role: 'user', content: 'hi' }],
        maxTokens: 1,
        temperature: 0,
      })
      setTestResult('success')
      setTestMessage('连接成功，Base URL、API Key 和模型均可用。')
    } catch (error) {
      setTestResult('error')
      setTestMessage(error instanceof Error ? error.message : '连接失败，请检查配置。')
    }
  }

  function handleRemove(id: string) {
    const newStore = { ...store, providers: { ...store.providers } }
    delete newStore.providers[id]
    if (newStore.activeProviderId === id) newStore.activeProviderId = Object.keys(newStore.providers)[0] ?? null
    saveStore(newStore)
    setStore(newStore)
    toast('已移除平台', '相关配置已删除。', 'info')
  }

  function handleSetActive(id: string) {
    const newStore = { ...store, activeProviderId: id }
    saveStore(newStore)
    setStore(newStore)
  }

  function handleToggle(id: string) {
    const newStore = { ...store, providers: { ...store.providers } }
    if (newStore.providers[id]) newStore.providers[id] = { ...newStore.providers[id], enabled: !newStore.providers[id].enabled }
    saveStore(newStore)
    setStore(newStore)
  }

  function handleInlineModelChange(providerId: string, modelId: string) {
    const newStore = { ...store, providers: { ...store.providers } }
    if (newStore.providers[providerId]) newStore.providers[providerId] = { ...newStore.providers[providerId], selectedModel: modelId }
    saveStore(newStore)
    setStore(newStore)
  }

  function handleBaseUrlChange(providerId: string, baseUrl: string) {
    const newStore = { ...store, providers: { ...store.providers } }
    if (newStore.providers[providerId]) newStore.providers[providerId] = { ...newStore.providers[providerId], baseUrl: normalizeBaseUrl(baseUrl) }
    saveStore(newStore)
    setStore(newStore)
  }

  function handleAgentModelChange(agentId: string, providerId: string, modelId: string) {
    const newStore = { ...store, agentModels: { ...store.agentModels } }
    if (!providerId) {
      delete newStore.agentModels[agentId]
    } else {
      newStore.agentModels[agentId] = { providerId, modelId }
    }
    saveStore(newStore)
    setStore(newStore)
  }

  function handleSaveSettings() {
    saveSettings(settings)
    setSettings(loadSettings())
    toast('设置已保存', '通用配置已写入本地。', 'success')
  }

  function handleClearProviders() {
    if (!window.confirm('确定移除所有 AI 平台配置吗？')) return
    saveStore(DEFAULT_STORE)
    setStore(DEFAULT_STORE)
    toast('AI 配置已清空', '所有已保存的平台配置都已移除。', 'warning')
  }

  function handleResetWorkspace() {
    if (!window.confirm('确定清空任务、产出和记忆库吗？此操作不可撤销。')) return
    resetWorkspaceData()
    toast('工作区数据已重置', '任务、产出和记忆库已清空。', 'warning')
  }

  if (!mounted) return <div className="animate-pulse"><div className="h-8 bg-dark-800 rounded w-48 mb-4" /></div>

  const providerOptions = configuredIds.map(id => {
    const config = getProvider(id)
    const inst = store.providers[id]
    return config && inst ? { id, name: config.name, icon: config.icon, model: inst.selectedModel } : null
  }).filter(Boolean)

  return (
    <div className="space-y-5 max-w-[1100px]">
      <div>
        <h1 className="text-xl font-bold text-white">设置</h1>
        <p className="text-sm text-dark-300 mt-1">接入 AI 平台，绑定 Agent 模型，管理系统配置。</p>
      </div>

      <div className="flex gap-1 p-1 bg-dark-800 rounded-xl border border-white/[0.08] w-fit flex-wrap">
        {[
          { key: 'providers' as const, label: 'AI 平台', count: configuredIds.length },
          { key: 'agents' as const, label: 'Agent 模型' },
          { key: 'general' as const, label: '通用' },
          { key: 'budget' as const, label: '预算' },
          { key: 'danger' as const, label: '危险区域' },
        ].map(item => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${tab === item.key ? 'bg-accent-purple/25 text-white' : 'text-dark-300 hover:text-white'}`}
          >
            {item.label}
            {item.count !== undefined && item.count > 0 && <span className="ml-1.5 text-[10px] bg-accent-green/20 text-accent-green px-1.5 py-0.5 rounded-full">{item.count}</span>}
          </button>
        ))}
      </div>

      {/* ==================== AI 平台接入 ==================== */}
      {tab === 'providers' && (
        <div className="space-y-5">
          {/* 已接入列表 */}
          {configuredIds.length > 0 && (
            <div className="glass-card p-5">
              <h2 className="text-sm font-semibold text-dark-100 mb-4">已接入平台</h2>
              <div className="space-y-3">
                {configuredIds.map(id => {
                  const config = getProvider(id)
                  const inst = store.providers[id]
                  if (!config || !inst) return null
                  const isActive = store.activeProviderId === id
                  const isCustom = id.startsWith('custom-')
                  return (
                    <div key={id} className={`p-4 rounded-xl border ${isActive ? 'border-accent-purple/50 bg-accent-purple/[0.08]' : 'border-white/[0.08] bg-dark-800/80'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-2xl">{config.icon}</span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-dark-100">{config.name}</span>
                              {isActive && <span className="badge bg-accent-purple/25 text-accent-purple text-[10px]">默认</span>}
                              {!inst.enabled && <span className="badge bg-dark-600 text-dark-300 text-[10px]">已禁用</span>}
                            </div>
                            <p className="text-[11px] text-dark-300 mt-1 truncate">模型: {inst.selectedModel}</p>
                            <p className="text-[11px] text-dark-400 mt-0.5 truncate">URL: {inst.baseUrl || config.baseUrl}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          {!isActive && <button onClick={() => handleSetActive(id)} className="px-3 py-1.5 text-[11px] text-accent-purple hover:bg-accent-purple/10 rounded-lg">设为默认</button>}
                          <button onClick={() => handleToggle(id)} className="px-3 py-1.5 text-[11px] text-dark-200 hover:bg-dark-700 rounded-lg">{inst.enabled ? '禁用' : '启用'}</button>
                          <button onClick={() => handleRemove(id)} className="px-3 py-1.5 text-[11px] text-accent-red hover:bg-accent-red/10 rounded-lg">移除</button>
                        </div>
                      </div>
                      {/* 模型和 URL 可编辑 */}
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] text-dark-300 mb-1 block">模型 ID（可手动修改）</label>
                          <input
                            value={inst.selectedModel}
                            onChange={e => handleInlineModelChange(id, e.target.value)}
                            className="w-full px-3 py-2 bg-dark-900 border border-white/[0.08] rounded-lg text-xs text-dark-100 font-mono focus:outline-none focus:border-accent-purple/50"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-dark-300 mb-1 block">Base URL</label>
                          <input
                            value={inst.baseUrl || config.baseUrl}
                            onChange={e => handleBaseUrlChange(id, e.target.value)}
                            className="w-full px-3 py-2 bg-dark-900 border border-white/[0.08] rounded-lg text-xs text-dark-100 font-mono focus:outline-none focus:border-accent-purple/50"
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {configuredIds.length === 0 && (
            <div className="glass-card p-5 border-accent-yellow/30">
              <h2 className="text-sm font-semibold text-accent-yellow mb-2">尚未接入 AI 平台</h2>
              <p className="text-xs text-dark-300">接入后才能让 Agent 自动执行任务。可以从免费模型开始。</p>
              {freeModels.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {freeModels.map(model => (
                    <button key={`${model.provider}-${model.model}`} onClick={() => openSetup(model.provider, model.model)} className="px-3 py-1.5 text-xs text-dark-100 bg-dark-700 hover:bg-dark-600 border border-white/[0.08] rounded-lg">
                      {model.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 添加平台 */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-dark-100">添加 AI 平台</h2>
              <div className="flex gap-1 p-0.5 bg-dark-800 rounded-lg border border-white/[0.08]">
                {[
                  { key: 'all' as const, label: '全部' },
                  { key: 'china' as const, label: '国内' },
                  { key: 'global' as const, label: '国际' },
                ].map(region => (
                  <button key={region.key} onClick={() => setRegionFilter(region.key)} className={`px-3 py-1 rounded-md text-[11px] font-medium ${regionFilter === region.key ? 'bg-dark-600 text-white' : 'text-dark-300 hover:text-white'}`}>
                    {region.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* 自定义平台卡片 - 始终显示 */}
              <button onClick={openCustomSetup} className="glass-card-hover p-4 text-left border-dashed border-accent-purple/30">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🔧</span>
                  <div>
                    <div className="text-sm font-semibold text-accent-purple">+ 自定义平台</div>
                    <p className="text-[11px] text-dark-300 mt-0.5">任何 OpenAI 兼容的 API（小米、豆包、百川...）</p>
                  </div>
                </div>
              </button>
              {/* 内置平台 */}
              {filteredProviders.map(provider => {
                const count = configuredIds.filter(id => id === provider.id || id.startsWith(provider.id + '-')).length
                return (
                  <button key={provider.id} onClick={() => openSetup(provider.id)} className="glass-card-hover p-4 text-left">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-2xl">{provider.icon}</span>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-dark-100">{provider.name}</div>
                          <p className="text-[11px] text-dark-300 mt-0.5 line-clamp-2">{provider.description}</p>
                        </div>
                      </div>
                      {count > 0 && <span className="text-[10px] px-2 py-1 rounded-full bg-accent-green/20 text-accent-green">×{count}</span>}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 接入弹窗 */}
          {setupProvider && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setSetupProvider(null)}>
              <div className="w-full max-w-xl glass-card p-6 animate-fade-in max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-3xl">{setupProvider === 'custom' ? '🔧' : providerToSetup?.icon}</span>
                  <div>
                    <h2 className="text-lg font-bold text-white">{setupProvider === 'custom' ? '添加自定义平台' : `接入 ${providerToSetup?.name}`}</h2>
                    <p className="text-xs text-dark-300">{setupProvider === 'custom' ? '任何兼容 OpenAI 格式的 API' : providerToSetup?.description}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {setupProvider === 'custom' && (
                    <div>
                      <label className="text-xs text-dark-200 mb-1.5 block font-medium">平台名称</label>
                      <input value={customNameInput} onChange={e => setCustomNameInput(e.target.value)} placeholder="如：小米 MiMo、豆包、百川" className="w-full px-3 py-2.5 bg-dark-900 border border-white/[0.1] rounded-xl text-sm text-dark-100 placeholder-dark-500 focus:outline-none focus:border-accent-purple/50" />
                    </div>
                  )}

                  <div>
                    <label className="text-xs text-dark-200 mb-1.5 block font-medium">Base URL</label>
                    <input value={baseUrlInput} onChange={e => setBaseUrlInput(e.target.value)} placeholder={setupProvider === 'custom' ? 'https://api.example.com/v1' : providerToSetup?.baseUrl} className="w-full px-3 py-2.5 bg-dark-900 border border-white/[0.1] rounded-xl text-sm text-dark-100 placeholder-dark-500 focus:outline-none focus:border-accent-purple/50 font-mono" />
                  </div>

                  <div>
                    <label className="text-xs text-dark-200 mb-1.5 block font-medium">API Key</label>
                    <input type="password" value={apiKeyInput} onChange={e => setApiKeyInput(e.target.value)} placeholder={setupProvider === 'custom' ? 'sk-...' : providerToSetup?.apiKeyPlaceholder} className="w-full px-3 py-2.5 bg-dark-900 border border-white/[0.1] rounded-xl text-sm text-dark-100 placeholder-dark-500 focus:outline-none focus:border-accent-purple/50 font-mono" />
                  </div>

                  <div>
                    <label className="text-xs text-dark-200 mb-1.5 block font-medium">模型</label>
                    {/* 预设模型下拉（仅内置平台） */}
                    {setupProvider !== 'custom' && providerToSetup && (
                      <div className="space-y-2 mb-2">
                        <select
                          value={useManualModel ? '__manual__' : selectedModel}
                          onChange={e => {
                            if (e.target.value === '__manual__') {
                              setUseManualModel(true)
                            } else {
                              setUseManualModel(false)
                              setSelectedModel(e.target.value)
                            }
                          }}
                          className="w-full px-3 py-2.5 bg-dark-900 border border-white/[0.1] rounded-xl text-sm text-dark-100 focus:outline-none focus:border-accent-purple/50"
                        >
                          {providerToSetup.models.map(model => <option key={model.id} value={model.id}>{model.name} ({model.id})</option>)}
                          <option value="__manual__">✏️ 手动输入模型 ID...</option>
                        </select>
                      </div>
                    )}

                    {/* 自动拉取按钮 */}
                    <div className="flex items-center gap-2 mb-2">
                      <button
                        onClick={fetchModels}
                        disabled={!baseUrlInput.trim() || !apiKeyInput.trim() || fetchingModels}
                        className="px-3 py-2 text-xs font-medium text-accent-blue bg-accent-blue/10 hover:bg-accent-blue/20 border border-accent-blue/20 rounded-lg disabled:opacity-40 transition-all"
                      >
                        {fetchingModels ? '拉取中...' : '🔍 自动获取模型列表'}
                      </button>
                      {fetchedModels.length > 0 && (
                        <span className="text-[10px] text-dark-400">已获取 {fetchedModels.length} 个模型</span>
                      )}
                    </div>

                    {/* 拉取到的模型列表 */}
                    {fetchedModels.length > 0 && (
                      <div className="max-h-40 overflow-y-auto border border-white/[0.08] rounded-lg bg-dark-900 mb-2">
                        {fetchedModels.map(id => (
                          <button
                            key={id}
                            onClick={() => { setManualModelInput(id); setUseManualModel(true); setSelectedModel(id) }}
                            className={`w-full text-left px-3 py-2 text-xs font-mono hover:bg-dark-700 transition-colors border-b border-white/[0.04] last:border-0 ${
                              (useManualModel ? manualModelInput : selectedModel) === id ? 'text-accent-purple bg-accent-purple/10' : 'text-dark-200'
                            }`}
                          >
                            {id}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* 手动输入框 */}
                    {(setupProvider === 'custom' || useManualModel) && (
                      <div>
                        <input
                          value={manualModelInput}
                          onChange={e => setManualModelInput(e.target.value)}
                          placeholder="输入模型 ID，如 gpt-5.4、MiMo-V2-Pro、doubao-pro-32k"
                          className="w-full px-3 py-2.5 bg-dark-900 border border-white/[0.1] rounded-xl text-sm text-dark-100 placeholder-dark-500 focus:outline-none focus:border-accent-purple/50 font-mono"
                        />
                      </div>
                    )}
                    {!useManualModel && setupProvider !== 'custom' && (
                      <p className="text-[10px] text-dark-400 mt-1">当前: {selectedModel} · 下拉选「手动输入」或点「自动获取」</p>
                    )}
                  </div>
                </div>

                {testResult !== 'idle' && (
                  <div className={`mt-4 p-3 rounded-lg text-xs border ${
                    testResult === 'testing' ? 'bg-accent-blue/10 text-accent-blue border-accent-blue/20' :
                    testResult === 'success' ? 'bg-accent-green/10 text-accent-green border-accent-green/20' :
                    'bg-accent-red/10 text-accent-red border-accent-red/20'
                  }`}>
                    {testMessage}
                  </div>
                )}

                <div className="flex gap-2 mt-5">
                  <button onClick={handleTestApi} disabled={!apiKeyInput.trim() || !getDisplayModel() || testResult === 'testing'} className="flex-1 py-2.5 text-xs font-medium text-dark-100 bg-dark-700 hover:bg-dark-600 rounded-xl disabled:opacity-40">
                    {testResult === 'testing' ? '测试中...' : '测试连接'}
                  </button>
                  <button onClick={handleAdd} disabled={!apiKeyInput.trim() || !getDisplayModel()} className="flex-1 py-2.5 text-xs font-medium text-white bg-accent-purple hover:bg-accent-purple/90 rounded-xl disabled:opacity-40">
                    确认接入
                  </button>
                  <button onClick={() => setSetupProvider(null)} className="px-4 py-2.5 text-xs font-medium text-dark-200 bg-dark-700/60 hover:bg-dark-700 rounded-xl">
                    取消
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== Agent 模型绑定 ==================== */}
      {tab === 'agents' && (
        <div className="space-y-5">
          <div className="glass-card p-5">
            <h2 className="text-sm font-semibold text-dark-100 mb-2">Agent 模型分配</h2>
            <p className="text-xs text-dark-300 mb-4">为每个 Agent 指定使用的 AI 平台和模型。未绑定的 Agent 将使用默认平台。</p>

            {configuredIds.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-dark-300">请先在「AI 平台」标签接入至少一个平台</p>
              </div>
            ) : (
              <div className="space-y-3">
                {AGENT_LIST.map(agent => {
                  const binding = store.agentModels[agent.id]
                  const boundProvider = binding ? getProvider(binding.providerId) : null
                  return (
                    <div key={agent.id} className="flex items-center gap-4 p-3 bg-dark-800/60 rounded-xl border border-white/[0.06]">
                      <div className="flex items-center gap-2 min-w-[140px]">
                        <span className="text-xl">{agent.avatar}</span>
                        <span className="text-sm text-dark-100 font-medium">{agent.name}</span>
                      </div>
                      <div className="flex-1 flex items-center gap-2">
                        <select
                          value={binding?.providerId || ''}
                          onChange={e => {
                            const pid = e.target.value
                            if (!pid) {
                              handleAgentModelChange(agent.id, '', '')
                            } else {
                              const config = getProvider(pid)
                              handleAgentModelChange(agent.id, pid, config?.defaultModel || '')
                            }
                          }}
                          className="flex-1 px-3 py-2 bg-dark-900 border border-white/[0.08] rounded-lg text-xs text-dark-100 focus:outline-none focus:border-accent-purple/50"
                        >
                          <option value="">使用默认平台</option>
                          {providerOptions.map(p => p && (
                            <option key={p.id} value={p.id}>{p.icon} {p.name}</option>
                          ))}
                        </select>
                        {binding && (
                          <input
                            value={binding.modelId}
                            onChange={e => handleAgentModelChange(agent.id, binding.providerId, e.target.value)}
                            placeholder="模型 ID"
                            className="flex-1 px-3 py-2 bg-dark-900 border border-white/[0.08] rounded-lg text-xs text-dark-100 font-mono focus:outline-none focus:border-accent-purple/50"
                          />
                        )}
                      </div>
                      {binding && (
                        <span className="text-[10px] text-dark-400 truncate max-w-[120px]">{boundProvider?.name}: {binding.modelId}</span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== 通用设置 ==================== */}
      {tab === 'general' && (
        <div className="glass-card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-dark-100">个人信息</h2>
          <div>
            <label className="text-xs text-dark-300 mb-1 block">名称</label>
            <input value={settings.profileName} onChange={e => setSettings({ ...settings, profileName: e.target.value })} className="w-full px-3 py-2 bg-dark-900 border border-white/[0.08] rounded-lg text-sm text-dark-100 focus:outline-none focus:border-accent-purple/50" />
          </div>
          <div>
            <label className="text-xs text-dark-300 mb-1 block">角色</label>
            <input value={settings.profileRole} onChange={e => setSettings({ ...settings, profileRole: e.target.value })} className="w-full px-3 py-2 bg-dark-900 border border-white/[0.08] rounded-lg text-sm text-dark-100 focus:outline-none focus:border-accent-purple/50" />
          </div>
          <button onClick={handleSaveSettings} className="px-5 py-2 text-xs font-medium text-white bg-accent-purple hover:bg-accent-purple/90 rounded-lg">保存</button>
        </div>
      )}

      {/* ==================== 预算 ==================== */}
      {tab === 'budget' && (
        <div className="space-y-4">
          <div className="glass-card p-5 space-y-4">
            <h2 className="text-sm font-semibold text-dark-100">预算管理</h2>
            <div>
              <label className="text-xs text-dark-300 mb-1 block">月度预算上限（元，0 = 不启用）</label>
              <input type="number" value={settings.monthlyBudget} onChange={e => setSettings({ ...settings, monthlyBudget: Number(e.target.value) })} className="w-full px-3 py-2 bg-dark-900 border border-white/[0.08] rounded-lg text-sm text-dark-100 focus:outline-none focus:border-accent-purple/50" />
            </div>
            <div>
              <label className="text-xs text-dark-300 mb-1 block">预算超限行为</label>
              <select value={settings.budgetLimitAction} onChange={e => setSettings({ ...settings, budgetLimitAction: e.target.value as UserSettings['budgetLimitAction'] })} className="w-full px-3 py-2 bg-dark-900 border border-white/[0.08] rounded-lg text-sm text-dark-100 focus:outline-none focus:border-accent-purple/50">
                <option value="notify">只通知提醒</option>
                <option value="downgrade">自动降级模型</option>
                <option value="pause">暂停 Agent 调用</option>
              </select>
            </div>
            <button onClick={handleSaveSettings} className="px-5 py-2 text-xs font-medium text-white bg-accent-purple hover:bg-accent-purple/90 rounded-lg">保存</button>
          </div>
          <div className="glass-card p-5">
            <h2 className="text-sm font-semibold text-dark-100 mb-4">本月消耗</h2>
            <p className="text-2xl font-bold text-white">¥0</p>
            <p className="text-xs text-dark-300 mt-1">未执行真实 AI 调用前不展示虚构成本。</p>
          </div>
        </div>
      )}

      {/* ==================== 危险区域 ==================== */}
      {tab === 'danger' && (
        <div className="space-y-4">
          <div className="glass-card p-5 border-accent-red/30">
            <h2 className="text-sm font-semibold text-accent-red mb-4">危险操作</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
                <div>
                  <p className="text-sm text-dark-100">清除所有平台配置</p>
                  <p className="text-xs text-dark-300">移除本地保存的 API Key、Base URL 和模型选择。</p>
                </div>
                <button onClick={handleClearProviders} className="px-4 py-2 text-xs font-medium text-accent-red border border-accent-red/40 hover:bg-accent-red/10 rounded-lg">清除</button>
              </div>
              <div className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
                <div>
                  <p className="text-sm text-dark-100">重置工作区数据</p>
                  <p className="text-xs text-dark-300">清空任务、产出和记忆库，不影响 AI 配置。</p>
                </div>
                <button onClick={handleResetWorkspace} className="px-4 py-2 text-xs font-medium text-accent-red border border-accent-red/40 hover:bg-accent-red/10 rounded-lg">重置</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
