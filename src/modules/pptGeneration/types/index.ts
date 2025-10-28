/**
 * PPT生成相关的共享类型定义
 */

import type { PPTTextElement, PPTShapeElement } from '@/types/slides'

/**
 * 图片池中的图片对象接口
 */
export interface ImagePoolItem {
  src: string
  width: number
  height: number
}

/**
 * 配对元素结果接口
 */
export interface PairedElement {
  title: PPTTextElement | PPTShapeElement | null
  text: PPTTextElement | PPTShapeElement
  dataItem?: any
}

/**
 * 布局分析结果接口
 */
export interface LayoutAnalysisResult {
  layoutType: 'comparison' | 'horizontal_list' | 'generic'
  leftTitles: (PPTTextElement | PPTShapeElement)[]
  rightTitles: (PPTTextElement | PPTShapeElement)[]
  leftTexts: (PPTTextElement | PPTShapeElement)[]
  rightTexts: (PPTTextElement | PPTShapeElement)[]
  topTexts: (PPTTextElement | PPTShapeElement)[]
  bottomTexts: (PPTTextElement | PPTShapeElement)[]
  listTitles?: (PPTTextElement | PPTShapeElement)[]
  listTexts?: (PPTTextElement | PPTShapeElement)[]
}

