/**
 * 混合标题和正文布局内容替换测试
 * 测试有标题无正文、有标题有正文混合的场景
 */

import { describe, it, expect } from 'vitest'
import { processContentSlide } from '../../../../src/modules/pptGeneration/processors/slideProcessorsEnhanced'

describe('Mixed Title-Text Layout Content Replacement - 混合布局测试', () => {
  const mockImgPool = [
    { src: 'image1.jpg', width: 800, height: 600 },
    { src: 'image2.jpg', width: 600, height: 800 }
  ]

  describe('用户反馈：水平列表布局中有标题无正文的场景', () => {
    it('应该正确处理有标题无正文和有标题有正文混合的数据项', async () => {
      // 实际模板数据
      const contentTemplates = [
        {
          id: 'horizontal_mixed_template',
          elements: [
            // 顶部无标题文本 (a文本)
            {
              type: 'text' as const,
              id: 'Sc2n0mkYxK',
              textType: 'item' as const,
              left: 207.76666666666665,
              top: 182.15529037390607,
              width: 951.7899761336514,
              height: 68,
              content: '<p style="text-align: center;"><span style="font-size: 32px;">列表项内容列表项内容列表项内容列表项内容列表项内容</span></p>'
            },
            // 第一组：标题 (b文本title)
            {
              type: 'text' as const,
              id: 'L1YVmhQFy6',
              textType: 'itemTitle' as const,
              left: 154.24025457438344,
              top: 459.2929594272076,
              width: 241.3743038981702,
              height: 53,
              content: '<p style=""><strong><span style="font-size: 22px;">列表项标题列表项标题</span></strong></p>'
            },
            // 第二组：标题 (c文本title)
            {
              type: 'text' as const,
              id: 'FO9nmSeQOD',
              textType: 'itemTitle' as const,
              left: 542.1699609118073,
              top: 460.5049868766404,
              width: 241.3743038981702,
              height: 53,
              content: '<p style=""><strong><span style="font-size: 22px;">列表项标题列表项标题</span></strong></p>'
            },

            // 第三组：标题 (d文本title)
            {
              type: 'text' as const,
              id: 'Fz0bXZFgCw',
              textType: 'itemTitle' as const,
              left: 932.6234215323324,
              top: 460.5049868766404,
              width: 241.3743038981702,
              height: 53,
              content: '<p style=""><strong><span style="font-size: 22px;">列表项标题列表项标题</span></strong></p>'
            },
            // 第一组：正文 (b文本text，实际为空)
            {
              type: 'text' as const,
              id: '43oqgKR1lN',
              textType: 'item' as const,
              left: 157.42840095465394,
              top: 542.0666666666666,
              width: 231.98090692124103,
              height: 68,
              content: '<p style="">列表项内容列表项内容列表项内容列表项内容列表项内容列</p>'
            },
            // 第二组：正文 (c文本text)
            {
              type: 'text' as const,
              id: 'gIVV78iAmV',
              textType: 'item' as const,
              left: 551.5633578887364,
              top: 542.0666666666666,
              width: 231.98090692124103,
              height: 68,
              content: '<p style="">列表项内容列表项内容列表项内容列表项内容列表项内容列</p>'
            },
            // 第三组：正文 (d文本text)
            {
              type: 'text' as const,
              id: 'yhIeIxeF3S',
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

      // 实际后端返回数据
      const contentSlide = {
        type: 'content' as const,
        data: {
          title: '探究建构',
          semanticFeatures: {
            logicType: 'sequential',
            contentType: 'inquiry_practice'
          },
          items: [
            {
              title: '',
              text: '两个负数（-3和-8），应该怎么比较谁大谁小？',
              metadata: {}
            },
            {
              title: '在数轴上找到-3 和 -8',
              text: '',
              metadata: { step: 1 }
            },
            {
              title: '观察它们在数轴上的位置',
              text: ' -8 比 -3 更靠左 \n|-8| > |-3| \n所以，-8 < -3',
              metadata: { step: 2 }
            },
            {
              title: '你观察到了什么规律',
              text: '两个负数比较大小，绝对值大的反而小',
              metadata: { step: 3 }
            }
          ]
        }
      }

      const result = await processContentSlide(contentSlide, contentTemplates, mockImgPool)

      expect(result).toBeDefined()

      // 验证 a文本：顶部无标题文本
      const topText = result?.elements.find(el => el.id === 'Sc2n0mkYxK')
      expect(topText).toBeDefined()
      if (topText && topText.type === 'text') {
        expect(topText.content).toContain('两个负数')
      }

      // 验证 b文本：有标题无正文
      const bTitle = result?.elements.find(el => el.id === 'L1YVmhQFy6')
      expect(bTitle).toBeDefined()
      if (bTitle && bTitle.type === 'text') {
        expect(bTitle.content).toContain('在数轴上找到-3 和 -8')
      }

      const bText = result?.elements.find(el => el.id === '43oqgKR1lN')
      expect(bText).toBeDefined()
      // b文本的text为空，但模板元素应该存在（可能显示为空或保留原内容）

      // 验证 c文本：有标题有正文
      const cTitle = result?.elements.find(el => el.id === 'FO9nmSeQOD')
      expect(cTitle).toBeDefined()
      if (cTitle && cTitle.type === 'text') {
        expect(cTitle.content).toContain('观察它们在数轴上的位置')
      }

      const cText = result?.elements.find(el => el.id === 'gIVV78iAmV')
      expect(cText).toBeDefined()
      if (cText && cText.type === 'text') {
        expect(cText.content).toContain('-8 比 -3 更靠左')
      }

      // 验证 d文本：有标题有正文（这是关键测试点）
      const dTitle = result?.elements.find(el => el.id === 'Fz0bXZFgCw')
      expect(dTitle).toBeDefined()
      if (dTitle && dTitle.type === 'text') {
        expect(dTitle.content).toContain('你观察到了什么规律')
      }

      const dText = result?.elements.find(el => el.id === 'yhIeIxeF3S')
      expect(dText).toBeDefined()
      if (dText && dText.type === 'text') {
        // 关键断言：d文本的text应该被正确替换
        expect(dText.content).toContain('两个负数比较大小')
        expect(dText.content).toContain('绝对值大的反而小')
      }
    })

    it('应该正确处理全部有标题无正文的场景', async () => {
      const contentTemplates = [
        {
          id: 'title_only_template',
          elements: [
            {
              type: 'text' as const,
              id: 'title1',
              textType: 'itemTitle' as const,
              left: 100,
              top: 100,
              width: 200,
              height: 50,
              content: '<p>标题1</p>'
            },
            {
              type: 'text' as const,
              id: 'text1',
              textType: 'item' as const,
              left: 100,
              top: 160,
              width: 200,
              height: 100,
              content: '<p>内容1</p>'
            },
            {
              type: 'text' as const,
              id: 'title2',
              textType: 'itemTitle' as const,
              left: 400,
              top: 100,
              width: 200,
              height: 50,
              content: '<p>标题2</p>'
            },
            {
              type: 'text' as const,
              id: 'text2',
              textType: 'item' as const,
              left: 400,
              top: 160,
              width: 200,
              height: 100,
              content: '<p>内容2</p>'
            }
          ]
        }
      ]

      const contentSlide = {
        type: 'content' as const,
        data: {
          title: '测试标题',
          items: [
            { title: '第一步', text: '' },
            { title: '第二步', text: '' }
          ]
        }
      }

      const result = await processContentSlide(contentSlide, contentTemplates, mockImgPool)

      expect(result).toBeDefined()

      // 标题应该被正确替换
      const title1 = result?.elements.find(el => el.id === 'title1')
      if (title1 && title1.type === 'text') {
        expect(title1.content).toContain('第一步')
      }

      const title2 = result?.elements.find(el => el.id === 'title2')
      if (title2 && title2.type === 'text') {
        expect(title2.content).toContain('第二步')
      }

      // 正文元素应该存在（但可能为空或保留原内容）
      const text1 = result?.elements.find(el => el.id === 'text1')
      expect(text1).toBeDefined()

      const text2 = result?.elements.find(el => el.id === 'text2')
      expect(text2).toBeDefined()
    })
  })
})

