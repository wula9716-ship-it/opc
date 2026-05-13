/**
 * AI Provider 状态管理
 * 使用 localStorage 持久化用户的平台配置
 */

import { ProviderConfig } from './types'
import { PROVIDER_REGISTRY, getProvider } from './registry'

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
}

const STORAGE_KEY = 'opc-os-ai-providers'

const DEFAULT_STORE: AIStore = {
  providers: {},
  activeProviderId: null,
  defaultForTasks: {},
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

export function addProvider(providerId: string, apiKey: string, model?: string, baseUrl?: string): AIStore {
  const store = loadStore()
  const config = getProvider(providerId)
  if (!config) throw new Error(`未知平台: ${providerId}`)

  store.providers[providerId] = {
    providerId,
    apiKey,
    selectedModel: model ?? config.defaultModel,
    baseUrl: baseUrl?.trim() || config.baseUrl,
    enabled: true,
    addedAt: new Date().toISOString(),
  }

  if (!store.activeProviderId) {
    store.activeProviderId = providerId
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
