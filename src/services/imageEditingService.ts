/**
 * 图片编辑服务
 * 封装MinerU、混合OCR识别和图片编辑的API调用
 */

import axios from 'axios'
import { API_CONFIG } from '@/configs/api'
import { POLLING_CONFIG, type PollingConfig } from '@/configs/polling'
import type {
  EditingTaskResponse,
  EditingStatusResponse,
  EditingResultResponse,
} from '@/types/imageEditing'

/**
 * MinerU识别选项
 */
export interface MinerUParseOptions {
  enable_formula?: boolean;
  enable_table?: boolean;
  enable_style_recognition?: boolean;
  remove_text?: boolean;
}

/**
 * 轮询控制器
 * 用于中断正在进行的轮询
 */
export class PollingController {
  private aborted = false

  /**
   * 中断轮询
   */
  abort(): void {
    this.aborted = true
  }

  /**
   * 检查是否已中断
   */
  isAborted(): boolean {
    return this.aborted
  }

  /**
   * 重置控制器状态
   */
  reset(): void {
    this.aborted = false
  }
}

/**
 * 图片编辑服务
 */
export const imageEditingService = {
  /**
   * 使用MinerU识别图片（精确坐标 + 多模态样式）
   * @param slideId 幻灯片ID
   * @param cosKey 图片COS Key
   * @param options 识别选项
   * @returns 解析任务响应
   */
  async parseWithMinerU(
    slideId: string,
    cosKey: string,
    options: MinerUParseOptions = {},
  ): Promise<EditingTaskResponse> {
    const response = await axios.post(
      API_CONFIG.IMAGE_EDITING.PARSE_WITH_MINERU,
      {
        slide_id: slideId,
        cos_key: cosKey,
        enable_formula: options.enable_formula !== false,
        enable_table: options.enable_table !== false,
        enable_style_recognition: options.enable_style_recognition !== false,
        remove_text: options.remove_text || false,
      },
    )

    if (response.data.status === 'success') {
      return response.data.data
    }

    throw new Error(response.data.message || 'MinerU识别失败')
  },

  /**
   * 混合OCR识别
   * @param slideId 幻灯片ID
   * @param cosKey 图片COS Key
   * @returns 解析任务响应
   */
  async parseWithHybridOCR(
    slideId: string,
    cosKey: string,
  ): Promise<EditingTaskResponse> {
    const response = await axios.post(
      API_CONFIG.IMAGE_EDITING.PARSE_HYBRID_OCR,
      {
        slide_id: slideId,
        cos_key: cosKey,
      },
    )

    if (response.data.status === 'success') {
      return response.data.data
    }

    throw new Error(response.data.message || '混合OCR识别失败')
  },

  /**
   * 一步完成：OCR识别 + 文字去除
   * @param slideId 幻灯片ID
   * @param cosKey 图片COS Key
   * @param aiModelId AI模型ID（可选，用于文字去除）
   * @param ocrEngine OCR引擎：mineru | hybrid_ocr（默认hybrid_ocr）
   * @returns 解析任务响应
   */
  async parseAndRemoveText(
    slideId: string,
    cosKey: string,
    aiModelId?: string,
    ocrEngine?: 'mineru' | 'hybrid_ocr',
  ): Promise<EditingTaskResponse> {
    const response = await axios.post(
      API_CONFIG.IMAGE_EDITING.PARSE_AND_REMOVE,
      {
        slide_id: slideId,
        cos_key: cosKey,
        ai_model_id: aiModelId || null,
        ocr_engine: ocrEngine || 'hybrid_ocr',
      },
    )

    if (response.data.status === 'success') {
      return response.data.data
    }

    throw new Error(response.data.message || '图片编辑失败')
  },

  /**
   * 查询任务状态
   * @param taskId 任务ID
   * @returns 任务状态响应
   */
  async getEditingStatus(taskId: string): Promise<EditingStatusResponse> {
    const response = await axios.get(API_CONFIG.IMAGE_EDITING.STATUS(taskId))

    if (response.data.status === 'success') {
      return response.data.data
    }

    throw new Error(response.data.message || '查询状态失败')
  },

  /**
   * 轮询获取完整结果（增强版 - 支持无限制轮询和中断）
   * @param taskId 任务ID
   * @param onProgress 进度回调
   * @param controller 轮询控制器（用于中断）
   * @param config 轮询配置
   * @returns 完整的编辑结果
   */
  async pollEditingResult(
    taskId: string,
    onProgress?: (progress: number, status: string) => void,
    controller?: PollingController,
    config: Partial<PollingConfig> = {},
  ): Promise<EditingResultResponse> {
    const finalConfig = { ...POLLING_CONFIG.IMAGE_EDITING, ...config }

    const startTime = Date.now()

    // 无限制轮询，直到任务完成、失败或被中断
    // eslint-disable-next-line no-constant-condition
    while (true) {
      // 检查是否被中断
      if (controller?.isAborted()) {
        throw new Error('轮询已取消')
      }

      const result = await this.getEditingStatus(taskId)

      // 通知进度（包含已用时间）
      if (onProgress) {
        const elapsed = Date.now() - startTime
        const elapsedSeconds = Math.floor(elapsed / 1000)
        const minutes = Math.floor(elapsedSeconds / 60)
        const seconds = elapsedSeconds % 60
        const timeStr = minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`

        onProgress(
          result.progress,
          `${result.status} (已等待: ${timeStr})`,
        )
      }

      // 检查是否完成
      if (result.status === 'completed') {
        return {
          task_id: result.task_id,
          slide_id: result.slide_id,
          status: result.status,
          progress: result.progress,
          ocr_result: result.ocr_result,
          edited_image: result.edited_image,
        }
      }

      // 检查是否失败
      if (result.status === 'failed') {
        throw new Error(result.message || '编辑失败')
      }

      // 等待后重试（固定间隔）
      await new Promise((resolve) => setTimeout(resolve, finalConfig.interval))
    }
  },
}

export default imageEditingService
