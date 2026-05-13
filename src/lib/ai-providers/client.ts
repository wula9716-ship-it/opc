/**
 * AI 统一客户端
 * 屏蔽不同平台的接口差异，提供统一调用方式
 */

import { AIMessage, AIRequestOptions, AIResponse, AIStreamChunk, ProviderConfig } from './types'
import { getProvider } from './registry'

interface ClientConfig {
  provider: ProviderConfig
  apiKey: string
}

function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '')
}

/**
 * OpenAI 兼容格式请求（覆盖 OpenAI、DeepSeek、通义、智谱、Moonshot、硅基、OpenRouter 等）
 */
async function openaiCompatibleRequest(config: ClientConfig, options: AIRequestOptions): Promise<AIResponse> {
  const { provider, apiKey } = config
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  // 设置认证头
  if (provider.apiKeyHeader.includes('{key}')) {
    const [headerName, _] = provider.apiKeyHeader.split(': ')
    const headerValue = provider.apiKeyHeader.replace('{key}', apiKey)
    if (headerValue.startsWith('Bearer ')) {
      headers['Authorization'] = headerValue
    } else {
      headers[headerName] = headerValue.split(': ').slice(1).join(': ')
    }
  }

  const response = await fetch(`${trimTrailingSlash(provider.baseUrl)}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: options.model,
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4096,
      stream: false,
      top_p: options.topP,
      frequency_penalty: options.frequencyPenalty,
      presence_penalty: options.presencePenalty,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`[${provider.name}] API 错误 (${response.status}): ${error}`)
  }

  const data = await response.json()
  const choice = data.choices?.[0]

  return {
    content: choice?.message?.content ?? '',
    model: data.model ?? options.model,
    usage: {
      promptTokens: data.usage?.prompt_tokens ?? 0,
      completionTokens: data.usage?.completion_tokens ?? 0,
      totalTokens: data.usage?.total_tokens ?? 0,
    },
    finishReason: choice?.finish_reason ?? 'stop',
  }
}

/**
 * OpenAI 兼容格式流式请求
 */
async function* openaiCompatibleStream(config: ClientConfig, options: AIRequestOptions): AsyncGenerator<AIStreamChunk> {
  const { provider, apiKey } = config
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (provider.apiKeyHeader.includes('{key}')) {
    const headerValue = provider.apiKeyHeader.replace('{key}', apiKey)
    if (headerValue.startsWith('Bearer ')) {
      headers['Authorization'] = headerValue
    } else {
      const [headerName, ...rest] = provider.apiKeyHeader.split(': ')
      headers[headerName] = rest.join(': ').replace('{key}', apiKey)
    }
  }

  const response = await fetch(`${trimTrailingSlash(provider.baseUrl)}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: options.model,
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4096,
      stream: true,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`[${provider.name}] 流式 API 错误 (${response.status}): ${error}`)
  }

  const reader = response.body?.getReader()
  if (!reader) throw new Error('无法读取流式响应')

  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || !trimmed.startsWith('data: ')) continue
      const data = trimmed.slice(6)
      if (data === '[DONE]') {
        yield { content: '', done: true }
        return
      }

      try {
        const parsed = JSON.parse(data)
        const content = parsed.choices?.[0]?.delta?.content ?? ''
        if (content) {
          yield { content, done: false }
        }
      } catch {
        // 跳过解析失败的行
      }
    }
  }

  yield { content: '', done: true }
}

/**
 * Anthropic Claude 格式请求
 */
async function anthropicRequest(config: ClientConfig, options: AIRequestOptions): Promise<AIResponse> {
  const { provider, apiKey } = config

  // 分离 system message
  const systemMessage = options.messages.find(m => m.role === 'system')
  const nonSystemMessages = options.messages.filter(m => m.role !== 'system')

  const response = await fetch(`${trimTrailingSlash(provider.baseUrl)}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: options.model,
      max_tokens: options.maxTokens ?? 4096,
      ...(systemMessage ? { system: systemMessage.content } : {}),
      messages: nonSystemMessages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      temperature: options.temperature ?? 0.7,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`[Claude] API 错误 (${response.status}): ${error}`)
  }

  const data = await response.json()

  return {
    content: data.content?.[0]?.text ?? '',
    model: data.model ?? options.model,
    usage: {
      promptTokens: data.usage?.input_tokens ?? 0,
      completionTokens: data.usage?.output_tokens ?? 0,
      totalTokens: (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0),
    },
    finishReason: data.stop_reason ?? 'stop',
  }
}

/**
 * Anthropic Claude 流式请求
 */
async function* anthropicStream(config: ClientConfig, options: AIRequestOptions): AsyncGenerator<AIStreamChunk> {
  const { provider, apiKey } = config

  const systemMessage = options.messages.find(m => m.role === 'system')
  const nonSystemMessages = options.messages.filter(m => m.role !== 'system')

  const response = await fetch(`${trimTrailingSlash(provider.baseUrl)}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: options.model,
      max_tokens: options.maxTokens ?? 4096,
      ...(systemMessage ? { system: systemMessage.content } : {}),
      messages: nonSystemMessages.map(m => ({ role: m.role, content: m.content })),
      temperature: options.temperature ?? 0.7,
      stream: true,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`[Claude] 流式 API 错误 (${response.status}): ${error}`)
  }

  const reader = response.body?.getReader()
  if (!reader) throw new Error('无法读取流式响应')

  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data: ')) continue
      try {
        const data = JSON.parse(trimmed.slice(6))
        if (data.type === 'content_block_delta' && data.delta?.text) {
          yield { content: data.delta.text, done: false }
        }
      } catch {
        // skip
      }
    }
  }

  yield { content: '', done: true }
}

/**
 * Google Gemini 格式请求
 */
async function geminiRequest(config: ClientConfig, options: AIRequestOptions): Promise<AIResponse> {
  const { provider, apiKey } = config

  const systemInstruction = options.messages.find(m => m.role === 'system')
  const contents = options.messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

  const url = `${trimTrailingSlash(provider.baseUrl)}/models/${options.model}:generateContent?key=${apiKey}`

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      ...(systemInstruction ? { systemInstruction: { parts: [{ text: systemInstruction.content }] } } : {}),
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens ?? 4096,
      },
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`[Gemini] API 错误 (${response.status}): ${error}`)
  }

  const data = await response.json()
  const candidate = data.candidates?.[0]

  return {
    content: candidate?.content?.parts?.[0]?.text ?? '',
    model: options.model,
    usage: {
      promptTokens: data.usageMetadata?.promptTokenCount ?? 0,
      completionTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
      totalTokens: data.usageMetadata?.totalTokenCount ?? 0,
    },
    finishReason: candidate?.finishReason ?? 'STOP',
  }
}

// Gemini 流式简化实现（SSE 格式类似但端点不同）
async function* geminiStream(config: ClientConfig, options: AIRequestOptions): AsyncGenerator<AIStreamChunk> {
  const { provider, apiKey } = config

  const systemInstruction = options.messages.find(m => m.role === 'system')
  const contents = options.messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

  const url = `${trimTrailingSlash(provider.baseUrl)}/models/${options.model}:streamGenerateContent?alt=sse&key=${apiKey}`

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      ...(systemInstruction ? { systemInstruction: { parts: [{ text: systemInstruction.content }] } } : {}),
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens ?? 4096,
      },
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`[Gemini] 流式 API 错误 (${response.status}): ${error}`)
  }

  const reader = response.body?.getReader()
  if (!reader) throw new Error('无法读取流式响应')

  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data: ')) continue
      try {
        const data = JSON.parse(trimmed.slice(6))
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
        if (text) yield { content: text, done: false }
      } catch {
        // skip
      }
    }
  }

  yield { content: '', done: true }
}

/**
 * 统一客户端 - 根据 provider 配置自动路由到正确的实现
 */
export class AIClient {
  private config: ClientConfig

  constructor(config: ClientConfig) {
    this.config = config
  }

  async chat(options: AIRequestOptions): Promise<AIResponse> {
    const { provider } = this.config
    switch (provider.compatible) {
      case 'openai':
        return openaiCompatibleRequest(this.config, options)
      case 'anthropic':
        return anthropicRequest(this.config, options)
      case 'custom':
        if (provider.id === 'google') return geminiRequest(this.config, options)
        // 百度走 openai 兼容（千帆新版接口）
        return openaiCompatibleRequest(this.config, options)
      default:
        return openaiCompatibleRequest(this.config, options)
    }
  }

  async *chatStream(options: AIRequestOptions): AsyncGenerator<AIStreamChunk> {
    const { provider } = this.config
    switch (provider.compatible) {
      case 'openai':
        yield* openaiCompatibleStream(this.config, options)
        break
      case 'anthropic':
        yield* anthropicStream(this.config, options)
        break
      case 'custom':
        if (provider.id === 'google') {
          yield* geminiStream(this.config, options)
        } else {
          yield* openaiCompatibleStream(this.config, options)
        }
        break
      default:
        yield* openaiCompatibleStream(this.config, options)
    }
  }

  async validateApiKey(): Promise<boolean> {
    try {
      await this.chat({
        model: this.config.provider.defaultModel,
        messages: [{ role: 'user', content: 'hi' }],
        maxTokens: 1,
      })
      return true
    } catch {
      return false
    }
  }
}

/**
 * 便捷工厂函数
 */
export function createClient(providerId: string, apiKey: string, baseUrl?: string): AIClient {
  const provider = getProvider(providerId)
  if (!provider) throw new Error(`未知的 AI 平台: ${providerId}`)
  return new AIClient({
    provider: {
      ...provider,
      baseUrl: baseUrl?.trim() || provider.baseUrl,
    },
    apiKey,
  })
}
