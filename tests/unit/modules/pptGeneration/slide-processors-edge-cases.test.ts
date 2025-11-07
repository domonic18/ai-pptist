/**
 * 增强版幻灯片处理器边缘情况测试
 * 测试各种边界条件和异常情况
 */

import { describe, it, expect } from 'vitest'
import {
  analyzeTemplateLayout,
  pairComparisonLayout,
  pairHorizontalListLayout,
  pairGenericLayout,
  processContentSlide
} from '../../../../src/modules/pptGeneration/processors/slideProcessorsEnhanced'

describe('Enhanced Slide Processors - 边缘情况测试', () => {
  const mockImgPool = [
    { src: 'image1.jpg', width: 800, height: 600 },
    { src: 'image2.jpg', width: 600, height: 800 }
  ]

  describe('边界条件测试', () => {
    it('应该处理空元素数组', () => {
      const result = analyzeTemplateLayout([], [])

      expect(result.layoutType).toBe('generic')
      expect(result.leftTitles).toHaveLength(0)
      expect(result.rightTitles).toHaveLength(0)
      expect(result.leftTexts).toHaveLength(0)
      expect(result.rightTexts).toHaveLength(0)
      expect(result.topTexts).toHaveLength(0)
      expect(result.bottomTexts).toHaveLength(0)
    })

    it('应该处理只有标题元素的情况', () => {
      const titleElements = [
        {
          type: 'text' as const,
          id: 'title1',
          textType: 'itemTitle' as const,
          left: 100,
          top: 100,
          width: 200,
          height: 50
        }
      ]

      const result = analyzeTemplateLayout(titleElements, [])

      expect(result.layoutType).toBe('generic')
      expect(result.leftTitles).toHaveLength(0)
      expect(result.rightTitles).toHaveLength(0)
    })

    it('应该处理只有正文元素的情况', () => {
      const textElements = [
        {
          type: 'text' as const,
          id: 'text1',
          textType: 'item' as const,
          left: 100,
          top: 100,
          width: 200,
          height: 100
        }
      ]

      const result = analyzeTemplateLayout([], textElements)

      expect(result.layoutType).toBe('generic')
      expect(result.leftTexts).toHaveLength(0)
      expect(result.rightTexts).toHaveLength(0)
    })

    it('应该处理元素数量不匹配的情况', () => {
      const layoutAnalysis = {
        layoutType: 'comparison' as const,
        leftTitles: [
          {
            type: 'text' as const,
            id: 'leftTitle',
            textType: 'itemTitle' as const,
            left: 100,
            top: 200,
            width: 300,
            height: 50
          }
        ],
        rightTitles: [
          {
            type: 'text' as const,
            id: 'rightTitle',
            textType: 'itemTitle' as const,
            left: 500,
            top: 200,
            width: 300,
            height: 50
          }
        ],
        leftTexts: [
          {
            type: 'text' as const,
            id: 'leftText',
            textType: 'item' as const,
            left: 120,
            top: 280,
            width: 280,
            height: 100
          }
        ],
        rightTexts: [
          {
            type: 'text' as const,
            id: 'rightText',
            textType: 'item' as const,
            left: 520,
            top: 280,
            width: 280,
            height: 100
          }
        ],
        topTexts: [],
        bottomTexts: []
      }

      // 数据项数量少于模板元素
      const itemsWithTitle = [
        { title: '左侧标题', text: '左侧内容' }
      ]

      const itemsWithoutTitle = []

      const result = pairComparisonLayout(layoutAnalysis, itemsWithTitle, itemsWithoutTitle)

      expect(result).toHaveLength(1)
      expect(result[0].title?.id).toBe('leftTitle')
      expect(result[0].text.id).toBe('leftText')
    })
  })

  describe('异常数据测试', () => {
    it('应该处理包含null或undefined的数据项', async () => {
      const contentSlide = {
        type: 'content' as const,
        data: {
          title: '异常数据测试',
          items: [
            { title: '正常标题', text: '正常内容' },
            { title: null as any, text: '空标题内容' },
            { title: '空文本标题', text: null as any },
            { title: undefined as any, text: undefined as any }
          ]
        }
      }

      const contentTemplates = [
        {
          id: 'test_template',
          elements: [
            {
              type: 'text' as const,
              id: 'title1',
              textType: 'itemTitle' as const,
              left: 100,
              top: 100,
              width: 200,
              height: 50,
              content: '<p>原始标题1</p>'
            },
            {
              type: 'text' as const,
              id: 'text1',
              textType: 'item' as const,
              left: 100,
              top: 160,
              width: 200,
              height: 100,
              content: '<p>原始内容1</p>'
            },
            {
              type: 'text' as const,
              id: 'title2',
              textType: 'itemTitle' as const,
              left: 100,
              top: 280,
              width: 200,
              height: 50,
              content: '<p>原始标题2</p>'
            },
            {
              type: 'text' as const,
              id: 'text2',
              textType: 'item' as const,
              left: 100,
              top: 340,
              width: 200,
              height: 100,
              content: '<p>原始内容2</p>'
            }
          ]
        }
      ]

      const result = await processContentSlide(contentSlide, contentTemplates, mockImgPool)

      expect(result).toBeDefined()

      // 验证正常数据项正确处理
      const title1 = result?.elements.find(el => el.id === 'title1')
      expect(title1).toBeDefined()
      if (title1 && title1.type === 'text') {
        expect(title1.content).toContain('正常标题')
      }

      const text1 = result?.elements.find(el => el.id === 'text1')
      expect(text1).toBeDefined()
      if (text1 && text1.type === 'text') {
        expect(text1.content).toContain('正常内容')
      }
    })

    it('应该处理极端位置和大小的元素', () => {
      const titleElements = [
        {
          type: 'text' as const,
          id: 'tinyTitle',
          textType: 'itemTitle' as const,
          left: 0,
          top: 0,
          width: 10,
          height: 5
        },
        {
          type: 'text' as const,
          id: 'hugeTitle',
          textType: 'itemTitle' as const,
          left: 1000,
          top: 1000,
          width: 500,
          height: 200
        }
      ]

      const textElements = [
        {
          type: 'text' as const,
          id: 'tinyText',
          textType: 'item' as const,
          left: 0,
          top: 10,
          width: 10,
          height: 5
        },
        {
          type: 'text' as const,
          id: 'hugeText',
          textType: 'item' as const,
          left: 1000,
          top: 1200,
          width: 500,
          height: 200
        }
      ]

      const result = analyzeTemplateLayout(titleElements, textElements)

      expect(result.layoutType).toBe('generic')
      // 算法应该能够处理极端位置和大小的元素
    })
  })

  describe('性能测试', () => {
    it('应该处理大量元素的情况', () => {
      // 创建大量元素测试性能
      const titleElements = Array.from({ length: 20 }, (_, i) => ({
        type: 'text' as const,
        id: `title${i}`,
        textType: 'itemTitle' as const,
        left: 100 + (i % 5) * 200,
        top: 100 + Math.floor(i / 5) * 100,
        width: 180,
        height: 50
      }))

      const textElements = Array.from({ length: 20 }, (_, i) => ({
        type: 'text' as const,
        id: `text${i}`,
        textType: 'item' as const,
        left: 100 + (i % 5) * 200,
        top: 160 + Math.floor(i / 5) * 100,
        width: 180,
        height: 80
      }))

      const startTime = Date.now()
      const result = analyzeTemplateLayout(titleElements, textElements)
      const endTime = Date.now()

      expect(result).toBeDefined()
      expect(result.layoutType).toBe('generic') // 大量元素应该被识别为通用布局

      // 性能检查：处理20个元素应该在合理时间内完成
      const processingTime = endTime - startTime
      expect(processingTime).toBeLessThan(1000) // 应该在1秒内完成
    })

    it('应该处理大量数据项的情况', async () => {
      const contentSlide = {
        type: 'content' as const,
        data: {
          title: '大量数据项测试',
          items: Array.from({ length: 50 }, (_, i) => ({
            title: `标题${i + 1}`,
            text: `内容${i + 1}`
          }))
        }
      }

      const contentTemplates = [
        {
          id: 'large_template',
          elements: [
            ...Array.from({ length: 50 }, (_, i) => ({
              type: 'text' as const,
              id: `title${i}`,
              textType: 'itemTitle' as const,
              left: 100,
              top: 100 + i * 60,
              width: 200,
              height: 50,
              content: `<p>原始标题${i}</p>`
            })),
            ...Array.from({ length: 50 }, (_, i) => ({
              type: 'text' as const,
              id: `text${i}`,
              textType: 'item' as const,
              left: 100,
              top: 160 + i * 60,
              width: 200,
              height: 50,
              content: `<p>原始内容${i}</p>`
            }))
          ]
        }
      ]

      const startTime = Date.now()
      const result = await processContentSlide(contentSlide, contentTemplates, mockImgPool)
      const endTime = Date.now()

      expect(result).toBeDefined()

      // 性能检查：处理100个元素应该在合理时间内完成
      const processingTime = endTime - startTime
      expect(processingTime).toBeLessThan(5000) // 应该在5秒内完成
    })
  })

  describe('布局识别边界测试', () => {
    it('应该识别接近边界的左右对比布局', () => {
      const titleElements = [
        {
          type: 'text' as const,
          id: 'leftTitle',
          textType: 'itemTitle' as const,
          left: 100,
          top: 200,
          width: 350,
          height: 50
        },
        {
          type: 'text' as const,
          id: 'rightTitle',
          textType: 'itemTitle' as const,
          left: 550, // 接近边界
          top: 200,
          width: 350,
          height: 50
        }
      ]

      const textElements = [
        {
          type: 'text' as const,
          id: 'leftText',
          textType: 'item' as const,
          left: 120,
          top: 280,
          width: 330,
          height: 100
        },
        {
          type: 'text' as const,
          id: 'rightText',
          textType: 'item' as const,
          left: 570,
          top: 280,
          width: 330,
          height: 100
        }
      ]

      const result = analyzeTemplateLayout(titleElements, textElements)

      // 接近边界的布局应该仍然被识别为对比布局
      expect(result.layoutType).toBe('comparison')
    })

    it('应该识别不规则的水平列表布局', () => {
      const titleElements = [
        {
          type: 'text' as const,
          id: 'title1',
          textType: 'itemTitle' as const,
          left: 100,
          top: 200,
          width: 200,
          height: 50
        },
        {
          type: 'text' as const,
          id: 'title2',
          textType: 'itemTitle' as const,
          left: 450, // 间距不规则
          top: 200,
          width: 200,
          height: 50
        },
        {
          type: 'text' as const,
          id: 'title3',
          textType: 'itemTitle' as const,
          left: 800,
          top: 200,
          width: 200,
          height: 50
        }
      ]

      const textElements = [
        {
          type: 'text' as const,
          id: 'text1',
          textType: 'item' as const,
          left: 120,
          top: 280,
          width: 180,
          height: 100
        },
        {
          type: 'text' as const,
          id: 'text2',
          textType: 'item' as const,
          left: 470,
          top: 280,
          width: 180,
          height: 100
        },
        {
          type: 'text' as const,
          id: 'text3',
          textType: 'item' as const,
          left: 820,
          top: 280,
          width: 180,
          height: 100
        }
      ]

      const result = analyzeTemplateLayout(titleElements, textElements)

      // 不规则间距的水平列表应该仍然被识别
      expect(result.layoutType).toBe('horizontal_list')
    })
  })
})