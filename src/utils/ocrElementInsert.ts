/**
 * OCR结果元素插入工具
 * 将OCR识别结果转换为可编辑的幻灯片文字元素
 * 注意：图片已通过文生图去除文字，不需要再添加遮罩
 */

import { nanoid } from 'nanoid'
import { useMainStore, useSlidesStore } from '@/store'
import type { PPTTextElement, PPTImageElement } from '@/types/slides'
import type { TextRegion } from '@/types/imageParsing'

type Rect = { left: number; top: number; width: number; height: number }
type OcrInsertOptions = {
  /**
   * 本次OCR所对应的图片cosKey（用于在slide.elements中定位图片元素）
   */
  cosKey?: string
  /**
   * OCR来源：选中图片 or 背景图片
   */
  source?: 'selected' | 'background'
  /**
   * OCR识别所用"原图"的实际像素尺寸（后端PIL检测得到）
   */
  ocrImageSize?: { width: number; height: number }
  /**
   * 与SmartImage保持一致：object-fit: cover + object-position: center
   */
  objectFit?: 'cover' | 'contain'
}

function find_image_element_by_cos_key(elements: any[], cosKey: string): PPTImageElement | undefined {
  for (const el of elements) {
    if (el?.type !== 'image') continue
    const img = el as PPTImageElement
    if (img?.imageInfo?.cosKey === cosKey) return img
  }
  return undefined
}

function map_bbox_to_target_rect(
  bbox: { x: number; y: number; width: number; height: number },
  target: Rect,
  srcImage: { width: number; height: number },
  objectFit: 'cover' | 'contain'
): Rect {
  const srcW = srcImage.width
  const srcH = srcImage.height
  const dstW = target.width
  const dstH = target.height

  if (srcW <= 0 || srcH <= 0 || dstW <= 0 || dstH <= 0) {
    // fallback：不做映射
    return {
      left: target.left + bbox.x,
      top: target.top + bbox.y,
      width: bbox.width,
      height: bbox.height,
    }
  }

  // SmartImage默认：object-position: center
  const scale =
    objectFit === 'cover'
      ? Math.max(dstW / srcW, dstH / srcH)
      : Math.min(dstW / srcW, dstH / srcH)

  const renderedW = srcW * scale
  const renderedH = srcH * scale
  const offsetX = (renderedW - dstW) / 2
  const offsetY = (renderedH - dstH) / 2

  return {
    left: target.left + bbox.x * scale - offsetX,
    top: target.top + bbox.y * scale - offsetY,
    width: bbox.width * scale,
    height: bbox.height * scale,
  }
}

/**
 * 将OCR识别结果插入为可编辑文字元素
 * 注意：由于图片已通过文生图去除文字，不需要再添加遮罩
 *
 * @param regions OCR识别的文字区域列表
 * @param taskId 任务ID（用于生成唯一ID）
 */
export function insertOCRElementsAsEditable(
  regions: TextRegion[],
  taskId: string,
  options: OcrInsertOptions = {}
) {
  const mainStore = useMainStore()
  const slidesStore = useSlidesStore()
  const currentSlide = slidesStore.currentSlide

  if (!currentSlide) {
    console.error('当前没有幻灯片')
    return
  }

  const viewportWidth = slidesStore.viewportSize
  const viewportHeight = slidesStore.viewportSize * slidesStore.viewportRatio

  const objectFit = options.objectFit ?? 'cover'

  // 目标映射矩形：默认全画布；若是选中图片，尽量定位对应图片元素的矩形
  let targetRect: Rect = { left: 0, top: 0, width: viewportWidth, height: viewportHeight }

  if (options.source === 'selected') {
    let targetImg: PPTImageElement | undefined
    if (options.cosKey) {
      targetImg = find_image_element_by_cos_key(currentSlide.elements as any[], options.cosKey)
    }
    if (!targetImg) {
      targetImg = getSelectedImageElement()
    }
    if (targetImg) {
      targetRect = { left: targetImg.left, top: targetImg.top, width: targetImg.width, height: targetImg.height }
    }
  }

  // 原图尺寸：优先使用后端PIL检测值；否则退化为"目标矩形尺寸"
  const srcImageSize = options.ocrImageSize?.width && options.ocrImageSize?.height
    ? { width: options.ocrImageSize.width, height: options.ocrImageSize.height }
    : { width: targetRect.width, height: targetRect.height }

  console.log('[OCR坐标映射]', {
    objectFit,
    srcImageSize,
    targetRect,
  })

  // 遍历所有文字区域
  for (const region of regions) {
    const mapped = map_bbox_to_target_rect(region.bbox, targetRect, srcImageSize, objectFit)
    const left = mapped.left
    const top = mapped.top
    const width = mapped.width
    const height = mapped.height

    // 生成文字元素的ID
    const textId = `ocr_text_${taskId}_${region.id}`

    // 创建可编辑文字元素
    // 使用多模态OCR模型提供的字体信息
    const font = region.font
    const fontSize = font?.size || 16
    const fontFamily = font?.family || slidesStore.theme.fontName
    const fontWeight = font?.weight || 'normal'
    const color = font?.color || '#000000'
    const textAlign = font?.align || 'left'

    // 构建带样式的HTML内容
    const style = [
      `text-align: ${textAlign}`,
      `font-size: ${fontSize}px`,
      `color: ${color}`,
      `font-weight: ${fontWeight}`,
    ].join('; ')

    const textEl: PPTTextElement = {
      type: 'text',
      id: textId,
      left: left,
      top: top,
      width: width,
      height: height,
      rotate: 0,
      content: `<p style="${style}">${region.text}</p>`,
      defaultFontName: fontFamily,
      defaultColor: color,
    }

    // 插入文字元素
    slidesStore.addElement(textEl)
  }

  // 清空选中状态（可选）
  mainStore.setActiveElementIdList([])
}

/**
 * 检查当前幻灯片是否有背景图片（判断是否为香蕉生成的PPT）
 * @returns 是否有背景图片
 */
export function hasBackgroundImage(): boolean {
  const slidesStore = useSlidesStore()
  const currentSlide = slidesStore.currentSlide

  if (!currentSlide) return false

  // 检查是否有背景图片
  return !!(currentSlide.background && currentSlide.background.type === 'image')
}

/**
 * 获取当前幻灯片的背景图片COS Key
 * @returns COS Key或undefined
 */
export function getBackgroundImageCOSKey(): string | undefined {
  const slidesStore = useSlidesStore()
  const currentSlide = slidesStore.currentSlide

  if (!currentSlide || !currentSlide.background || currentSlide.background.type !== 'image') {
    return undefined
  }

  // 从背景图片信息中提取COS Key
  const background = currentSlide.background
  if (background.image && background.image.imageInfo) {
    return background.image.imageInfo.cosKey
  }

  return undefined
}

/**
 * 获取当前选中的图片元素
 * @returns 图片元素或undefined
 */
export function getSelectedImageElement(): PPTImageElement | undefined {
  const mainStore = useMainStore()
  const slidesStore = useSlidesStore()
  const currentSlide = slidesStore.currentSlide

  if (!currentSlide) return undefined

  // 获取选中的元素列表
  const activeElements = mainStore.activeElementList

  // 只处理单个选中元素的情况
  if (activeElements.length !== 1) return undefined

  const element = activeElements[0]

  // 检查是否为图片元素
  if (element.type !== 'image') return undefined

  return element as PPTImageElement
}

/**
 * 获取选中图片的COS Key
 * @returns COS Key或undefined
 */
export function getSelectedImageCOSKey(): string | undefined {
  const imageElement = getSelectedImageElement()

  if (!imageElement || !imageElement.imageInfo) {
    return undefined
  }

  return imageElement.imageInfo.cosKey
}

/**
 * 获取选中图片的URL
 * @returns URL或undefined
 */
export function getSelectedImageSrc(): string | undefined {
  const imageElement = getSelectedImageElement()
  return imageElement?.src
}

/**
 * 获取背景图片URL
 * @returns URL或undefined
 */
export function getBackgroundImageSrc(): string | undefined {
  const slidesStore = useSlidesStore()
  const currentSlide = slidesStore.currentSlide
  if (currentSlide?.background?.type === 'image') {
    return currentSlide.background.image?.src
  }
  return undefined
}

/**
 * 检查是否有可进行OCR的图片（背景图片或选中的图片元素）
 * @returns 是否有可识别的图片
 */
export function hasImageForOCR(): boolean {
  // 优先检查选中的图片元素
  if (getSelectedImageElement()) {
    return true
  }

  // 检查背景图片
  if (hasBackgroundImage()) {
    return true
  }

  return false
}

/**
 * 获取用于OCR的图片COS Key
 * 后端将使用此Key从COS获取图片
 * @returns COS Key和来源信息，或undefined
 */
export function getImageCOSKeyForOCR(): { cosKey: string; source: 'selected' | 'background' } | undefined {
  const mainStore = useMainStore()
  const slidesStore = useSlidesStore()
  
  // 优先获取选中的图片元素
  const imageElement = getSelectedImageElement()
  if (imageElement && imageElement.imageInfo?.cosKey) {
    return {
      cosKey: imageElement.imageInfo.cosKey,
      source: 'selected'
    }
  }

  // 尝试使用选中图片的 src（如果它本身就是 cos_key 格式）
  if (imageElement && imageElement.src) {
    // 检查 src 是否为 cos_key 格式 (通常以 ai-generated/ 或 images/ 开头)
    const src = imageElement.src
    if (!src.startsWith('http') && !src.startsWith('data:') && !src.startsWith('/api/')) {
      return {
        cosKey: src,
        source: 'selected'
      }
    }
  }

  // 获取背景图片的 cos_key
  const currentSlide = slidesStore.currentSlide
  if (currentSlide?.background?.type === 'image') {
    const bgSrc = currentSlide.background.image?.src
    if (bgSrc && !bgSrc.startsWith('http') && !bgSrc.startsWith('data:') && !bgSrc.startsWith('/api/')) {
      return {
        cosKey: bgSrc,
        source: 'background'
      }
    }
  }

  return undefined
}

/**
 * 生成幻灯片ID（用于识别当前幻灯片）
 * @returns 幻灯片ID
 */
export function getSlideId(): string {
  const slidesStore = useSlidesStore()
  const currentIndex = slidesStore.slideIndex

  // 使用香蕉生成格式的幻灯片ID
  // 格式：banana_task_{task_id}_slide_{index}
  // 这里简化为：slide_{currentSlideIndex}
  return `slide_${currentIndex}`
}
