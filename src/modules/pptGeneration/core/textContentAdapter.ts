/**
 * 文本内容适配器
 * 使用智能DOM操作保留完整模板样式，支持换行显示
 */

import type { PPTTextElement, PPTShapeElement } from '@/types/slides'
import { SmartTextReplacer } from './smartTextReplacer'

export class TextContentAdapter {
  /**
   * 创建新的文本元素
   * 使用智能替换器保留完整模板样式
   */
  static createEnhancedTextElement({
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
    const padding = 10
    const width = el.width - padding * 2 - 2

    const content = el.type === 'text' ? el.content : el.text!.content

    // 获取字体信息（仅用于字体大小适配）
    const fontInfo = this.extractStyleInfo(content)

    // 计算适配的字体大小
    const size = this.calculateAdaptedFontSize({
      text: longestText || text,
      fontSize: fontInfo.fontSize,
      fontFamily: fontInfo.fontFamily,
      width,
      maxLine,
    })

    // 处理数字补零
    let processedText = text
    if (digitPadding && text.length === 1) {
      processedText = '0' + text
    }

    // 使用智能替换器替换文本内容，保留所有样式
    const newContent = SmartTextReplacer.replaceTextWithStyles(content, processedText)

    // 更新字体大小（如果需要）
    const finalContent = newContent.replace(/font-size:(.+?)px/g, `font-size: ${size}px`)

    return el.type === 'text'
      ? { ...el, content: finalContent, lineHeight: size < 15 ? 1.2 : el.lineHeight }
      : { ...el, text: { ...el.text!, content: finalContent } }
  }

  /**
   * 从HTML内容中提取字体信息（仅用于字体大小适配）
   */
  private static extractStyleInfo(htmlString: string): { fontSize: number; fontFamily: string } {
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
   * 计算适配的字体大小
   */
  private static calculateAdaptedFontSize({
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
}