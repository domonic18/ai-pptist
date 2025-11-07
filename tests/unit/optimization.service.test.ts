/**
 * @fileoverview 布局优化服务单元测试
 * @description 测试optimization.ts中optimizeSlideLayout函数的行为
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { optimizeSlideLayout } from '@/services/optimization'
import type { PPTElement } from '@/types/slides'

// 模拟fetch
global.fetch = vi.fn()

// 创建模拟的响应
const mockResponse = {
  status: 'success' as const,
  message: '优化完成',
  data: {
    elements: [
      {
        id: '1',
        type: 'text',
        left: 150,
        top: 100,
        width: 200,
        height: 50,
        rotate: 0,
        content: '优化后的文本',
        defaultFontName: 'Arial',
        defaultColor: '#333333',
        lineHeight: 1.5,
      },
    ],
  },
  error: null,
}

describe('optimizeSlideLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('应该过滤掉锁定的元素，只对未锁定元素进行优化', async () => {
    // 准备测试数据
    const mockElements: PPTElement[] = [
      {
        id: '1',
        type: 'text',
        left: 100,
        top: 100,
        width: 200,
        height: 50,
        rotate: 0,
        lock: false,
        content: '未锁定的文本',
        defaultFontName: 'Arial',
        defaultColor: '#333333',
        lineHeight: 1.5,
      },
      {
        id: '2',
        type: 'shape',
        left: 150,
        top: 150,
        width: 100,
        height: 100,
        rotate: 0,
        lock: true, // 锁定的元素
        fill: '#ffffff',
        text: { content: '' },
      },
      {
        id: '3',
        type: 'image',
        left: 200,
        top: 200,
        width: 150,
        height: 150,
        rotate: 0,
        lock: false,
        src: 'image.jpg',
        fixedRatio: true,
      },
      {
        id: '4',
        type: 'text',
        left: 250,
        top: 250,
        width: 200,
        height: 50,
        rotate: 0,
        lock: true, // 锁定的元素
        content: '另一个锁定的文本',
        defaultFontName: 'Arial',
        defaultColor: '#333333',
        lineHeight: 1.5,
      },
    ]

    // 模拟API响应
    ;(fetch as vi.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response)

    // 执行测试
    const result = await optimizeSlideLayout(
      'slide-123',
      mockElements,
      { width: 1920, height: 1080 },
      undefined,
      '优化布局'
    )

    // 验证
    expect(result.status).toBe('success')
    expect(fetch).toHaveBeenCalledTimes(1)

    // 获取传递给API的参数
    const apiCall = (fetch as vi.MockedFunction<typeof fetch>).mock.calls[0]
    const requestBody = JSON.parse(apiCall[1].body as string)

    // 验证只有未锁定的元素被传递
    expect(requestBody.elements).toHaveLength(2) // 只有id为1和3的未锁定元素
    expect(requestBody.elements.map((e: any) => e.id)).toEqual(['1', '3'])
  })

  it('应该正确处理所有元素都未锁定的情况', async () => {
    const mockElements: PPTElement[] = [
      {
        id: '1',
        type: 'text',
        left: 100,
        top: 100,
        width: 200,
        height: 50,
        rotate: 0,
        lock: false,
        content: '文本1',
        defaultFontName: 'Arial',
        defaultColor: '#333333',
        lineHeight: 1.5,
      },
      {
        id: '2',
        type: 'shape',
        left: 150,
        top: 150,
        width: 100,
        height: 100,
        rotate: 0,
        lock: false,
        fill: '#ffffff',
        text: { content: '' },
      },
    ]

    ;(fetch as vi.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response)

    const result = await optimizeSlideLayout(
      'slide-123',
      mockElements,
      { width: 1920, height: 1080 }
    )

    const apiCall = (fetch as vi.MockedFunction<typeof fetch>).mock.calls[0]
    const requestBody = JSON.parse(apiCall[1].body as string)

    expect(requestBody.elements).toHaveLength(2)
    expect(requestBody.elements.map((e: any) => e.id)).toEqual(['1', '2'])
  })

  it('应该正确处理所有元素都被锁定的情况', async () => {
    const mockElements: PPTElement[] = [
      {
        id: '1',
        type: 'text',
        left: 100,
        top: 100,
        width: 200,
        height: 50,
        rotate: 0,
        lock: true,
        content: '锁定的文本',
        defaultFontName: 'Arial',
        defaultColor: '#333333',
        lineHeight: 1.5,
      },
      {
        id: '2',
        type: 'shape',
        left: 150,
        top: 150,
        width: 100,
        height: 100,
        rotate: 0,
        lock: true,
        fill: '#ffffff',
        text: { content: '' },
      },
    ]

    ;(fetch as vi.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response)

    const result = await optimizeSlideLayout(
      'slide-123',
      mockElements,
      { width: 1920, height: 1080 }
    )

    const apiCall = (fetch as vi.MockedFunction<typeof fetch>).mock.calls[0]
    const requestBody = JSON.parse(apiCall[1].body as string)

    // 所有元素都被锁定，所以不会传递任何元素
    expect(requestBody.elements).toHaveLength(0)
  })

  it('应该正确处理没有lock属性的元素（视为未锁定）', async () => {
    const mockElements: PPTElement[] = [
      {
        id: '1',
        type: 'text',
        left: 100,
        top: 100,
        width: 200,
        height: 50,
        rotate: 0,
        // 没有lock属性
        content: '无lock属性',
        defaultFontName: 'Arial',
        defaultColor: '#333333',
        lineHeight: 1.5,
      },
      {
        id: '2',
        type: 'shape',
        left: 150,
        top: 150,
        width: 100,
        height: 100,
        rotate: 0,
        lock: true,
        fill: '#ffffff',
        text: { content: '' },
      },
    ]

    ;(fetch as vi.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response)

    const result = await optimizeSlideLayout(
      'slide-123',
      mockElements,
      { width: 1920, height: 1080 }
    )

    const apiCall = (fetch as vi.MockedFunction<typeof fetch>).mock.calls[0]
    const requestBody = JSON.parse(apiCall[1].body as string)

    // 没有lock属性的元素被视为未锁定
    expect(requestBody.elements).toHaveLength(1)
    expect(requestBody.elements[0].id).toBe('1')
  })

  it('应该在网络错误时返回标准错误格式', async () => {
    const mockElements: PPTElement[] = [
      {
        id: '1',
        type: 'text',
        left: 100,
        top: 100,
        width: 200,
        height: 50,
        rotate: 0,
        lock: false,
        content: '文本',
        defaultFontName: 'Arial',
        defaultColor: '#333333',
        lineHeight: 1.5,
      },
    ]

    ;(fetch as vi.MockedFunction<typeof fetch>).mockRejectedValueOnce(
      new Error('Network error')
    )

    const result = await optimizeSlideLayout(
      'slide-123',
      mockElements,
      { width: 1920, height: 1080 }
    )

    expect(result.status).toBe('error')
    expect(result.error_code).toBe('NETWORK_ERROR')
    expect(result.message).toBe('Network error')
  })
})
