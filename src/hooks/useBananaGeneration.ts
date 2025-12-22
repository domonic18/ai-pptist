/**
 * Banana生成Hook
 * 管理生成状态和轮询逻辑
 */

import { ref, computed } from 'vue'
import type { Ref } from 'vue'
import { ElMessage } from 'element-plus'
import bananaGenerationService from '@/services/bananaGenerationService'
import type {
  OutlineData,
  BananaTemplate,
  GenerationStatus,
  SlideGenerationResult,
  GenerationStatusResponse
} from '@/types/banana-generation'

/**
 * 轮询状态
 */
enum PollStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  STOPPED = 'stopped',
  ERROR = 'error'
}

/**
 * 使用Banana批量生成
 */
export function useBananaGeneration() {
  const currentTaskId: Ref<string | null> = ref(null)
  const generationStatus: Ref<GenerationStatus | null> = ref(null)
  const slidesResults: Ref<SlideGenerationResult[]> = ref([])
  const isGenerating = ref(false)
  const pollStatus = ref<PollStatus>(PollStatus.IDLE)
  const pollInterval: Ref<number | null> = ref(null)

  // 计算进度百分比
  const progress = computed(() => {
    const total = slidesResults.value.length
    const completed = slidesResults.value.filter(s => s.status === 'completed').length
    return total > 0 ? Math.round((completed / total) * 100) : 0
  })

  // 计算是否还有正在处理的幻灯片
  const hasProcessingSlides = computed(() => {
    return slidesResults.value.some(s => s.status === 'processing')
  })

  // 计算已完成幻灯片数
  const completedSlidesCount = computed(() => {
    return slidesResults.value.filter(s => s.status === 'completed').length
  })

  /**
   * 开始批量生成
   */
  const startGeneration = async (
    outline: OutlineData,
    template: BananaTemplate,
    generationModel: string = 'gemini-3-pro-image-preview',
    canvasSize: { width: number; height: number } = { width: 1920, height: 1080 }
  ) => {
    try {
      isGenerating.value = true
      pollStatus.value = PollStatus.RUNNING

      // 调用API开始生成
      const response = await bananaGenerationService.generateBatchSlides({
        outline,
        templateId: template.id,
        generationModel,
        canvasSize
      })

      // 检查响应结构
      if (!response || !response.success) {
        throw new Error(response?.error?.message || '生成任务启动失败')
      }

      const data = response.data || {}
      currentTaskId.value = data.taskId

      // 初始化幻灯片结果列表
      slidesResults.value = outline.slides.map((slide, index) => ({
        index,
        title: slide.title,
        status: 'pending',
        imageUrl: undefined
      }))

      // 开始轮询
      startPolling()

      ElMessage.success('生成任务已启动')

      return currentTaskId.value
    } catch (error: any) {
      console.error('启动生成失败:', error)
      ElMessage.error(error.message || '启动生成失败')
      isGenerating.value = false
      pollStatus.value = PollStatus.ERROR
      throw error
    }
  }

  /**
   * 开始轮询状态
   */
  const startPolling = () => {
    if (!currentTaskId.value) return

    pollStatus.value = PollStatus.RUNNING

    pollInterval.value = window.setInterval(async () => {
      await pollGenerationStatus()
    }, 2000) as unknown as number
  }

  /**
   * 停止轮询
   */
  const stopPolling = () => {
    if (pollInterval.value) {
      clearInterval(pollInterval.value)
      pollInterval.value = null
    }
    pollStatus.value = PollStatus.STOPPED
  }

  /**
   * 查询生成状态（轮询核心逻辑）
   */
  const pollGenerationStatus = async () => {
    if (!currentTaskId.value) return

    try {
      const response = await bananaGenerationService.getGenerationStatus(currentTaskId.value)

      if (!response || !response.success) {
        throw new Error(response?.error?.message || '查询状态失败')
      }

      const data: GenerationStatusResponse = response.data

      // 更新状态
      generationStatus.value = data.status
      slidesResults.value = data.slides

      // 检查是否需要停止轮询
      if (data.status === 'completed' || data.status === 'failed') {
        stopPolling()
        isGenerating.value = false

        const completedCount = data.progress.completed
        const failedCount = data.progress.failed

        // 显示最终结果
        if (data.status === 'completed') {
          if (failedCount > 0) {
            ElMessage.warning(`生成完成，${failedCount}页失败`)
          } else {
            ElMessage.success('幻灯片生成成功！')
          }
        } else {
          ElMessage.error('幻灯片生成失败')
        }
      }
    } catch (error: any) {
      console.error('查询生成状态失败:', error)

      if (pollStatus.value === PollStatus.RUNNING) {
        stopPolling()
        pollStatus.value = PollStatus.ERROR
        isGenerating.value = false
      }

      ElMessage.error('查询生成状态失败，请刷新页面重试')
    }
  }

  /**
   * 停止生成
   */
  const stopGeneration = async () => {
    if (!currentTaskId.value || !isGenerating.value) return

    try {
      await bananaGenerationService.stopGeneration(currentTaskId.value)
      stopPolling()
      isGenerating.value = false
      ElMessage.info('已停止生成')
    } catch (error: any) {
      console.error('停止生成失败:', error)
      ElMessage.error('停止生成失败')
    }
  }

  /**
   * 重新生成单页
   */
  const regenerateSlide = async (slideIndex: number) => {
    if (!currentTaskId.value) {
      ElMessage.error('当前没有进行中的生成任务')
      return
    }

    try {
      await bananaGenerationService.regenerateSlide({
        task_id: currentTaskId.value,
        slide_index: slideIndex
      })

      // 更新状态为处理中
      const slide = slidesResults.value.find(s => s.index === slideIndex)
      if (slide) {
        slide.status = 'processing'
      }

      ElMessage.success('重新生成已启动')

      // 如果轮询已停止，重新开始
      if (pollStatus.value !== PollStatus.RUNNING) {
        startPolling()
      }
    } catch (error: any) {
      console.error('重新生成失败:', error)
      ElMessage.error('重新生成失败')
    }
  }

  /**
   * 重置状态
   */
  const reset = () => {
    stopPolling()
    currentTaskId.value = null
    generationStatus.value = null
    slidesResults.value = []
    isGenerating.value = false
    pollStatus.value = PollStatus.IDLE
  }

  return {
    // 状态
    currentTaskId,
    generationStatus,
    slidesResults,
    isGenerating,
    pollStatus,

    // 计算属性
    progress,
    hasProcessingSlides,
    completedSlidesCount,

    // 方法
    startGeneration,
    stopGeneration,
    regenerateSlide,
    pollGenerationStatus,
    reset
  }
}
