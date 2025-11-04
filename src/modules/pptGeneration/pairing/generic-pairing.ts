/**
 * 通用布局配对模块
 * 负责处理通用布局的元素配对（降级算法）
 */

import type { PPTElement, PPTTextElement, PPTShapeElement } from '@/types/slides'
import type { PairedElement } from '../types/index'
import { calculateLayoutMatchScore } from './match-scorer'

/**
 * 配对通用布局（降级算法）
 * 
 * 配对策略：
 * 1. 使用 calculateLayoutMatchScore 计算匹配度
 * 2. 为有标题的数据项选择最佳匹配
 * 3. 为无标题的数据项分配剩余元素
 * 
 * @param titleElements - 标题元素列表
 * @param textElements - 正文元素列表
 * @param itemsWithTitle - 有标题的数据项列表
 * @param itemsWithoutTitle - 无标题的数据项列表
 * @returns 配对结果列表
 */
export function pairGenericLayout(
  titleElements: PPTElement[],
  textElements: PPTElement[],
  itemsWithTitle: any[],
  itemsWithoutTitle: any[]
): PairedElement[] {
  const pairedElements: PairedElement[] = []

  // 对有标题的数据项进行智能配对
  if (itemsWithTitle.length > 0) {
    const sortedTitleElements = titleElements
      .filter((el): el is PPTTextElement | PPTShapeElement => el.type === 'text' || el.type === 'shape')
      .sort((a, b) => {
        const aIndex = a.left + a.top * 2
        const bIndex = b.left + b.top * 2
        return aIndex - bIndex
      })

    const sortedTextElements = textElements
      .filter((el): el is PPTTextElement | PPTShapeElement => el.type === 'text' || el.type === 'shape')
      .sort((a, b) => {
        const aIndex = a.left + a.top * 2
        const bIndex = b.left + b.top * 2
        return aIndex - bIndex
      })

    for (let i = 0; i < itemsWithTitle.length; i++) {
      const titleEl = sortedTitleElements[i]
      let bestMatch: PPTTextElement | PPTShapeElement | null = null
      let bestScore = -1

      for (const textEl of sortedTextElements) {
        const score = calculateLayoutMatchScore(titleEl, textEl)
        if (score > bestScore) {
          bestScore = score
          bestMatch = textEl
        }
      }

      if (titleEl && bestMatch) {
        pairedElements.push({
          title: titleEl,
          text: bestMatch,
          dataItem: itemsWithTitle[i]
        })
        const index = sortedTextElements.indexOf(bestMatch)
        if (index > -1) sortedTextElements.splice(index, 1)
      }
    }
  }

  // 特殊处理：当所有数据项都没有标题时，直接进行文本元素配对
  if (itemsWithTitle.length === 0 && itemsWithoutTitle.length > 0) {
    console.log('[Generic Pairing] 进入特殊处理分支：所有数据项都没有标题')
    const sortedTextElements = textElements
      .filter((el): el is PPTTextElement | PPTShapeElement => el.type === 'text' || el.type === 'shape')
      .sort((a, b) => {
        const aIndex = a.left + a.top * 2
        const bIndex = b.left + b.top * 2
        return aIndex - bIndex
      })

    console.log('[Generic Pairing] 排序后的文本元素:', sortedTextElements.map(el => ({ id: el.id, left: el.left, top: el.top })))

    for (let i = 0; i < itemsWithoutTitle.length; i++) {
      const textEl = sortedTextElements[i]
      if (textEl) {
        pairedElements.push({
          title: null,
          text: textEl,
          dataItem: itemsWithoutTitle[i]
        })
        console.log('[Generic Pairing] 配对成功:', {
          textElementId: textEl.id,
          dataItem: itemsWithoutTitle[i]
        })
      }
    }
    console.log('[Generic Pairing] 最终配对结果:', pairedElements)
    return pairedElements
  }
  const remainingTextElements = textElements
    .filter((textEl): textEl is PPTTextElement | PPTShapeElement =>
      textEl.type === 'text' || textEl.type === 'shape'
    )
    .filter(textEl => !pairedElements.some(pair => pair.text.id === textEl.id))
    .sort((a, b) => {
      const aIndex = a.left + a.top * 2
      const bIndex = b.left + b.top * 2
      return aIndex - bIndex
    })

  for (let i = 0; i < itemsWithoutTitle.length; i++) {
    const textEl = remainingTextElements[i]
    if (textEl) {
      pairedElements.push({ 
        title: null, 
        text: textEl,
        dataItem: itemsWithoutTitle[i]
      })
    }
  }

  return pairedElements
}

