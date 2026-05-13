/**
 * AI Provider 状态管理
 * 使用 localStorage 持久化用户的平台配置
 */

import { ProviderConfig } from './types'
import { PROVIDER_REGISTRY, getProvider, registerCustomProvider } from './registry'

export interface ProviderInstance {
  providerId: string
  apiKey: string
  selectedModel: string
  baseUrl?: string
  enabled: boolean
  addedAt: string
}

export interface AIStore {
  providers: Record<string, ProviderInstance>
  activeProviderId: string | null
  defaultForTasks: Record<string, string>  // taskType -> providerId 映射
  agentModels: Record<string, { providerId: string; modelId: string }>  // agentId -> 使用的模型
}

const STORAGE_KEY = 'opc-os-ai-providers'

const DEFAULT_STORE: AIStore = {
  providers: {},
  activeProviderId: null,
  defaultForTasks: {},
  agentModels: {},
}

export function loadStore(): AIStore {
  if (typeof window === 'undefined') return DEFAULT_STORE
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_STORE
    return { ...DEFAULT_STORE, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_STORE
  }
}

export function saveStore(store: AIStore): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export function addProvider(providerId: string, apiKey: string, model?: string, baseUrl?: string, customName?: string): AIStore {
  const store = loadStore()

  // 自定义平台：生成唯一 ID，允许多个
  let storeKey = providerId
  if (providerId === 'custom') {
    storeKey = `custom-${Date.now()}`
    // 在内存注册表中动态注册
    const customConfig: ProviderConfig = {
      id: storeKey,
      name: customName || `自定义平台 ${Object.keys(store.providers).filter(k => k.startsWith('custom')).length + 1}`,
      icon: '🔧',
      description: '自定义 OpenAI 兼容平台',
      baseUrl: baseUrl || '',
      apiKeyPlaceholder: 'sk-...',
      apiKeyHeader: 'Authorization: Bearer {key}',
      compatible: 'openai',
      docsUrl: '',
      defaultModel: model || '',
      region: 'both',
      features: { streaming: true, functionCalling: false, vision: false, maxContextWindow: 128000 },
      models: [{ id: model || 'custom-model', name: model || '自定义模型', contextWindow: 128000, maxOutput: 4096, pricing: { input: 0, output: 0 }, capabilities: ['chat', 'code'] }],
    }
    registerCustomProvider(customConfig)
  }

  const config = getProvider(storeKey)
  if (!config) throw new Error(`未知平台: ${providerId}`)

  store.providers[storeKey] = {
    providerId: storeKey,
    apiKey,
    selectedModel: model ?? config.defaultModel,
    baseUrl: baseUrl?.trim() || config.baseUrl,
    enabled: true,
    addedAt: new Date().toISOString(),
  }

  if (!store.activeProviderId) {
    store.activeProviderId = storeKey
  }

  saveStore(store)
  return store
}

export function removeProvider(providerId: string): AIStore {
  const store = loadStore()
  delete store.providers[providerId]
  if (store.activeProviderId === providerId) {
    store.activeProviderId = Object.keys(store.providers)[0] ?? null
  }
  saveStore(store)
  return store
}

export function setActiveProvider(providerId: string): AIStore {
  const store = loadStore()
  store.activeProviderId = providerId
  saveStore(store)
  return store
}

export function toggleProvider(providerId: string): AIStore {
  const store = loadStore()
  if (store.providers[providerId]) {
    store.providers[providerId].enabled = !store.providers[providerId].enabled
  }
  saveStore(store)
  return store
}

export function updateModel(providerId: string, modelId: string): AIStore {
  const store = loadStore()
  if (store.providers[providerId]) {
    store.providers[providerId].selectedModel = modelId
  }
  saveStore(store)
  return store
}

export function getActiveProvider(): { config: ProviderConfig; instance: ProviderInstance } | null {
  const store = loadStore()
  if (!store.activeProviderId) return null
  const instance = store.providers[store.activeProviderId]
  if (!instance || !instance.enabled) return null
  const config = getProvider(store.activeProviderId)
  if (!config) return null
  return { config, instance }
}

export function getConfiguredProviders(): { config: ProviderConfig; instance: ProviderInstance }[] {
  const store = loadStore()
  return Object.values(store.providers)
    .filter(i => i.enabled)
    .map(i => {
      const config = getProvider(i.providerId)
      return config ? { config, instance: i } : null
    })
    .filter(Boolean) as { config: ProviderConfig; instance: ProviderInstance }[]
}

// ============ Agent 模型绑定 ============

export function setAgentModel(agentId: string, providerId: string, modelId: string): void {
  const store = loadStore()
  store.agentModels[agentId] = { providerId, modelId }
  saveStore(store)
}

export function getAgentModel(agentId: string): { providerId: string; modelId: string } | null {
  const store = loadStore()
  return store.agentModels[agentId] ?? null
}

export function getAllAgentModels(): Record<string, { providerId: string; modelId: string }> {
  return loadStore().agentModels
}
