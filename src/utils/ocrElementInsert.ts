/**
 * OCR结果元素插入工具
 * 将OCR识别结果转换为可编辑的幻灯片元素（遮罩 + 文字）
 */

import { nanoid } from 'nanoid'
import { useMainStore, useSlidesStore } from '@/store'
import type { PPTShapeElement, PPTTextElement, PPTImageElement } from '@/types/slides'
import type { TextRegion } from '@/types/imageParsing'

// OCR图片的标准分辨率（香蕉生成PPT固定使用1920x1080）
const OCR_IMAGE_WIDTH = 1920
const OCR_IMAGE_HEIGHT = 1080

// 矩形形状的路径配置（复用shapes.ts中的配置）
const RECT_SHAPE = {
  viewBox: [200, 200] as [number, number],
  path: 'M 0 0 L 200 0 L 200 200 L 0 200 Z',
}

/**
 * 将OCR识别结果插入为可编辑元素
 * 每个文字区域创建两个元素：白色遮罩shape + 可编辑text
 * 两者通过groupId绑定，移动/缩放/旋转天然同步
 *
 * @param regions OCR识别的文字区域列表
 * @param taskId 任务ID（用于生成唯一ID）
 */
export function insertOCRElementsAsEditable(regions: TextRegion[], taskId: string) {
  const mainStore = useMainStore()
  const slidesStore = useSlidesStore()
  const currentSlide = slidesStore.currentSlide

  if (!currentSlide) {
    console.error('当前没有幻灯片')
    return
  }

  // 获取当前画布尺寸
  const viewportWidth = slidesStore.viewportSize
  const viewportHeight = slidesStore.viewportSize * slidesStore.viewportRatio

  // 计算坐标换算比例
  const scaleX = viewportWidth / OCR_IMAGE_WIDTH
  const scaleY = viewportHeight / OCR_IMAGE_HEIGHT

  // 遍历所有文字区域
  for (const region of regions) {
    // 生成唯一的groupId，将遮罩和文字绑定在一起
    const groupId = `ocr_group_${taskId}_${region.id}`

    // 将OCR坐标转换为幻灯片坐标
    const left = region.bbox.x * scaleX
    const top = region.bbox.y * scaleY
    const width = region.bbox.width * scaleX
    const height = region.bbox.height * scaleY

    // 生成遮罩和文字元素的ID
    const maskId = `ocr_mask_${taskId}_${region.id}`
    const textId = `ocr_text_${taskId}_${region.id}`

    // 1) 创建白色遮罩shape（先插入，保证位于text下方）
    const maskEl: PPTShapeElement = {
      type: 'shape',
      id: maskId,
      groupId: groupId,
      left: left,
      top: top,
      width: width,
      height: height,
      rotate: 0,
      viewBox: RECT_SHAPE.viewBox,
      path: RECT_SHAPE.path,
      fixedRatio: false,
      fill: '#ffffff',
      opacity: 0.85,
      outline: { width: 0, color: 'transparent' },
    }

    // 2) 创建可编辑文字元素（覆盖在遮罩之上）
    // 注意：字体大小等信息需要通过编辑器样式面板调整
    const textEl: PPTTextElement = {
      type: 'text',
      id: textId,
      groupId: groupId,
      left: left,
      top: top,
      width: width,
      height: height,
      rotate: 0,
      content: region.text,
      defaultFontName: region.font?.family || slidesStore.theme.fontName,
      defaultColor: '#000000',
    }

    // 插入元素（先插入遮罩，再插入文字，确保文字在上层）
    slidesStore.addElement(maskEl)
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
