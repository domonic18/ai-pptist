/**
 * Banana生成Hook
 * 处理PPT图片生成的完整流程：创建任务、轮询状态、更新幻灯片
 */

import { ref, onUnmounted } from 'vue'
import { useSlidesStore, useMainStore } from '@/store'
import bananaGenerationService from '@/services/bananaGenerationService'
import {
  GenerationStatus,
  type GenerateBatchSlidesRequest,
  type GenerationStatusResponse,
} from '@/types/banana-generation'
import message from '@/utils/message'
import { nanoid } from 'nanoid'
import type { Slide, PPTElement, PPTImageElement } from '@/types/slides'

const POLL_INTERVAL = 2000 // 2秒轮询一次

export default function useBananaGeneration() {
  const slidesStore = useSlidesStore()
  const mainStore = useMainStore()

  const isGenerating = ref(false)
  const currentTaskId = ref<string | null>(null)
  const pollTimer = ref<number | null>(null)

  /**
   * 创建空幻灯片（带骨架图占位符）
   * 使用纯色背景和文字，避免依赖外部图片文件
   */
  const createEmptySlides = (totalSlides: number) => {
    const newSlides: Slide[] = []

    for (let i = 0; i < totalSlides; i++) {
      const slide: Slide = {
        id: nanoid(10),
        elements: [
          // 加载文字 - 居中显示
          {
            type: 'text',
            id: nanoid(10),
            left: slidesStore.viewportSize / 2 - 150,
            top: slidesStore.viewportSize * slidesStore.viewportRatio / 2 - 20,
            width: 300,
            height: 40,
            rotate: 0,
            content: `<p style="text-align: center; font-size: 28px; color: #999;">正在生成第 ${i + 1} 页图片...</p>`,
            defaultColor: '#999',
            defaultFontName: 'Microsoft YaHei',
            fontSize: 28,
            fontFamily: 'Microsoft YaHei',
            textType: 'title',
          } as PPTElement,
        ],
        background: {
          type: 'solid',
          color: '#f0f0f0', // 浅灰色背景作为占位符
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
  const updateSlideImage = (slideIndex: number, imageUrl: string, cosPath?: string) => {
    if (slideIndex < 0 || slideIndex >= slidesStore.slides.length) {
      console.warn(`幻灯片索引 ${slideIndex} 超出范围`)
      return
    }

    const slide = slidesStore.slides[slideIndex]

    // 替换所有元素为单个图片元素
    // 使用固定的 ID 前缀 + 索引，确保在同一次生成任务中 ID 稳定，避免重复渲染导致的闪烁
    const imageElement: PPTImageElement = {
      type: 'image',
      id: `banana-image-${slideIndex}`,
      left: 0,
      top: 0,
      width: slidesStore.viewportSize,
      height: slidesStore.viewportSize * slidesStore.viewportRatio,
      rotate: 0,
      src: imageUrl,
      fixedRatio: true,
      imageInfo: cosPath ? {
        id: nanoid(10),
        cosKey: cosPath,
      } : undefined,
    }

    // 更新幻灯片
    slidesStore.updateSlide(
      {
        elements: [imageElement],
      },
      slide.id
    )

    console.log(`幻灯片 ${slideIndex + 1} 图片已更新:`, { cosPath, imageUrl })
  }

  /**
   * 轮询生成状态
   */
  const pollGenerationStatus = async () => {
    if (!currentTaskId.value) {
      return
    }

    // 先清除之前的定时器，防止多个轮询循环同时运行
    stopPolling()

    try {
      const statusData = await bananaGenerationService.getGenerationStatus(
        currentTaskId.value
      )

      // 更新已完成的幻灯片图片
      if (statusData.slides) {
        statusData.slides.forEach((slide) => {
          // 只有状态为已完成时才尝试更新图片
          if (slide.status === 'completed') {
            const currentSlide = slidesStore.slides[slide.index]
            if (!currentSlide) return

            // 检查当前幻灯片是否已经是图片（即已经更新过）
            // 只有当它还是初始状态（骨架图）时才执行更新
            const hasImage = currentSlide.elements.some(el => el.type === 'image')
            if (!hasImage) {
              const imagePath = slide.cosPath || slide.imageUrl
              if (imagePath) {
                updateSlideImage(slide.index, imagePath, slide.cosPath)
              }
            }
          }
        })
      }

      // 判断是否继续轮询
      if (statusData.status === GenerationStatus.PROCESSING) {
        // 还在生成中，继续轮询
        pollTimer.value = window.setTimeout(() => {
          pollGenerationStatus()
        }, POLL_INTERVAL)
      } 
      else if (statusData.status === GenerationStatus.COMPLETED) {
        // 全部完成
        isGenerating.value = false
        const failedCount = statusData.progress.failed || 0
        if (failedCount === 0) {
          message.success('幻灯片生成成功！')
        } 
        else {
          message.warning(`幻灯片生成完成，${failedCount} 页生成失败`)
        }
        stopPolling()
      } 
      else if (statusData.status === GenerationStatus.FAILED) {
        // 任务失败
        isGenerating.value = false
        message.error('幻灯片生成失败')
        stopPolling()
      } 
      else if (statusData.status === GenerationStatus.CANCELLED) {
        // 任务已取消
        isGenerating.value = false
        message.info('生成任务已取消')
        stopPolling()
      }
    } 
    catch (error) {
      // 捕获异常，继续重试
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
    } 
    catch (error: any) {
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
    } 
    catch (error: any) {
      message.error(error.message || '停止生成失败')
    }
  }

  /**
   * 将单页幻灯片重置为加载状态
   */
  const resetSlideToLoading = (slideIndex: number) => {
    if (slideIndex < 0 || slideIndex >= slidesStore.slides.length) return

    const slide = slidesStore.slides[slideIndex]
    const loadingElement: PPTElement = {
      type: 'text',
      id: nanoid(10),
      left: slidesStore.viewportSize / 2 - 150,
      top: slidesStore.viewportSize * slidesStore.viewportRatio / 2 - 20,
      width: 300,
      height: 40,
      rotate: 0,
      content: `<p style="text-align: center; font-size: 28px; color: #999;">正在重新生成第 ${slideIndex + 1} 页图片...</p>`,
      defaultColor: '#999',
      defaultFontName: 'Microsoft YaHei',
      fontSize: 28,
      fontFamily: 'Microsoft YaHei',
      textType: 'title',
    } as PPTElement

    slidesStore.updateSlide(
      {
        elements: [loadingElement],
        background: {
          type: 'solid',
          color: '#f0f0f0',
        },
      },
      slide.id
    )
  }

  /**
   * 重新生成单页
   */
  const regenerateSlide = async (slideIndex: number) => {
    if (!currentTaskId.value) {
      return
    }

    try {
      // 先将该页重置为加载状态，以便轮询逻辑能识别并更新它
      resetSlideToLoading(slideIndex)

      await bananaGenerationService.regenerateSlide(currentTaskId.value, slideIndex)
      message.success(`已开始重新生成第 ${slideIndex + 1} 页`)

      // 重新开始轮询
      if (!isGenerating.value) {
        isGenerating.value = true
      }
      pollGenerationStatus()
    } 
    catch (error: any) {
      // 错误处理
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
    } 
    catch (error) {
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
