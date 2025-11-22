/**
 * 自动标注功能组合式函数
 *
 * 提供单页标注和批量标注功能，包括截图生成、API调用和结果应用
 */

import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useSlidesStore } from '@/store'
import { useModelStore } from '@/store/model'
import { generateScreenshotsFromContainer } from '@/utils/screenshotHelper'
import { useAnnotationApplication } from './useAnnotationApplication'
import type { AnnotationResult } from './types'

/**
 * 自动标注功能组合式函数
 */
export function useAutoAnnotation() {
  const slidesStore = useSlidesStore()
  const modelStore = useModelStore()
  const { applyAnnotationResults } = useAnnotationApplication()

  // 状态定义
  const isAnnotatingCurrent = ref(false)
  const isAnnotatingAll = ref(false)

  // 进度信息
  const annotatingSlideIndex = ref(0)
  const totalSlidesToAnnotate = ref(0)
  const annotatingProgress = ref(0)

  // 结果统计
  const successCount = ref(0)
  const failedCount = ref(0)

  // 计算属性
  const totalSlides = computed(() => slidesStore.slides.length)

  const annotatingSlideTitle = computed(() => {
    const slide = slidesStore.slides[annotatingSlideIndex.value - 1]
    return slide ? getSlideTitle(slide) : ''
  })

  const showProgress = computed(() => {
    return isAnnotatingCurrent.value || isAnnotatingAll.value
  })

  const showStats = computed(() => {
    return successCount.value > 0 || failedCount.value > 0
  })

  /**
   * 标注当前页
   */
  const annotateCurrentSlide = async (hiddenThumbnailsRef: HTMLElement | null): Promise<void> => {
    if (isAnnotatingCurrent.value || isAnnotatingAll.value) return

    const currentSlide = slidesStore.currentSlide
    if (!currentSlide) {
      ElMessage.warning('当前幻灯片不存在')
      return
    }

    isAnnotatingCurrent.value = true
    annotatingSlideIndex.value = 1
    totalSlidesToAnnotate.value = 1
    annotatingProgress.value = 0
    successCount.value = 0
    failedCount.value = 0

    try {
      // 确保模型列表已加载
      await modelStore.loadModels()

      // 生成当前幻灯片截图
      const screenshot = await generateSlideScreenshot(currentSlide.id, hiddenThumbnailsRef)

      // 调用标注服务
      const result = await callSingleAnnotationAPI(currentSlide, screenshot)

      // 自动应用标注结果
      if (result.success && result.annotation) {
        await applyAnnotationResult(currentSlide, result.annotation)
        successCount.value = 1
        ElMessage.success('当前页标注完成')
      } else {
        failedCount.value = 1
        ElMessage.error('标注失败：' + result.message)
      }
    } catch (error) {
      failedCount.value = 1
      console.error('标注当前页失败:', error)
      ElMessage.error('标注失败，请查看控制台了解详细信息')
    } finally {
      isAnnotatingCurrent.value = false
      annotatingProgress.value = 0
      annotatingSlideIndex.value = 0
    }
  }

  /**
   * 标注所有页
   */
  const annotateAllSlides = async (hiddenThumbnailsRef: HTMLElement | null): Promise<void> => {
    if (isAnnotatingCurrent.value || isAnnotatingAll.value) return

    const total = slidesStore.slides.length
    if (total === 0) {
      ElMessage.warning('没有幻灯片可标注')
      return
    }

    isAnnotatingAll.value = true
    annotatingSlideIndex.value = 0
    totalSlidesToAnnotate.value = total
    annotatingProgress.value = 0
    successCount.value = 0
    failedCount.value = 0

    try {
      // 先生成所有幻灯片的截图（性能优化）
      const screenshots = await generateAllSlideScreenshots(hiddenThumbnailsRef)

      // 遍历标注每页幻灯片
      for (let i = 0; i < slidesStore.slides.length; i++) {
        const slide = slidesStore.slides[i]
        const screenshot = screenshots[i]

        annotatingSlideIndex.value = i + 1
        annotatingProgress.value = Math.round(((i + 1) / total) * 100)

        try {
          // 验证截图有效性
          if (!screenshot || screenshot.length <= 1000) {
            console.warn(`幻灯片 ${slide.id} 的截图无效，跳过`)
            failedCount.value++
            continue
          }

          // 调用标注服务
          const result = await callSingleAnnotationAPI(slide, screenshot)

          // 自动应用标注结果
          if (result.success && result.annotation) {
            await applyAnnotationResult(slide, result.annotation)
            successCount.value++
          } else {
            failedCount.value++
            console.warn(`幻灯片 ${slide.id} 标注失败:`, result.message)
          }
        } catch (error) {
          failedCount.value++
          console.error(`标注幻灯片 ${slide.id} 失败:`, error)
        }

        // 每页之间稍作延迟，避免请求过快
        if (i < slidesStore.slides.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      }

      // 标注完成
      ElMessage.success(`批量标注完成：成功 ${successCount.value} 页，失败 ${failedCount.value} 页`)
    } catch (error) {
      console.error('批量标注失败:', error)
      ElMessage.error('批量标注失败：' + (error instanceof Error ? error.message : '未知错误'))
    } finally {
      isAnnotatingAll.value = false
      annotatingProgress.value = 0
      annotatingSlideIndex.value = 0
    }
  }

  /**
   * 获取幻灯片标题（用于显示）
   */
  const getSlideTitle = (slide: any): string => {
    if (!slide || !slide.elements) return '幻灯片'

    // 尝试查找标题元素
    const titleElement = slide.elements.find((el: any) =>
      el.type === 'text' && (el.textType === 'title' || (el.text && el.text.type === 'title'))
    )

    if (titleElement && titleElement.text && titleElement.text.content) {
      return titleElement.text.content.substring(0, 20)
    }

    return `幻灯片 ${slide.id.substring(0, 8)}`
  }

  /**
   * 获取默认视觉模型ID
   */
  const getDefaultVisionModelId = (): string => {
    // 从模型存储中获取支持视觉的文本模型
    const visionModels = modelStore.models.filter(model =>
      model.type === 'text' && model.supportsVision && model.isEnabled
    )

    if (visionModels.length > 0) {
      // 优先使用默认模型，否则使用第一个可用的视觉模型
      const defaultModel = visionModels.find(model => model.isDefault) || visionModels[0]
      console.log('使用视觉模型:', defaultModel.name, 'ID:', defaultModel.id)
      return defaultModel.id
    }

    // 如果没有找到视觉模型，使用硬编码的默认值（作为后备方案）
    console.warn('未找到可用的视觉模型，使用默认值')
    return 'default-vision-model'
  }

  /**
   * 调用单页标注API
   */
  const callSingleAnnotationAPI = async (slide: any, screenshot: string): Promise<AnnotationResult> => {
    try {
      // 准备请求数据
      const requestData = {
        slide: {
          slide_id: slide.id,
          screenshot: screenshot || '',
          elements: slide.elements || []
        },
        model_id: getDefaultVisionModelId()
      }

      console.log('调用单页标注API:', { slideId: slide.id, screenshotLength: screenshot?.length || 0 })

      // 调用同步接口 /api/v1/annotation/single
      const response = await fetch('/api/v1/annotation/single', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.status === 'success' && result.data) {
        console.log('标注成功:', { slideId: slide.id })
        return {
          success: true,
          annotation: result.data
        }
      } else {
        return {
          success: false,
          message: result.message || '标注失败'
        }
      }
    } catch (error) {
      console.error('标注API调用失败:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : '未知错误'
      }
    }
  }

  /**
   * 生成单张幻灯片截图
   */
  const generateSlideScreenshot = async (slideId: string, hiddenThumbnailsRef: HTMLElement | null): Promise<string> => {
    try {
      console.log('生成单张幻灯片截图:', { slideId })

      // 确保隐藏的缩略图容器已渲染
      if (!hiddenThumbnailsRef) {
        console.warn('隐藏的缩略图容器未找到，将使用空截图')
        return ''
      }

      // 查找幻灯片在数组中的索引
      const slideIndex = slidesStore.slides.findIndex(s => s.id === slideId)
      if (slideIndex === -1) {
        console.warn(`未找到幻灯片: ${slideId}`)
        return ''
      }

      // 使用现有的工具函数生成所有截图
      // 为提高性能，我们只为需要的幻灯片生成截图（通过count参数）
      const screenshots = await generateScreenshotsFromContainer(
        hiddenThumbnailsRef,
        slideIndex + 1, // 生成到目标幻灯片为止的所有截图
        {
          width: 800,
          quality: 0.95,
          saveToDisk: false
        }
      )

      // 获取目标幻灯片的截图
      const screenshot = screenshots[slideIndex]

      if (!screenshot || screenshot.length <= 1000) {
        console.warn(`幻灯片 ${slideId} 的截图无效或太小，长度: ${screenshot?.length || 0}`)
        return ''
      }

      console.log('截图生成成功:', { slideId, length: screenshot.length })
      return screenshot
    } catch (error) {
      console.error('生成幻灯片截图失败:', error)
      return ''
    }
  }

  /**
   * 生成所有幻灯片截图
   */
  const generateAllSlideScreenshots = async (hiddenThumbnailsRef: HTMLElement | null): Promise<string[]> => {
    try {
      console.log('生成所有幻灯片截图，总数:', slidesStore.slides.length)

      // 确保隐藏的缩略图容器已渲染
      if (!hiddenThumbnailsRef) {
        console.warn('隐藏的缩略图容器未找到')
        return []
      }

      // 使用现有的工具函数生成所有截图
      const screenshots = await generateScreenshotsFromContainer(
        hiddenThumbnailsRef,
        slidesStore.slides.length,
        {
          width: 800,
          quality: 0.95,
          saveToDisk: false
        }
      )

      // 验证截图有效性
      const validCount = screenshots.filter(s => s && s.length > 1000).length
      console.log(`截图生成完成，有效数量: ${validCount}/${screenshots.length}`)

      return screenshots
    } catch (error) {
      console.error('生成所有幻灯片截图失败:', error)
      return []
    }
  }

  /**
   * 应用标注结果到幻灯片
   */
  const applyAnnotationResult = async (slide: any, annotation: any): Promise<void> => {
    try {
      // 准备更新数据
      const updateData: any = {}

      // 所有标注信息统一存储在 slideAnnotation 中
      const slideAnnotation: any = {}

      // 1. 应用页面类型 - 只有当用户没有手动设置页面类型时才应用 AI 标注
      if (annotation.page_type?.type && !slide.type) {
        // 这里需要映射AI类型到前端类型
        // 临时使用映射函数（实际应该使用TYPE_MAPPINGS）
        const pageTypeMap: Record<string, string> = {
          'cover': 'cover',
          'catalog': 'contents',
          'transition': 'transition',
          'concept_explanation': 'content',
          'data_analysis': 'content',
          'conclusion': 'end'
        }
        slideAnnotation.pageType = pageTypeMap[annotation.page_type.type] || 'content'
        console.log(`应用 AI 页面类型标注: ${slideAnnotation.pageType} (原AI类型: ${annotation.page_type.type})`)
      } else if (slide.type) {
        console.log(`跳过 AI 页面类型标注，用户已手动设置类型: ${slide.type}`)
      }

      // 2. 应用布局类型
      if (annotation.layout_type?.type) {
        slideAnnotation.layoutType = annotation.layout_type.type
      }

      // 3. 应用内容类型
      if (annotation.page_type?.type) {
        const contentTypeMap: Record<string, string> = {
          'cover': 'lesson_introduction',
          'catalog': 'learning_objective',
          'concept_explanation': 'concept_explanation',
          'data_analysis': 'case_analysis',
          'conclusion': 'content_summary'
        }
        slideAnnotation.contentType = contentTypeMap[annotation.page_type.type] || ''
      }

      // 存储标注信息
      if (Object.keys(slideAnnotation).length > 0) {
        updateData.slideAnnotation = {
          ...(slide.slideAnnotation || {}),
          ...slideAnnotation
        }
      }

      // 更新幻灯片
      if (Object.keys(updateData).length > 0) {
        slidesStore.updateSlide(updateData, slide.id)
        console.log('标注已应用到幻灯片:', { slideId: slide.id, slideAnnotation })
      }

      // 4. 应用元素标注（注意：这部分逻辑需要进一步完善）
      if (annotation.element_annotations && annotation.element_annotations.length > 0) {
        console.log(`检测到 ${annotation.element_annotations.length} 个元素标注，待处理`)
        // TODO: 实现元素标注的应用逻辑
      }
    } catch (error) {
      console.error('应用标注结果失败:', error)
      throw error
    }
  }

  return {
    // 状态
    isAnnotatingCurrent,
    isAnnotatingAll,
    annotatingSlideIndex,
    totalSlidesToAnnotate,
    annotatingProgress,
    successCount,
    failedCount,

    // 计算属性
    totalSlides,
    annotatingSlideTitle,
    showProgress,
    showStats,

    // 方法
    annotateCurrentSlide,
    annotateAllSlides
  }
}