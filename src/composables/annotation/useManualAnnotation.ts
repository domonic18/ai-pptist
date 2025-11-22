/**
 * 手动标注功能组合式函数
 *
 * 提供页面类型、内容类型、布局类型和元素类型的手动标注功能
 */

import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useSlidesStore, useMainStore } from '@/store'
import type {
  SlideType,
  TextType,
  ImageType,
  ContentType,
  LayoutType
} from '@/types/slides'

/**
 * 手动标注功能组合式函数
 */
export function useManualAnnotation() {
  const slidesStore = useSlidesStore()
  const mainStore = useMainStore()
  const { currentSlide } = storeToRefs(slidesStore)
  const { handleElement, handleElementId } = storeToRefs(mainStore)

  /**
   * 页面类型计算属性
   */
  const slideType = computed(() => {
    const slide = currentSlide.value
    if (!slide) {
      console.log('MarkupPanel - currentSlide is null')
      return ''
    }

    // 使用 toRaw 检查原始数据
    const rawSlide = slide
    console.log('MarkupPanel - currentSlide (raw):', {
      id: rawSlide.id,
      type: rawSlide.type,
      slideAnnotation: rawSlide.slideAnnotation
    })

    // 优先使用用户手动设置的页面类型（slide.type），如果用户没有设置，再使用 AI 标注的页面类型
    const slideAnnotation = slide.slideAnnotation as any
    const annotatedType = slideAnnotation?.pageType

    console.log(`MarkupPanel - 读取标注: slideId=${slide.id}, type=${slide.type}, pageType=${annotatedType}, hasSlideAnnotation=${!!slideAnnotation}`)

    // 用户手动设置的页面类型优先级最高，其次是 AI 标注的类型
    const result = slide.type || annotatedType || ''
    return result
  })

  /**
   * 文本类型计算属性
   */
  const textType = computed(() => {
    if (!handleElement.value) return ''
    if (handleElement.value.type === 'text') {
      return handleElement.value.textType || ''
    }
    if (handleElement.value.type === 'shape' && handleElement.value.text) {
      return handleElement.value.text.type || ''
    }
    return ''
  })

  /**
   * 图片类型计算属性
   */
  const imageType = computed(() => {
    if (!handleElement.value) return ''
    if (handleElement.value.type === 'image') {
      return handleElement.value.imageType || ''
    }
    return ''
  })

  /**
   * 内容类型计算属性
   */
  const contentType = computed(() => {
    return currentSlide.value?.slideAnnotation?.contentType || ''
  })

  /**
   * 布局类型计算属性
   */
  const layoutType = computed(() => {
    return currentSlide.value?.slideAnnotation?.layoutType || ''
  })

  /**
   * 更新页面类型
   */
  const updateSlide = (type: SlideType | '') => {
    if (type) {
      // 用户手动设置页面类型时，直接更新 slide.type 字段
      // 同时清除 AI 标注的页面类型，避免冲突
      const currentAnnotation = currentSlide.value?.slideAnnotation || {}
      const updatedAnnotation = { ...currentAnnotation }
      delete updatedAnnotation.pageType

      // 如果标注信息为空，则移除整个 slideAnnotation 字段
      if (Object.keys(updatedAnnotation).length === 0) {
        slidesStore.updateSlide({
          type
        })
      } else {
        slidesStore.updateSlide({
          type,
          slideAnnotation: updatedAnnotation
        })
      }
    } else {
      // 清除页面类型
      slidesStore.removeSlideProps({
        id: currentSlide.value.id,
        propName: 'type',
      })
    }
  }

  /**
   * 更新元素类型
   */
  const updateElement = (type: TextType | ImageType | '') => {
    if (!handleElement.value) return
    if (handleElement.value.type === 'image') {
      if (type) {
        slidesStore.updateElement({
          id: handleElementId.value,
          props: { imageType: type as ImageType },
        })
      } else {
        slidesStore.removeElementProps({
          id: handleElementId.value,
          propName: 'imageType',
        })
      }
    }
    if (handleElement.value.type === 'text') {
      if (type) {
        slidesStore.updateElement({
          id: handleElementId.value,
          props: { textType: type as TextType },
        })
      } else {
        slidesStore.removeElementProps({
          id: handleElementId.value,
          propName: 'textType',
        })
      }
    }
    if (handleElement.value.type === 'shape') {
      const text = handleElement.value.text
      if (!text) return

      if (type) {
        slidesStore.updateElement({
          id: handleElementId.value,
          props: { text: { ...text, type: type as TextType } },
        })
      } else {
        delete text.type
        slidesStore.updateElement({
          id: handleElementId.value,
          props: { text },
        })
      }
    }
  }

  /**
   * 更新内容类型
   */
  const updateContentType = (type: ContentType | '') => {
    const currentAnnotation = currentSlide.value?.slideAnnotation || {}

    if (type) {
      slidesStore.updateSlide({
        slideAnnotation: {
          ...currentAnnotation,
          contentType: type,
        },
      })
    } else {
      // 如果内容类型为空，则移除该属性
      const restAnnotation = { ...currentAnnotation }
      delete restAnnotation.contentType
      if (Object.keys(restAnnotation).length > 0) {
        slidesStore.updateSlide({
          slideAnnotation: restAnnotation,
        })
      } else {
        // 如果没有任何标注信息，则移除整个slideAnnotation字段
        slidesStore.removeSlideProps({
          id: currentSlide.value.id,
          propName: 'slideAnnotation',
        })
      }
    }
  }

  /**
   * 更新布局类型
   */
  const updateLayoutType = (type: LayoutType | '') => {
    const currentAnnotation = currentSlide.value?.slideAnnotation || {}

    if (type) {
      slidesStore.updateSlide({
        slideAnnotation: {
          ...currentAnnotation,
          layoutType: type,
        },
      })
    } else {
      // 如果布局类型为空，则移除该属性
      const restAnnotation = { ...currentAnnotation }
      delete restAnnotation.layoutType
      if (Object.keys(restAnnotation).length > 0) {
        slidesStore.updateSlide({
          slideAnnotation: restAnnotation,
        })
      } else {
        // 如果没有任何标注信息，则移除整个slideAnnotation字段
        slidesStore.removeSlideProps({
          id: currentSlide.value.id,
          propName: 'slideAnnotation',
        })
      }
    }
  }

  return {
    // 计算属性
    slideType,
    textType,
    imageType,
    contentType,
    layoutType,
    handleElement,

    // 方法
    updateSlide,
    updateElement,
    updateContentType,
    updateLayoutType
  }
}