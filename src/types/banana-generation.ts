/**
 * Banana生成相关类型定义
 */

/**
 * PPT大纲结构
 */
export interface OutlineData {
  title: string
  slides: SlideOutline[]
}

/**
 * 单页大纲
 */
export interface SlideOutline {
  title: string
  points: string[]
}

/**
 * Banana模板
 */
export interface BananaTemplate {
  id: string
  name: string
  description?: string
  coverUrl: string
  fullImageUrl: string
  type: 'system' | 'user'
  aspectRatio: '16:9' | '4:3'
  usageCount: number
  createdAt: string
}

/**
 * 生成任务状态
 */
export enum GenerationStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

/**
 * 单页生成结果
 */
export interface SlideGenerationResult {
  index: number
  title: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  imageUrl?: string
  cosPath?: string
  generationTime?: number
  error?: string
}

/**
 * 批量生成请求
 */
export interface GenerateBatchSlidesRequest {
  outline: OutlineData
  templateId: string
  generationModel: string
  canvasSize: {
    width: number
    height: number
  }
}

/**
 * 批量生成响应
 */
export interface GenerateBatchSlidesResponse {
  taskId: string
  celeryTaskId: string
  totalSlides: number
  status: GenerationStatus
}

/**
 * 生成进度响应
 */
export interface GenerationStatusResponse {
  taskId: string
  status: GenerationStatus
  progress: {
    total: number
    completed: number
    failed: number
    pending: number
  }
  slides: SlideGenerationResult[]
}

/**
 * 停止生成响应
 */
export interface StopGenerationResponse {
  taskId: string
  status: GenerationStatus
  completedSlides: number
  totalSlides: number
}

/**
 * 重新生成单页请求
 */
export interface RegenerateSlideRequest {
  taskId: string
  slideIndex: number
}

/**
 * 模板列表响应
 */
export interface TemplatesResponse {
  templates: BananaTemplate[]
}