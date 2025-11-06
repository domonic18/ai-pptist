/**
 * 幻灯片优化Mock数据
 * 用于前端调试和测试，避免依赖后端服务
 */

/**
 * 清洗元素数据，移除null/undefined值以避免运行时错误
 * @param element 原始元素数据
 * @returns 清洗后的元素数据
 */
function cleanElementData(element: any): any {
  const cleaned: any = {}

  // 遍历元素的所有属性
  for (const [key, value] of Object.entries(element)) {
    // 跳过 null 和 undefined 值
    if (value === null || value === undefined) {
      continue
    }

    // 对于对象类型，递归清洗
    if (typeof value === 'object' && !Array.isArray(value)) {
      cleaned[key] = cleanElementData(value)
    }
    else {
      cleaned[key] = value
    }
  }

  return cleaned
}

/**
 * 清洗优化响应数据
 * @param response 原始响应数据
 * @returns 清洗后的响应数据
 */
function cleanOptimizationResponse(response: OptimizationMockResponse): OptimizationMockResponse {
  return {
    ...response,
    data: {
      ...response.data,
      elements: response.data.elements.map(cleanElementData)
    }
  }
}

export interface OptimizationMockResponse {
  status: 'success' | 'error'
  message: string
  data: {
    slide_id: string
    elements: any[]
    description?: string
    duration?: number
  }
}

/**
 * 模拟优化成功的响应数据
 * 基于实际后端返回的数据结构
 */
export const OPTIMIZATION_MOCK_RESPONSE: OptimizationMockResponse = {
  status: 'success',
  message: '布局优化完成',
  data: {
    slide_id: 'test-slide-2',
    elements: [
      {
        id: 'abCD1234ef',
        type: 'shape',
        left: 0.0,
        top: 0.0,
        width: 1000.0,
        height: 562.5,
        rotate: 0.0,
        content: null,
        defaultFontName: null,
        defaultColor: null,
        lineHeight: null,
        fill: '#f5f7fa',
        outline: null,
        text: {
          content: ''
        },
        src: null,
        fixedRatio: null,
        radius: null,
        shadow: null,
        opacity: null,
        flipH: null,
        flipV: null,
        fontSize: null,
        fontWeight: null,
        textAlign: null,
        wordSpace: null,
        paragraphSpace: null,
        filter: null,
        path: null,
        viewBox: null
      },
      {
        id: 'XyZ987abCd',
        type: 'shape',
        left: 0.0,
        top: 432.0,
        width: 1000.0,
        height: 130.5,
        rotate: 0.0,
        content: null,
        defaultFontName: null,
        defaultColor: null,
        lineHeight: null,
        fill: '#4a6491',
        outline: null,
        text: {
          content: ''
        },
        src: null,
        fixedRatio: null,
        radius: null,
        shadow: null,
        opacity: null,
        flipH: null,
        flipV: null,
        fontSize: null,
        fontWeight: null,
        textAlign: null,
        wordSpace: null,
        paragraphSpace: null,
        filter: null,
        path: null,
        viewBox: null
      },
      {
        id: 'A1b2C3d4E5',
        type: 'shape',
        left: 50.0,
        top: 462.0,
        width: 900.0,
        height: 6.0,
        rotate: 0.0,
        content: null,
        defaultFontName: null,
        defaultColor: null,
        lineHeight: null,
        fill: 'rgba(255, 255, 255, 0.3)',
        outline: null,
        text: {
          content: ''
        },
        src: null,
        fixedRatio: null,
        radius: null,
        shadow: null,
        opacity: null,
        flipH: null,
        flipV: null,
        fontSize: null,
        fontWeight: null,
        textAlign: null,
        wordSpace: null,
        paragraphSpace: null,
        filter: null,
        path: null,
        viewBox: null
      },
      {
        id: 'G7h8I9j0K1',
        type: 'shape',
        left: 180.0,
        top: 130.0,
        width: 640.0,
        height: 120.0,
        rotate: 0.0,
        content: null,
        defaultFontName: null,
        defaultColor: null,
        lineHeight: null,
        fill: 'rgba(255, 255, 255, 0.9)',
        outline: null,
        text: {
          content: ''
        },
        src: null,
        fixedRatio: null,
        radius: null,
        shadow: null,
        opacity: null,
        flipH: null,
        flipV: null,
        fontSize: null,
        fontWeight: null,
        textAlign: null,
        wordSpace: null,
        paragraphSpace: null,
        filter: null,
        path: null,
        viewBox: null
      },
      {
        id: 'L2m3N4p5Q6',
        type: 'shape',
        left: 180.0,
        top: 270.0,
        width: 640.0,
        height: 80.0,
        rotate: 0.0,
        content: null,
        defaultFontName: null,
        defaultColor: null,
        lineHeight: null,
        fill: 'rgba(74, 100, 145, 0.1)',
        outline: null,
        text: {
          content: ''
        },
        src: null,
        fixedRatio: null,
        radius: null,
        shadow: null,
        opacity: null,
        flipH: null,
        flipV: null,
        fontSize: null,
        fontWeight: null,
        textAlign: null,
        wordSpace: null,
        paragraphSpace: null,
        filter: null,
        path: null,
        viewBox: null
      },
      {
        id: 'R7s8T9u0V1',
        type: 'shape',
        left: 420.0,
        top: 230.0,
        width: 160.0,
        height: 6.0,
        rotate: 0.0,
        content: null,
        defaultFontName: null,
        defaultColor: null,
        lineHeight: null,
        fill: '#4a6491',
        outline: null,
        text: {
          content: ''
        },
        src: null,
        fixedRatio: null,
        radius: null,
        shadow: null,
        opacity: null,
        flipH: null,
        flipV: null,
        fontSize: null,
        fontWeight: null,
        textAlign: null,
        wordSpace: null,
        paragraphSpace: null,
        filter: null,
        path: null,
        viewBox: null
      },
      {
        id: 'ptNnUJ',
        type: 'text',
        left: 200.0,
        top: 150.0,
        width: 600.0,
        height: 77.0,
        rotate: 0.0,
        content: '在此处添加标题',
        defaultFontName: '',
        defaultColor: '#2c3e50',
        lineHeight: 1.2,
        fill: null,
        outline: null,
        text: null,
        src: null,
        fixedRatio: null,
        radius: null,
        shadow: null,
        opacity: null,
        flipH: null,
        flipV: null,
        fontSize: null,
        fontWeight: null,
        textAlign: null,
        wordSpace: null,
        paragraphSpace: null,
        filter: null,
        path: null,
        viewBox: null
      },
      {
        id: 'mRHvQN',
        type: 'text',
        left: 207.5,
        top: 290.0,
        width: 585.0,
        height: 56.0,
        rotate: 0.0,
        content: '在此处添加副标题',
        defaultFontName: '',
        defaultColor: '#4a6491',
        lineHeight: 1.0,
        fill: null,
        outline: null,
        text: null,
        src: null,
        fixedRatio: null,
        radius: null,
        shadow: null,
        opacity: null,
        flipH: null,
        flipV: null,
        fontSize: null,
        fontWeight: null,
        textAlign: null,
        wordSpace: null,
        paragraphSpace: null,
        filter: null,
        path: null,
        viewBox: null
      },
      {
        id: '7CQDwc',
        type: 'line',
        left: 323.09259259259267,
        top: 238.33333333333334,
        width: null,
        height: null,
        rotate: 0.0,
        content: null,
        defaultFontName: null,
        defaultColor: null,
        lineHeight: null,
        fill: null,
        outline: null,
        text: null,
        src: null,
        fixedRatio: null,
        radius: null,
        shadow: null,
        opacity: null,
        flipH: null,
        flipV: null,
        fontSize: null,
        fontWeight: null,
        textAlign: null,
        wordSpace: null,
        paragraphSpace: null,
        filter: null,
        path: null,
        viewBox: null
      },
      {
        id: '09wqWw',
        type: 'shape',
        left: -27.0,
        top: 432.0,
        width: 1056.0,
        height: 162.0,
        rotate: 0.0,
        content: null,
        defaultFontName: null,
        defaultColor: null,
        lineHeight: null,
        fill: 'transparent',
        outline: null,
        text: {
          content: ''
        },
        src: null,
        fixedRatio: null,
        radius: null,
        shadow: null,
        opacity: null,
        flipH: null,
        flipV: null,
        fontSize: null,
        fontWeight: null,
        textAlign: null,
        wordSpace: null,
        paragraphSpace: null,
        filter: null,
        path: null,
        viewBox: null
      },
      {
        id: 'W2x3Y4z5A6',
        type: 'shape',
        left: 120.0,
        top: 80.0,
        width: 24.0,
        height: 24.0,
        rotate: 0.0,
        content: null,
        defaultFontName: null,
        defaultColor: null,
        lineHeight: null,
        fill: '#4a6491',
        outline: null,
        text: {
          content: ''
        },
        src: null,
        fixedRatio: null,
        radius: null,
        shadow: null,
        opacity: null,
        flipH: null,
        flipV: null,
        fontSize: null,
        fontWeight: null,
        textAlign: null,
        wordSpace: null,
        paragraphSpace: null,
        filter: null,
        path: null,
        viewBox: null
      },
      {
        id: 'B7c8D9e0F1',
        type: 'shape',
        left: 860.0,
        top: 400.0,
        width: 24.0,
        height: 24.0,
        rotate: 0.0,
        content: null,
        defaultFontName: null,
        defaultColor: null,
        lineHeight: null,
        fill: '#4a6491',
        outline: null,
        text: {
          content: ''
        },
        src: null,
        fixedRatio: null,
        radius: null,
        shadow: null,
        opacity: null,
        flipH: null,
        flipV: null,
        fontSize: null,
        fontWeight: null,
        textAlign: null,
        wordSpace: null,
        paragraphSpace: null,
        filter: null,
        path: null,
        viewBox: null
      },
      {
        id: 'G2h3I4j5K6',
        type: 'shape',
        left: 120.0,
        top: 400.0,
        width: 24.0,
        height: 24.0,
        rotate: 0.0,
        content: null,
        defaultFontName: null,
        defaultColor: null,
        lineHeight: null,
        fill: '#4a6491',
        outline: null,
        text: {
          content: ''
        },
        src: null,
        fixedRatio: null,
        radius: null,
        shadow: null,
        opacity: null,
        flipH: null,
        flipV: null,
        fontSize: null,
        fontWeight: null,
        textAlign: null,
        wordSpace: null,
        paragraphSpace: null,
        filter: null,
        path: null,
        viewBox: null
      },
      {
        id: 'L7m8N9p0Q1',
        type: 'shape',
        left: 860.0,
        top: 80.0,
        width: 24.0,
        height: 24.0,
        rotate: 0.0,
        content: null,
        defaultFontName: null,
        defaultColor: null,
        lineHeight: null,
        fill: '#4a6491',
        outline: null,
        text: {
          content: ''
        },
        src: null,
        fixedRatio: null,
        radius: null,
        shadow: null,
        opacity: null,
        flipH: null,
        flipV: null,
        fontSize: null,
        fontWeight: null,
        textAlign: null,
        wordSpace: null,
        paragraphSpace: null,
        filter: null,
        path: null,
        viewBox: null
      },
      {
        id: 'R2s3T4u5V6',
        type: 'shape',
        left: 60.0,
        top: 210.0,
        width: 40.0,
        height: 6.0,
        rotate: 0.0,
        content: null,
        defaultFontName: null,
        defaultColor: null,
        lineHeight: null,
        fill: '#4a6491',
        outline: null,
        text: {
          content: ''
        },
        src: null,
        fixedRatio: null,
        radius: null,
        shadow: null,
        opacity: null,
        flipH: null,
        flipV: null,
        fontSize: null,
        fontWeight: null,
        textAlign: null,
        wordSpace: null,
        paragraphSpace: null,
        filter: null,
        path: null,
        viewBox: null
      },
      {
        id: 'W7x8Y9z0A1',
        type: 'shape',
        left: 900.0,
        top: 210.0,
        width: 40.0,
        height: 6.0,
        rotate: 0.0,
        content: null,
        defaultFontName: null,
        defaultColor: null,
        lineHeight: null,
        fill: '#4a6491',
        outline: null,
        text: {
          content: ''
        },
        src: null,
        fixedRatio: null,
        radius: null,
        shadow: null,
        opacity: null,
        flipH: null,
        flipV: null,
        fontSize: null,
        fontWeight: null,
        textAlign: null,
        wordSpace: null,
        paragraphSpace: null,
        filter: null,
        path: null,
        viewBox: null
      }
    ],
    duration: 26.45514178276062
  }
}

/**
 * 模拟优化失败的响应数据
 */
export const OPTIMIZATION_MOCK_ERROR_RESPONSE: OptimizationMockResponse = {
  status: 'error',
  message: '模拟优化失败',
  data: {
    slide_id: 'test-slide-error',
    elements: [],
    duration: 0
  }
}

/**
 * 获取Mock优化响应
 * @param success 是否返回成功响应
 * @returns 清洗后的Mock响应数据
 */
export function getOptimizationMockResponse(success: boolean = true): OptimizationMockResponse {
  const response = success ? OPTIMIZATION_MOCK_RESPONSE : OPTIMIZATION_MOCK_ERROR_RESPONSE
  return cleanOptimizationResponse(response)
}