/**
 * PPT生成相关的工具函数
 * 从 useAIPPT.ts 中提取的通用工具函数
 */

import type { PPTElement, PPTImageElement, PPTShapeElement, PPTTextElement, TextType, Slide } from '@/types/slides'
import { TextContentAdapter } from './textContentAdapter'
import type { ImagePoolItem } from '../types/index'

/**
 * 检查元素是否为指定文本类型
 *
 * @param el - PPT元素
 * @param type - 要检查的文本类型
 * @returns 如果元素是指定类型的文本元素则返回true
 */
export function checkTextType(el: PPTElement, type: TextType): boolean {
  if (el.type === 'text') {
    return (el as PPTTextElement).textType === type
  }
  if (el.type === 'shape' && (el as PPTShapeElement).text) {
    return (el as PPTShapeElement).text!.type === type
  }
  return false
}

/**
 * 获取可用的模板列表
 *
 * @param templates - 模板列表
 * @param n - 需要的元素数量
 * @param type - 元素类型
 * @returns 符合条件的模板列表
 */
export function getUseableTemplates(templates: Slide[], n: number, type: TextType): Slide[] {
  if (n === 1) {
    const list = templates.filter(slide => {
      const items = slide.elements.filter((el: PPTElement) => checkTextType(el, type))
      const titles = slide.elements.filter((el: PPTElement) => checkTextType(el, 'title'))
      const texts = slide.elements.filter((el: PPTElement) => checkTextType(el, 'content'))

      return !items.length && titles.length === 1 && texts.length === 1
    })

    if (list.length) return list
  }

  let target: any = null

  const list = templates.filter(slide => {
    const len = slide.elements.filter((el: PPTElement) => checkTextType(el, type)).length
    return len >= n
  })
  if (list.length === 0) {
    const sorted = templates.sort((a, b) => {
      const aLen = a.elements.filter((el: PPTElement) => checkTextType(el, type)).length
      const bLen = b.elements.filter((el: PPTElement) => checkTextType(el, type)).length
      return aLen - bLen
    })
    target = sorted[sorted.length - 1]
  }
  else {
    target = list.reduce((closest, current) => {
      const currentLen = current.elements.filter((el: PPTElement) => checkTextType(el, type)).length
      const closestLen = closest.elements.filter((el: PPTElement) => checkTextType(el, type)).length
      return (currentLen - n) <= (closestLen - n) ? current : closest
    })
  }

  return templates.filter(slide => {
    const len = slide.elements.filter((el: PPTElement) => checkTextType(el, type)).length
    const targetLen = target.elements.filter((el: PPTElement) => checkTextType(el, type)).length
    return len === targetLen
  })
}

/**
 * 获取适配后的字体大小
 *
 * @param params - 字体适配参数
 * @param params.text - 文本内容
 * @param params.fontSize - 初始字体大小
 * @param params.fontFamily - 字体家族
 * @param params.width - 容器宽度
 * @param params.maxLine - 最大行数
 * @returns 适配后的字体大小
 */
export function getAdaptedFontsize({
  text,
  fontSize,
  fontFamily,
  width,
  maxLine,
}: {
  text: string
  fontSize: number
  fontFamily: string
  width: number
  maxLine: number
}): number {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')!

  let newFontSize = fontSize
  const minFontSize = 10

  while (newFontSize >= minFontSize) {
    context.font = `${newFontSize}px ${fontFamily}`
    const textWidth = context.measureText(text).width
    const line = Math.ceil(textWidth / width)

    if (line <= maxLine) return newFontSize

    const step = newFontSize <= 22 ? 1 : 2
    newFontSize = newFontSize - step
  }

  return minFontSize
}

/**
 * 从HTML字符串中提取字体信息
 *
 * @param htmlString - HTML字符串
 * @returns 包含字体大小和字体家族的对象
 */
export function getFontInfo(htmlString: string): { fontSize: number; fontFamily: string } {
  const fontSizeRegex = /font-size:\s*(\d+(?:\.\d+)?)\s*px/i
  const fontFamilyRegex = /font-family:\s*['"]?([^'";]+)['"]?\s*(?=;|>|$)/i

  const defaultInfo = {
    fontSize: 16,
    fontFamily: 'Microsoft Yahei',
  }

  const fontSizeMatch = htmlString.match(fontSizeRegex)
  const fontFamilyMatch = htmlString.match(fontFamilyRegex)

  return {
    fontSize: fontSizeMatch ? (+fontSizeMatch[1].trim()) : defaultInfo.fontSize,
    fontFamily: fontFamilyMatch ? fontFamilyMatch[1].trim() : defaultInfo.fontFamily,
  }
}

/**
 * 创建新的文本元素
 * 使用优雅的架构方案处理换行显示
 *
 * @param params - 文本元素参数
 * @param params.el - 原始元素
 * @param params.text - 新文本内容
 * @param params.maxLine - 最大行数
 * @param params.longestText - 最长文本（用于字体适配）
 * @param params.digitPadding - 是否启用数字补零
 * @returns 新的文本元素
 */
export function getNewTextElement({
  el,
  text,
  maxLine,
  longestText,
  digitPadding,
}: {
  el: PPTTextElement | PPTShapeElement
  text: string
  maxLine: number
  longestText?: string
  digitPadding?: boolean
}): PPTTextElement | PPTShapeElement {
  return TextContentAdapter.createEnhancedTextElement({
    el,
    text,
    maxLine,
    longestText,
    digitPadding,
  })
}

/**
 * 从图片池中获取可用的图片
 *
 * @param el - 图片元素
 * @param imgPool - 图片池
 * @returns 可用的图片对象或null
 */
export function getUseableImage(el: PPTImageElement, imgPool: ImagePoolItem[]): ImagePoolItem | null {
  let img: any | null = null

  let imgs = []

  if (el.width === el.height) imgs = imgPool.filter(img => img.width === img.height)
  else if (el.width > el.height) imgs = imgPool.filter(img => img.width > img.height)
  else imgs = imgPool.filter(img => img.width <= img.height)
  if (!imgs.length) imgs = imgPool

  img = imgs[Math.floor(Math.random() * imgs.length)]

  return img
}

/**
 * 创建新的图片元素
 *
 * @param el - 原始图片元素
 * @param imgPool - 图片池
 * @returns 新的图片元素
 */
export function getNewImgElement(el: PPTImageElement, imgPool: ImagePoolItem[]): PPTImageElement {
  const img = getUseableImage(el, imgPool)
  if (!img) return el

  let scale = 1
  let w = el.width
  let h = el.height
  let range: any = [[0, 0], [0, 0]]
  const radio = el.width / el.height
  if (img.width / img.height >= radio) {
    scale = img.height / el.height
    w = img.width / scale
    const diff = (w - el.width) / 2 / w * 100
    range = [[diff, 0], [100 - diff, 100]]
  }
  else {
    scale = img.width / el.width
    h = img.height / scale
    const diff = (h - el.height) / 2 / h * 100
    range = [[0, diff], [100, 100 - diff]]
  }
  const clipShape = (el.clip && el.clip.shape) ? el.clip.shape : 'rect'
  const clip = { range, shape: clipShape }
  const src = img.src

  return { ...el, src, clip }
}

/**
 * 将文本中的换行符转换为HTML换行标签
 * 同时保持原有的HTML结构
 *
 * @param text - 原始文本内容
 * @returns 处理后的HTML内容
 */
export function convertNewlinesToHtml(text: string): string {
  if (!text.includes('\n')) {
    return text
  }

  // 将文本分割成行
  const lines = text.split('\n')

  // 如果只有一行，直接返回
  if (lines.length <= 1) {
    return text
  }

  // 将多行文本转换为HTML格式
  return lines.map(line => {
    // 对每行进行HTML转义，防止XSS攻击
    const escapedLine = line
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')

    return escapedLine
  }).join('<br>')
}

/**
 * 从内容中提取Markdown内容
 *
 * @param content - 原始内容字符串
 * @returns 提取的Markdown内容
 */
export function getMdContent(content: string): string {
  const regex = /```markdown([^`]*)```/
  const match = content.match(regex)
  if (match) return match[1].trim()
  return content.replace('```markdown', '').replace('```', '')
}

/**
 * 从内容中提取JSON内容
 *
 * @param content - 原始内容字符串
 * @returns 提取的JSON内容
 */
export function getJSONContent(content: string): string {
  const regex = /```json([^```]*)```/
  const match = content.match(regex)
  if (match) return match[1].trim()
  return content.replace('```json', '').replace('```', '')
}