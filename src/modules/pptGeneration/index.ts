/**
 * PPT生成模块统一导出
 * 
 * 本模块负责AI PPT的生成逻辑，包括：
 * - 幻灯片处理
 * - 布局分析
 * - 元素配对
 * - 分页处理
 */

// ===== 类型定义 =====
export type { ImagePoolItem, PairedElement, LayoutAnalysisResult } from './types'

// ===== 布局分析 =====
export { analyzeTemplateLayout, groupElementsByVerticalPosition } from './layout/analysis'

// ===== 元素配对 =====
export { 
  pairComparisonLayout,
  pairHorizontalListLayout,
  pairGenericLayout,
  calculateLayoutMatchScore 
} from './pairing'

// ===== 幻灯片处理器 =====
export {
  processCoverSlide,
  processContentsSlide,
  processTransitionSlide,
  processContentSlide,
  processEndSlide
} from './processors/slideProcessorsEnhanced'

// 基础处理器（向后兼容）
export {
  processCoverSlide as processCoverSlideBasic,
  processContentsSlide as processContentsSlideBasic,
  processTransitionSlide as processTransitionSlideBasic,
  processContentSlide as processContentSlideBasic,
  processEndSlide as processEndSlideBasic
} from './processors/slideProcessors'

// ===== 分页处理 =====
export { 
  PaginationProcessor,
  createDefaultPaginationProcessor
} from './pagination/processor'
export type { PaginationResult, PaginationStats } from './pagination/processor'
export { PaginationRuleManager, PAGINATION_RULES } from './pagination/rules'
export type { PaginationRule, PaginationCondition, PaginationStrategy } from './pagination/rules'

// ===== 核心工具 =====
export {
  checkTextType,
  getNewTextElement,
  getNewImgElement,
  getUseableTemplates,
  getAdaptedFontsize,
  getFontInfo,
  getMdContent,
  getJSONContent
} from './core/textUtils'

export { TextContentAdapter } from './core/textContentAdapter'
export { SmartTextReplacer } from './core/smartTextReplacer'

