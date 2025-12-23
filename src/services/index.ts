import axios from './config'
import { API_CONFIG } from '../configs/api'

// export const SERVER_URL = 'http://localhost:5000'
export const SERVER_URL = (import.meta.env.MODE === 'development') ? '/api' : 'https://server.pptist.cn'

interface AIPPTOutlinePayload {
  content: string
  language: string
  model: string
}

interface OutlineGenerationRequest {
  title?: string
  input_content: string
  slide_count?: number
  language?: string
  ai_model_id?: string
}

interface AIPPTPayload {
  content: string
  language: string
  style: string
  model: string
}

interface AIWritingPayload {
  content: string
  command: string
}

interface AIModel {
  id: string
  name: string
  ai_model_name: string
  base_url?: string
  api_key?: string
  capabilities: string[]
  provider_mapping: Record<string, string>
  parameters?: Record<string, any>
  max_tokens?: number
  context_window?: number
  is_enabled: boolean
  is_default: boolean
  created_at?: string
  updated_at?: string
}

interface AIModelCreate {
  name: string
  ai_model_name: string
  base_url?: string
  api_key?: string
  capabilities: string[]
  provider_mapping: Record<string, string>
  parameters?: Record<string, any>
  max_tokens?: number
  context_window?: number
  is_enabled?: boolean
  is_default?: boolean
}

interface AIModelUpdate {
  name?: string
  ai_model_name?: string
  base_url?: string
  api_key?: string
  capabilities?: string[]
  provider_mapping?: Record<string, string>
  parameters?: Record<string, any>
  max_tokens?: number
  context_window?: number
  is_enabled?: boolean
  is_default?: boolean
}

export default {
  getMockData(filename: string): Promise<any> {
    return axios.get(`./mocks/${filename}.json`)
  },

  AIPPT_Outline({
    content,
    language,
    model,
  }: AIPPTOutlinePayload): Promise<any> {
    return fetch(API_CONFIG.GENERATION.OUTLINE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        language,
        model,
        stream: true,
      }),
    })
  },

  AIPPT({
    content,
    language,
    style,
    model,
  }: AIPPTPayload): Promise<any> {
    return fetch(API_CONFIG.GENERATION.SLIDES, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        language,
        model,
        style,
        stream: true,
      }),
    })
  },

  GenerateOutline(payload: OutlineGenerationRequest): Promise<any> {
    return fetch(API_CONFIG.GENERATION.OUTLINE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
  },

  AI_Writing({
    content,
    command,
  }: AIWritingPayload): Promise<any> {
    return fetch('/api/tools/ai_writing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        command,
        stream: true,
      }),
    })
  },

  // 获取AI模型列表
  async getAIModels(capability?: string): Promise<AIModel[]> {
    let url = API_CONFIG.AI_MODELS.LIST
    if (capability) {
      url += `?capability=${capability}`
    }
    
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const result = await response.json()

    if (result.status === 'success' && result.data && result.data.items) {
      return result.data.items
    }
    throw new Error('Invalid response format')
  },

  // 获取支持图片生成的AI模型列表
  async getImageGenerationModels(): Promise<AIModel[]> {
    return this.getAIModels('image_gen')
  },

  // 获取AI模型详情（包含敏感信息如API密钥）
  async getAIModelDetail(modelId: string): Promise<AIModel> {
    const response = await fetch(API_CONFIG.AI_MODELS.DETAIL(modelId))
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const result = await response.json()

    if (result.status === 'success' && result.data) {
      return result.data
    }
    throw new Error('Invalid response format')
  },

  // 创建AI模型
  async createAIModel(modelData: AIModelCreate): Promise<AIModel> {
    const response = await fetch(API_CONFIG.AI_MODELS.CREATE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(modelData),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()

    if (result.status === 'success' && result.data) {
      return result.data
    }
    throw new Error('Invalid response format')
  },

  // 更新AI模型
  async updateAIModel(modelId: string, modelData: AIModelUpdate): Promise<AIModel> {
    const response = await fetch(API_CONFIG.AI_MODELS.UPDATE(modelId), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(modelData),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()

    if (result.status === 'success' && result.data) {
      return result.data
    }
    throw new Error('Invalid response format')
  },

  // 删除AI模型
  async deleteAIModel(modelId: string): Promise<boolean> {
    const response = await fetch(API_CONFIG.AI_MODELS.DELETE(modelId), {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()

    if (result.status === 'success') {
      return true
    }
    throw new Error('Invalid response format')
  },
}