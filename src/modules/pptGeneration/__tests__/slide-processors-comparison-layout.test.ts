/**
 * 对比布局内容替换问题专项测试
 * 针对用户反馈的具体问题场景
 */

import { describe, it, expect } from 'vitest'
import { processContentSlide } from '../processors/slideProcessorsEnhanced'

describe('Comparison Layout Content Replacement - 专项测试', () => {
  const mockImgPool = [
    { src: 'image1.jpg', width: 800, height: 600 },
    { src: 'image2.jpg', width: 600, height: 800 }
  ]

  describe('用户反馈的对比布局内容替换问题', () => {
    it('应该正确匹配对比布局模板中的元素和数据项', async () => {
      // 用户提供的模板数据
      const contentTemplates = [
        {
          id: 'comparison_template',
          elements: [
            // 顶部正文元素 (a文本)
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
            // 左侧标题 (b文本title)
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
            // 右侧标题 (c文本title)
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
            // 左侧正文 (b文本text)
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
            // 右侧正文 (c文本text)
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
            // 底部正文 (d文本)
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

      // 用户提供的后端数据
      const contentSlide = {
        type: 'content' as const,
        data: {
          title: '技术方案',
          semanticFeatures: {
            logicType: 'hierarchical',
            contentType: 'comparison_analysis'
          },
          items: [
            {
              title: '',
              text: '下面让我们一起来总结有理数比较大小的直接法则',
              metadata: { hierarchyLevel: 1 }
            },
            {
              title: '有理数比较大小直接法则',
              text: '正数 > 0 > 负数 \n两个正数，绝对值大的更大 \n两个负数，绝对值大的更小',
              metadata: { hierarchyLevel: 2 }
            },
            {
              title: '操作流程',
              text: '看符号 → 不同符号直接判断\n 同正 → 再比较绝对值：两个正数，绝对值大的更大 \n 同负 → 再比较绝对值：两个负数，绝对值大的更小',
              metadata: { hierarchyLevel: 3 }
            },
            {
              title: '',
              text: '现在，来设计一个你自己的有理数比较口诀吧',
              metadata: { hierarchyLevel: 4 }
            }
          ]
        }
      }

      const result = await processContentSlide(contentSlide, contentTemplates, mockImgPool)

      expect(result).toBeDefined()

      // 预期匹配结果验证
      // a文本内容对应K25cduHiv-
      const topText = result?.elements.find(el => el.id === 'K25cduHiv-')
      expect(topText).toBeDefined()
      if (topText && topText.type === 'text') {
        expect(topText.content).toContain('下面让我们一起来总结有理数比较大小的直接法则')
      }

      // b文本title对应YW0uQ0g49O
      const leftTitle = result?.elements.find(el => el.id === 'YW0uQ0g49O')
      expect(leftTitle).toBeDefined()
      if (leftTitle && leftTitle.type === 'text') {
        expect(leftTitle.content).toContain('有理数比较大小直接法则')
      }

      // b文本text对应yCboOdD3Wk
      const leftText = result?.elements.find(el => el.id === 'yCboOdD3Wk')
      expect(leftText).toBeDefined()
      if (leftText && leftText.type === 'text') {
        // HTML转义后应该包含 &gt; 符号
        expect(leftText.content).toContain('正数 &gt; 0 &gt; 负数')
      }

      // c文本title对应chT28VpEX6
      const rightTitle = result?.elements.find(el => el.id === 'chT28VpEX6')
      expect(rightTitle).toBeDefined()
      if (rightTitle && rightTitle.type === 'text') {
        expect(rightTitle.content).toContain('操作流程')
      }

      // c文本text对应GSASUa6nX8
      const rightText = result?.elements.find(el => el.id === 'GSASUa6nX8')
      expect(rightText).toBeDefined()
      if (rightText && rightText.type === 'text') {
        // HTML转义后应该包含 &gt; 符号
        expect(rightText.content).toContain('看符号 → 不同符号直接判断')
      }

      // d文本内容对应vpPCPzsUJ1
      const bottomText = result?.elements.find(el => el.id === 'vpPCPzsUJ1')
      expect(bottomText).toBeDefined()
      if (bottomText && bottomText.type === 'text') {
        expect(bottomText.content).toContain('现在，来设计一个你自己的有理数比较口诀吧')
      }
    })
  })
})