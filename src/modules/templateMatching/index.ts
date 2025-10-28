/**
 * Template Matching 模块统一导出
 * 提供模板智能匹配的完整功能
 */

// ===== 类型定义 =====
export type {
  ContentType,
  LayoutType,
  AIPPTSlideData,
  DimensionEvaluator,
  DimensionScore,
  DimensionConfig,
  TemplateMatchResult,
  ContentTypeUnion,
  LayoutTypeUnion,
} from './types'

// ===== 核心服务 =====
export {
  DimensionFactory,
  PolynomialEngine,
  TemplateMatchingService,
  templateMatchingService,
  FallbackMatcher,
} from './core'

// ===== 维度评估器 =====
export {
  BaseDimension,
  CapacityDimension,
  ContentTypeDimension,
  LayoutTypeDimension,
  TextAmountDimension,
  TextStructureDimension,
  TitleStructureDimension,
} from './dimensions'

// ===== 集成工具 =====
export {
  smartTemplateSelector,
  batchSmartTemplateSelection,
  testTemplateMatching,
  enhancedTemplateSelector,
  batchEnhancedTemplateSelector,
  selectTemplateWithFallback,
} from './integration'

// ===== 配置 =====
export * from './config'

