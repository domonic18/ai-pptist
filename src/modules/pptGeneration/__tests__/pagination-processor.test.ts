/**
 * 分页处理器测试用例
 */

import { PaginationProcessor } from '../pagination/processor'

describe('Pagination Processor', () => {
  let paginationProcessor: PaginationProcessor

  beforeEach(() => {
    paginationProcessor = new PaginationProcessor()
  })

  describe('processPagination', () => {
    it('应该处理内容幻灯片的分页', () => {
      const slides = [
        {
          type: 'content' as const,
          data: {
            title: '测试标题',
            items: Array(6).fill({ title: '子标题', text: '内容' })
          }
        }
      ]

      const result = paginationProcessor.processPagination(slides)

      expect(result.length).toBe(2)
      expect(result[0].type).toBe('content')
      expect(result[1].type).toBe('content')
    })

    it('应该处理目录幻灯片的分页', () => {
      const slides = [
        {
          type: 'contents' as const,
          data: {
            items: Array(12).fill('目录项')
          }
        }
      ]

      const result = paginationProcessor.processPagination(slides)

      expect(result.length).toBe(2)
      expect(result[0].type).toBe('contents')
      expect(result[1].type).toBe('contents')
    })

    it('应该跳过不需要分页的幻灯片类型', () => {
      const slides = [
        {
          type: 'cover' as const,
          data: {
            title: '封面标题',
            text: '封面内容'
          }
        }
      ]

      const result = paginationProcessor.processPagination(slides)

      expect(result.length).toBe(1)
      expect(result[0].type).toBe('cover')
    })

    it('应该保持原始幻灯片当没有适用的分页规则时', () => {
      const slides = [
        {
          type: 'content' as const,
          data: {
            title: '测试标题',
            items: Array(2).fill({ title: '子标题', text: '内容' })
          }
        }
      ]

      const result = paginationProcessor.processPagination(slides)

      expect(result.length).toBe(1)
      expect(result[0].type).toBe('content')
    })
  })

  describe('getPaginationStats', () => {
    it('应该正确计算分页统计信息', () => {
      const slides = [
        {
          type: 'content' as const,
          data: {
            title: '测试标题',
            items: Array(6).fill({ title: '子标题', text: '内容' })
          },
          offset: 0
        },
        {
          type: 'content' as const,
          data: {
            title: '测试标题',
            items: Array(3).fill({ title: '子标题', text: '内容' })
          },
          offset: 3
        },
        {
          type: 'cover' as const,
          data: {
            title: '封面标题',
            text: '封面内容'
          }
        }
      ]

      const stats = paginationProcessor.getPaginationStats(slides)

      expect(stats.totalSlides).toBe(3)
      expect(stats.paginatedSlides).toBe(2)
    })
  })

  describe('validatePagination', () => {
    it('应该验证分页结果的正确性', () => {
      const originalSlides = [
        {
          type: 'content' as const,
          data: {
            title: '测试标题',
            items: Array(6).fill({ title: '子标题', text: '内容' })
          }
        }
      ]

      const paginatedSlides = paginationProcessor.processPagination(originalSlides)
      const isValid = paginationProcessor.validatePagination(originalSlides, paginatedSlides)

      expect(isValid).toBe(true)
    })

    it('应该检测到无效的分页结果', () => {
      const originalSlides = [
        {
          type: 'content' as const,
          data: {
            title: '测试标题',
            items: Array(6).fill({ title: '子标题', text: '内容' })
          }
        }
      ]

      const invalidSlides = [
        {
          type: 'content' as const,
          data: {
            title: '测试标题',
            items: Array(3).fill({ title: '子标题', text: '内容' })
          },
          offset: 0
        }
      ]

      const isValid = paginationProcessor.validatePagination(originalSlides, invalidSlides)

      expect(isValid).toBe(false)
    })
  })
})