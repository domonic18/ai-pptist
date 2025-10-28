/**
 * 布局类型维度评估器
 * 直接评估后端推荐的layoutType与模板layoutType的匹配度
 *
 * 特点: 直接比较，无需复杂的映射转换
 */

import { BaseDimension } from './baseDimension'
import type { AIPPTSlideData, Slide } from '../types'
import type { LayoutType } from '@/types/slides'

/**
 * 布局类型维度评估器
 *
 * 匹配流程:
 * 1. 获取后端推荐的layoutType
 * 2. 获取模板标注的layoutType
 * 3. 直接比较两个layoutType是否相同
 *
 * 评分逻辑:
 * - 完全匹配: 1.0
 * - 不匹配: 0.0
 * - 后端未推荐或模板未标注: 0.5 (中性分)
 */
export class LayoutTypeDimension extends BaseDimension {
  readonly id = 'layoutType'
  readonly name = '布局类型维度'
  readonly required = false

  /**
   * 检查布局类型特征是否可用
   */
  isAvailable(slideData: AIPPTSlideData): boolean {
    return !!(
      slideData.data.semanticFeatures &&
      slideData.data.semanticFeatures.layoutType
    )
  }

  /**
   * 计算布局类型匹配评分
   */
  protected calculateScore(slideData: AIPPTSlideData, template: Slide): number {
    // 1. 获取后端推荐的layoutType
    const recommendedLayoutType = slideData.data.semanticFeatures!.layoutType as LayoutType

    // 2. 获取模板标注的layoutType
    const templateLayoutType = template.slideAnnotation
      ?.layoutType as LayoutType

    if (!recommendedLayoutType || !templateLayoutType) {
      // 任一缺失布局类型标注,返回中性分
      return 0.5
    }

    // 3. 直接比较两个layoutType是否相同
    return recommendedLayoutType === templateLayoutType ? 1.0 : 0.0
  }
}
