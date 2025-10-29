/**
 * 布局优化相关类型定义
 */

/**
 * 优化请求数据
 */
export interface OptimizationRequest {
  slide_id: string;
  elements: SimplifiedElement[];
  canvas_size: {
    width: number;
    height: number;
  };
  options?: {
    keep_colors?: boolean;
    keep_fonts?: boolean;
    style?: 'professional' | 'creative' | 'minimal';
  };
}

/**
 * 精简元素数据（仅传输必要字段）
 */
export interface SimplifiedElement {
  id: string;
  type: 'text' | 'image' | 'shape' | 'line' | 'chart' | 'table' | 'latex' | 'video' | 'audio';
  left: number;
  top: number;
  width?: number; // 线条元素没有width
  height?: number; // 线条元素没有height
  rotate?: number; // 线条元素没有rotate
  // 类型特定字段
  content?: string; // text类型
  defaultFontName?: string;
  defaultColor?: string;
  lineHeight?: number;
  fill?: string; // shape类型
  outline?: any;
  text?: any;
  src?: string; // image类型
  fixedRatio?: boolean;
}

/**
 * 优化响应（符合StandardResponse规范）
 */
export interface OptimizationResponse {
  status: 'success' | 'error' | 'warning';
  message: string;
  data?: {
    slide_id: string;
    elements: SimplifiedElement[];
    description?: string;
    duration?: number;
  };
  error_code?: string;
  error_details?: any;
}
