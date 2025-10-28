/**
 * 匹配度计算模块
 * 负责计算标题与正文元素的布局匹配度
 */

import type { PPTTextElement, PPTShapeElement } from '@/types/slides'
import { MATCH_SCORE_CONFIG } from '@/configs/pptGeneration/layoutConfig'

/**
 * 计算标题与正文元素的布局匹配度
 * 基于位置接近度和布局关系进行评分
 * 
 * @param titleElement - 标题元素
 * @param textElement - 正文元素
 * @returns 匹配分数（0-无匹配，>0-匹配度分数）
 */
export function calculateLayoutMatchScore(
  titleElement: PPTTextElement | PPTShapeElement,
  textElement: PPTTextElement | PPTShapeElement
): number {
  const config = MATCH_SCORE_CONFIG

  // 1. 水平位置匹配度（同一列）
  const horizontalDistance = Math.abs(titleElement.left - textElement.left)
  if (horizontalDistance > config.THRESHOLDS.HORIZONTAL_DISTANCE) {
    return 0 // 不在同一列，直接返回0分
  }
  const horizontalScore = Math.max(
    0,
    100 * Math.exp(-horizontalDistance / config.DECAY.DISTANCE_FACTOR)
  )

  // 2. 垂直位置匹配度（正文必须在标题下方）
  const verticalDistance = textElement.top - titleElement.top
  let verticalScore = 0
  
  if (verticalDistance > 0 && verticalDistance < config.THRESHOLDS.VERTICAL_DISTANCE_MAX) {
    // 正文在标题下方且距离合理
    const distanceDiff = Math.abs(verticalDistance - config.IDEAL.VERTICAL_DISTANCE)
    verticalScore = Math.max(
      0,
      100 * Math.exp(-distanceDiff / config.DECAY.DISTANCE_FACTOR)
    )
  }
  else {
    // 正文在标题上方或距离过远
    return 0
  }

  // 3. 宽度匹配度（相似宽度）
  const widthRatio = Math.min(titleElement.width, textElement.width) / 
                     Math.max(titleElement.width, textElement.width)
  const widthScore = widthRatio * 50

  // 4. 中心点对齐度
  const titleCenter = titleElement.left + titleElement.width / 2
  const textCenter = textElement.left + textElement.width / 2
  const centerDistance = Math.abs(titleCenter - textCenter)
  
  if (centerDistance > config.THRESHOLDS.CENTER_DISTANCE) {
    return 0 // 中心点不对齐，直接返回0分
  }
  const centerAlignScore = Math.max(
    0,
    50 * Math.exp(-centerDistance / config.DECAY.DISTANCE_FACTOR)
  )

  // 总分 = 各项得分的加权和
  const totalScore = 
    horizontalScore * config.WEIGHTS.HORIZONTAL +
    verticalScore * config.WEIGHTS.VERTICAL +
    widthScore * config.WEIGHTS.WIDTH +
    centerAlignScore * config.WEIGHTS.CENTER_ALIGN

  return totalScore
}

