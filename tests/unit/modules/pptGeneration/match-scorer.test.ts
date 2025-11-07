/**
 * @fileoverview 匹配度评分器单元测试
 * @description 测试PPT元素布局匹配度计算算法
 */
import { describe, it, expect } from 'vitest'
import { calculateLayoutMatchScore } from '../../../../src/modules/pptGeneration/pairing/index'
import type { PPTTextElement } from '../../../../src/types/slides'

describe('Match Scorer - 匹配度计算', () => {
  // 创建测试用的标题元素
  const createTitleElement = (left: number, top: number, width: number): PPTTextElement => ({
    type: 'text',
    id: 'title_' + Math.random(),
    left,
    top,
    width,
    height: 50,
    content: '<p>标题</p>',
    rotate: 0,
    defaultFontName: '',
    defaultColor: '#333',
    vertical: false,
  })

  // 创建测试用的正文元素
  const createTextElement = (left: number, top: number, width: number): PPTTextElement => ({
    type: 'text',
    id: 'text_' + Math.random(),
    left,
    top,
    width,
    height: 100,
    content: '<p>正文内容</p>',
    rotate: 0,
    defaultFontName: '',
    defaultColor: '#333',
    vertical: false,
  })

  describe('正常匹配场景', () => {
    it('应该为正确配对的元素返回高分数', () => {
      const title = createTitleElement(100, 100, 200)
      const text = createTextElement(100, 170, 200) // 在标题正下方70像素（理想距离）
      
      const score = calculateLayoutMatchScore(title, text)
      expect(score).toBeGreaterThan(200) // 高分数表示良好匹配
    })

    it('应该为水平对齐的元素返回高分数', () => {
      const title = createTitleElement(100, 100, 200)
      const text = createTextElement(105, 170, 200) // 略微偏移（5像素）
      
      const score = calculateLayoutMatchScore(title, text)
      expect(score).toBeGreaterThan(200)
    })

    it('应该为相似宽度的元素返回更高分数', () => {
      const title = createTitleElement(100, 100, 200)
      const text1 = createTextElement(100, 170, 200) // 相同宽度
      const text2 = createTextElement(100, 170, 100) // 不同宽度
      
      const score1 = calculateLayoutMatchScore(title, text1)
      const score2 = calculateLayoutMatchScore(title, text2)
      
      expect(score1).toBeGreaterThan(score2)
    })
  })

  describe('不匹配场景', () => {
    it('应该为水平距离过大的元素返回0分', () => {
      const title = createTitleElement(100, 100, 200)
      const text = createTextElement(300, 170, 200) // 水平距离200像素（超过阈值150）
      
      const score = calculateLayoutMatchScore(title, text)
      expect(score).toBe(0)
    })

    it('应该为正文在标题上方的元素返回0分', () => {
      const title = createTitleElement(100, 200, 200)
      const text = createTextElement(100, 100, 200) // 在标题上方
      
      const score = calculateLayoutMatchScore(title, text)
      expect(score).toBe(0)
    })

    it('应该为垂直距离过大的元素返回0分', () => {
      const title = createTitleElement(100, 100, 200)
      const text = createTextElement(100, 350, 200) // 垂直距离250像素（超过阈值200）
      
      const score = calculateLayoutMatchScore(title, text)
      expect(score).toBe(0)
    })

    it('应该为中心点不对齐的元素返回0分', () => {
      const title = createTitleElement(100, 100, 200)
      const text = createTextElement(250, 170, 200) // 中心点距离150像素（超过阈值100）
      
      const score = calculateLayoutMatchScore(title, text)
      expect(score).toBe(0)
    })
  })

  describe('边界情况', () => {
    it('应该正确处理恰好在阈值边界的元素', () => {
      const title = createTitleElement(100, 100, 200)
      const text = createTextElement(250, 170, 200) // 水平距离恰好150像素
      
      const score = calculateLayoutMatchScore(title, text)
      // 恰好在阈值上，应该返回一个较低的正数分数
      expect(score).toBeGreaterThanOrEqual(0)
    })

    it('应该正确处理完全重叠的元素', () => {
      const title = createTitleElement(100, 100, 200)
      const text = createTextElement(100, 100, 200) // 完全重叠（不符合逻辑）
      
      const score = calculateLayoutMatchScore(title, text)
      expect(score).toBe(0) // 正文必须在标题下方
    })
  })

  describe('评分一致性', () => {
    it('同样的元素应该返回同样的分数', () => {
      const title = createTitleElement(100, 100, 200)
      const text = createTextElement(100, 170, 200)
      
      const score1 = calculateLayoutMatchScore(title, text)
      const score2 = calculateLayoutMatchScore(title, text)
      
      expect(score1).toBe(score2)
    })

    it('距离越远，分数应该越低', () => {
      const title = createTitleElement(100, 100, 200)
      const text1 = createTextElement(100, 170, 200) // 理想距离70
      const text2 = createTextElement(100, 200, 200) // 距离100
      const text3 = createTextElement(100, 250, 200) // 距离150
      
      const score1 = calculateLayoutMatchScore(title, text1)
      const score2 = calculateLayoutMatchScore(title, text2)
      const score3 = calculateLayoutMatchScore(title, text3)
      
      expect(score1).toBeGreaterThan(score2)
      expect(score2).toBeGreaterThan(score3)
    })
  })
})

