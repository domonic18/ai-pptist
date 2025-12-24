/**
 * 图片解析类型定义
 * 用于图片文字识别功能的数据类型
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
  align: 'left' | 'center' | 'right'
}

/**
 * 文字区域
 */
export interface TextRegion {
  id: string
  text: string
  bbox: BoundingBox
  confidence: number
  font?: FontInfo
}

/**
 * 解析元数据
 */
export interface ParseMetadata {
  parse_time: number
  ocr_engine: string
  text_count: number
  image_width?: number
  image_height?: number
  created_at: string
  completed_at?: string
}

/**
 * 解析任务响应
 */
export interface ParseTaskResponse {
  task_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  estimated_time: number
  message?: string
}

/**
 * 解析状态响应（完成时包含完整结果）
 */
export interface ParseStatusResponse {
  task_id: string
  slide_id: string
  cos_key?: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  current_step?: string
  text_regions?: TextRegion[]
  metadata?: ParseMetadata
  message?: string
}

/**
 * 图片解析结果
 */
export interface ImageParseResult {
  task_id: string
  slide_id: string
  cos_key?: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  text_regions: TextRegion[]
  metadata: ParseMetadata
}

/**
 * 解析请求参数
 */
export interface ParseRequest {
  slide_id: string
  cos_key: string
}
