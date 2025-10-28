import { describe, it, expect } from 'vitest'
import { 
  LAYOUT_ANALYSIS_CONFIG, 
  MATCH_SCORE_CONFIG,
  getLayoutAnalysisConfig,
  getMatchScoreConfig
} from '@/configs/pptGeneration/layoutConfig'

describe('Layout Config - 布局配置', () => {
  describe('LAYOUT_ANALYSIS_CONFIG', () => {
    it('应该包含垂直分组阈值配置', () => {
      expect(LAYOUT_ANALYSIS_CONFIG.VERTICAL_GROUPING_THRESHOLD).toBeDefined()
      expect(typeof LAYOUT_ANALYSIS_CONFIG.VERTICAL_GROUPING_THRESHOLD).toBe('number')
      expect(LAYOUT_ANALYSIS_CONFIG.VERTICAL_GROUPING_THRESHOLD).toBeGreaterThan(0)
    })

    it('应该包含水平列表布局配置', () => {
      expect(LAYOUT_ANALYSIS_CONFIG.HORIZONTAL_LIST).toBeDefined()
      expect(LAYOUT_ANALYSIS_CONFIG.HORIZONTAL_LIST.MIN_TITLE_COUNT).toBe(3)
      expect(LAYOUT_ANALYSIS_CONFIG.HORIZONTAL_LIST.HORIZONTAL_MATCH_THRESHOLD).toBeGreaterThan(0)
      expect(LAYOUT_ANALYSIS_CONFIG.HORIZONTAL_LIST.TOP_TEXT_MIN_WIDTH).toBeGreaterThan(0)
    })

    it('应该包含对比布局配置', () => {
      expect(LAYOUT_ANALYSIS_CONFIG.COMPARISON).toBeDefined()
      expect(LAYOUT_ANALYSIS_CONFIG.COMPARISON.TITLE_COUNT).toBe(2)
      expect(LAYOUT_ANALYSIS_CONFIG.COMPARISON.HORIZONTAL_MATCH_THRESHOLD).toBeGreaterThan(0)
      expect(LAYOUT_ANALYSIS_CONFIG.COMPARISON.WIDE_TEXT_MIN_WIDTH).toBeGreaterThan(0)
    })
  })

  describe('MATCH_SCORE_CONFIG', () => {
    it('应该包含距离阈值配置', () => {
      expect(MATCH_SCORE_CONFIG.THRESHOLDS).toBeDefined()
      expect(MATCH_SCORE_CONFIG.THRESHOLDS.HORIZONTAL_DISTANCE).toBe(150)
      expect(MATCH_SCORE_CONFIG.THRESHOLDS.VERTICAL_DISTANCE_MAX).toBe(200)
      expect(MATCH_SCORE_CONFIG.THRESHOLDS.CENTER_DISTANCE).toBe(100)
    })

    it('应该包含理想距离配置', () => {
      expect(MATCH_SCORE_CONFIG.IDEAL).toBeDefined()
      expect(MATCH_SCORE_CONFIG.IDEAL.VERTICAL_DISTANCE).toBe(70)
    })

    it('应该包含评分权重配置', () => {
      expect(MATCH_SCORE_CONFIG.WEIGHTS).toBeDefined()
      expect(MATCH_SCORE_CONFIG.WEIGHTS.HORIZONTAL).toBe(1.0)
      expect(MATCH_SCORE_CONFIG.WEIGHTS.VERTICAL).toBe(1.2)
      expect(MATCH_SCORE_CONFIG.WEIGHTS.WIDTH).toBe(0.5)
      expect(MATCH_SCORE_CONFIG.WEIGHTS.CENTER_ALIGN).toBe(0.8)
    })

    it('应该包含衰减系数配置', () => {
      expect(MATCH_SCORE_CONFIG.DECAY).toBeDefined()
      expect(MATCH_SCORE_CONFIG.DECAY.DISTANCE_FACTOR).toBe(50)
    })
  })

  describe('配置访问函数', () => {
    it('getLayoutAnalysisConfig应该返回布局分析配置', () => {
      const config = getLayoutAnalysisConfig()
      expect(config).toEqual(LAYOUT_ANALYSIS_CONFIG)
    })

    it('getMatchScoreConfig应该返回匹配度计算配置', () => {
      const config = getMatchScoreConfig()
      expect(config).toEqual(MATCH_SCORE_CONFIG)
    })
  })
})

