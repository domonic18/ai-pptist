/**
 * 幻灯片处理器测试用例
 */

import {
  processCoverSlide,
  processContentsSlide,
  processTransitionSlide,
  processContentSlide,
  processEndSlide
} from '../processors/slideProcessors'

describe('Slide Processors', () => {
  const mockImgPool = [
    { src: 'image1.jpg', width: 800, height: 600 },
    { src: 'image2.jpg', width: 600, height: 800 }
  ]

  describe('processCoverSlide', () => {
    it('应该正确处理封面幻灯片', () => {
      const coverSlide = {
        type: 'cover' as const,
        data: {
          title: '测试封面标题',
          text: '测试封面内容'
        }
      }

      const coverTemplates = [
        {
          id: 'template1',
          elements: [
            {
              type: 'text' as const,
              id: 'title',
              textType: 'title' as const,
              content: '<p>原始标题</p>'
            },
            {
              type: 'text' as const,
              id: 'content',
              textType: 'content' as const,
              content: '<p>原始内容</p>'
            }
          ]
        }
      ]

      const result = processCoverSlide(coverSlide, coverTemplates, mockImgPool)

      expect(result).toBeDefined()
      expect(result?.id).toBeDefined()
      expect(result?.elements.length).toBe(2)
    })

    it('应该返回null当没有封面模板时', () => {
      const coverSlide = {
        type: 'cover' as const,
        data: {
          title: '测试封面标题',
          text: '测试封面内容'
        }
      }

      const result = processCoverSlide(coverSlide, [], mockImgPool)

      expect(result).toBeNull()
    })
  })

  describe('processContentsSlide', () => {
    it('应该正确处理目录幻灯片', () => {
      const contentsSlide = {
        type: 'contents' as const,
        data: {
          items: ['项目1', '项目2', '项目3']
        }
      }

      const contentsTemplates = [
        {
          id: 'template1',
          elements: [
            {
              type: 'text' as const,
              id: 'item1',
              textType: 'item' as const,
              content: '<p>原始项目</p>'
            },
            {
              type: 'text' as const,
              id: 'item2',
              textType: 'item' as const,
              content: '<p>原始项目</p>'
            },
            {
              type: 'text' as const,
              id: 'item3',
              textType: 'item' as const,
              content: '<p>原始项目</p>'
            }
          ]
        }
      ]

      const result = processContentsSlide(contentsSlide, contentsTemplates, mockImgPool)

      expect(result).toBeDefined()
      expect(result?.id).toBeDefined()
      expect(result?.elements.length).toBe(3)
    })
  })

  describe('processTransitionSlide', () => {
    it('应该正确处理过渡幻灯片', () => {
      const transitionSlide = {
        type: 'transition' as const,
        data: {
          title: '过渡标题',
          text: '过渡内容'
        }
      }

      const transitionTemplate = {
        id: 'template1',
        elements: [
          {
            type: 'text' as const,
            id: 'title',
            textType: 'title' as const,
            content: '<p>原始标题</p>'
          },
          {
            type: 'text' as const,
            id: 'content',
            textType: 'content' as const,
            content: '<p>原始内容</p>'
          }
        ]
      }

      const result = processTransitionSlide(transitionSlide, transitionTemplate, 1, mockImgPool)

      expect(result).toBeDefined()
      expect(result?.id).toBeDefined()
      expect(result?.elements.length).toBe(2)
    })

    it('应该返回null当没有过渡模板时', () => {
      const transitionSlide = {
        type: 'transition' as const,
        data: {
          title: '过渡标题',
          text: '过渡内容'
        }
      }

      const result = processTransitionSlide(transitionSlide, null, 1, mockImgPool)

      expect(result).toBeNull()
    })
  })

  describe('processContentSlide', () => {
    it('应该正确处理内容幻灯片', () => {
      const contentSlide = {
        type: 'content' as const,
        data: {
          title: '内容标题',
          items: [
            { title: '子标题1', text: '内容1' },
            { title: '子标题2', text: '内容2' }
          ]
        }
      }

      const contentTemplates = [
        {
          id: 'template1',
          elements: [
            {
              type: 'text' as const,
              id: 'title',
              textType: 'title' as const,
              content: '<p>原始标题</p>'
            },
            {
              type: 'text' as const,
              id: 'itemTitle1',
              textType: 'itemTitle' as const,
              content: '<p>原始子标题</p>'
            },
            {
              type: 'text' as const,
              id: 'item1',
              textType: 'item' as const,
              content: '<p>原始内容</p>'
            }
          ]
        }
      ]

      const result = processContentSlide(contentSlide, contentTemplates, mockImgPool)

      expect(result).toBeDefined()
      expect(result?.id).toBeDefined()
      expect(result?.elements.length).toBe(3)
    })
  })

  describe('processEndSlide', () => {
    it('应该正确处理结束幻灯片', () => {
      const endSlide = {
        type: 'end' as const
      }

      const endTemplates = [
        {
          id: 'template1',
          elements: [
            {
              type: 'image' as const,
              id: 'image1',
              imageType: 'background' as const,
              src: '',
              width: 800,
              height: 600
            }
          ]
        }
      ]

      const result = processEndSlide(endSlide, endTemplates, mockImgPool)

      expect(result).toBeDefined()
      expect(result?.id).toBeDefined()
      expect(result?.elements.length).toBe(1)
    })
  })
})