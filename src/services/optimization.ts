/**
 * 布局优化API服务
 */

/* eslint-disable no-console */

import { API_CONFIG } from '@/configs/api'
import { getMockConfig, mockDelay } from '@/configs/mock'
import { getOptimizationMockResponse } from '@/mocks/optimizationMock'
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
 * 使用Mock数据进行优化
 */
async function optimizeWithMock(
  slideId: string,
  elements: PPTElement[],
  canvasSize: { width: number; height: number },
  userPrompt?: string
): Promise<OptimizationResponse> {
  console.log('📱 使用Mock数据进行幻灯片优化')
  console.log('幻灯片ID:', slideId)
  console.log('元素数量:', elements.length)
  console.log('画布尺寸:', canvasSize)
  console.log('用户提示词:', userPrompt || '无')

  // 模拟网络延迟
  await mockDelay()

  // 获取Mock配置
  const mockConfig = getMockConfig()

  // 返回Mock响应
  const mockResponse = getOptimizationMockResponse(mockConfig.mockSuccess)

  console.log('✅ Mock优化完成，返回元素数量:', mockResponse.data.elements.length)
  return mockResponse
}

/**
 * 使用真实API进行优化
 */
async function optimizeWithAPI(
  slideId: string,
  elements: PPTElement[],
  canvasSize: { width: number; height: number },
  options?: OptimizationRequest['options'],
  userPrompt?: string,
  modelConfig?: OptimizationRequest['ai_model_config'],
  temperature?: number,
  contentAnalysis?: string,
  layoutTypeHint?: string
): Promise<OptimizationResponse> {
  console.log('🌐 使用真实API进行幻灯片优化')

  // 精简元素数据
  const simplifiedElements = elements.map(simplifyElement)

  // 构建请求
  const request: OptimizationRequest = {
    slide_id: slideId,
    elements: simplifiedElements,
    canvas_size: canvasSize,
    options,
    user_prompt: userPrompt,
    ai_model_config: modelConfig,
    temperature,
    content_analysis: contentAnalysis,
    layout_type_hint: layoutTypeHint,
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
  console.log('✅ API优化完成，返回元素数量:', result.data?.elements?.length || 0)
  return result
}

/**
 * 优化幻灯片布局
 */
export async function optimizeSlideLayout(
  slideId: string,
  elements: PPTElement[],
  canvasSize: { width: number; height: number },
  options?: OptimizationRequest['options'],
  userPrompt?: string,
  modelConfig?: OptimizationRequest['ai_model_config'],
  temperature?: number,
  contentAnalysis?: string,
  layoutTypeHint?: string
): Promise<OptimizationResponse> {
  try {
    // 检查是否启用Mock
    const mockConfig = getMockConfig()

    if (mockConfig.enableOptimizationMock) {
      return await optimizeWithMock(slideId, elements, canvasSize, userPrompt)
    }

    return await optimizeWithAPI(
      slideId,
      elements,
      canvasSize,
      options,
      userPrompt,
      modelConfig,
      temperature,
      contentAnalysis,
      layoutTypeHint
    )
  }
  catch (error: any) {
    console.error('❌ 优化幻灯片布局失败:', error)

    // 返回符合StandardResponse格式的错误
    return {
      status: 'error',
      message: error.message || '网络请求失败',
      error_code: 'NETWORK_ERROR',
      error_details: { error: error.message },
    }
  }
}