/**
 * 图片编辑工具函数
 * 用于将混合OCR结果转换为文字元素
 */

import { nanoid } from 'nanoid'
import type { PPTTextElement } from '@/types/slides'
import type { HybridTextRegion } from '@/types/imageEditing'

// 图片分辨率约定（与香蕉生成保持一致）
const EDITING_IMAGE_WIDTH = 1920
const EDITING_IMAGE_HEIGHT = 1080

/**
 * 将混合OCR结果转换为文字元素
 */
export function convertOCRToTextElements(
  ocrRegions: HybridTextRegion[],
  taskId: string,
  viewportSize: number,
  viewportRatio: number
): PPTTextElement[] {
  const elements: PPTTextElement[] = []

  // 计算缩放比例
  const viewportWidth = viewportSize
  const viewportHeight = viewportSize * viewportRatio
  const scaleX = viewportWidth / EDITING_IMAGE_WIDTH
  const scaleY = viewportHeight / EDITING_IMAGE_HEIGHT

  for (const region of ocrRegions) {
    const elementId = `ocr_text_${taskId}_${region.id}`

    // 转换坐标
    const left = region.bbox.x * scaleX
    const top = region.bbox.y * scaleY
    const width = region.bbox.width * scaleX
    const height = region.bbox.height * scaleY

    // 创建文字元素
    const textElement: PPTTextElement = {
      type: 'text',
      id: elementId,
      left,
      top,
      width,
      height,
      rotate: 0,
      content: region.text,
      defaultFontName: region.font.family,
      defaultFontSize: region.font.size * scaleX,  // 按比例缩放字体大小
      defaultColor: region.font.color,
      fontWeight: region.font.weight === 'bold' ? 600 : 400,
      textAlign: region.font.align || 'left',
      verticalAlign: 'top',
    }

    elements.push(textElement)
  }

  return elements
}

/**
 * 应用完整的图片编辑结果
 * 替换背景图片并创建文字元素
 */
export async function applyImageEditingResult(
  result: {
    task_id: string
    slide_id: string
    ocr_result?: {
      text_regions: HybridTextRegion[]
    }
    edited_image?: {
      edited_cos_key: string
    }
  },
  viewportSize: number,
  viewportRatio: number
): Promise<void> {
  const { useSlidesStore, useMainStore } = await import('@/store')
  const slidesStore = useSlidesStore()
  const mainStore = useMainStore()

  if (!result.ocr_result || !result.ocr_result.text_regions) {
    throw new Error('OCR识别结果不完整')
  }

  // 步骤1: 如果有去除文字后的图片，替换背景图片
  if (result.edited_image) {
    await replaceSlideBackground(result.slide_id, result.edited_image.edited_cos_key)
  }

  // 步骤2: 创建文字元素
  const textElements = convertOCRToTextElements(
    result.ocr_result.text_regions,
    result.task_id,
    viewportSize,
    viewportRatio
  )

  // 步骤3: 插入文字元素
  for (const element of textElements) {
    slidesStore.addElement(element)
  }

  // 步骤4: 记录操作（用于撤销）
  mainStore.setEditorState({
    ...mainStore.editorState,
    lastImageEditTask: result.task_id
  })

  // 步骤5: 添加到历史记录
  mainStore.addSnapshot()
}

/**
 * 替换幻灯片背景图片
 */
async function replaceSlideBackground(
  slideId: string,
  newCosKey: string
): Promise<void> {
  const { useSlidesStore } = await import('@/store')
  const slidesStore = useSlidesStore()
  const slide = slidesStore.slides.find((s: { id: string }) => s.id === slideId)

  if (!slide) return

  // 更新背景图片
  slidesStore.updateSlide({
    ...slide,
    background: {
      type: 'image',
      image: newCosKey
    }
  })
}

export default {
  convertOCRToTextElements,
  applyImageEditingResult,
  replaceSlideBackground
}
