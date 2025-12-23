/**
 * Banana生成Hook
 * 处理PPT图片生成的完整流程：创建任务、轮询状态、更新幻灯片
 */

import { ref, onUnmounted } from 'vue'
import { useSlidesStore, useMainStore } from '@/store'
import bananaGenerationService from '@/services/bananaGenerationService'
import type {
  GenerateBatchSlidesRequest,
  GenerationStatusResponse,
} from '@/types/banana-generation'
import { GenerationStatus } from '@/types/banana-generation'
import message from '@/utils/message'
import { nanoid } from 'nanoid'
import type { Slide, PPTElement } from '@/types/slides'

const POLL_INTERVAL = 2000 // 2秒轮询一次

export default function useBananaGeneration() {
  const slidesStore = useSlidesStore()
  const mainStore = useMainStore()

  const isGenerating = ref(false)
  const currentTaskId = ref<string | null>(null)
  const pollTimer = ref<number | null>(null)

  /**
   * 创建空幻灯片（带骨架图占位符）
   */
  const createEmptySlides = (totalSlides: number) => {
    const newSlides: Slide[] = []

    for (let i = 0; i < totalSlides; i++) {
      const slide: Slide = {
        id: nanoid(10),
        elements: [
          // 骨架图占位符
          {
            type: 'image',
            id: nanoid(10),
            left: 0,
            top: 0,
            width: slidesStore.viewportSize,
            height: slidesStore.viewportSize * slidesStore.viewportRatio,
            src: '/imgs/skeleton-loading.gif', // 使用骨架图
            fixedRatio: true,
          } as PPTElement,
          // 加载文字
          {
            type: 'text',
            id: nanoid(10),
            left: slidesStore.viewportSize / 2 - 100,
            top: slidesStore.viewportSize * slidesStore.viewportRatio / 2 - 20,
            width: 200,
            height: 40,
            content: '正在生成图片...',
            defaultColor: '#999',
          } as PPTElement,
        ],
        background: {
          type: 'solid',
          color: '#f5f5f5',
        },
      }
      newSlides.push(slide)
    }

    // 设置幻灯片
    slidesStore.setSlides(newSlides)
    slidesStore.updateSlideIndex(0)
  }

  /**
   * 更新幻灯片图片
   */
  const updateSlideImage = (slideIndex: number, imageUrl: string) => {
    if (slideIndex < 0 || slideIndex >= slidesStore.slides.length) {
      console.warn(`幻灯片索引 ${slideIndex} 超出范围`)
      return
    }

    const slide = slidesStore.slides[slideIndex]

    // 替换所有元素为单个图片元素
    const imageElement: PPTElement = {
      type: 'image',
      id: nanoid(10),
      left: 0,
      top: 0,
      width: slidesStore.viewportSize,
      height: slidesStore.viewportSize * slidesStore.viewportRatio,
      src: imageUrl,
      fixedRatio: true,
    }

    // 更新幻灯片
    slidesStore.updateSlide(
      {
        elements: [imageElement],
      },
      slide.id
    )

    console.log(`幻灯片 ${slideIndex + 1} 图片已更新`)
  }

  /**
   * 轮询生成状态
   */
  const pollGenerationStatus = async () => {
    if (!currentTaskId.value) {
      return
    }

    try {
      const statusData = await bananaGenerationService.getGenerationStatus(
        currentTaskId.value
      )

      // 更新已完成的幻灯片图片
      if (statusData.slides) {
        statusData.slides.forEach((slide) => {
          if (slide.status === 'completed' && slide.imageUrl) {
            updateSlideImage(slide.index, slide.imageUrl)
          }
        })
      }

      // 判断是否继续轮询
      if (statusData.status === GenerationStatus.PROCESSING) {
        // 还在生成中，继续轮询
        pollTimer.value = window.setTimeout(() => {
          pollGenerationStatus()
        }, POLL_INTERVAL)
      } else if (statusData.status === GenerationStatus.COMPLETED) {
        // 全部完成
        isGenerating.value = false
        const failedCount = statusData.progress.failed || 0
        if (failedCount === 0) {
          message.success('幻灯片生成成功！')
        } else {
          message.warning(`幻灯片生成完成，${failedCount} 页生成失败`)
        }
        stopPolling()
      } else if (statusData.status === GenerationStatus.FAILED) {
        // 任务失败
        isGenerating.value = false
        message.error('幻灯片生成失败')
        stopPolling()
      } else if (statusData.status === GenerationStatus.CANCELLED) {
        // 任务已取消
        isGenerating.value = false
        message.info('生成任务已取消')
        stopPolling()
      }
    } catch (error) {
      console.error('查询生成状态失败:', error)
      // 继续重试
      pollTimer.value = window.setTimeout(() => {
        pollGenerationStatus()
      }, POLL_INTERVAL)
    }
  }

  /**
   * 停止轮询
   */
  const stopPolling = () => {
    if (pollTimer.value !== null) {
      clearTimeout(pollTimer.value)
      pollTimer.value = null
    }
  }

  /**
   * 开始生成PPT图片
   */
  const startGeneration = async (request: GenerateBatchSlidesRequest) => {
    if (isGenerating.value) {
      message.warning('正在生成中，请稍候...')
      return false
    }

    try {
      isGenerating.value = true

      // 创建空幻灯片（带骨架图）
      createEmptySlides(request.outline.slides.length)

      // 跳转到编辑页面
      mainStore.setAIPPTDialogState(false)

      // 调用API开始生成
      const response = await bananaGenerationService.generateBatchSlides(request)
      currentTaskId.value = response.taskId

      // 开始轮询状态
      pollGenerationStatus()

      return true
    } catch (error: any) {
      console.error('开始生成失败:', error)
      message.error(error.message || '开始生成失败')
      isGenerating.value = false
      return false
    }
  }

  /**
   * 停止生成
   */
  const stopGeneration = async () => {
    if (!currentTaskId.value) {
      return
    }

    try {
      await bananaGenerationService.stopGeneration(currentTaskId.value)
      stopPolling()
      isGenerating.value = false
      message.info('已停止生成')
    } catch (error: any) {
      console.error('停止生成失败:', error)
      message.error(error.message || '停止生成失败')
    }
  }

  /**
   * 重新生成单页
   */
  const regenerateSlide = async (slideIndex: number) => {
    if (!currentTaskId.value) {
      return
    }

    try {
      await bananaGenerationService.regenerateSlide(currentTaskId.value, slideIndex)
      message.success(`已开始重新生成第 ${slideIndex + 1} 页`)

      // 重新开始轮询
      if (!isGenerating.value) {
        isGenerating.value = true
      }
      pollGenerationStatus()
    } catch (error: any) {
      console.error('重新生成失败:', error)
      message.error(error.message || '重新生成失败')
    }
  }

  /**
   * 获取当前生成状态（用于进度对话框）
   */
  const getCurrentStatus = async (): Promise<GenerationStatusResponse | null> => {
    if (!currentTaskId.value) {
      return null
    }

    try {
      return await bananaGenerationService.getGenerationStatus(currentTaskId.value)
    } catch (error) {
      console.error('获取生成状态失败:', error)
      return null
    }
  }

  // 组件卸载时清理定时器
  onUnmounted(() => {
    stopPolling()
  })

  return {
    isGenerating,
    currentTaskId,
    startGeneration,
    stopGeneration,
    regenerateSlide,
    getCurrentStatus,
    stopPolling,
  }
}
