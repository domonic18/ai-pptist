/**
 * 增强版幻灯片处理器集成测试
 * 测试完整的幻灯片处理流程
 */

import { describe, it, expect } from 'vitest'
import { processContentSlide } from '../../../../src/modules/pptGeneration/processors/slideProcessorsEnhanced'

describe('Enhanced Slide Processors - 集成测试', () => {
  const mockImgPool = [
    { src: 'image1.jpg', width: 800, height: 600 },
    { src: 'image2.jpg', width: 600, height: 800 }
  ]

  describe('processContentSlide - 完整内容幻灯片处理', () => {
    it('应该正确处理水平列表布局的完整流程', async () => {
      // 基于模板第二页的实际数据
      const contentSlide = {
        type: 'content' as const,
        data: {
          title: '负数比较大小',
          items: [
            { title: '', text: '两个负数（-3和-8），应该怎么比较谁大谁小？' },
            { title: '在数轴上找到-3 和 -8', text: '' },
            { title: '观察它们在数轴上的位置', text: ' -8 比 -3 更靠左 \n|-8| > |-3| \n所以，-8 < -3' },
            { title: '你观察到了什么规律', text: '两个负数比较大小，绝对值大的反而小' }
          ]
        }
      }

      const contentTemplates = [
        {
          id: 'horizontal_list_template',
          elements: [
            // 顶部正文元素
            {
              type: 'text' as const,
              id: 'ZVhB-c4vfP',
              textType: 'item' as const,
              left: 207.76666666666665,
              top: 182.15529037390607,
              width: 951.7899761336514,
              height: 68,
              content: '<p style="text-align: center;"><span style="font-size: 32px;">列表项内容列表项内容列表项内容列表项内容列表项内容</span></p>'
            },
            // 水平列表标题
            {
              type: 'text' as const,
              id: 'OOt_0l53y0',
              textType: 'itemTitle' as const,
              left: 154.24025457438344,
              top: 459.2929594272076,
              width: 241.3743038981702,
              height: 86,
              content: '<p style="text-align: center;"><strong><span style="font-size: 22px;">列表项标题列表项标题列表项标题列表标题列</span></strong></p>'
            },
            {
              type: 'text' as const,
              id: '0xEvZBgfYV',
              textType: 'itemTitle' as const,
              left: 542.1699609118073,
              top: 460.5049868766404,
              width: 241.3743038981702,
              height: 86,
              content: '<p style="text-align: center;"><strong><span style="font-size: 22px;">列表项标题列表项标题列表项标题列表标题列</span></strong></p>'
            },
            {
              type: 'text' as const,
              id: 'DM62m3AIgr',
              textType: 'itemTitle' as const,
              left: 932.6234215323324,
              top: 460.5049868766404,
              width: 241.3743038981702,
              height: 86,
              content: '<p style="text-align: center;"><strong><span style="font-size: 22px;">列表项标题列表项标题列表项标题列表标题列</span></strong></p>'
            },
            // 水平列表正文
            {
              type: 'text' as const,
              id: 'c2HrdHI3yn',
              textType: 'item' as const,
              left: 157.42840095465394,
              top: 542.0666666666666,
              width: 231.98090692124103,
              height: 68,
              content: '<p style="">列表项内容列表项内容列表项内容列表项内容列表项内容列</p>'
            },
            {
              type: 'text' as const,
              id: 'JO5R9uldtS',
              textType: 'item' as const,
              left: 551.5633578887364,
              top: 542.0666666666666,
              width: 231.98090692124103,
              height: 68,
              content: '<p style="">列表项内容列表项内容列表项内容列表项内容列表项内容列</p>'
            },
            {
              type: 'text' as const,
              id: '0nUpN-WR3g',
              textType: 'item' as const,
              left: 937.3201200207972,
              top: 542.0666666666666,
              width: 231.98090692124103,
              height: 68,
              content: '<p style="">列表项内容列表项内容列表项内容列表项内容列表项内容列</p>'
            }
          ]
        }
      ]

      const result = await processContentSlide(contentSlide, contentTemplates, mockImgPool)

      expect(result).toBeDefined()
      expect(result?.id).toBeDefined()
      expect(result?.elements).toHaveLength(7)

      // 验证顶部正文内容替换
      const topTextElement = result?.elements.find(el => el.id === 'ZVhB-c4vfP')
      expect(topTextElement).toBeDefined()
      if (topTextElement && topTextElement.type === 'text') {
        expect(topTextElement.content).toContain('两个负数（-3和-8），应该怎么比较谁大谁小？')
      }

      // 验证水平列表标题替换
      const title1 = result?.elements.find(el => el.id === 'OOt_0l53y0')
      expect(title1).toBeDefined()
      if (title1 && title1.type === 'text') {
        expect(title1.content).toContain('在数轴上找到-3 和 -8')
      }

      const title2 = result?.elements.find(el => el.id === '0xEvZBgfYV')
      expect(title2).toBeDefined()
      if (title2 && title2.type === 'text') {
        expect(title2.content).toContain('观察它们在数轴上的位置')
      }

      const title3 = result?.elements.find(el => el.id === 'DM62m3AIgr')
      expect(title3).toBeDefined()
      if (title3 && title3.type === 'text') {
        expect(title3.content).toContain('你观察到了什么规律')
      }

      // 验证水平列表正文替换
      // text1对应第2项（有标题无正文），应该为空
      const text1 = result?.elements.find(el => el.id === 'c2HrdHI3yn')
      expect(text1).toBeDefined()
      if (text1 && text1.type === 'text') {
        // 第2项的text为空字符串，所以这里应该是空或保留原内容
        expect(text1.content).toBeDefined()
      }

      // text2对应第3项（有标题有正文）
      const text2 = result?.elements.find(el => el.id === 'JO5R9uldtS')
      expect(text2).toBeDefined()
      if (text2 && text2.type === 'text') {
        expect(text2.content).toContain(' -8 比 -3 更靠左')
      }

      // text3对应第4项（有标题有正文）
      const text3 = result?.elements.find(el => el.id === '0nUpN-WR3g')
      expect(text3).toBeDefined()
      if (text3 && text3.type === 'text') {
        expect(text3.content).toContain('两个负数比较大小，绝对值大的反而小')
      }
    })

    it('应该正确处理左右对比布局的完整流程', async () => {
      const contentSlide = {
        type: 'content' as const,
        data: {
          title: '负数比较分析',
          items: [
            { title: '', text: '顶部说明：负数比较需要特殊规则' },
            { title: '左侧分析', text: '左侧内容：负数在数轴上的位置关系' },
            { title: '右侧分析', text: '右侧内容：负数绝对值的比较规则' },
            { title: '', text: '底部总结：绝对值大的负数反而小' }
          ]
        }
      }

      const contentTemplates = [
        {
          id: 'comparison_template',
          elements: [
            // 顶部正文
            {
              type: 'text' as const,
              id: 'K25cduHiv-',
              textType: 'item' as const,
              left: 207.76666666666665,
              top: 182.15529037390607,
              width: 951.7899761336514,
              height: 68,
              content: '<p style="text-align: center;"><span style="font-size: 32px;">列表项内容列表项内容列表项内容列表项内容列表项内容</span></p>'
            },
            // 左侧标题和正文
            {
              type: 'text' as const,
              id: 'YW0uQ0g49O',
              textType: 'itemTitle' as const,
              left: 201.81980906921237,
              top: 292.22852028639613,
              width: 347.49403341288786,
              height: 53,
              content: '<p style=""><strong><span style="font-size: 22px;">左侧列表项标题列表项标题列表</span></strong></p>'
            },
            {
              type: 'text' as const,
              id: 'yCboOdD3Wk',
              textType: 'item' as const,
              left: 170.3162291169451,
              top: 361.9182577565632,
              width: 420.04773269689736,
              height: 110,
              content: '<p style=""><span style="font-size: 20px;">左侧列表项内容列表项内容列表项内容列表项内容列表项内容列表项内容列表项内容列表项内容列表项内容列表项内容列表项内容列表项</span></p>'
            },
            // 右侧标题和正文
            {
              type: 'text' as const,
              id: 'chT28VpEX6',
              textType: 'itemTitle' as const,
              left: 791.9863166268893,
              top: 292.22852028639613,
              width: 347.49403341288786,
              height: 53,
              content: '<p style=""><strong><span style="font-size: 22px;">右侧列表项标题列表项标题列表</span></strong></p>'
            },
            {
              type: 'text' as const,
              id: 'GSASUa6nX8',
              textType: 'item' as const,
              left: 738.0761336515513,
              top: 362.92480314960625,
              width: 420.04773269689736,
              height: 110,
              content: '<p style=""><span style="font-size: 20px;">右侧列表项内容列表项内容列表项内容列表项内容列表项内容列表项内容列表项内容列表项内容列表项内容列表项内容列表项内容列表项</span></p>'
            },
            // 底部正文
            {
              type: 'text' as const,
              id: 'vpPCPzsUJ1',
              textType: 'item' as const,
              left: 186.96212479406663,
              top: 591.6049868766404,
              width: 951.7899761336514,
              height: 68,
              content: '<p style="text-align: center;"><span style="font-size: 32px;"><span style="color: #ffffff;">列表项内容列表项内容列表项内容列表项内容列表项内容</span></span></p>'
            }
          ]
        }
      ]

      const result = await processContentSlide(contentSlide, contentTemplates, mockImgPool)

      expect(result).toBeDefined()
      expect(result?.id).toBeDefined()
      expect(result?.elements).toHaveLength(6)

      // 验证顶部正文内容替换
      const topText = result?.elements.find(el => el.id === 'K25cduHiv-')
      expect(topText).toBeDefined()
      if (topText && topText.type === 'text') {
        expect(topText.content).toContain('顶部说明：负数比较需要特殊规则')
      }

      // 验证左侧区域内容替换
      const leftTitle = result?.elements.find(el => el.id === 'YW0uQ0g49O')
      expect(leftTitle).toBeDefined()
      if (leftTitle && leftTitle.type === 'text') {
        expect(leftTitle.content).toContain('左侧分析')
      }

      const leftText = result?.elements.find(el => el.id === 'yCboOdD3Wk')
      expect(leftText).toBeDefined()
      if (leftText && leftText.type === 'text') {
        expect(leftText.content).toContain('左侧内容：负数在数轴上的位置关系')
      }

      // 验证右侧区域内容替换
      const rightTitle = result?.elements.find(el => el.id === 'chT28VpEX6')
      expect(rightTitle).toBeDefined()
      if (rightTitle && rightTitle.type === 'text') {
        expect(rightTitle.content).toContain('右侧分析')
      }

      const rightText = result?.elements.find(el => el.id === 'GSASUa6nX8')
      expect(rightText).toBeDefined()
      if (rightText && rightText.type === 'text') {
        expect(rightText.content).toContain('右侧内容：负数绝对值的比较规则')
      }

      // 验证底部正文内容替换
      const bottomText = result?.elements.find(el => el.id === 'vpPCPzsUJ1')
      expect(bottomText).toBeDefined()
      if (bottomText && bottomText.type === 'text') {
        expect(bottomText.content).toContain('底部总结：绝对值大的负数反而小')
      }
    })

    it('应该正确处理通用布局的完整流程', async () => {
      const contentSlide = {
        type: 'content' as const,
        data: {
          title: '通用布局测试',
          items: [
            { title: '标题1', text: '内容1' },
            { title: '标题2', text: '内容2' }
          ]
        }
      }

      const contentTemplates = [
        {
          id: 'generic_template',
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
      expect(result?.id).toBeDefined()
      expect(result?.elements).toHaveLength(4)

      // 验证标题和内容替换
      const title1 = result?.elements.find(el => el.id === 'title1')
      expect(title1).toBeDefined()
      if (title1 && title1.type === 'text') {
        expect(title1.content).toContain('标题1')
      }

      const text1 = result?.elements.find(el => el.id === 'text1')
      expect(text1).toBeDefined()
      if (text1 && text1.type === 'text') {
        expect(text1.content).toContain('内容1')
      }

      const title2 = result?.elements.find(el => el.id === 'title2')
      expect(title2).toBeDefined()
      if (title2 && title2.type === 'text') {
        expect(title2.content).toContain('标题2')
      }

      const text2 = result?.elements.find(el => el.id === 'text2')
      expect(text2).toBeDefined()
      if (text2 && text2.type === 'text') {
        expect(text2.content).toContain('内容2')
      }
    })
  })
})