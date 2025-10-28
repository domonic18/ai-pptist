/**
 * 布局分析模块
 * 负责分析PPT模板的布局类型和元素分组
 */

import type { PPTElement, PPTTextElement, PPTShapeElement } from '@/types/slides'
import type { LayoutAnalysisResult } from '../types/index'
import { LAYOUT_ANALYSIS_CONFIG } from '@/configs/pptGeneration/layoutConfig'

/**
 * 分析模板布局模式
 * 
 * @param titleElements - 标题元素列表
 * @param textElements - 正文元素列表
 * @returns 布局分析结果
 */
export function analyzeTemplateLayout(
  titleElements: PPTElement[],
  textElements: PPTElement[]
): LayoutAnalysisResult {
  // 过滤出文本和形状元素
  const filteredTitleElements = titleElements
    .filter((el): el is PPTTextElement | PPTShapeElement => el.type === 'text' || el.type === 'shape')
  const filteredTextElements = textElements
    .filter((el): el is PPTTextElement | PPTShapeElement => el.type === 'text' || el.type === 'shape')

  // 获取配置
  const config = LAYOUT_ANALYSIS_CONFIG

  // 按垂直位置分组
  const titleGroups = groupElementsByVerticalPosition(filteredTitleElements)

  // 1. 检测水平列表布局
  if (titleGroups.length === 1 && titleGroups[0].length >= config.HORIZONTAL_LIST.MIN_TITLE_COUNT) {
    const sortedTitles = titleGroups[0].sort((a, b) => a.left - b.left)

    // 检查是否有对应的正文元素
    const pairedTexts: (PPTTextElement | PPTShapeElement)[] = []

    for (const title of sortedTitles) {
      const matchingText = filteredTextElements.find(text =>
        Math.abs(text.left - title.left) < config.HORIZONTAL_LIST.HORIZONTAL_MATCH_THRESHOLD &&
        text.top > title.top &&
        !pairedTexts.includes(text)
      )
      if (matchingText) {
        pairedTexts.push(matchingText)
      }
    }

    if (pairedTexts.length === sortedTitles.length) {
      // 识别顶部宽幅正文元素
      const topTexts = filteredTextElements.filter(text =>
        text.top < sortedTitles[0].top && text.width > config.HORIZONTAL_LIST.TOP_TEXT_MIN_WIDTH
      )

      return {
        layoutType: 'horizontal_list',
        leftTitles: [],
        rightTitles: [],
        leftTexts: [],
        rightTexts: [],
        topTexts,
        bottomTexts: [],
        listTitles: sortedTitles,
        listTexts: pairedTexts
      }
    }
  }

  // 2. 检测左右对比布局
  if (titleGroups.length === 1 && titleGroups[0].length === config.COMPARISON.TITLE_COUNT) {
    const [leftTitle, rightTitle] = titleGroups[0].sort((a, b) => a.left - b.left)

    // 检查是否有对应的左右正文
    const leftText = filteredTextElements.find(text =>
      Math.abs(text.left - leftTitle.left) < config.COMPARISON.HORIZONTAL_MATCH_THRESHOLD &&
      text.top > leftTitle.top
    )
    const rightText = filteredTextElements.find(text =>
      Math.abs(text.left - rightTitle.left) < config.COMPARISON.HORIZONTAL_MATCH_THRESHOLD &&
      text.top > rightTitle.top
    )

    if (leftText && rightText) {
      // 识别顶部和底部的正文元素
      const topTexts = filteredTextElements.filter(text =>
        text.top < leftTitle.top && text.width > config.COMPARISON.WIDE_TEXT_MIN_WIDTH
      )
      const bottomTexts = filteredTextElements.filter(text =>
        text.top > rightText.top && text.width > config.COMPARISON.WIDE_TEXT_MIN_WIDTH
      )

      return {
        layoutType: 'comparison',
        leftTitles: [leftTitle],
        rightTitles: [rightTitle],
        leftTexts: [leftText],
        rightTexts: [rightText],
        topTexts,
        bottomTexts
      }
    }
  }

  // 默认返回通用布局
  return {
    layoutType: 'generic',
    leftTitles: [],
    rightTitles: [],
    leftTexts: [],
    rightTexts: [],
    topTexts: [],
    bottomTexts: []
  }
}

/**
 * 按垂直位置分组元素
 * 
 * @param elements - 元素列表
 * @returns 分组后的元素数组
 */
export function groupElementsByVerticalPosition(
  elements: (PPTTextElement | PPTShapeElement)[]
): (PPTTextElement | PPTShapeElement)[][] {
  const config = LAYOUT_ANALYSIS_CONFIG
  const groups: (PPTTextElement | PPTShapeElement)[][] = []

  for (const element of elements) {
    let foundGroup = false

    for (const group of groups) {
      if (group.some(el => Math.abs(el.top - element.top) < config.VERTICAL_GROUPING_THRESHOLD)) {
        group.push(element)
        foundGroup = true
        break
      }
    }

    if (!foundGroup) {
      groups.push([element])
    }
  }

  return groups
}

