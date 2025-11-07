/**
 * 增强版幻灯片处理器测试用例
 * 基于实际模板数据和后端返回数据创建测试
 */

import { describe, it, expect } from 'vitest'
import {
  analyzeTemplateLayout,
  pairComparisonLayout,
  pairHorizontalListLayout,
  pairGenericLayout,
  calculateLayoutMatchScore
} from '../../../../src/modules/pptGeneration/processors/slideProcessorsEnhanced'

describe('Enhanced Slide Processors - 基于实际模板数据测试', () => {
  describe('analyzeTemplateLayout - 实际模板布局分析', () => {
    it('应该正确识别水平列表布局（模板第二页）', () => {
      // 基于模板第二页的实际元素数据
      const titleElements = [
        {
          type: 'text' as const,
          id: 'OOt_0l53y0',
          textType: 'itemTitle' as const,
          left: 154.24025457438344,
          top: 459.2929594272076,
          width: 241.3743038981702,
          height: 86
        },
        {
          type: 'text' as const,
          id: '0xEvZBgfYV',
          textType: 'itemTitle' as const,
          left: 542.1699609118073,
          top: 460.5049868766404,
          width: 241.3743038981702,
          height: 86
        },
        {
          type: 'text' as const,
          id: 'DM62m3AIgr',
          textType: 'itemTitle' as const,
          left: 932.6234215323324,
          top: 460.5049868766404,
          width: 241.3743038981702,
          height: 86
        }
      ]

      const textElements = [
        {
          type: 'text' as const,
          id: 'ZVhB-c4vfP',
          textType: 'item' as const,
          left: 207.76666666666665,
          top: 182.15529037390607,
          width: 951.7899761336514,
          height: 68
        },
        {
          type: 'text' as const,
          id: 'c2HrdHI3yn',
          textType: 'item' as const,
          left: 157.42840095465394,
          top: 542.0666666666666,
          width: 231.98090692124103,
          height: 68
        },
        {
          type: 'text' as const,
          id: 'JO5R9uldtS',
          textType: 'item' as const,
          left: 551.5633578887364,
          top: 542.0666666666666,
          width: 231.98090692124103,
          height: 68
        },
        {
          type: 'text' as const,
          id: '0nUpN-WR3g',
          textType: 'item' as const,
          left: 937.3201200207972,
          top: 542.0666666666666,
          width: 231.98090692124103,
          height: 68
        }
      ]

      const result = analyzeTemplateLayout(titleElements, textElements)

      expect(result.layoutType).toBe('horizontal_list')
      expect(result.listTitles).toHaveLength(3)
      expect(result.listTexts).toHaveLength(3)
      expect(result.topTexts).toHaveLength(1)

      // 验证标题排序正确
      expect(result.listTitles![0].id).toBe('OOt_0l53y0') // 最左侧
      expect(result.listTitles![1].id).toBe('0xEvZBgfYV') // 中间
      expect(result.listTitles![2].id).toBe('DM62m3AIgr') // 最右侧

      // 验证正文配对正确
      expect(result.listTexts![0].id).toBe('c2HrdHI3yn') // 左侧正文
      expect(result.listTexts![1].id).toBe('JO5R9uldtS') // 中间正文
      expect(result.listTexts![2].id).toBe('0nUpN-WR3g') // 右侧正文

      // 验证顶部正文
      expect(result.topTexts[0].id).toBe('ZVhB-c4vfP')
    })

    it('应该正确识别左右对比布局（模板第三页）', () => {
      // 基于模板第三页的实际元素数据
      const titleElements = [
        {
          type: 'text' as const,
          id: 'YW0uQ0g49O',
          textType: 'itemTitle' as const,
          left: 201.81980906921237,
          top: 292.22852028639613,
          width: 347.49403341288786,
          height: 53
        },
        {
          type: 'text' as const,
          id: 'chT28VpEX6',
          textType: 'itemTitle' as const,
          left: 791.9863166268893,
          top: 292.22852028639613,
          width: 347.49403341288786,
          height: 53
        }
      ]

      const textElements = [
        {
          type: 'text' as const,
          id: 'K25cduHiv-',
          textType: 'item' as const,
          left: 207.76666666666665,
          top: 182.15529037390607,
          width: 951.7899761336514,
          height: 68
        },
        {
          type: 'text' as const,
          id: 'yCboOdD3Wk',
          textType: 'item' as const,
          left: 170.3162291169451,
          top: 361.9182577565632,
          width: 420.04773269689736,
          height: 110
        },
        {
          type: 'text' as const,
          id: 'GSASUa6nX8',
          textType: 'item' as const,
          left: 738.0761336515513,
          top: 362.92480314960625,
          width: 420.04773269689736,
          height: 110
        },
        {
          type: 'text' as const,
          id: 'vpPCPzsUJ1',
          textType: 'item' as const,
          left: 186.96212479406663,
          top: 591.6049868766404,
          width: 951.7899761336514,
          height: 68
        }
      ]

      const result = analyzeTemplateLayout(titleElements, textElements)

      expect(result.layoutType).toBe('comparison')
      expect(result.leftTitles).toHaveLength(1)
      expect(result.rightTitles).toHaveLength(1)
      expect(result.leftTexts).toHaveLength(1)
      expect(result.rightTexts).toHaveLength(1)
      expect(result.topTexts).toHaveLength(1)
      expect(result.bottomTexts).toHaveLength(1)

      // 验证左侧区域
      expect(result.leftTitles[0].id).toBe('YW0uQ0g49O')
      expect(result.leftTexts[0].id).toBe('yCboOdD3Wk')

      // 验证右侧区域
      expect(result.rightTitles[0].id).toBe('chT28VpEX6')
      expect(result.rightTexts[0].id).toBe('GSASUa6nX8')

      // 验证顶部和底部区域
      expect(result.topTexts[0].id).toBe('K25cduHiv-')
      expect(result.bottomTexts[0].id).toBe('vpPCPzsUJ1')
    })

    it('应该识别通用布局（模板第一页）', () => {
      // 基于模板第一页的实际元素数据
      const titleElements = [] // 第一页没有标题元素

      const textElements = [
        {
          type: 'text' as const,
          id: 'jbSMYjr2O0',
          textType: 'item' as const,
          left: 56.71241050119331,
          top: 243.54116945107396,
          width: 756.0859188544152,
          height: 116
        },
        {
          type: 'text' as const,
          id: 'oG6O2erm4x',
          textType: 'item' as const,
          left: 137.3591089896579,
          top: 449.0666666666666,
          width: 666.3484486873508,
          height: 116
        }
      ]

      const result = analyzeTemplateLayout(titleElements, textElements)

      expect(result.layoutType).toBe('generic')
      expect(result.leftTitles).toHaveLength(0)
      expect(result.rightTitles).toHaveLength(0)
      expect(result.leftTexts).toHaveLength(0)
      expect(result.rightTexts).toHaveLength(0)
      expect(result.topTexts).toHaveLength(0)
      expect(result.bottomTexts).toHaveLength(0)
    })
  })

  describe('pairHorizontalListLayout - 水平列表布局配对', () => {
    it('应该正确配对水平列表布局数据（基于实际数据）', () => {
      const layoutAnalysis = {
        layoutType: 'horizontal_list' as const,
        leftTitles: [],
        rightTitles: [],
        leftTexts: [],
        rightTexts: [],
        topTexts: [
          {
            type: 'text' as const,
            id: 'ZVhB-c4vfP',
            textType: 'item' as const,
            left: 207.76666666666665,
            top: 182.15529037390607,
            width: 951.7899761336514,
            height: 68
          }
        ],
        bottomTexts: [],
        listTitles: [
          {
            type: 'text' as const,
            id: 'OOt_0l53y0',
            textType: 'itemTitle' as const,
            left: 154.24025457438344,
            top: 459.2929594272076,
            width: 241.3743038981702,
            height: 86
          },
          {
            type: 'text' as const,
            id: '0xEvZBgfYV',
            textType: 'itemTitle' as const,
            left: 542.1699609118073,
            top: 460.5049868766404,
            width: 241.3743038981702,
            height: 86
          },
          {
            type: 'text' as const,
            id: 'DM62m3AIgr',
            textType: 'itemTitle' as const,
            left: 932.6234215323324,
            top: 460.5049868766404,
            width: 241.3743038981702,
            height: 86
          }
        ],
        listTexts: [
          {
            type: 'text' as const,
            id: 'c2HrdHI3yn',
            textType: 'item' as const,
            left: 157.42840095465394,
            top: 542.0666666666666,
            width: 231.98090692124103,
            height: 68
          },
          {
            type: 'text' as const,
            id: 'JO5R9uldtS',
            textType: 'item' as const,
            left: 551.5633578887364,
            top: 542.0666666666666,
            width: 231.98090692124103,
            height: 68
          },
          {
            type: 'text' as const,
            id: '0nUpN-WR3g',
            textType: 'item' as const,
            left: 937.3201200207972,
            top: 542.0666666666666,
            width: 231.98090692124103,
            height: 68
          }
        ]
      }

      // 基于实际后端返回数据
      const itemsWithTitle = [
        { title: '在数轴上找到-3 和 -8', text: '' },
        { title: '观察它们在数轴上的位置', text: ' -8 比 -3 更靠左 \n|-8| > |-3| \n所以，-8 < -3' },
        { title: '你观察到了什么规律', text: '两个负数比较大小，绝对值大的反而小' }
      ]

      const itemsWithoutTitle = [
        { title: '', text: '两个负数（-3和-8），应该怎么比较谁大谁小？' }
      ]

      const result = pairHorizontalListLayout(layoutAnalysis, itemsWithTitle, itemsWithoutTitle)

      expect(result).toHaveLength(4)

      // 验证顶部无标题内容配对
      expect(result[0].title).toBeNull()
      expect(result[0].text.id).toBe('ZVhB-c4vfP')
      expect(result[0].dataItem.text).toBe('两个负数（-3和-8），应该怎么比较谁大谁小？')

      // 验证水平列表区域配对
      expect(result[1].title?.id).toBe('OOt_0l53y0')
      expect(result[1].text.id).toBe('c2HrdHI3yn')
      expect(result[1].dataItem.title).toBe('在数轴上找到-3 和 -8')

      expect(result[2].title?.id).toBe('0xEvZBgfYV')
      expect(result[2].text.id).toBe('JO5R9uldtS')
      expect(result[2].dataItem.title).toBe('观察它们在数轴上的位置')

      expect(result[3].title?.id).toBe('DM62m3AIgr')
      expect(result[3].text.id).toBe('0nUpN-WR3g')
      expect(result[3].dataItem.title).toBe('你观察到了什么规律')
    })

    it('应该处理数据项数量不足的情况', () => {
      const layoutAnalysis = {
        layoutType: 'horizontal_list' as const,
        leftTitles: [],
        rightTitles: [],
        leftTexts: [],
        rightTexts: [],
        topTexts: [
          {
            type: 'text' as const,
            id: 'ZVhB-c4vfP',
            textType: 'item' as const,
            left: 207.76666666666665,
            top: 182.15529037390607,
            width: 951.7899761336514,
            height: 68
          }
        ],
        bottomTexts: [],
        listTitles: [
          {
            type: 'text' as const,
            id: 'OOt_0l53y0',
            textType: 'itemTitle' as const,
            left: 154.24025457438344,
            top: 459.2929594272076,
            width: 241.3743038981702,
            height: 86
          },
          {
            type: 'text' as const,
            id: '0xEvZBgfYV',
            textType: 'itemTitle' as const,
            left: 542.1699609118073,
            top: 460.5049868766404,
            width: 241.3743038981702,
            height: 86
          }
        ],
        listTexts: [
          {
            type: 'text' as const,
            id: 'c2HrdHI3yn',
            textType: 'item' as const,
            left: 157.42840095465394,
            top: 542.0666666666666,
            width: 231.98090692124103,
            height: 68
          },
          {
            type: 'text' as const,
            id: 'JO5R9uldtS',
            textType: 'item' as const,
            left: 551.5633578887364,
            top: 542.0666666666666,
            width: 231.98090692124103,
            height: 68
          }
        ]
      }

      const itemsWithTitle = [
        { title: '在数轴上找到-3 和 -8', text: '' }
      ]

      const itemsWithoutTitle = [
        { title: '', text: '两个负数（-3和-8），应该怎么比较谁大谁小？' }
      ]

      const result = pairHorizontalListLayout(layoutAnalysis, itemsWithTitle, itemsWithoutTitle)

      expect(result).toHaveLength(2)
      expect(result[0].title).toBeNull()
      expect(result[0].text.id).toBe('ZVhB-c4vfP')
      expect(result[1].title?.id).toBe('OOt_0l53y0')
      expect(result[1].text.id).toBe('c2HrdHI3yn')
    })
  })

  describe('pairComparisonLayout - 左右对比布局配对', () => {
    it('应该正确配对左右对比布局数据（基于实际数据）', () => {
      const layoutAnalysis = {
        layoutType: 'comparison' as const,
        leftTitles: [
          {
            type: 'text' as const,
            id: 'YW0uQ0g49O',
            textType: 'itemTitle' as const,
            left: 201.81980906921237,
            top: 292.22852028639613,
            width: 347.49403341288786,
            height: 53
          }
        ],
        rightTitles: [
          {
            type: 'text' as const,
            id: 'chT28VpEX6',
            textType: 'itemTitle' as const,
            left: 791.9863166268893,
            top: 292.22852028639613,
            width: 347.49403341288786,
            height: 53
          }
        ],
        leftTexts: [
          {
            type: 'text' as const,
            id: 'yCboOdD3Wk',
            textType: 'item' as const,
            left: 170.3162291169451,
            top: 361.9182577565632,
            width: 420.04773269689736,
            height: 110
          }
        ],
        rightTexts: [
          {
            type: 'text' as const,
            id: 'GSASUa6nX8',
            textType: 'item' as const,
            left: 738.0761336515513,
            top: 362.92480314960625,
            width: 420.04773269689736,
            height: 110
          }
        ],
        topTexts: [
          {
            type: 'text' as const,
            id: 'K25cduHiv-',
            textType: 'item' as const,
            left: 207.76666666666665,
            top: 182.15529037390607,
            width: 951.7899761336514,
            height: 68
          }
        ],
        bottomTexts: [
          {
            type: 'text' as const,
            id: 'vpPCPzsUJ1',
            textType: 'item' as const,
            left: 186.96212479406663,
            top: 591.6049868766404,
            width: 951.7899761336514,
            height: 68
          }
        ]
      }

      // 基于实际后端返回数据
      const itemsWithTitle = [
        { title: '左侧对比标题', text: '左侧对比内容' },
        { title: '右侧对比标题', text: '右侧对比内容' }
      ]

      const itemsWithoutTitle = [
        { title: '', text: '顶部无标题内容' },
        { title: '', text: '底部无标题内容' }
      ]

      const result = pairComparisonLayout(layoutAnalysis, itemsWithTitle, itemsWithoutTitle)

      expect(result).toHaveLength(4)

      // 验证顶部无标题内容配对
      expect(result[0].title).toBeNull()
      expect(result[0].text.id).toBe('K25cduHiv-')
      expect(result[0].dataItem.text).toBe('顶部无标题内容')

      // 验证左侧区域配对
      expect(result[1].title?.id).toBe('YW0uQ0g49O')
      expect(result[1].text.id).toBe('yCboOdD3Wk')
      expect(result[1].dataItem.title).toBe('左侧对比标题')

      // 验证右侧区域配对
      expect(result[2].title?.id).toBe('chT28VpEX6')
      expect(result[2].text.id).toBe('GSASUa6nX8')
      expect(result[2].dataItem.title).toBe('右侧对比标题')

      // 验证底部无标题内容配对
      expect(result[3].title).toBeNull()
      expect(result[3].text.id).toBe('vpPCPzsUJ1')
      expect(result[3].dataItem.text).toBe('底部无标题内容')
    })
  })

  describe('calculateLayoutMatchScore - 布局匹配评分', () => {
    it('应该为正确配对的元素返回高分数', () => {
      const titleElement = {
        type: 'text' as const,
        id: 'YW0uQ0g49O',
        textType: 'itemTitle' as const,
        left: 201.81980906921237,
        top: 292.22852028639613,
        width: 347.49403341288786,
        height: 53
      }

      const textElement = {
        type: 'text' as const,
        id: 'yCboOdD3Wk',
        textType: 'item' as const,
        left: 170.3162291169451,
        top: 361.9182577565632,
        width: 420.04773269689736,
        height: 110
      }

      const score = calculateLayoutMatchScore(titleElement, textElement)

      expect(score).toBeGreaterThan(200) // 正确配对应有较高分数
    })

    it('应该为不匹配的元素返回低分数', () => {
      const titleElement = {
        type: 'text' as const,
        id: 'YW0uQ0g49O',
        textType: 'itemTitle' as const,
        left: 201.81980906921237,
        top: 292.22852028639613,
        width: 347.49403341288786,
        height: 53
      }

      const textElement = {
        type: 'text' as const,
        id: 'GSASUa6nX8', // 右侧正文
        textType: 'item' as const,
        left: 738.0761336515513,
        top: 362.92480314960625,
        width: 420.04773269689736,
        height: 110
      }

      const score = calculateLayoutMatchScore(titleElement, textElement)

      expect(score).toBeLessThan(100) // 不匹配的配对应有较低分数
    })
  })
})