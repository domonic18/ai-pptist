/**
 * 图片编辑功能类型定义
 * 用于混合OCR识别和图片编辑功能
 */

/**
 * 边界框坐标
 */
export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

/**
 * 字体信息
 */
export interface FontInfo {
  size: number
  family: string
  weight: 'normal' | 'bold'
  color: string
  align?: 'left' | 'center' | 'right'
}

/**
 * 融合后的文字区域
 */
export interface HybridTextRegion {
  id: string
  text: string
  bbox: BoundingBox
  confidence: number
  font: FontInfo
  color: string
  source: 'traditional' | 'multimodal' | 'merged'
}

/**
 * 混合OCR元数据
 */
export interface HybridOCRMetadata {
  traditional_ocr_engine: string
  multimodal_model: string
  parse_time_ms: number
  traditional_time_ms: number
  multimodal_time_ms: number
  merge_time_ms: number
  text_count: number
  traditional_count: number
  multimodal_count: number
  merged_count: number
  created_at: string
  completed_at: string
}

/**
 * 混合OCR识别结果
 */
export interface HybridOCRResult {
  task_id: string
  slide_id: string
  original_cos_key: string
  text_regions: HybridTextRegion[]
  metadata: HybridOCRMetadata
}

/**
 * 文字去除结果
 */
export interface TextRemovalResult {
  original_cos_key: string
  edited_cos_key: string
  processing_time_ms: number
  model_used: string
  prompt_used: string
  created_at: string
}

/**
 * 编辑任务元数据
 */
export interface EditingTaskMetadata {
  total_time_ms: number
  ocr_time_ms: number
  removal_time_ms?: number
  text_count: number
  created_at: string
  completed_at?: string
}

/**
 * 编辑任务响应
 */
export interface EditingTaskResponse {
  task_id: string
  status: string
  estimated_time: number
  message?: string
}

/**
 * 编辑状态响应
 */
export interface EditingStatusResponse {
  task_id: string
  slide_id: string
  status: string
  progress: number
  current_step?: string
  message?: string
  ocr_result?: HybridOCRResult
  edited_image?: TextRemovalResult
}

/**
 * 编辑完整结果响应
 */
export interface EditingResultResponse {
  task_id: string
  slide_id: string
  status: string
  progress: number
  ocr_result?: HybridOCRResult
  edited_image?: TextRemovalResult
  metadata?: EditingTaskMetadata
  error_message?: string
}
