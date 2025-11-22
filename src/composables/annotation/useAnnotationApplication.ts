import { useSlidesStore } from '@/store'
import type {
  AnnotationResults,
  ApplyAnnotationStats,
  AISourceAnnotation,
  ElementAnnotationResult
} from './types'
import type { TextType, ImageType } from '@/types/slides'

// 内部类型定义
interface SlideData {
  id: string
  elements?: any[]
  slideAnnotation?: any
  type?: string
}

interface ElementData {
  id: string
  type: string
  text?: any
  textType?: string
  imageType?: string
}

/**
 * 标注结果应用组合式函数
 *
 * 职责:
 * - 将AI标注结果应用到幻灯片和元素
 * - 处理类型映射和数据转换
 * - 管理标注应用的业务逻辑
 *
 * @example
 * ```typescript
 * const { applyAnnotationResults, stats } = useAnnotationApplication()
 *
 * // 应用标注结果
 * await applyAnnotationResults(currentSlides, annotationResults)
 *
 * // 获取应用统计
 * console.log(`成功: ${stats.successCount}, 失败: ${stats.failedCount}`)
 * ```
 */
export function useAnnotationApplication() {
  const slidesStore = useSlidesStore()

  // 类型映射配置
  const TYPE_MAPPINGS = {
    // AI页面类型 -> 前端slide.type
    pageType: {
      'cover': 'cover',
      'catalog': 'contents',
      'transition': 'transition',
      'concept_explanation': 'content',
      'data_analysis': 'content',
      'conclusion': 'end'
    } as Record<string, string>,

    // AI页面类型 -> 前端slide.annotation.contentType
    contentType: {
      'cover': 'lesson_introduction',
      'catalog': 'learning_objective',
      'concept_explanation': 'concept_explanation',
      'data_analysis': 'case_analysis',
      'conclusion': 'content_summary'
    } as Record<string, string>,

    // AI元素类型 -> 前端文本元素textType
    textElementType: {
      'slide_title': 'title',
      'item_title': 'itemTitle',
      'content': 'content',
      'decoration': 'notes',
      'icon': 'itemNumber'
    } as Record<string, string>,

    // AI元素类型 -> 前端图片元素imageType
    imageElementType: {
      'decoration': 'background',
      'content': 'pageFigure',
      'icon': 'itemFigure'
    } as Record<string, string>,

    // AI元素类型 -> 前端形状元素text.type（形状包含文本的情况）
    shapeElementType: {
      'slide_title': 'title',
      'item_title': 'itemTitle',
      'content': 'content',
      'decoration': 'notes',
      'icon': 'itemNumber'
    } as Record<string, string>
  }

  // 应用统计
  let _stats: ApplyAnnotationStats = {
    successCount: 0,
    failedCount: 0,
    elementCount: 0
  }

  /**
   * 获取应用统计
   */
  const getStats = (): ApplyAnnotationStats => ({ ..._stats })

  /**
   * 重置统计
   */
  const resetStats = () => {
    _stats = {
      successCount: 0,
      failedCount: 0,
      elementCount: 0
    }
  }

  /**
   * 将AI标注结果应用到幻灯片
   *
   * @param currentSlides - 当前幻灯片列表
   * @param annotationResults - AI标注结果
   * @returns 应用统计信息
   *
   * @throws {Error} 当标注结果为空或格式无效时抛出错误
   *
   * @example
   * ```typescript
   * try {
   *   const stats = await applyAnnotationResults(slides, results)
   *   console.log(`成功应用 ${stats.successCount} 页幻灯片`)
   * } catch (error) {
   *   console.error('标注应用失败:', error)
   * }
   * ```
   */
  const applyAnnotationResults = async (
    currentSlides: SlideData[],
    annotationResults: AnnotationResults
  ): Promise<ApplyAnnotationStats> => {
    // 参数验证
    if (!annotationResults || !annotationResults.results || annotationResults.results.length === 0) {
      throw new Error('没有可用的标注结果')
    }

    // 重置统计
    resetStats()

    // 调试信息：打印所有幻灯片ID和标注结果ID
    console.log('当前幻灯片列表:', currentSlides.map(s => ({ id: s.id, type: s.type })))
    console.log('标注结果列表:', annotationResults.results.map(r => ({ slide_id: r.slide_id, page_type: r.page_type })))

    // 检查ID匹配情况
    const slideIds = new Set(currentSlides.map(s => s.id))
    const resultIds = annotationResults.results.map(r => r.slide_id)
    const missingIds = resultIds.filter(id => !slideIds.has(id))
    if (missingIds.length > 0) {
      console.warn('以下标注结果的幻灯片ID在当前幻灯片中未找到:', missingIds)
    }

    // 遍历所有幻灯片标注结果
    for (const slideResult of annotationResults.results) {
      try {
        // 查找对应的幻灯片
        const slideIndex = currentSlides.findIndex(
          (slide: SlideData) => slide.id === slideResult.slide_id
        )

        if (slideIndex === -1) {
          console.warn(`未找到幻灯片: ${slideResult.slide_id}`)
          console.warn('可用幻灯片ID:', currentSlides.map(s => s.id))
          _stats.failedCount++
          continue
        }

        const slide: SlideData = currentSlides[slideIndex]
        console.log(`应用标注到幻灯片[${slideIndex}]: ${slide.id} -> ${slideResult.slide_id}`)
        await applySlideAnnotation(slide, slideResult, slideIndex)
        _stats.successCount++
        console.log(`标注应用成功: ${slide.id}`)

      } catch (error) {
        console.error(`应用标注到幻灯片 ${slideResult.slide_id} 失败:`, error)
        _stats.failedCount++
      }
    }

    console.log('标注应用完成，统计:', getStats())
    return getStats()
  }

  /**
   * 应用单个幻灯片的标注
   *
   * @private
   * @param slide - 目标幻灯片
   * @param slideResult - AI标注结果
   * @param slideIndex - 幻灯片索引
   */
  const applySlideAnnotation = async (
    slide: SlideData,
    slideResult: AISourceAnnotation,
    slideIndex: number
  ): Promise<void> => {
    // 准备更新数据
    const updateData: any = {}

    // 所有标注信息统一存储在 slideAnnotation 中
    const slideAnnotation: any = {}

    // 1. 应用页面类型到 slideAnnotation.pageType - 只有当用户没有手动设置页面类型时才应用
    if (slideResult.page_type?.type && !slide.type) {
      const mappedType = TYPE_MAPPINGS.pageType[slideResult.page_type.type] || 'content'
      slideAnnotation.pageType = mappedType
      console.log(`设置 slideAnnotation.pageType: ${mappedType} (${slideResult.page_type.type})`)
    } else if (slide.type) {
      console.log(`跳过 AI 页面类型标注，用户已手动设置类型: ${slide.type}`)
    }

    // 2. 应用布局类型
    if (slideResult.layout_type?.type) {
      slideAnnotation.layoutType = slideResult.layout_type.type
      console.log(`设置 slideAnnotation.layoutType: ${slideResult.layout_type.type}`)
    }

    // 3. 应用内容类型
    if (slideResult.page_type?.type) {
      slideAnnotation.contentType = TYPE_MAPPINGS.contentType[slideResult.page_type.type] || ''
      console.log(`设置 slideAnnotation.contentType: ${slideAnnotation.contentType}`)
    }

    // 将标注信息存入 slideAnnotation
    if (Object.keys(slideAnnotation).length > 0) {
      updateData.slideAnnotation = {
        ...(slide.slideAnnotation || {}),
        ...slideAnnotation
      }
      console.log(`更新幻灯片 ${slide.id} 的 slideAnnotation:`, updateData.slideAnnotation)
    }

    // 更新幻灯片
    if (Object.keys(updateData).length > 0) {
      console.log(`调用 slidesStore.updateSlide: slideId=${slide.id}`, updateData)
      // 将 slideId 作为第二个参数传递，而不是放在 props 中
      slidesStore.updateSlide(updateData, slide.id)

      // 验证更新结果
      setTimeout(() => {
        const updatedSlide = slidesStore.slides.find(s => s.id === slide.id)
        console.log(`验证更新结果 - slideId=${slide.id}:`, {
          slideAnnotation: updatedSlide?.slideAnnotation,
          type: updatedSlide?.type
        })
      }, 100)
    }

    // 4. 应用元素标注
    if (slideResult.element_annotations && slideResult.element_annotations.length > 0) {
      console.log(`应用 ${slideResult.element_annotations.length} 个元素标注到幻灯片 ${slide.id}`)
      for (const elementAnnotation of slideResult.element_annotations) {
        await applyElementAnnotation(slide, elementAnnotation)
      }
    }
  }

  /**
   * 应用元素标注
   *
   * @private
   * @param slide - 幻灯片
   * @param elementAnnotation - 元素标注数据
   */
  const applyElementAnnotation = async (
    slide: SlideData,
    elementAnnotation: ElementAnnotationResult
  ): Promise<void> => {
    const element = slide.elements?.find(
      (el: ElementData) => el.id === elementAnnotation.element_id
    )

    if (!element) {
      console.warn(
        `未找到元素: ${elementAnnotation.element_id} in slide ${slide.id}`
      )
      return
    }

    const elementType = elementAnnotation.type

    // 根据元素类型应用不同的映射
    if (element.type === 'text') {
      const mappedTextType = TYPE_MAPPINGS.textElementType[elementType] || 'content'
      slidesStore.updateElement({
        id: element.id,
        props: { textType: mappedTextType as TextType },
        slideId: slide.id
      })
      _stats.elementCount++
    } else if (element.type === 'image') {
      const mappedImageType = TYPE_MAPPINGS.imageElementType[elementType] || 'pageFigure'
      slidesStore.updateElement({
        id: element.id,
        props: { imageType: mappedImageType as ImageType },
        slideId: slide.id
      })
      _stats.elementCount++
    } else if (element.type === 'shape' && element.text) {
      const mappedTextType = TYPE_MAPPINGS.shapeElementType[elementType] || 'content'
      slidesStore.updateElement({
        id: element.id,
        props: {
          text: { ...element.text, type: mappedTextType }
        },
        slideId: slide.id
      })
      _stats.elementCount++
    }
  }

  return {
    applyAnnotationResults,
    getStats,
    resetStats,
    mappings: TYPE_MAPPINGS
  }
}
