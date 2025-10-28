/**
 * 维度评估器抽象基类
 * 提供通用功能，子类只需实现核心评估逻辑
 */

import type { DimensionEvaluator, AIPPTSlideData, Slide } from '../types'

/**
 * 维度评估器抽象基类
 */
export abstract class BaseDimension implements DimensionEvaluator {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly required: boolean;

  /**
   * 计算评分（模板方法）
   */
  evaluate(slideData: AIPPTSlideData, template: Slide): number | null {
    // 1. 检查维度是否可用
    if (!this.isAvailable(slideData, template)) {
      return null
    }

    // 2. 执行具体评估逻辑
    try {
      const score = this.calculateScore(slideData, template)

      // 3. 标准化评分到0-1范围
      return this.normalizeScore(score)
    }
    catch (error) {
      // eslint-disable-next-line no-console
      console.error(`[${this.id}] Evaluation error:`, error)
      return null
    }
  }

  /**
   * 检查维度是否可用（可被子类重写）
   */
  isAvailable(_slideData: AIPPTSlideData, _template: Slide): boolean {
    return true
  }

  /**
   * 计算原始评分（子类必须实现）
   */
  protected abstract calculateScore(
    slideData: AIPPTSlideData,
    template: Slide,
  ): number;

  /**
   * 标准化评分到0-1范围
   */
  protected normalizeScore(score: number): number {
    return Math.max(0, Math.min(1, score))
  }

  /**
   * 辅助方法：计算模板容量
   */
  protected getTemplateCapacity(template: Slide): number {
    const itemElements = template.elements.filter(
      (el) => {
        if (el.type === 'text') {
          return (el as any).textType === 'item' || (el as any).textType === 'itemTitle'
        }
        if (el.type === 'shape' && (el as any).text) {
          return (el as any).text.type === 'item' || (el as any).text.type === 'itemTitle'
        }
        return false
      }
    )
    return Math.max(itemElements.length, 1)
  }

  /**
   * 辅助方法：统计内容项数量
   */
  protected getContentItemCount(slideData: AIPPTSlideData): number {
    return slideData.data.items?.length || 0
  }

  /**
   * 辅助方法：统计内容项中有title的item数量
   */
  protected getContentItemCountWithTitle(slideData: AIPPTSlideData): number {
    return (
      slideData.data.items?.filter((item) => item.title && item.title.trim())
        .length || 0
    )
  }

  /**
   * 辅助方法：统计内容项中有text的item数量
   */
  protected getContentItemCountWithText(slideData: AIPPTSlideData): number {
    return (
      slideData.data.items?.filter((item) => item.text && item.text.trim())
        .length || 0
    )
  }

  /**
   * 辅助方法：统计模板中特定文本类型的元素数量
   */
  protected getTemplateTextElementCount(
    template: Slide,
    textType: string,
  ): number {
    return template.elements.filter((el) => {
      if (el.type === 'text') {
        return el.textType === textType
      }
      if (el.type === 'shape' && el.text) {
        return el.text.type === textType
      }
      return false
    }).length
  }

  /**
   * 辅助方法：计算两个数的匹配度（min/max算法）
   */
  protected calculateMatchRatio(count1: number, count2: number): number {
    if (count1 === 0 && count2 === 0) {
      return 1.0 // 都为0时认为是完美匹配
    }
    if (count1 === 0 || count2 === 0) {
      return 0.0 // 只有一个为0时完全不匹配
    }
    return Math.min(count1, count2) / Math.max(count1, count2)
  }
}
