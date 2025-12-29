/**
 * Banana生成API服务
 * 封装所有与banana生成相关的API调用
 */

import { API_CONFIG } from '@/configs/api'
import type {
  GenerateBatchSlidesRequest,
  GenerateBatchSlidesResponse,
  GenerationStatusResponse,
  StopGenerationResponse,
  TemplatesResponse,
  RegenerateSlideRequest,
  OutlineData,
} from '@/types/banana-generation'

/**
 * 标准API响应格式（后端重构后的格式）
 */
interface StandardResponse<T> {
  status: 'success' | 'error'
  message: string
  data: T | null
}

/**
 * 发起API请求的通用方法
 */
async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<StandardResponse<T>> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const result = await response.json()
  return result
}

export const bananaGenerationService = {
  /**
   * 拆分大纲内容
   */
  async splitOutline(
    content: string,
    aiModelId: string
  ): Promise<OutlineData> {
    const response = await apiRequest<OutlineData>(
      API_CONFIG.BANANA_GENERATION.SPLIT_OUTLINE,
      {
        method: 'POST',
        body: JSON.stringify({
          content,
          ai_model_id: aiModelId,
        }),
      }
    )

    if (response.status !== 'success' || !response.data) {
      throw new Error(response.message || '大纲拆分失败')
    }

    return response.data
  },

  /**
   * 批量生成幻灯片图片
   */
  async generateBatchSlides(
    request: GenerateBatchSlidesRequest
  ): Promise<GenerateBatchSlidesResponse> {
    // 转换请求格式：前端使用camelCase，后端使用snake_case
    const backendRequest: Record<string, any> = {
      outline: request.outline,
      generation_model: request.generationModel,
      canvas_size: request.canvasSize,
    }

    // 支持系统模板或自定义模板URL
    if (request.templateId) {
      backendRequest.template_id = request.templateId
    }
    if (request.customTemplateUrl) {
      backendRequest.custom_template_url = request.customTemplateUrl
    }

    const response = await apiRequest<any>(
      API_CONFIG.BANANA_GENERATION.GENERATE_BATCH_SLIDES,
      {
        method: 'POST',
        body: JSON.stringify(backendRequest),
      }
    )

    if (response.status !== 'success' || !response.data) {
      throw new Error(response.message || '生成失败')
    }

    // 转换响应格式：后端使用snake_case，前端使用camelCase
    const backendData = response.data
    return {
      taskId: backendData.task_id,
      celeryTaskId: backendData.celery_task_id,
      totalSlides: backendData.total_slides,
      status: backendData.status as any,
    }
  },

  /**
   * 查询生成状态
   */
  async getGenerationStatus(taskId: string): Promise<GenerationStatusResponse> {
    const response = await apiRequest<any>(
      API_CONFIG.BANANA_GENERATION.GENERATION_STATUS(taskId),
      {
        method: 'GET',
      }
    )

    if (response.status !== 'success' || !response.data) {
      throw new Error(response.message || '查询状态失败')
    }

    // 转换响应格式：后端使用snake_case，前端使用camelCase
    const backendData = response.data
    return {
      taskId: backendData.task_id || taskId,
      status: backendData.status as any,
      progress: {
        total: backendData.progress?.total || 0,
        completed: backendData.progress?.completed || 0,
        failed: backendData.progress?.failed || 0,
        pending: backendData.progress?.pending || 0,
      },
      slides: (backendData.slides || []).map((slide: any) => ({
        index: slide.index,
        title: slide.title || '',
        status: slide.status,
        imageUrl: slide.image_url,
        cosPath: slide.cos_path,
        generationTime: slide.generation_time,
        error: slide.error,
      })),
    }
  },

  /**
   * 停止生成任务
   */
  async stopGeneration(taskId: string): Promise<StopGenerationResponse> {
    const response = await apiRequest<any>(
      API_CONFIG.BANANA_GENERATION.STOP_GENERATION(taskId),
      {
        method: 'POST',
      }
    )

    if (response.status !== 'success' || !response.data) {
      throw new Error(response.message || '停止生成失败')
    }

    return response.data
  },

  /**
   * 重新生成单页
   */
  async regenerateSlide(taskId: string, slideIndex: number): Promise<void> {
    // 转换请求格式：前端使用camelCase，后端使用snake_case
    const backendRequest = {
      task_id: taskId,
      slide_index: slideIndex,
    }

    const response = await apiRequest<void>(
      API_CONFIG.BANANA_GENERATION.REGENERATE_SLIDE,
      {
        method: 'POST',
        body: JSON.stringify(backendRequest),
      }
    )

    if (response.status !== 'success') {
      throw new Error(response.message || '重新生成失败')
    }
  },

  /**
   * 获取模板列表
   */
  async getTemplates(type?: string, aspectRatio?: string): Promise<TemplatesResponse> {
    const params = new URLSearchParams()
    if (type) params.append('type', type)
    if (aspectRatio) params.append('aspect_ratio', aspectRatio)

    const url = `${API_CONFIG.BANANA_GENERATION.TEMPLATES}${params.toString() ? `?${params.toString()}` : ''}`

    const response = await apiRequest<any>(url, {
      method: 'GET',
    })

    if (response.status !== 'success' || !response.data) {
      throw new Error(response.message || '获取模板列表失败')
    }

    // 转换响应格式：后端使用snake_case，前端使用camelCase
    const backendData = response.data
    return {
      templates: (backendData.templates || []).map((template: any) => ({
        id: template.id,
        name: template.name,
        description: template.description,
        coverUrl: template.cover_url,
        fullImageUrl: template.full_image_url,
        type: template.type,
        aspectRatio: template.aspect_ratio,
        usageCount: template.usage_count || 0,
        createdAt: template.created_at || '',
      })),
    }
  },
}

export default bananaGenerationService
