/**
 * AI图片生成相关类型定义
 */

export interface GenerationForm {
  prompt: string
  generation_model: string
  width: number
  height: number
  quality: string
  style: string
  search_enabled: boolean
  match_threshold: number
  confidence_threshold: number
  search_limit: number
  ref_images?: string[] // 参考图片列表（base64或URL）
  aspect_ratio?: string // 图片比例（如 "16:9"）
  resolution?: string // 分辨率（如 "2K"）
}

export interface ModelInfo {
  id: string
  name: string
  ai_model_name: string
  base_url?: string
  api_key?: string
  capabilities: string[]
  provider_mapping: Record<string, string>
  parameters?: Record<string, any>
  max_tokens?: number
  is_enabled: boolean
  is_default: boolean
  
  // 便捷字段：图片生成的provider（从provider_mapping获取）
  provider?: string
  created_at?: string
}

export interface GeneratedImage {
  id: string
  url: string
  prompt: string
  generation_model: string
  width: number
  height: number
  status: 'generating' | 'success' | 'error'
  timestamp: Date
  reused?: boolean
  created_at?: string
  error?: string
}

export interface LogEntry {
  id: string
  timestamp: Date
  level: 'info' | 'success' | 'warning' | 'error'
  message: string
}

export interface GenerationState {
  loading: boolean
  storeLoading: boolean
  currentStep: string
  generatedImages: GeneratedImage[]
  logs: LogEntry[]
  availableModels: ModelInfo[]
  previewImage: GeneratedImage | null
  previewVisible: boolean
}