/**
 * 正文结构维度评估器
 * 评估内容项正文数量与模板正文元素的匹配度
 *
 * 特点: 无嵌套加权,直接返回匹配度值
 */

import { BaseDimension } from './baseDimension'
import type { AIPPTSlideData, Slide } from '../types'

/**
 * 正文结构维度评估器
 *
 * 匹配逻辑:
 * - 模板侧: 统计textType为"item"或"content"的元素数量
 * - 数据侧: 统计items数组中content字段非空的item数量
 *
 * 评分逻辑:
 * - min/max匹配算法
 * - 都为0: 1.0 (完美匹配)
 * - 只有模板为0: 0.0 (内容有正文但模板没有)
 * - 其他情况: min(count1, count2) / max(count1, count2)
 */
export class TextStructureDimension extends BaseDimension {
  readonly id = 'textStructure'
  readonly name = '正文结构维度'
  readonly required = true

  /**
   * 计算正文结构匹配评分
   */
  protected calculateScore(slideData: AIPPTSlideData, template: Slide): number {
    // 1. 统计内容项中有text的item数量（text字段非空）
    const itemsWithText =
      slideData.data.items?.filter(
        (item) => item.text && item.text.trim(),
      ).length || 0

    // 2. 统计模板中正文类型的元素数量（item或content类型）
    const templateTextElements = template.elements.filter((el) => {
      // 文本元素或带文本的形状元素
      if (el.type === 'text') {
        return (el as any).textType === 'item' || (el as any).textType === 'content'
      }
      if (el.type === 'shape' && el.text) {
        return (el as any).text.type === 'item' || (el as any).text.type === 'content'
      }
      return false
    }).length

    // 3. 计算匹配度
    if (itemsWithText === 0 && templateTextElements === 0) {
      return 1.0 // 都没有正文元素,完美匹配
    }

    if (templateTextElements === 0) {
      return 0.0 // 内容有正文但模板没有正文元素,不匹配
    }

    // 使用min/max计算匹配度（单一比率，无嵌套加权）
    const matchRatio =
      Math.min(itemsWithText, templateTextElements) /
      Math.max(itemsWithText, templateTextElements)

    return matchRatio
  }
}
