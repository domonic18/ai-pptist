import { describe, it, expect } from 'vitest'
import { pairComparisonLayout } from '../pairing'
import { pairHorizontalListLayout } from '../pairing'
import { pairGenericLayout } from '../pairing'
import type { LayoutAnalysisResult } from '../types/index'
import type { PPTTextElement } from '@/types/slides'

describe('Pairing Modules - 配对模块', () => {
  // 创建测试用的文本元素
  const createTextElement = (
    id: string,
    left: number,
    top: number,
    width: number,
    textType?: string
  ): PPTTextElement => ({
    type: 'text',
    id,
    left,
    top,
    width,
    height: 50,
    content: '<p>测试内容</p>',
    rotate: 0,
    defaultFontName: '',
    defaultColor: '#333',
    vertical: false,
    textType,
  })

  describe('pairComparisonLayout - 对比布局配对', () => {
    it('应该正确配对左右对比布局', () => {
      const layoutAnalysis: LayoutAnalysisResult = {
        layoutType: 'comparison',
        leftTitles: [createTextElement('left_title', 100, 100, 200)],
        rightTitles: [createTextElement('right_title', 400, 100, 200)],
        leftTexts: [createTextElement('left_text', 100, 170, 200)],
        rightTexts: [createTextElement('right_text', 400, 170, 200)],
        topTexts: [],
        bottomTexts: [],
      }

      const itemsWithTitle = [
        { title: '左侧标题', text: '左侧内容' },
        { title: '右侧标题', text: '右侧内容' },
      ]
      const itemsWithoutTitle = []

      const result = pairComparisonLayout(layoutAnalysis, itemsWithTitle, itemsWithoutTitle)

      expect(result).toHaveLength(2)
      expect(result[0].title?.id).toBe('left_title')
      expect(result[0].text.id).toBe('left_text')
      expect(result[0].dataItem.title).toBe('左侧标题')
      expect(result[1].title?.id).toBe('right_title')
      expect(result[1].text.id).toBe('right_text')
      expect(result[1].dataItem.title).toBe('右侧标题')
    })

    it('应该正确处理顶部和底部的无标题内容', () => {
      const layoutAnalysis: LayoutAnalysisResult = {
        layoutType: 'comparison',
        leftTitles: [createTextElement('left_title', 100, 200, 200)],
        rightTitles: [createTextElement('right_title', 400, 200, 200)],
        leftTexts: [createTextElement('left_text', 100, 270, 200)],
        rightTexts: [createTextElement('right_text', 400, 270, 200)],
        topTexts: [createTextElement('top_text', 100, 50, 600)],
        bottomTexts: [createTextElement('bottom_text', 100, 400, 600)],
      }

      const itemsWithTitle = [
        { title: '左侧', text: '左侧内容' },
        { title: '右侧', text: '右侧内容' },
      ]
      const itemsWithoutTitle = [
        { title: '', text: '顶部说明' },
        { title: '', text: '底部总结' },
      ]

      const result = pairComparisonLayout(layoutAnalysis, itemsWithTitle, itemsWithoutTitle)

      expect(result).toHaveLength(4)
      expect(result[0].title).toBeNull()
      expect(result[0].text.id).toBe('top_text')
      expect(result[3].title).toBeNull()
      expect(result[3].text.id).toBe('bottom_text')
    })
  })

  describe('pairHorizontalListLayout - 水平列表配对', () => {
    it('应该正确配对水平列表布局', () => {
      const layoutAnalysis: LayoutAnalysisResult = {
        layoutType: 'horizontal_list',
        leftTitles: [],
        rightTitles: [],
        leftTexts: [],
        rightTexts: [],
        topTexts: [],
        bottomTexts: [],
        listTitles: [
          createTextElement('title1', 100, 100, 150),
          createTextElement('title2', 300, 100, 150),
          createTextElement('title3', 500, 100, 150),
        ],
        listTexts: [
          createTextElement('text1', 100, 170, 150),
          createTextElement('text2', 300, 170, 150),
          createTextElement('text3', 500, 170, 150),
        ],
      }

      const itemsWithTitle = [
        { title: '步骤1', text: '内容1' },
        { title: '步骤2', text: '内容2' },
        { title: '步骤3', text: '内容3' },
      ]
      const itemsWithoutTitle = []

      const result = pairHorizontalListLayout(layoutAnalysis, itemsWithTitle, itemsWithoutTitle)

      expect(result).toHaveLength(3)
      expect(result[0].title?.id).toBe('title1')
      expect(result[0].text.id).toBe('text1')
      expect(result[1].title?.id).toBe('title2')
      expect(result[1].text.id).toBe('text2')
      expect(result[2].title?.id).toBe('title3')
      expect(result[2].text.id).toBe('text3')
    })

    it('应该按水平位置排序后配对', () => {
      const layoutAnalysis: LayoutAnalysisResult = {
        layoutType: 'horizontal_list',
        leftTitles: [],
        rightTitles: [],
        leftTexts: [],
        rightTexts: [],
        topTexts: [],
        bottomTexts: [],
        listTitles: [
          createTextElement('title3', 500, 100, 150), // 故意乱序
          createTextElement('title1', 100, 100, 150),
          createTextElement('title2', 300, 100, 150),
        ],
        listTexts: [
          createTextElement('text2', 300, 170, 150),
          createTextElement('text3', 500, 170, 150),
          createTextElement('text1', 100, 170, 150),
        ],
      }

      const itemsWithTitle = [
        { title: '第一个', text: '内容1' },
        { title: '第二个', text: '内容2' },
        { title: '第三个', text: '内容3' },
      ]
      const itemsWithoutTitle = []

      const result = pairHorizontalListLayout(layoutAnalysis, itemsWithTitle, itemsWithoutTitle)

      expect(result).toHaveLength(3)
      // 应该按left值排序后配对
      expect(result[0].title?.id).toBe('title1')
      expect(result[0].text.id).toBe('text1')
      expect(result[0].dataItem.title).toBe('第一个')
    })
  })

  describe('pairGenericLayout - 通用布局配对', () => {
    it('应该使用智能匹配为有标题的数据项配对', () => {
      const titleElements = [
        createTextElement('title1', 100, 100, 200, 'itemTitle'),
        createTextElement('title2', 100, 250, 200, 'itemTitle'),
      ]
      const textElements = [
        createTextElement('text1', 100, 170, 200, 'item'),
        createTextElement('text2', 100, 320, 200, 'item'),
      ]

      const itemsWithTitle = [
        { title: '标题1', text: '内容1' },
        { title: '标题2', text: '内容2' },
      ]
      const itemsWithoutTitle = []

      const result = pairGenericLayout(titleElements, textElements, itemsWithTitle, itemsWithoutTitle)

      expect(result).toHaveLength(2)
      expect(result[0].title).toBeDefined()
      expect(result[0].text).toBeDefined()
      expect(result[1].title).toBeDefined()
      expect(result[1].text).toBeDefined()
    })

    it('应该为无标题的数据项分配剩余元素', () => {
      const titleElements = [
        createTextElement('title1', 100, 100, 200, 'itemTitle'),
      ]
      const textElements = [
        createTextElement('text1', 100, 170, 200, 'item'),
        createTextElement('text2', 100, 320, 200, 'item'),
      ]

      const itemsWithTitle = [
        { title: '标题1', text: '内容1' },
      ]
      const itemsWithoutTitle = [
        { title: '', text: '独立内容' },
      ]

      const result = pairGenericLayout(titleElements, textElements, itemsWithTitle, itemsWithoutTitle)

      expect(result).toHaveLength(2)
      expect(result[0].title).toBeDefined()
      expect(result[1].title).toBeNull()
      expect(result[1].text).toBeDefined()
    })

    it('应该正确处理元素数量不匹配的情况', () => {
      const titleElements = [
        createTextElement('title1', 100, 100, 200, 'itemTitle'),
        createTextElement('title2', 100, 250, 200, 'itemTitle'),
      ]
      const textElements = [
        createTextElement('text1', 100, 170, 200, 'item'),
      ]

      const itemsWithTitle = [
        { title: '标题1', text: '内容1' },
      ]
      const itemsWithoutTitle = []

      const result = pairGenericLayout(titleElements, textElements, itemsWithTitle, itemsWithoutTitle)

      // 只有一个数据项，所以只配对一个
      expect(result).toHaveLength(1)
      expect(result[0].title).toBeDefined()
      expect(result[0].text).toBeDefined()
    })
  })

  describe('实际场景测试 - 基于DdUosjpCnW模板', () => {
    it('应该正确处理对比布局中所有数据项都没有标题的情况', () => {
      // 基于实际模板 DdUosjpCnW 的布局分析结果
      const layoutAnalysis: LayoutAnalysisResult = {
        layoutType: 'comparison',
        leftTitles: [createTextElement('left_title', 100, 100, 200)],
        rightTitles: [createTextElement('right_title', 400, 100, 200)],
        leftTexts: [createTextElement('52r6QyTCHX', 100, 170, 200, 'item')], // 实际模板中的文本元素ID
        rightTexts: [createTextElement('c1MNLb3HIm', 400, 170, 200, 'item')], // 实际模板中的文本元素ID
        topTexts: [],
        bottomTexts: [],
      }

      // 基于实际后端返回的数据结构
      const itemsWithTitle = []
      const itemsWithoutTitle = [
        { title: '', text: '通过生活情境引入有理数比较的挑战，激发学习兴趣' },
        { title: '', text: '通过分类讨论和数轴观察，构建有理数比较的基本框架' },
      ]

      const result = pairComparisonLayout(layoutAnalysis, itemsWithTitle, itemsWithoutTitle)

      expect(result).toHaveLength(2)
      // 左侧文本元素应该与第一个无标题数据项配对
      expect(result[0].title).toBeNull()
      expect(result[0].text.id).toBe('52r6QyTCHX')
      expect(result[0].dataItem.text).toBe('通过生活情境引入有理数比较的挑战，激发学习兴趣')
      // 右侧文本元素应该与第二个无标题数据项配对
      expect(result[1].title).toBeNull()
      expect(result[1].text.id).toBe('c1MNLb3HIm')
      expect(result[1].dataItem.text).toBe('通过分类讨论和数轴观察，构建有理数比较的基本框架')
    })

    it('应该正确处理通用布局中所有数据项都没有标题的情况', () => {
      // 模拟通用布局场景
      const titleElements = [
        createTextElement('title1', 100, 100, 200, 'itemTitle'),
        createTextElement('title2', 100, 250, 200, 'itemTitle'),
      ]
      const textElements = [
        createTextElement('text1', 100, 170, 200, 'item'),
        createTextElement('text2', 100, 320, 200, 'item'),
      ]

      // 基于实际后端返回的数据结构 - 所有数据项都没有标题
      const itemsWithTitle = []
      const itemsWithoutTitle = [
        { title: '', text: '通过生活情境引入有理数比较的挑战，激发学习兴趣' },
        { title: '', text: '通过分类讨论和数轴观察，构建有理数比较的基本框架' },
      ]

      const result = pairGenericLayout(titleElements, textElements, itemsWithTitle, itemsWithoutTitle)

      expect(result).toHaveLength(2)
      // 所有配对都应该没有标题元素
      expect(result[0].title).toBeNull()
      expect(result[0].text.id).toBe('text1')
      expect(result[0].dataItem.text).toBe('通过生活情境引入有理数比较的挑战，激发学习兴趣')
      expect(result[1].title).toBeNull()
      expect(result[1].text.id).toBe('text2')
      expect(result[1].dataItem.text).toBe('通过分类讨论和数轴观察，构建有理数比较的基本框架')
    })
  })
})