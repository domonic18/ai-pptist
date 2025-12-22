/**
 * AI模型类型定义 - 统一架构
 */

// 模型能力枚举
export type ModelCapability = 'chat' | 'vision' | 'image_gen' | 'video_gen' | 'embeddings' | 'tools' | 'code'

// Provider类型映射
export type ProviderMapping = {
  [key in ModelCapability]?: string
}

// Provider选项
export interface ProviderOption {
  label: string
  value: string
  capabilities: ModelCapability[]
  description?: string
}

// AI模型数据（后端返回）
export interface AIModelResponse {
  id: string
  name: string
  provider: string
  ai_model_name: string
  base_url?: string
  api_key: string
  parameters?: Record<string, any>
  max_tokens?: number
  context_window?: number
  is_enabled: boolean
  is_default: boolean
  
  // 新增：统一架构字段
  capabilities: ModelCapability[]
  provider_mapping: ProviderMapping
  
  // 旧字段（向后兼容）
  supports_chat?: boolean
  supports_vision?: boolean
  supports_image_generation?: boolean
  supports_embeddings?: boolean
  supports_tools?: boolean
  
  created_at: string
  updated_at: string
}

// AI模型表单数据（前端使用）
export interface AIModelForm {
  id?: string
  name: string
  model_name: string
  base_url?: string
  api_key: string
  
  // 新增：统一架构字段
  capabilities: ModelCapability[]
  provider_mapping: ProviderMapping
  
  parameters?: Record<string, any>
  max_tokens?: number
  context_window?: number
  is_enabled: boolean
  is_default: boolean
}

// 能力标签配置
export interface CapabilityConfig {
  label: string
  value: ModelCapability
  type: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  description: string
}

// 能力配置列表
export const CAPABILITY_CONFIGS: CapabilityConfig[] = [
  {
    label: '对话',
    value: 'chat',
    type: 'primary',
    description: '支持文本对话功能'
  },
  {
    label: '多模态',
    value: 'vision',
    type: 'success',
    description: '支持图片识别和多模态对话'
  },
  {
    label: '文生图',
    value: 'image_gen',
    type: 'warning',
    description: '支持文本生成图片'
  },
  {
    label: '文生视频',
    value: 'video_gen',
    type: 'danger',
    description: '支持文本生成视频'
  },
  {
    label: '向量嵌入',
    value: 'embeddings',
    type: 'info',
    description: '支持文本向量化'
  },
  {
    label: '工具调用',
    value: 'tools',
    type: 'info',
    description: '支持Function Calling'
  },
  {
    label: '代码生成',
    value: 'code',
    type: 'info',
    description: '支持代码生成和补全'
  }
]

// Provider配置（按能力组织）
export const PROVIDER_OPTIONS: Record<ModelCapability, ProviderOption[]> = {
  chat: [
    {
      label: 'OpenAI兼容',
      value: 'openai_compatible',
      capabilities: ['chat'],
      description: '支持DeepSeek、智谱AI、Moonshot等'
    },
    {
      label: 'OpenAI',
      value: 'openai',
      capabilities: ['chat'],
      description: 'OpenAI官方API'
    },
    {
      label: 'Gemini',
      value: 'gemini',
      capabilities: ['chat'],
      description: 'Google Gemini（待实现）'
    },
    {
      label: 'Anthropic',
      value: 'anthropic',
      capabilities: ['chat'],
      description: 'Claude（待实现）'
    },
    {
      label: '通义千问',
      value: 'qwen',
      capabilities: ['chat'],
      description: '阿里云通义千问'
    }
  ],
  vision: [
    {
      label: 'OpenAI兼容',
      value: 'openai_compatible',
      capabilities: ['vision'],
      description: '支持多模态的OpenAI兼容API'
    },
    {
      label: 'OpenAI',
      value: 'openai',
      capabilities: ['vision'],
      description: 'OpenAI GPT-4 Vision'
    },
    {
      label: 'Gemini',
      value: 'gemini',
      capabilities: ['vision'],
      description: 'Google Gemini Vision（待实现）'
    }
  ],
  image_gen: [
    {
      label: 'Nano Banana',
      value: 'nano_banana',
      capabilities: ['image_gen'],
      description: 'Gemini 3 Pro Image Preview'
    },
    {
      label: '硅基流动',
      value: 'siliconflow',
      capabilities: ['image_gen'],
      description: '硅基流动文生图（支持Qwen、Kolors等模型）'
    }
  ],
  video_gen: [
    {
      label: 'Runway',
      value: 'runway',
      capabilities: ['video_gen'],
      description: 'Runway Gen-2/Gen-3（待实现）'
    },
    {
      label: 'Pika',
      value: 'pika',
      capabilities: ['video_gen'],
      description: 'Pika Labs（待实现）'
    }
  ],
  embeddings: [
    {
      label: 'OpenAI',
      value: 'openai',
      capabilities: ['embeddings'],
      description: 'OpenAI Embeddings'
    }
  ],
  tools: [
    {
      label: 'OpenAI兼容',
      value: 'openai_compatible',
      capabilities: ['tools'],
      description: '支持Function Calling的模型'
    }
  ],
  code: [
    {
      label: 'OpenAI兼容',
      value: 'openai_compatible',
      capabilities: ['code'],
      description: '代码生成模型'
    }
  ]
}

// 获取能力的Provider选项
export function getProviderOptionsForCapability(capability: ModelCapability): ProviderOption[] {
  return PROVIDER_OPTIONS[capability] || []
}

// 获取能力配置
export function getCapabilityConfig(capability: ModelCapability): CapabilityConfig | undefined {
  return CAPABILITY_CONFIGS.find(c => c.value === capability)
}

// 获取Provider显示标签
export function getProviderLabel(provider: string): string {
  // 遍历所有能力的Provider配置
  for (const capability of Object.keys(PROVIDER_OPTIONS) as ModelCapability[]) {
    const option = PROVIDER_OPTIONS[capability].find(p => p.value === provider)
    if (option) {
      return option.label
    }
  }
  return provider
}

// 获取Provider标签类型
export function getProviderTagType(provider: string): 'primary' | 'success' | 'warning' | 'danger' | 'info' {
  const typeMap: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'info'> = {
    'openai': 'primary',
    'openai_compatible': 'warning',
    'openai_dalle': 'primary',
    'gemini': 'success',
    'gemini_imagen': 'success',
    'anthropic': 'info',
    'nano_banana': 'warning',
    'qwen': 'danger',
    'volcengine_ark': 'info',
    'siliconflow': 'warning',
    'runway': 'danger',
    'pika': 'danger'
  }
  return typeMap[provider] || 'info'
}

