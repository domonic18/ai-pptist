/**
 * 自动标注相关类型定义
 */

/**
 * 标注配置
 */
export interface AnnotationConfig {
  modelId: string
  options: string[]
}

/**
 * 标注结果
 */
export interface AnnotationResults {
  taskId: string
  results: SlideAnnotationResult[]
  statistics: {
    total_pages: number
    successful_pages: number
    failed_pages: number
    average_confidence: number
  }
}

/**
 * 幻灯片标注结果
 */
export interface SlideAnnotationResult {
  slide_id: string
  status: 'success' | 'failed'
  page_type?: {
    type: string
    confidence: number
    reason: string
  }
  layout_type?: {
    type: string
    confidence: number
    reason: string
  }
  element_annotations?: ElementAnnotationResult[]
  overall_confidence?: number
  error?: string
}

/**
 * 元素标注结果
 */
export interface ElementAnnotationResult {
  element_id: string
  type: string
  confidence: number
  reason: string
}

/**
 * 进度信息
 */
export interface ProgressInfo {
  percentage: number
  currentPage: number
  totalPages: number
  estimatedRemainingTime: number
  status: 'pending' | 'processing' | 'completed' | 'error'
}

/**
 * 用户修正数据
 */
export interface UserCorrection {
  slide_id: string
  element_id: string
  corrected_type: string
  reason?: string
}

/**
 * 可用的标注模型
 */
export interface AnnotationModel {
  id: string
  name: string
  description?: string
  capabilities: string[]
}

/**
 * 标注选项
 */
export type AnnotationOption =
  | 'page_type'
  | 'layout_type'
  | 'element_annotations'

/**
 * 页面类型枚举
 */
export enum PageType {
  COVER = 'cover',
  CATALOG = 'catalog',
  TRANSITION = 'transition',
  CONCEPT_EXPLANATION = 'concept_explanation',
  DATA_ANALYSIS = 'data_analysis',
  CONCLUSION = 'conclusion'
}

/**
 * 布局类型枚举
 */
export enum LayoutType {
  VERTICAL_LIST = 'vertical_list',
  HORIZONTAL_LIST = 'horizontal_list',
  GRID = 'grid',
  HIERARCHY = 'hierarchy',
  FREE_FORM = 'free_form'
}

/**
 * 元素类型枚举
 */
export enum ElementType {
  SLIDE_TITLE = 'slide_title',
  ITEM_TITLE = 'item_title',
  CONTENT = 'content',
  DECORATION = 'decoration',
  ICON = 'icon'
}

/**
 * 标注结果应用映射配置
 */
export interface AnnotationMappingConfig {
  pageType: Record<string, string>
  contentType: Record<string, string>
  textElementType: Record<string, string>
  imageElementType: Record<string, string>
  shapeElementType: Record<string, string>
}

/**
 * AI标注源数据
 */
export interface AISourceAnnotation {
  page_type?: {
    type: string
    confidence: number
    reason: string
  }
  layout_type?: {
    type: string
    confidence: number
    reason: string
  }
  element_annotations?: ElementAnnotationResult[]
}

/**
 * 单页标注结果
 */
export interface AnnotationResult {
  success: boolean
  annotation?: any
  message?: string
}

/**
 * 标注应用结果统计
 */
export interface ApplyAnnotationStats {
  successCount: number
  failedCount: number
  elementCount: number
}
