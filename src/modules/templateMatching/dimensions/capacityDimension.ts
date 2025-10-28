/**
 * 容量维度评估器
 * 评估内容项数量与模板容量的匹配度
 */

import { BaseDimension } from './baseDimension'
import type { AIPPTSlideData, Slide } from '../types'

/**
 * 容量维度评估器
 *
 * 评分逻辑:
 * - 超出容量: 0.0分 (硬性过滤)
 * - 完美匹配(利用率=1.0): 1.0分
 * - 高利用率[0.8, 1.0): 0.9分
 * - 中等利用率[0.6, 0.8): 0.7分
 * - 低利用率[0.4, 0.6): 0.5分
 * - 过低利用率<0.4: 0.3分
 */
export class CapacityDimension extends BaseDimension {
  readonly id = 'capacity'
  readonly name = '容量维度'
  readonly required = true

  /**
   * 计算容量匹配评分
   */
  protected calculateScore(slideData: AIPPTSlideData, template: Slide): number {
    const itemCount = this.getContentItemCount(slideData)
    const capacity = this.getTemplateCapacity(template)

    // 超出容量,直接返回0分(硬性过滤)
    if (itemCount > capacity) {
      return 0.0
    }

    // 计算容量利用率
    const utilizationRate = itemCount / capacity

    // 根据利用率区间返回评分
    if (Math.abs(utilizationRate - 1.0) < 0.01) {
      return 1.0 // 完美匹配 (利用率=1.0)
    }
    else if (utilizationRate >= 0.8) {
      return 0.9 // 高利用率 [0.8, 1.0)
    }
    else if (utilizationRate >= 0.6) {
      return 0.7 // 中等利用率 [0.6, 0.8)
    }
    else if (utilizationRate >= 0.4) {
      return 0.5 // 低利用率 [0.4, 0.6)
    } 
    return 0.3 // 过低利用率 < 0.4
    
  }
}
