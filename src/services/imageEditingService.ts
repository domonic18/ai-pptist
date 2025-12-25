/**
 * 图片编辑服务
 * 封装混合OCR识别和图片编辑的API调用
 */

import axios from 'axios'
import { API_CONFIG } from '@/configs/api'
import type {
  EditingTaskResponse,
  EditingStatusResponse,
  EditingResultResponse,
  HybridOCRResult
} from '@/types/imageEditing'

/**
 * 图片编辑服务
 */
export const imageEditingService = {
  /**
   * 混合OCR识别
   * @param slideId 幻灯片ID
   * @param cosKey 图片COS Key
   * @returns 解析任务响应
   */
  async parseWithHybridOCR(
    slideId: string,
    cosKey: string
  ): Promise<EditingTaskResponse> {
    const response = await axios.post(API_CONFIG.IMAGE_EDITING.PARSE_HYBRID_OCR, {
      slide_id: slideId,
      cos_key: cosKey
    })

    if (response.data.success) {
      return response.data.data
    }

    throw new Error(response.data.error?.message || '混合OCR识别失败')
  },

  /**
   * 一步完成：OCR识别 + 文字去除
   * @param slideId 幻灯片ID
   * @param cosKey 图片COS Key
   * @param aiModelId AI模型ID（可选，用于文字去除）
   * @returns 解析任务响应
   */
  async parseAndRemoveText(
    slideId: string,
    cosKey: string,
    aiModelId?: string
  ): Promise<EditingTaskResponse> {
    const response = await axios.post(API_CONFIG.IMAGE_EDITING.PARSE_AND_REMOVE, {
      slide_id: slideId,
      cos_key: cosKey,
      ai_model_id: aiModelId || null
    })

    if (response.data.success) {
      return response.data.data
    }

    throw new Error(response.data.error?.message || '图片编辑失败')
  },

  /**
   * 查询任务状态
   * @param taskId 任务ID
   * @returns 任务状态响应
   */
  async getEditingStatus(taskId: string): Promise<EditingStatusResponse> {
    const response = await axios.get(
      API_CONFIG.IMAGE_EDITING.STATUS(taskId)
    )

    if (response.data.success) {
      return response.data.data
    }

    throw new Error(response.data.error?.message || '查询状态失败')
  },

  /**
   * 轮询获取完整结果
   * @param taskId 任务ID
   * @param onProgress 进度回调
   * @param interval 轮询间隔（毫秒）
   * @returns 完整的编辑结果
   */
  async pollEditingResult(
    taskId: string,
    onProgress?: (progress: number, status: string) => void,
    interval: number = 2000
  ): Promise<EditingResultResponse> {
    const maxAttempts = 60
    let attempts = 0

    while (attempts < maxAttempts) {
      const result = await this.getEditingStatus(taskId)

      // 通知进度
      if (onProgress) {
        onProgress(result.progress, result.status)
      }

      // 检查是否完成
      if (result.status === 'completed') {
        return {
          task_id: result.task_id,
          slide_id: result.slide_id,
          status: result.status,
          progress: result.progress,
          ocr_result: result.ocr_result,
          edited_image: result.edited_image
        }
      }

      // 检查是否失败
      if (result.status === 'failed') {
        throw new Error(result.message || '编辑失败')
      }

      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, interval))
      attempts++
    }

    throw new Error('编辑超时')
  }
}

export default imageEditingService
