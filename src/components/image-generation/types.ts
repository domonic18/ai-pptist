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
}

export interface ModelInfo {
  id: string
  name: string
  provider: string
  is_enabled: boolean
  is_default: boolean
  ai_model_name?: string
  base_url?: string
  api_key?: string
  parameters?: string
  max_tokens?: string
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