/**
 * AI 平台注册表
 * 所有支持的 AI 平台配置集中管理
 */

import { ProviderConfig } from './types'

export const PROVIDER_REGISTRY: ProviderConfig[] = [
  // ==================== 国际平台 ====================
  {
    id: 'openai',
    name: 'OpenAI',
    icon: '🟢',
    description: 'GPT-4o / GPT-4 / GPT-3.5，全球最广泛使用的 AI 平台',
    baseUrl: 'https://api.openai.com/v1',
    apiKeyPlaceholder: 'sk-...',
    apiKeyHeader: 'Authorization: Bearer {key}',
    compatible: 'openai',
    docsUrl: 'https://platform.openai.com/docs',
    defaultModel: 'gpt-4o',
    region: 'global',
    features: { streaming: true, functionCalling: true, vision: true, maxContextWindow: 128000 },
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', contextWindow: 128000, maxOutput: 16384, pricing: { input: 18, output: 54 }, capabilities: ['chat', 'code', 'vision', 'function'] },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', contextWindow: 128000, maxOutput: 16384, pricing: { input: 1.08, output: 4.32 }, capabilities: ['chat', 'code', 'vision', 'function'] },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', contextWindow: 128000, maxOutput: 4096, pricing: { input: 72, output: 216 }, capabilities: ['chat', 'code', 'vision', 'function'] },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', contextWindow: 16385, maxOutput: 4096, pricing: { input: 3.6, output: 7.2 }, capabilities: ['chat', 'code', 'function'] },
      { id: 'o1', name: 'o1', contextWindow: 200000, maxOutput: 100000, pricing: { input: 108, output: 432 }, capabilities: ['chat', 'code', 'reasoning'] },
      { id: 'o3-mini', name: 'o3-mini', contextWindow: 200000, maxOutput: 100000, pricing: { input: 7.92, output: 31.68 }, capabilities: ['chat', 'code', 'reasoning'] },
    ],
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    icon: '🟤',
    description: 'Claude 系列，擅长长文本理解、代码和复杂推理',
    baseUrl: 'https://api.anthropic.com',
    apiKeyPlaceholder: 'sk-ant-...',
    apiKeyHeader: 'x-api-key: {key}',
    compatible: 'anthropic',
    docsUrl: 'https://docs.anthropic.com',
    defaultModel: 'claude-sonnet-4-20250514',
    region: 'global',
    features: { streaming: true, functionCalling: true, vision: true, maxContextWindow: 200000 },
    models: [
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', contextWindow: 200000, maxOutput: 64000, pricing: { input: 21.6, output: 108 }, capabilities: ['chat', 'code', 'vision', 'function', 'reasoning'] },
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', contextWindow: 200000, maxOutput: 8192, pricing: { input: 21.6, output: 108 }, capabilities: ['chat', 'code', 'vision', 'function'] },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', contextWindow: 200000, maxOutput: 8192, pricing: { input: 5.76, output: 28.8 }, capabilities: ['chat', 'code', 'vision'] },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', contextWindow: 200000, maxOutput: 4096, pricing: { input: 108, output: 540 }, capabilities: ['chat', 'code', 'vision', 'reasoning'] },
    ],
  },
  {
    id: 'google',
    name: 'Google Gemini',
    icon: '🔵',
    description: 'Gemini 系列，支持超长上下文和多模态',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    apiKeyPlaceholder: 'AIza...',
    apiKeyHeader: 'x-goog-api-key: {key}',
    compatible: 'custom',
    docsUrl: 'https://ai.google.dev/docs',
    defaultModel: 'gemini-2.5-flash',
    region: 'global',
    features: { streaming: true, functionCalling: true, vision: true, maxContextWindow: 1000000 },
    models: [
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', contextWindow: 1000000, maxOutput: 65536, pricing: { input: 4.32, output: 17.28 }, capabilities: ['chat', 'code', 'vision', 'function', 'reasoning'] },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', contextWindow: 1000000, maxOutput: 8192, pricing: { input: 0.72, output: 2.88 }, capabilities: ['chat', 'code', 'vision', 'function'] },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', contextWindow: 2000000, maxOutput: 8192, pricing: { input: 8.64, output: 43.2 }, capabilities: ['chat', 'code', 'vision', 'function'] },
    ],
  },

  // ==================== 中国平台 ====================
  {
    id: 'deepseek',
    name: 'DeepSeek',
    icon: '🐋',
    description: '深度求索，性价比极高的国产大模型，代码和推理能力强',
    baseUrl: 'https://api.deepseek.com',
    apiKeyPlaceholder: 'sk-...',
    apiKeyHeader: 'Authorization: Bearer {key}',
    compatible: 'openai',
    docsUrl: 'https://platform.deepseek.com/api-docs',
    defaultModel: 'deepseek-chat',
    region: 'china',
    features: { streaming: true, functionCalling: true, vision: false, maxContextWindow: 128000 },
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek V3', contextWindow: 128000, maxOutput: 8192, pricing: { input: 1.33, output: 5.4 }, capabilities: ['chat', 'code', 'function'] },
      { id: 'deepseek-reasoner', name: 'DeepSeek R1', contextWindow: 128000, maxOutput: 8192, pricing: { input: 4.0, output: 16.0 }, capabilities: ['chat', 'code', 'reasoning'] },
    ],
  },
  {
    id: 'qwen',
    name: '通义千问',
    icon: '🟣',
    description: '阿里云百炼平台，Qwen 系列模型，国内生态最完善',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    apiKeyPlaceholder: 'sk-...',
    apiKeyHeader: 'Authorization: Bearer {key}',
    compatible: 'openai',
    docsUrl: 'https://help.aliyun.com/zh/dashscope/',
    defaultModel: 'qwen-plus',
    region: 'china',
    features: { streaming: true, functionCalling: true, vision: true, maxContextWindow: 131072 },
    models: [
      { id: 'qwen-max', name: 'Qwen Max', contextWindow: 131072, maxOutput: 8192, pricing: { input: 14.4, output: 43.2 }, capabilities: ['chat', 'code', 'vision', 'function'] },
      { id: 'qwen-plus', name: 'Qwen Plus', contextWindow: 131072, maxOutput: 8192, pricing: { input: 3.6, output: 10.8 }, capabilities: ['chat', 'code', 'vision', 'function'] },
      { id: 'qwen-turbo', name: 'Qwen Turbo', contextWindow: 131072, maxOutput: 8192, pricing: { input: 0.72, output: 2.16 }, capabilities: ['chat', 'code', 'function'] },
      { id: 'qwen-long', name: 'Qwen Long', contextWindow: 10000000, maxOutput: 6000, pricing: { input: 0.36, output: 1.44 }, capabilities: ['chat'] },
    ],
  },
  {
    id: 'zhipu',
    name: '智谱 AI',
    icon: '🧠',
    description: 'GLM 系列，清华技术背景，综合能力均衡',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    apiKeyPlaceholder: '...',
    apiKeyHeader: 'Authorization: Bearer {key}',
    compatible: 'openai',
    docsUrl: 'https://open.bigmodel.cn/dev/howuse/introduction',
    defaultModel: 'glm-4-flash',
    region: 'china',
    features: { streaming: true, functionCalling: true, vision: true, maxContextWindow: 128000 },
    models: [
      { id: 'glm-4-plus', name: 'GLM-4 Plus', contextWindow: 128000, maxOutput: 4096, pricing: { input: 36, output: 36 }, capabilities: ['chat', 'code', 'vision', 'function'] },
      { id: 'glm-4-flash', name: 'GLM-4 Flash', contextWindow: 128000, maxOutput: 4096, pricing: { input: 0, output: 0 }, capabilities: ['chat', 'code', 'vision'] },
      { id: 'glm-4-long', name: 'GLM-4 Long', contextWindow: 1000000, maxOutput: 4096, pricing: { input: 7.2, output: 7.2 }, capabilities: ['chat', 'code'] },
    ],
  },
  {
    id: 'moonshot',
    name: 'Moonshot / Kimi',
    icon: '🌙',
    description: '月之暗面，Kimi 背后的模型，超长上下文能力突出',
    baseUrl: 'https://api.moonshot.cn/v1',
    apiKeyPlaceholder: 'sk-...',
    apiKeyHeader: 'Authorization: Bearer {key}',
    compatible: 'openai',
    docsUrl: 'https://platform.moonshot.cn/docs',
    defaultModel: 'moonshot-v1-128k',
    region: 'china',
    features: { streaming: true, functionCalling: true, vision: false, maxContextWindow: 128000 },
    models: [
      { id: 'moonshot-v1-128k', name: 'Moonshot v1 128K', contextWindow: 128000, maxOutput: 8192, pricing: { input: 50.4, output: 50.4 }, capabilities: ['chat', 'code', 'function'] },
      { id: 'moonshot-v1-32k', name: 'Moonshot v1 32K', contextWindow: 32768, maxOutput: 8192, pricing: { input: 25.2, output: 25.2 }, capabilities: ['chat', 'code', 'function'] },
      { id: 'moonshot-v1-8k', name: 'Moonshot v1 8K', contextWindow: 8192, maxOutput: 4096, pricing: { input: 10.8, output: 10.8 }, capabilities: ['chat', 'code'] },
    ],
  },
  {
    id: 'baidu',
    name: '百度文心',
    icon: '🐻',
    description: '百度千帆平台，文心一言系列，中文理解能力强',
    baseUrl: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop',
    apiKeyPlaceholder: '...',
    apiKeyHeader: 'Authorization: Bearer {key}',
    compatible: 'custom',
    docsUrl: 'https://cloud.baidu.com/doc/WENXINWORKSHOP/',
    defaultModel: 'ernie-4.0-turbo-8k',
    region: 'china',
    features: { streaming: true, functionCalling: true, vision: true, maxContextWindow: 128000 },
    models: [
      { id: 'ernie-4.0-turbo-8k', name: 'ERNIE 4.0 Turbo', contextWindow: 8192, maxOutput: 4096, pricing: { input: 72, output: 72 }, capabilities: ['chat', 'code', 'vision'] },
      { id: 'ernie-3.5-8k', name: 'ERNIE 3.5', contextWindow: 8192, maxOutput: 4096, pricing: { input: 1.08, output: 1.08 }, capabilities: ['chat', 'code'] },
      { id: 'ernie-speed-8k', name: 'ERNIE Speed', contextWindow: 8192, maxOutput: 4096, pricing: { input: 0, output: 0 }, capabilities: ['chat'] },
    ],
  },

  // ==================== 通用自定义 ====================
  {
    id: 'custom',
    name: '自定义平台',
    icon: '🔧',
    description: '任何兼容 OpenAI 格式的 API，自行填写 Base URL、API Key 和模型',
    baseUrl: '',
    apiKeyPlaceholder: 'sk-... 或任意 Key',
    apiKeyHeader: 'Authorization: Bearer {key}',
    compatible: 'openai',
    docsUrl: '',
    defaultModel: '',
    region: 'both',
    features: { streaming: true, functionCalling: false, vision: false, maxContextWindow: 128000 },
    models: [
      { id: 'custom-model', name: '自定义模型', contextWindow: 128000, maxOutput: 4096, pricing: { input: 0, output: 0 }, capabilities: ['chat', 'code'] },
    ],
  },

  // ==================== 聚合平台 ====================
  {
    id: 'siliconflow',
    name: '硅基流动',
    icon: '⚡',
    description: 'SiliconFlow，国内聚合平台，一个 Key 调用多个模型',
    baseUrl: 'https://api.siliconflow.cn/v1',
    apiKeyPlaceholder: 'sk-...',
    apiKeyHeader: 'Authorization: Bearer {key}',
    compatible: 'openai',
    docsUrl: 'https://docs.siliconflow.cn/',
    defaultModel: 'Qwen/Qwen2.5-7B-Instruct',
    region: 'china',
    features: { streaming: true, functionCalling: true, vision: true, maxContextWindow: 128000 },
    models: [
      { id: 'Qwen/Qwen2.5-72B-Instruct', name: 'Qwen2.5 72B', contextWindow: 128000, maxOutput: 8192, pricing: { input: 7.92, output: 7.92 }, capabilities: ['chat', 'code', 'function'] },
      { id: 'deepseek-ai/DeepSeek-V3', name: 'DeepSeek V3', contextWindow: 128000, maxOutput: 8192, pricing: { input: 7.92, output: 7.92 }, capabilities: ['chat', 'code'] },
      { id: 'deepseek-ai/DeepSeek-R1', name: 'DeepSeek R1', contextWindow: 128000, maxOutput: 8192, pricing: { input: 21.6, output: 21.6 }, capabilities: ['chat', 'code', 'reasoning'] },
      { id: 'Pro/deepseek-ai/DeepSeek-V3', name: 'DeepSeek V3 (加速)', contextWindow: 128000, maxOutput: 8192, pricing: { input: 7.92, output: 7.92 }, capabilities: ['chat', 'code'] },
      { id: 'Qwen/Qwen2.5-7B-Instruct', name: 'Qwen2.5 7B (免费)', contextWindow: 32768, maxOutput: 4096, pricing: { input: 0, output: 0 }, capabilities: ['chat', 'code'] },
    ],
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    icon: '🔀',
    description: '国际聚合平台，一个 Key 访问数百个模型，自动路由',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKeyPlaceholder: 'sk-or-...',
    apiKeyHeader: 'Authorization: Bearer {key}',
    compatible: 'openai',
    docsUrl: 'https://openrouter.ai/docs',
    defaultModel: 'anthropic/claude-3.5-sonnet',
    region: 'global',
    features: { streaming: true, functionCalling: true, vision: true, maxContextWindow: 200000 },
    models: [
      { id: 'anthropic/claude-sonnet-4-20250514', name: 'Claude Sonnet 4', contextWindow: 200000, maxOutput: 64000, pricing: { input: 21.6, output: 108 }, capabilities: ['chat', 'code', 'vision', 'function'] },
      { id: 'openai/gpt-4o', name: 'GPT-4o', contextWindow: 128000, maxOutput: 16384, pricing: { input: 18, output: 54 }, capabilities: ['chat', 'code', 'vision', 'function'] },
      { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', contextWindow: 1000000, maxOutput: 65536, pricing: { input: 4.32, output: 17.28 }, capabilities: ['chat', 'code', 'vision', 'function'] },
      { id: 'deepseek/deepseek-chat-v3-0324', name: 'DeepSeek V3', contextWindow: 128000, maxOutput: 8192, pricing: { input: 1.08, output: 4.32 }, capabilities: ['chat', 'code'] },
      { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', contextWindow: 128000, maxOutput: 4096, pricing: { input: 1.08, output: 1.08 }, capabilities: ['chat', 'code'] },
    ],
  },
]

// 动态注册自定义平台
export function registerCustomProvider(config: ProviderConfig): void {
  const existing = PROVIDER_REGISTRY.findIndex(p => p.id === config.id)
  if (existing >= 0) {
    PROVIDER_REGISTRY[existing] = config
  } else {
    PROVIDER_REGISTRY.push(config)
  }
}

// 辅助函数
export function getProvider(id: string): ProviderConfig | undefined {
  return PROVIDER_REGISTRY.find(p => p.id === id)
}

export function getProvidersByRegion(region: 'global' | 'china' | 'both'): ProviderConfig[] {
  return PROVIDER_REGISTRY.filter(p => p.region === region || p.region === 'both')
}

export function getFreeModels(): { provider: string; model: string; name: string }[] {
  const result: { provider: string; model: string; name: string }[] = []
  for (const provider of PROVIDER_REGISTRY) {
    for (const model of provider.models) {
      if (model.pricing.input === 0 && model.pricing.output === 0) {
        result.push({ provider: provider.id, model: model.id, name: `${provider.name} - ${model.name}` })
      }
    }
  }
  return result
}
