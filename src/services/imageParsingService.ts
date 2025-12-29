/**
 * 图片解析服务
 * 封装图片文字识别相关的API调用
 */

import axios from 'axios'
import { API_CONFIG } from '@/configs/api'
import type {
  ImageParseResult,
  ParseTaskResponse,
  ParseStatusResponse,
  ParseRequest
} from '@/types/imageParsing'

/**
 * 图片解析服务
 */
export const imageParsingService = {
  /**
   * 解析图片中的文字
   * @param slideId 幻灯片ID
   * @param cosKey 图片的COS Key
   * @returns 解析任务响应
   */
  async parseSlideImage(
    slideId: string,
    cosKey: string
  ): Promise<ParseTaskResponse> {
    const response = await axios.post(API_CONFIG.IMAGE_PARSING.PARSE, {
      slide_id: slideId,
      cos_key: cosKey
    })

    if (response.data.status === 'success') {
      return response.data.data
    }

    throw new Error(response.data.message || '解析失败')
  },

  /**
   * 查询解析状态
   * @param taskId 任务ID
   * @returns 解析结果
   */
  async getParsingStatus(taskId: string): Promise<ParseStatusResponse> {
    const response = await axios.get(
      API_CONFIG.IMAGE_PARSING.STATUS(taskId)
    )

    if (response.data.status === 'success') {
      return response.data.data
    }

    throw new Error(response.data.message || '查询状态失败')
  },

  /**
   * 轮询解析结果直到完成
   * @param taskId 任务ID
   * @param onProgress 进度回调
   * @param interval 轮询间隔（毫秒）
   * @returns 完整的解析结果
   */
  async pollParsingResult(
    taskId: string,
    onProgress?: (progress: number, status: string) => void,
    interval: number = 1000
  ): Promise<ImageParseResult> {
    let attempts = 0
    const maxAttempts = 60 // 最多轮询60次

    while (attempts < maxAttempts) {
      const result = await this.getParsingStatus(taskId)

      // 通知进度
      if (onProgress) {
        onProgress(result.progress, result.status)
      }

      // 检查是否完成
      if (result.status === 'completed') {
        return {
          task_id: result.task_id,
          slide_id: result.slide_id,
          cos_key: result.cos_key,
          status: result.status,
          progress: result.progress,
          text_regions: result.text_regions || [],
          metadata: result.metadata!
        }
      }

      // 检查是否失败
      if (result.status === 'failed') {
        throw new Error(result.message || '解析失败')
      }

      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, interval))
      attempts++
    }

    throw new Error('解析超时')
  }
}

export default imageParsingService
