'use client'

import { useEffect, useState } from 'react'
import { PROVIDER_REGISTRY, getFreeModels, getProvider } from '@/lib/ai-providers'
import { createClient } from '@/lib/ai-providers/client'
import type { AIStore } from '@/lib/ai-providers/store'
import { DEFAULT_SETTINGS, loadSettings, saveSettings, resetWorkspaceData, type UserSettings } from '@/lib/workspace-store'
import { useToast } from '@/components/Toast'

const STORAGE_KEY = 'opc-os-ai-providers'
const DEFAULT_STORE: AIStore = { providers: {}, activeProviderId: null, defaultForTasks: {} }

type TabType = 'providers' | 'general' | 'budget' | 'danger'

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
  const [testResult, setTestResult] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [testMessage, setTestMessage] = useState('')
  const [customModelInput, setCustomModelInput] = useState('')
  const [regionFilter, setRegionFilter] = useState<'all' | 'china' | 'global'>('all')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setStore(loadStore())
    setSettings(loadSettings())
  }, [])

  const configuredIds = Object.keys(store.providers)
  const providerToSetup = setupProvider ? getProvider(setupProvider) : null
  const freeModels = getFreeModels()
  const filteredProviders = regionFilter === 'all'
    ? PROVIDER_REGISTRY
    : PROVIDER_REGISTRY.filter(p => p.region === regionFilter || p.region === 'both')

  function openSetup(id: string, model?: string) {
    const provider = getProvider(id)
    if (!provider) return
    setSetupProvider(id)
    setSelectedModel(model || provider.defaultModel)
    setCustomModelInput(model || '')
    setBaseUrlInput(provider.baseUrl)
    setApiKeyInput('')
    setTestResult('idle')
    setTestMessage('')
  }

  function handleAdd() {
    if (!setupProvider || !providerToSetup || !apiKeyInput.trim()) return
    const newStore = { ...store, providers: { ...store.providers } }
    newStore.providers[setupProvider] = {
      providerId: setupProvider,
      apiKey: apiKeyInput.trim(),
      selectedModel: selectedModel || providerToSetup.defaultModel,
      baseUrl: normalizeBaseUrl(baseUrlInput || providerToSetup.baseUrl),
      enabled: true,
      addedAt: new Date().toISOString(),
    }
    if (!newStore.activeProviderId) newStore.activeProviderId = setupProvider
    saveStore(newStore)
    setStore(newStore)
    setSetupProvider(null)
    toast('AI 平台已接入', `${providerToSetup.name} 已保存，可在群聊和调度中使用。`, 'success')
  }

  async function handleTestApi() {
    if (!setupProvider || !providerToSetup || !apiKeyInput.trim()) return
    const baseUrl = normalizeBaseUrl(baseUrlInput || providerToSetup.baseUrl)
    setTestResult('testing')
    setTestMessage('正在发送最小请求验证连接...')
    try {
      const client = createClient(setupProvider, apiKeyInput.trim(), baseUrl)
      await client.chat({
        model: selectedModel || providerToSetup.defaultModel,
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
    toast('已移除平台', '相关 API Key 已从本地配置中删除。', 'info')
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

  function handleModelChange(providerId: string, modelId: string) {
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

  return (
    <div className="space-y-5 max-w-[1100px]">
      <div>
        <h1 className="text-xl font-bold text-white">设置</h1>
        <p className="text-sm text-dark-300 mt-1">接入真实 AI 平台，管理本地系统配置。</p>
      </div>

      <div className="flex gap-1 p-1 bg-dark-800 rounded-xl border border-white/[0.08] w-fit">
        {[
          { key: 'providers' as const, label: 'AI 平台接入', count: configuredIds.length },
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

      {tab === 'providers' && (
        <div className="space-y-5">
          {configuredIds.length > 0 ? (
            <div className="glass-card p-5">
              <h2 className="text-sm font-semibold text-dark-100 mb-4">已接入平台</h2>
              <div className="space-y-3">
                {configuredIds.map(id => {
                  const config = getProvider(id)
                  const inst = store.providers[id]
                  if (!config || !inst) return null
                  const isActive = store.activeProviderId === id
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
                            <p className="text-[11px] text-dark-300 mt-1 truncate">Base URL: {inst.baseUrl || config.baseUrl}</p>
                            <p className="text-[11px] text-dark-400 mt-0.5">Key: {inst.apiKey.slice(0, 8)}...{inst.apiKey.slice(-4)}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <select value={inst.selectedModel} onChange={e => handleModelChange(id, e.target.value)} className="px-2 py-1.5 bg-dark-700 border border-white/[0.1] rounded-lg text-xs text-dark-100 focus:outline-none focus:border-accent-purple/50">
                            {config.models.map(model => <option key={model.id} value={model.id}>{model.name}</option>)}
                          </select>
                          {!isActive && <button onClick={() => handleSetActive(id)} className="px-3 py-1.5 text-[11px] text-accent-purple hover:bg-accent-purple/10 rounded-lg">设为默认</button>}
                          <button onClick={() => handleToggle(id)} className="px-3 py-1.5 text-[11px] text-dark-200 hover:bg-dark-700 rounded-lg">{inst.enabled ? '禁用' : '启用'}</button>
                          <button onClick={() => handleRemove(id)} className="px-3 py-1.5 text-[11px] text-accent-red hover:bg-accent-red/10 rounded-lg">移除</button>
                        </div>
                      </div>
                      <div className="mt-3">
                        <label className="text-[10px] text-dark-300 mb-1 block">自定义 Base URL</label>
                        <input
                          value={inst.baseUrl || config.baseUrl}
                          onChange={e => handleBaseUrlChange(id, e.target.value)}
                          className="w-full px-3 py-2 bg-dark-900 border border-white/[0.08] rounded-lg text-xs text-dark-100 placeholder-dark-500 focus:outline-none focus:border-accent-purple/50"
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="glass-card p-5 border-accent-yellow/30">
              <h2 className="text-sm font-semibold text-accent-yellow mb-2">尚未接入 AI 平台</h2>
              <p className="text-xs text-dark-300">未接入前，调度、群聊、Agent 执行都会保持空态，不会伪造任务进度或产出。</p>
            </div>
          )}

          {freeModels.length > 0 && configuredIds.length === 0 && (
            <div className="glass-card p-5">
              <h2 className="text-sm font-semibold text-dark-100 mb-2">可从免费模型开始</h2>
              <div className="flex flex-wrap gap-2">
                {freeModels.map(model => (
                  <button key={`${model.provider}-${model.model}`} onClick={() => openSetup(model.provider, model.model)} className="px-3 py-1.5 text-xs text-dark-100 bg-dark-700 hover:bg-dark-600 border border-white/[0.08] rounded-lg">
                    {model.name}
                  </button>
                ))}
              </div>
            </div>
          )}

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
              {filteredProviders.map(provider => {
                const isConfigured = configuredIds.includes(provider.id)
                return (
                  <button key={provider.id} onClick={() => !isConfigured && openSetup(provider.id)} className={`glass-card-hover p-4 text-left ${isConfigured ? 'border-accent-green/30 cursor-default' : ''}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-2xl">{provider.icon}</span>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-dark-100">{provider.name}</div>
                          <p className="text-[11px] text-dark-300 mt-0.5 line-clamp-2">{provider.description}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] px-2 py-1 rounded-full ${isConfigured ? 'bg-accent-green/20 text-accent-green' : 'bg-dark-700 text-dark-300'}`}>
                        {isConfigured ? '已接入' : '配置'}
                      </span>
                    </div>
                    <p className="text-[10px] text-dark-400 mt-3 truncate">{provider.baseUrl}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {providerToSetup && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setSetupProvider(null)}>
              <div className="w-full max-w-xl glass-card p-6 animate-fade-in" onClick={event => event.stopPropagation()}>
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-3xl">{providerToSetup.icon}</span>
                  <div>
                    <h2 className="text-lg font-bold text-white">接入 {providerToSetup.name}</h2>
                    <p className="text-xs text-dark-300">{providerToSetup.description}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-dark-200 mb-1.5 block font-medium">Base URL</label>
                    <input value={baseUrlInput} onChange={e => setBaseUrlInput(e.target.value)} placeholder={providerToSetup.baseUrl} className="w-full px-3 py-2.5 bg-dark-900 border border-white/[0.1] rounded-xl text-sm text-dark-100 placeholder-dark-500 focus:outline-none focus:border-accent-purple/50 font-mono" />
                    <p className="text-[10px] text-dark-400 mt-1">支持官方地址、自建代理、兼容 OpenAI 的第三方网关。</p>
                  </div>

                  <div>
                    <label className="text-xs text-dark-200 mb-1.5 block font-medium">API Key</label>
                    <input type="password" value={apiKeyInput} onChange={e => setApiKeyInput(e.target.value)} placeholder={providerToSetup.apiKeyPlaceholder} className="w-full px-3 py-2.5 bg-dark-900 border border-white/[0.1] rounded-xl text-sm text-dark-100 placeholder-dark-500 focus:outline-none focus:border-accent-purple/50 font-mono" />
                  </div>

                  <div>
                    <label className="text-xs text-dark-200 mb-1.5 block font-medium">默认模型</label>
                    {providerToSetup.id === 'custom' ? (
                      <div className="space-y-2">
                        <input
                          value={customModelInput || selectedModel}
                          onChange={e => { setCustomModelInput(e.target.value); setSelectedModel(e.target.value) }}
                          placeholder="输入模型 ID，如 gpt-4o、MiLM-7B、doubao-pro"
                          className="w-full px-3 py-2.5 bg-dark-900 border border-white/[0.1] rounded-xl text-sm text-dark-100 placeholder-dark-500 focus:outline-none focus:border-accent-purple/50 font-mono"
                        />
                        <div className="flex flex-wrap gap-1.5">
                          {['gpt-4o', 'claude-3.5-sonnet', 'MiLM-7B', 'doubao-pro-32k', 'Baichuan4', 'yi-large'].map(s => (
                            <button key={s} onClick={() => { setCustomModelInput(s); setSelectedModel(s) }} className="px-2 py-1 text-[10px] text-dark-300 bg-dark-800 hover:bg-dark-700 rounded-md border border-white/[0.06]">{s}</button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <select value={selectedModel} onChange={e => setSelectedModel(e.target.value)} className="w-full px-3 py-2.5 bg-dark-900 border border-white/[0.1] rounded-xl text-sm text-dark-100 focus:outline-none focus:border-accent-purple/50">
                        {providerToSetup.models.map(model => <option key={model.id} value={model.id}>{model.name} ({model.id})</option>)}
                      </select>
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
                  <button onClick={handleTestApi} disabled={!apiKeyInput.trim() || testResult === 'testing'} className="flex-1 py-2.5 text-xs font-medium text-dark-100 bg-dark-700 hover:bg-dark-600 rounded-xl disabled:opacity-40">
                    {testResult === 'testing' ? '测试中...' : '测试连接'}
                  </button>
                  <button onClick={handleAdd} disabled={!apiKeyInput.trim()} className="flex-1 py-2.5 text-xs font-medium text-white bg-accent-purple hover:bg-accent-purple/90 rounded-xl disabled:opacity-40">
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

      {tab === 'budget' && (
        <div className="space-y-4">
          <div className="glass-card p-5 space-y-4">
            <h2 className="text-sm font-semibold text-dark-100">预算管理</h2>
            <div>
              <label className="text-xs text-dark-300 mb-1 block">月度预算上限（元，0 表示不启用预算提醒）</label>
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
            <div>
              <label className="text-xs text-dark-300 mb-1 block">免费额度用尽后</label>
              <select value={settings.freeQuotaAction} onChange={e => setSettings({ ...settings, freeQuotaAction: e.target.value as UserSettings['freeQuotaAction'] })} className="w-full px-3 py-2 bg-dark-900 border border-white/[0.08] rounded-lg text-sm text-dark-100 focus:outline-none focus:border-accent-purple/50">
                <option value="switch_free">切换到其他免费模型</option>
                <option value="use_paid">允许使用付费模型</option>
                <option value="pause">暂停服务</option>
              </select>
            </div>
            <button onClick={handleSaveSettings} className="px-5 py-2 text-xs font-medium text-white bg-accent-purple hover:bg-accent-purple/90 rounded-lg">保存预算设置</button>
          </div>

          <div className="glass-card p-5">
            <h2 className="text-sm font-semibold text-dark-100 mb-4">本月消耗</h2>
            <p className="text-2xl font-bold text-white">¥0</p>
            <p className="text-xs text-dark-300 mt-1">未执行真实 AI 调用前不展示虚构成本。</p>
          </div>
        </div>
      )}

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
                <button onClick={handleClearProviders} className="px-4 py-2 text-xs font-medium text-accent-red border border-accent-red/40 hover:bg-accent-red/10 rounded-lg">清除配置</button>
              </div>
              <div className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
                <div>
                  <p className="text-sm text-dark-100">重置工作区数据</p>
                  <p className="text-xs text-dark-300">清空任务、产出和记忆库，不会删除 AI 平台配置。</p>
                </div>
                <button onClick={handleResetWorkspace} className="px-4 py-2 text-xs font-medium text-accent-red border border-accent-red/40 hover:bg-accent-red/10 rounded-lg">重置数据</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
