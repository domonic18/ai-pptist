/**
 * 水平列表布局配对模块
 * 负责处理水平列表布局的元素配对
 */

import type { LayoutAnalysisResult, PairedElement } from '../types/index'

/**
 * 配对水平列表布局
 * 
 * 配对逻辑：
 * 1. 顶部无标题内容优先配对
 * 2. 按水平位置（left值）排序标题和正文
 * 3. 按索引顺序配对数据项
 * 
 * @param layoutAnalysis - 布局分析结果
 * @param itemsWithTitle - 有标题的数据项列表
 * @param itemsWithoutTitle - 无标题的数据项列表
 * @returns 配对结果列表
 */
export function pairHorizontalListLayout(
  layoutAnalysis: LayoutAnalysisResult,
  itemsWithTitle: any[],
  itemsWithoutTitle: any[]
): PairedElement[] {
  const pairedElements: PairedElement[] = []

  if (!layoutAnalysis.listTitles || !layoutAnalysis.listTexts) {
    return pairedElements
  }

  let withoutTitleIndex = 0

  // 1. 处理顶部无标题内容
  if (layoutAnalysis.topTexts.length > 0 && itemsWithoutTitle.length > withoutTitleIndex) {
    pairedElements.push({ 
      title: null, 
      text: layoutAnalysis.topTexts[0],
      dataItem: itemsWithoutTitle[withoutTitleIndex]
    })
    withoutTitleIndex++
  }

  // 2. 处理水平列表区域
  const listTitles = layoutAnalysis.listTitles
  const listTexts = layoutAnalysis.listTexts

  // 确保标题和正文按水平位置排序
  const sortedTitles = listTitles.sort((a, b) => a.left - b.left)
  const sortedTexts = listTexts.sort((a, b) => a.left - b.left)

  // 为每个列表项分配标题和正文
  for (let i = 0; i < Math.min(itemsWithTitle.length, sortedTitles.length); i++) {
    pairedElements.push({
      title: sortedTitles[i],
      text: sortedTexts[i],
      dataItem: itemsWithTitle[i]
    })
  }

  return pairedElements
}

