/**
 * AI标注结果到前端类型的映射配置
 *
 * 这些映射定义了如何将AI模型返回的标注类型转换为前端使用的标准类型。
 * 映射关系可以根据不同的AI模型进行调整。
 */

/**
 * 页面类型映射
 * AI返回的页面类型 -> 前端slide.type
 */
export const PAGE_TYPE_MAPPING: Record<string, string> = {
  'cover': 'cover',
  'catalog': 'contents',
  'transition': 'transition',
  'concept_explanation': 'content',
  'data_analysis': 'content',
  'conclusion': 'end'
}

/**
 * 内容类型映射
 * AI返回的页面类型 -> 前端slide.annotation.contentType
 */
export const CONTENT_TYPE_MAPPING: Record<string, string> = {
  'cover': 'lesson_introduction',
  'catalog': 'learning_objective',
  'concept_explanation': 'concept_explanation',
  'data_analysis': 'case_analysis',
  'conclusion': 'content_summary'
}

/**
 * 文本元素类型映射
 * AI返回的元素类型 -> 前端text.textType
 */
export const TEXT_ELEMENT_TYPE_MAPPING: Record<string, string> = {
  'slide_title': 'title',
  'item_title': 'itemTitle',
  'content': 'content',
  'decoration': 'notes',
  'icon': 'itemNumber'
}

/**
 * 图片元素类型映射
 * AI返回的元素类型 -> 前端image.imageType
 */
export const IMAGE_ELEMENT_TYPE_MAPPING: Record<string, string> = {
  'decoration': 'background',
  'content': 'pageFigure',
  'icon': 'itemFigure'
}

/**
 * 形状元素类型映射（形状中包含文本的情况）
 * AI返回的元素类型 -> 前端shape.text.type
 */
export const SHAPE_ELEMENT_TYPE_MAPPING: Record<string, string> = {
  'slide_title': 'title',
  'item_title': 'itemTitle',
  'content': 'content',
  'decoration': 'notes',
  'icon': 'itemNumber'
}

/**
 * 获取默认类型映射的便捷函数
 */
export function getDefaultTypeMappings() {
  return {
    pageType: { ...PAGE_TYPE_MAPPING },
    contentType: { ...CONTENT_TYPE_MAPPING },
    textElementType: { ...TEXT_ELEMENT_TYPE_MAPPING },
    imageElementType: { ...IMAGE_ELEMENT_TYPE_MAPPING },
    shapeElementType: { ...SHAPE_ELEMENT_TYPE_MAPPING }
  }
}

/**
 * 合并自定义映射配置
 *
 * @param customMappings 自定义映射配置
 * @returns 合并后的映射配置
 */
export function mergeMappings(customMappings: Partial<{
  pageType: Record<string, string>
  contentType: Record<string, string>
  textElementType: Record<string, string>
  imageElementType: Record<string, string>
  shapeElementType: Record<string, string>
}>) {
  return {
    pageType: { ...PAGE_TYPE_MAPPING, ...(customMappings.pageType || {}) },
    contentType: { ...CONTENT_TYPE_MAPPING, ...(customMappings.contentType || {}) },
    textElementType: { ...TEXT_ELEMENT_TYPE_MAPPING, ...(customMappings.textElementType || {}) },
    imageElementType: { ...IMAGE_ELEMENT_TYPE_MAPPING, ...(customMappings.imageElementType || {}) },
    shapeElementType: { ...SHAPE_ELEMENT_TYPE_MAPPING, ...(customMappings.shapeElementType || {}) }
  }
}
