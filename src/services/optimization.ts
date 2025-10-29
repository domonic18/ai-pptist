/**
 * 布局优化API服务
 */

import { API_CONFIG } from '@/configs/api'
import type { PPTElement } from '@/types/slides'
import type {
  OptimizationRequest,
  OptimizationResponse,
  SimplifiedElement,
} from '@/types/optimization'

/**
 * 精简元素数据（仅传输必要字段）
 */
function simplifyElement(element: PPTElement): SimplifiedElement {
  // 基础属性
  const base: any = {
    id: element.id,
    type: element.type,
    left: element.left,
    top: element.top,
  }

  // 添加width和height（除了line类型）
  if (element.type !== 'line') {
    base.width = element.width
    base.height = element.height
    base.rotate = element.rotate
  }

  // 根据元素类型添加特定字段
  switch (element.type) {
    case 'text':
      return {
        ...base,
        content: element.content,
        defaultFontName: element.defaultFontName,
        defaultColor: element.defaultColor,
        lineHeight: element.lineHeight,
      }
    case 'shape':
      return {
        ...base,
        fill: element.fill,
        outline: element.outline,
        text: element.text,
      }
    case 'image':
      return {
        ...base,
        src: element.src,
        fixedRatio: element.fixedRatio,
      }
    case 'line':
      // 线条元素没有width、height、rotate属性
      return base
    default:
      return base
  }
}

/**
 * 优化幻灯片布局
 */
export async function optimizeSlideLayout(
  slideId: string,
  elements: PPTElement[],
  canvasSize: { width: number; height: number },
  options?: OptimizationRequest['options'],
): Promise<OptimizationResponse> {
  try {
    // 精简元素数据
    const simplifiedElements = elements.map(simplifyElement)

    // 构建请求
    const request: OptimizationRequest = {
      slide_id: slideId,
      elements: simplifiedElements,
      canvas_size: canvasSize,
      options,
    }

    // 使用API_CONFIG统一管理的端点
    const response = await fetch(API_CONFIG.LAYOUT.OPTIMIZE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    return result
  }
  catch (error: any) {
    // 返回符合StandardResponse格式的错误
    return {
      status: 'error',
      message: error.message || '网络请求失败',
      error_code: 'NETWORK_ERROR',
      error_details: { error: error.message },
    }
  }
}