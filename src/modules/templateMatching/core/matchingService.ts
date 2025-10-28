/**
 * 模板匹配服务
 * 整合所有匹配逻辑的主入口
 */

import type { AIPPTSlideData, DimensionScore, TemplateMatchResult } from '../types'
import type { Slide } from '@/types/slides'
import { DimensionFactory } from './dimensionFactory'
import { PolynomialEngine } from './polynomialEngine'
import { FallbackMatcher } from './fallbackMatcher'

/**
 * 模板匹配服务
 */
export class TemplateMatchingService {
  private dimensionFactory: DimensionFactory
  private polynomialEngine: PolynomialEngine
  private fallbackMatcher: FallbackMatcher
  private initialized = false

  constructor() {
    this.dimensionFactory = new DimensionFactory()
    this.polynomialEngine = new PolynomialEngine()
    this.fallbackMatcher = new FallbackMatcher()
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }

    await this.dimensionFactory.initialize()
    this.initialized = true

    console.log('[TemplateMatchingService] Initialized')
  }

  /**
   * 查找最佳匹配模板
   *
   * @param slideData - 幻灯片数据
   * @param availableTemplates - 可用模板列表
   * @returns 最佳匹配的模板
   */
  async findBestMatch(
    slideData: AIPPTSlideData,
    availableTemplates: Slide[],
  ): Promise<Slide> {
    // 确保已初始化
    if (!this.initialized) {
      await this.initialize()
    }

    try {
      // 1. 检查是否需要降级
      if (this.shouldFallback(slideData)) {
        console.log('[TemplateMatchingService] Using fallback matcher')
        return this.fallbackMatcher.findBasicMatch(
          slideData,
          availableTemplates,
        )
      }

      // 2. 筛选候选模板(过滤掉容量不足的)
      const candidates = this.filterCandidates(slideData, availableTemplates)

      if (candidates.length === 0) {
        console.warn(
          '[TemplateMatchingService] No candidates found, using fallback',
        )
        return this.fallbackMatcher.findBasicMatch(
          slideData,
          availableTemplates,
        )
      }

      // 3. 计算各模板的评分
      const results = this.evaluateTemplates(slideData, candidates)

      // 4. 选择最优模板
      const bestMatch = this.polynomialEngine.selectBestMatch(results)

      if (!bestMatch) {
        console.warn(
          '[TemplateMatchingService] No best match found, using fallback',
        )
        return this.fallbackMatcher.findBasicMatch(
          slideData,
          availableTemplates,
        )
      }

      // 5. 输出匹配详情(调试用)
      this.logMatchResult(bestMatch)

      return bestMatch.template
    }
    catch (error) {
      console.error('[TemplateMatchingService] Matching failed:', error)
      return this.fallbackMatcher.findBasicMatch(slideData, availableTemplates)
    }
  }

  /**
   * 批量匹配多个幻灯片
   */
  async batchMatch(
    slidesData: AIPPTSlideData[],
    availableTemplates: Slide[],
  ): Promise<Slide[]> {
    const results: Slide[] = []

    for (const slideData of slidesData) {
      const matchedTemplate = await this.findBestMatch(
        slideData,
        availableTemplates,
      )
      results.push(matchedTemplate)
    }

    return results
  }

  /**
   * 获取详细匹配分析
   */
  async getDetailedMatch(
    slideData: AIPPTSlideData,
    availableTemplates: Slide[],
  ): Promise<TemplateMatchResult[]> {
    // 确保已初始化
    if (!this.initialized) {
      await this.initialize()
    }

    if (this.shouldFallback(slideData)) {
      // 降级情况下返回空数组
      return []
    }

    const candidates = this.filterCandidates(slideData, availableTemplates)
    return this.evaluateTemplates(slideData, candidates)
  }

  /**
   * 判断是否需要降级到基础匹配
   */
  private shouldFallback(slideData: AIPPTSlideData): boolean {
    // 如果没有语义特征,触发降级
    return !slideData.data.semanticFeatures
  }

  /**
   * 筛选候选模板
   */
  private filterCandidates(
    slideData: AIPPTSlideData,
    templates: Slide[],
  ): Slide[] {
    return templates.filter((template) => {
      // 获取容量维度评估器
      const capacityEvaluator = this.dimensionFactory.getEvaluator('capacity')

      if (!capacityEvaluator) {
        return true
      }

      // 容量不足的模板直接过滤掉
      const capacityScore = capacityEvaluator.evaluate(slideData, template)
      return capacityScore !== null && capacityScore > 0
    })
  }

  /**
   * 评估所有候选模板
   */
  private evaluateTemplates(
    slideData: AIPPTSlideData,
    templates: Slide[],
  ): TemplateMatchResult[] {
    const evaluators = this.dimensionFactory.getEvaluators()
    const results: TemplateMatchResult[] = []

    for (const template of templates) {
      // 计算各维度评分
      const dimensionScores: DimensionScore[] = []

      for (const evaluator of evaluators) {
        const score = evaluator.evaluate(slideData, template)
        const weight = this.dimensionFactory.getWeight(evaluator.id)
        const available = score !== null

        dimensionScores.push({
          dimensionId: evaluator.id,
          score,
          weight: available ? weight : 0, // 不可用时权重设为0
          available,
        })
      }

      // 计算总评分
      const result = this.polynomialEngine.calculateScore(
        template,
        dimensionScores,
      )
      results.push(result)
    }

    return results
  }

  /**
   * 输出匹配结果详情
   */
  private logMatchResult(result: TemplateMatchResult): void {
    console.log('[TemplateMatchingService] Best match:', {
      templateId: result.template.id,
      totalScore: result.totalScore.toFixed(3),
      matchedDimensions: result.matchedDimensions,
      dimensionScores: result.dimensionScores.map((ds) => ({
        dimension: ds.dimensionId,
        score: ds.score?.toFixed(3),
        weight: ds.weight.toFixed(3),
        available: ds.available,
      })),
    })
  }

  /**
   * 获取服务状态
   */
  getServiceStatus(): {
    initialized: boolean;
    dimensionsLoaded: number;
    dimensionsEnabled: number;
    failedDimensions: string[];
    } {
    const stats = this.dimensionFactory.getStats()
    return {
      initialized: this.initialized,
      dimensionsLoaded: stats.loaded,
      dimensionsEnabled: stats.enabled,
      failedDimensions: stats.failed,
    }
  }

  /**
   * 重置服务
   */
  reset(): void {
    this.initialized = false
    this.dimensionFactory = new DimensionFactory()
  }
}

// 导出单例
export const templateMatchingService = new TemplateMatchingService()
