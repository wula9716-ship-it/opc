/**
 * AI Provider 统一接口定义
 * 所有平台适配器必须实现这个接口
 */

export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AIRequestOptions {
  model: string
  messages: AIMessage[]
  temperature?: number
  maxTokens?: number
  stream?: boolean
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
}

export interface AIResponse {
  content: string
  model: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  finishReason: string
}

export interface AIStreamChunk {
  content: string
  done: boolean
}

export interface ProviderModel {
  id: string
  name: string
  contextWindow: number
  maxOutput: number
  pricing: {
    input: number   // 每百万 token 价格（人民币）
    output: number
  }
  capabilities: ('chat' | 'code' | 'vision' | 'function' | 'reasoning')[]
}

export interface ProviderConfig {
  id: string
  name: string
  icon: string
  description: string
  baseUrl: string
  apiKeyPlaceholder: string
  apiKeyHeader: string       // 'Authorization: Bearer {key}' 或 'x-api-key: {key}'
  compatible: 'openai' | 'anthropic' | 'custom'  // 接口兼容模式
  docsUrl: string
  models: ProviderModel[]
  defaultModel: string
  region: 'global' | 'china' | 'both'
  features: {
    streaming: boolean
    functionCalling: boolean
    vision: boolean
    maxContextWindow: number
  }
}

export interface AIProvider {
  config: ProviderConfig
  chat(options: AIRequestOptions): Promise<AIResponse>
  chatStream(options: AIRequestOptions): AsyncGenerator<AIStreamChunk>
  validateApiKey(apiKey: string): Promise<boolean>
}
