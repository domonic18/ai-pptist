/**
 * Banana生成服务
 * 与后端API进行交互的服务模块
 */

import request from '@/utils/request'
import type {
  GenerateBatchSlidesRequest,
  GenerateBatchSlidesResponse,
  GenerationStatusResponse,
  StopGenerationResponse,
  TemplatesResponse,
  RegenerateSlideRequest
} from '@/types/banana-generation'

/**
 * Banana生成服务
 */
export const bananaGenerationService = {
  /**
   * 批量生成幻灯片图片
   */
  async generateBatchSlides(request: GenerateBatchSlidesRequest): Promise<any> {
    return request.post('/v1/banana_generation/generate_batch_slides', request)
  },

  /**
   * 查询生成状态
   */
  async getGenerationStatus(taskId: string): Promise<any> {
    return request.get(`/v1/banana_generation/generation_status/${taskId}`)
  },

  /**
   * 停止生成任务
   */
  async stopGeneration(taskId: string): Promise<any> {
    return request.post(`/v1/banana_generation/stop_generation/${taskId}`)
  },

  /**
   * 重新生成单页
   */
  async regenerateSlide(request: RegenerateSlideRequest): Promise<any> {
    return request.post('/v1/banana_generation/regenerate_slide', request)
  },

  /**
   * 获取模板列表
   */
  async getTemplates(): Promise<any> {
    return request.get('/v1/banana_generation/templates')
  }
}

export default bananaGenerationService
