/**
 * 标题结构维度评估器
 * 评估内容项标题数量与模板标题元素数量的匹配度
 *
 * 特点: 无嵌套加权,直接返回匹配度值
 */

import { BaseDimension } from './baseDimension'
import type { AIPPTSlideData, Slide } from '../types'

/**
 * 标题结构维度评估器
 *
 * 匹配逻辑:
 * - 模板侧: 统计textType="itemTitle"（列表项标题）的元素数量
 * - 数据侧: 统计items数组中title字段非空的item数量
 *
 * 评分逻辑:
 * - min/max匹配算法
 * - 都为0: 1.0 (完美匹配)
 * - 只有模板为0: 0.0 (内容有标题但模板没有)
 * - 其他情况: min(count1, count2) / max(count1, count2)
 */
export class TitleStructureDimension extends BaseDimension {
  readonly id = 'titleStructure'
  readonly name = '标题结构维度'
  readonly required = true

  /**
   * 计算标题结构匹配评分
   */
  protected calculateScore(slideData: AIPPTSlideData, template: Slide): number {
    // 1. 统计内容项中有title的item数量（title字段非空）
    const itemsWithTitle =
      slideData.data.items?.filter((item) => item.title && item.title.trim())
        .length || 0

    // 2. 统计模板中itemTitle类型的元素数量（列表项标题）
    const templateItemTitles = template.elements.filter((el) => {
      // 文本元素或带文本的形状元素
      if (el.type === 'text') {
        return (el as any).textType === 'itemTitle'
      }
      if (el.type === 'shape' && el.text) {
        return (el as any).text.type === 'itemTitle'
      }
      return false
    }).length

    // 3. 计算匹配度
    if (itemsWithTitle === 0 && templateItemTitles === 0) {
      return 1.0 // 都没有列表项标题,完美匹配
    }

    if (templateItemTitles === 0) {
      return 0.0 // 内容有标题但模板没有itemTitle元素,不匹配
    }

    // 使用min/max计算匹配度（单一比率，无嵌套加权）
    const matchRatio =
      Math.min(itemsWithTitle, templateItemTitles) /
      Math.max(itemsWithTitle, templateItemTitles)

    return matchRatio
  }
}
