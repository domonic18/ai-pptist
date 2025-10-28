/**
 * 内容类型维度评估器
 * 评估内容类型与模板内容类型标注的匹配度
 *
 * 特点: 无嵌套加权,直接比较contentType,返回0或1或0.5
 */

import { BaseDimension } from './baseDimension'
import type { AIPPTSlideData, Slide } from '../types'
import type { ContentType } from '@/types/slides'

/**
 * 内容类型维度评估器
 *
 * 匹配流程:
 * 1. 获取后端的contentType
 * 2. 获取模板标注的contentType
 * 3. 直接比较两者是否相同
 *
 * 评分逻辑:
 * - 完全匹配: 1.0
 * - 不匹配: 0.0
 * - 无模板标注: 0.5 (中性分)
 */
export class ContentTypeDimension extends BaseDimension {
  readonly id = 'contentType'
  readonly name = '内容类型维度'
  readonly required = false

  /**
   * 检查内容类型特征是否可用
   */
  isAvailable(slideData: AIPPTSlideData): boolean {
    return !!(
      slideData.data.semanticFeatures &&
      slideData.data.semanticFeatures.contentType
    )
  }

  /**
   * 计算内容类型匹配评分
   */
  protected calculateScore(slideData: AIPPTSlideData, template: Slide): number {
    // 1. 获取后端JSON数据的contentType
    const dataContentType = slideData.data.semanticFeatures!
      .contentType as ContentType

    // 2. 获取模板标注的contentType
    const templateContentType = template.slideAnnotation
      ?.contentType as ContentType

    if (!templateContentType) {
      // 模板没有标注内容类型,返回中性分
      return 0.5
    }

    // 3. 直接比较两者的contentType是否相同
    if (templateContentType === dataContentType) {
      return 1.0 // 完全匹配
    }

    return 0.0 // 不匹配
  }
}
