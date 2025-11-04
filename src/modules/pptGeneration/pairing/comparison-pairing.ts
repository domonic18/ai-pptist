/**
 * 左右对比布局配对模块
 * 负责处理左右对比布局的元素配对
 */

import type { LayoutAnalysisResult, PairedElement } from '../types/index'

/**
 * 配对左右对比布局
 * 
 * 配对顺序：
 * 1. 顶部无标题内容（topTexts）
 * 2. 左侧标题+正文配对
 * 3. 右侧标题+正文配对
 * 4. 底部无标题内容（bottomTexts）
 * 
 * @param layoutAnalysis - 布局分析结果
 * @param itemsWithTitle - 有标题的数据项列表
 * @param itemsWithoutTitle - 无标题的数据项列表
 * @returns 配对结果列表
 */
export function pairComparisonLayout(
  layoutAnalysis: LayoutAnalysisResult,
  itemsWithTitle: any[],
  itemsWithoutTitle: any[]
): PairedElement[] {
  const pairedElements: PairedElement[] = []

  console.log('[Comparison Pairing] 开始对比布局配对', {
    leftTitles: layoutAnalysis.leftTitles.length,
    leftTexts: layoutAnalysis.leftTexts.length,
    rightTitles: layoutAnalysis.rightTitles.length,
    rightTexts: layoutAnalysis.rightTexts.length,
    itemsWithTitle: itemsWithTitle.length,
    itemsWithoutTitle: itemsWithoutTitle.length
  })

  let withoutTitleIndex = 0
  let withTitleIndex = 0

  // 1. 处理顶部无标题内容
  if (layoutAnalysis.topTexts.length > 0 && itemsWithoutTitle.length > withoutTitleIndex) {
    pairedElements.push({ 
      title: null, 
      text: layoutAnalysis.topTexts[0],
      dataItem: itemsWithoutTitle[withoutTitleIndex]
    })
    withoutTitleIndex++
  }

  // 2. 处理左右对比区域
  // 左侧配对
  if (layoutAnalysis.leftTitles.length > 0 && itemsWithTitle.length > withTitleIndex) {
    pairedElements.push({
      title: layoutAnalysis.leftTitles[0],
      text: layoutAnalysis.leftTexts[0],
      dataItem: itemsWithTitle[withTitleIndex]
    })
    withTitleIndex++
  }
  // 左侧无标题配对（如果左侧有文本元素但没有有标题数据项）
  else if (layoutAnalysis.leftTexts.length > 0 && itemsWithoutTitle.length > withoutTitleIndex) {
    pairedElements.push({
      title: null,
      text: layoutAnalysis.leftTexts[0],
      dataItem: itemsWithoutTitle[withoutTitleIndex]
    })
    withoutTitleIndex++
  }

  // 右侧配对
  if (layoutAnalysis.rightTitles.length > 0 && itemsWithTitle.length > withTitleIndex) {
    pairedElements.push({
      title: layoutAnalysis.rightTitles[0],
      text: layoutAnalysis.rightTexts[0],
      dataItem: itemsWithTitle[withTitleIndex]
    })
    withTitleIndex++
  }
  // 右侧无标题配对（如果右侧有文本元素但没有有标题数据项）
  else if (layoutAnalysis.rightTexts.length > 0 && itemsWithoutTitle.length > withoutTitleIndex) {
    pairedElements.push({
      title: null,
      text: layoutAnalysis.rightTexts[0],
      dataItem: itemsWithoutTitle[withoutTitleIndex]
    })
    withoutTitleIndex++
  }

  // 3. 处理底部无标题内容
  if (layoutAnalysis.bottomTexts.length > 0 && itemsWithoutTitle.length > withoutTitleIndex) {
    pairedElements.push({
      title: null,
      text: layoutAnalysis.bottomTexts[0],
      dataItem: itemsWithoutTitle[withoutTitleIndex]
    })
    withoutTitleIndex++
  }

  console.log('[Comparison Pairing] 对比布局配对结果:', pairedElements)
  return pairedElements
}

