/**
 * @fileoverview 文本工具函数单元测试
 * @description 测试PPT文本处理辅助函数
 */
/**
 * 文本工具函数测试用例
 */

import {
  checkTextType,
  getUseableTemplates,
  getAdaptedFontsize,
  getFontInfo,
  getNewTextElement,
  getUseableImage,
  getNewImgElement,
  getMdContent,
  getJSONContent
} from '../../../../src/modules/pptGeneration/core/textUtils'

describe('Text Utils', () => {
  describe('checkTextType', () => {
    it('应该正确识别文本元素的类型', () => {
      const textElement = {
        type: 'text' as const,
        textType: 'title' as const,
        content: '测试标题'
      }

      const shapeElement = {
        type: 'shape' as const,
        text: {
          type: 'content' as const,
          content: '测试内容'
        }
      }

      expect(checkTextType(textElement, 'title')).toBe(true)
      expect(checkTextType(shapeElement, 'content')).toBe(true)
      expect(checkTextType(textElement, 'content')).toBe(false)
    })
  })

  describe('getAdaptedFontsize', () => {
    it('应该根据文本长度和容器宽度调整字体大小', () => {
      const result = getAdaptedFontsize({
        text: '这是一个测试文本',
        fontSize: 16,
        fontFamily: 'Arial',
        width: 200,
        maxLine: 2
      })

      expect(result).toBeLessThanOrEqual(16)
      expect(result).toBeGreaterThanOrEqual(10)
    })
  })

  describe('getFontInfo', () => {
    it('应该从HTML字符串中提取字体信息', () => {
      const htmlString = '<p style="font-size: 18px; font-family: Arial">测试</p>'
      const result = getFontInfo(htmlString)

      expect(result.fontSize).toBe(18)
      expect(result.fontFamily).toBe('Arial')
    })

    it('应该返回默认字体信息当HTML中没有字体样式时', () => {
      const htmlString = '<p>测试</p>'
      const result = getFontInfo(htmlString)

      expect(result.fontSize).toBe(16)
      expect(result.fontFamily).toBe('Microsoft Yahei')
    })
  })

  describe('getMdContent', () => {
    it('应该从内容中提取Markdown内容', () => {
      const content = '```markdown\n# 标题\n内容\n```'
      const result = getMdContent(content)

      expect(result).toBe('# 标题\n内容')
    })

    it('应该处理没有代码块的Markdown内容', () => {
      const content = '```markdown# 标题\n内容```'
      const result = getMdContent(content)

      expect(result).toBe('# 标题\n内容')
    })
  })

  describe('getJSONContent', () => {
    it('应该从内容中提取JSON内容', () => {
      const content = '```json\n{"key": "value"}\n```'
      const result = getJSONContent(content)

      expect(result).toBe('{"key": "value"}')
    })
  })
})