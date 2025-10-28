/**
 * 多项式计算引擎
 * 负责将各维度评分进行加权求和
 */

import type { DimensionScore, TemplateMatchResult } from '../types'
import type { Slide } from '@/types/slides'

/**
 * 多项式计算引擎
 */
export class PolynomialEngine {
  /**
   * 计算模板的总评分
   *
   * Score = Σ(wi × di)  其中wi为权重，di为维度评分
   *
   * 支持可选维度自动跳过和权重重新分配:
   * - 当可选维度不可用时,返回null
   * - 系统自动过滤掉null值,只保留可用维度
   * - 对剩余维度的权重进行归一化,确保总和为1.0
   *
   * @param template - 模板
   * @param dimensionScores - 各维度评分
   * @returns 匹配结果
   */
  calculateScore(
    template: Slide,
    dimensionScores: DimensionScore[],
  ): TemplateMatchResult {
    // 1. 过滤出可用的维度评分(自动跳过返回null的可选维度)
    const availableScores = dimensionScores.filter(
      (ds) => ds.available && ds.score !== null,
    )

    // 2. 计算可用维度的权重总和(用于归一化)
    const totalWeight = availableScores.reduce((sum, ds) => sum + ds.weight, 0)

    if (totalWeight === 0) {
      // 如果没有可用维度,返回0分
      return {
        template,
        totalScore: 0,
        dimensionScores,
        matchedDimensions: [],
      }
    }

    // 3. 计算加权求和(自动归一化权重)
    let totalScore = 0
    const matchedDimensions: string[] = []

    for (const ds of availableScores) {
      // 归一化权重(确保权重总和为1)
      // 例如: 如果布局维度(0.05)跳过,剩余0.95会被归一化为1.0
      const normalizedWeight = ds.weight / totalWeight

      // 加权求和
      totalScore += normalizedWeight * (ds.score || 0)

      matchedDimensions.push(ds.dimensionId)
    }

    // 4. 返回结果
    return {
      template,
      totalScore,
      dimensionScores,
      matchedDimensions,
    }
  }

  /**
   * 批量计算多个模板的评分
   */
  calculateBatchScores(
    templates: Slide[],
    getDimensionScores: (template: Slide) => DimensionScore[],
  ): TemplateMatchResult[] {
    return templates.map((template) => {
      const dimensionScores = getDimensionScores(template)
      return this.calculateScore(template, dimensionScores)
    })
  }

  /**
   * 选择最优模板
   */
  selectBestMatch(results: TemplateMatchResult[]): TemplateMatchResult | null {
    if (results.length === 0) {
      return null
    }

    // 按总评分降序排序
    const sorted = [...results].sort((a, b) => b.totalScore - a.totalScore)

    return sorted[0]
  }

  /**
   * 获取评分最高的N个模板
   */
  getTopMatches(
    results: TemplateMatchResult[],
    count: number = 3,
  ): TemplateMatchResult[] {
    if (results.length === 0) {
      return []
    }

    // 按总评分降序排序
    const sorted = [...results].sort((a, b) => b.totalScore - a.totalScore)

    return sorted.slice(0, count)
  }

  /**
   * 分析匹配结果
   */
  analyzeResults(results: TemplateMatchResult[]): {
    averageScore: number;
    scoreDistribution: { high: number; medium: number; low: number };
    dimensionUsage: Record<string, number>;
  } {
    if (results.length === 0) {
      return {
        averageScore: 0,
        scoreDistribution: { high: 0, medium: 0, low: 0 },
        dimensionUsage: {},
      }
    }

    // 计算平均分
    const totalScore = results.reduce((sum, r) => sum + r.totalScore, 0)
    const averageScore = totalScore / results.length

    // 计算分数分布
    const scoreDistribution = results.reduce(
      (acc, r) => {
        if (r.totalScore >= 0.7) acc.high++
        else if (r.totalScore >= 0.4) acc.medium++
        else acc.low++
        return acc
      },
      { high: 0, medium: 0, low: 0 },
    )

    // 计算维度使用情况
    const dimensionUsage: Record<string, number> = {}
    results.forEach((result) => {
      result.matchedDimensions.forEach((dimensionId) => {
        dimensionUsage[dimensionId] = (dimensionUsage[dimensionId] || 0) + 1
      })
    })

    return {
      averageScore,
      scoreDistribution,
      dimensionUsage,
    }
  }
}
