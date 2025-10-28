/**
 * 文字量维度评估器
 * 评估内容文字总量与模板文字容量的匹配度
 */

import { BaseDimension } from './baseDimension'
import type { AIPPTSlideData, Slide } from '../types'

/**
 * 文字量维度评估器
 */
export class TextAmountDimension extends BaseDimension {
  readonly id = 'textAmount'
  readonly name = '文字量维度'
  readonly required = true

  /**
   * 计算文字量匹配评分
   */
  protected calculateScore(slideData: AIPPTSlideData, template: Slide): number {
    // 1. 计算内容文字总数
    const totalChars = this.calculateTotalChars(slideData)

    // 2. 估算模板文字容量
    const templateCapacity = this.estimateTemplateCapacity(template)

    // 3. 计算文字量比率
    const ratio = totalChars / templateCapacity

    // 4. 根据比率返回评分
    if (ratio >= 0.7 && ratio <= 1.0) {
      return 1.0
    }
    else if (ratio >= 0.5 && ratio < 0.7) {
      return 0.8
    }
    else if (ratio >= 0.3 && ratio < 0.5) {
      return 0.6
    } 
    return 0.4
    
  }

  /**
   * 计算内容文字总数
   */
  private calculateTotalChars(slideData: AIPPTSlideData): number {
    return slideData.data.items?.reduce((total, item) => {
      const titleLength = item.title?.length || 0
      const textLength = item.text?.length || 0
      return total + titleLength + textLength
    }, 0) || 0
  }

  /**
   * 估算模板文字容量
   * 基于模板文本元素的面积和字号进行估算
   */
  private estimateTemplateCapacity(template: Slide): number {
    const textElements = template.elements.filter(el => el.type === 'text')

    return textElements.reduce((capacity, element) => {
      // 基于元素面积和默认字号估算容量
      const width = (element as any).width || 100
      const height = (element as any).height || 30
      const fontSize = (element as any).fontSize || 16

      // 简化的容量估算：面积 / (字体大小 * 字符宽高比)
      const estimatedChars = Math.floor((width * height) / (fontSize * fontSize * 0.6))
      return capacity + estimatedChars
    }, 1000) // 默认最小容量为1000字符
  }
}