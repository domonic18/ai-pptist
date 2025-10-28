/**
 * 维度工厂
 * 负责动态加载和管理维度评估器实例
 */

import type { DimensionEvaluator } from '../types'
import { DimensionRegistry } from '@/configs/templateMatching/dimensionRegistry'
import { DimensionWeights } from '@/configs/templateMatching/dimensionWeights'

/**
 * 维度工厂
 */
export class DimensionFactory {
  private evaluators: Map<string, DimensionEvaluator> = new Map()
  private initialized = false

  /**
   * 初始化所有维度评估器
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }

    // 获取启用的维度配置
    const enabledDimensions = DimensionRegistry.filter(config => config.enabled)

    // 动态加载并实例化评估器
    for (const config of enabledDimensions) {
      try {
        const module = await config.evaluatorClass()
        // 根据维度ID获取对应的类名
        const className = config.id.split(/(?=[A-Z])/).map(word =>
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join('') + 'Dimension'

        const EvaluatorClass = module[className]
        if (!EvaluatorClass) {
          throw new Error(`Class ${className} not found in module`)
        }

        const evaluator = new EvaluatorClass()

        this.evaluators.set(config.id, evaluator)
        console.log(`[DimensionFactory] Loaded dimension: ${config.id}`)
      }
      catch (error) {
        console.error(
          `[DimensionFactory] Failed to load dimension: ${config.id}`,
          error,
        )
      }
    }

    this.initialized = true
  }

  /**
   * 获取所有可用的维度评估器
   */
  getEvaluators(): DimensionEvaluator[] {
    return Array.from(this.evaluators.values())
  }

  /**
   * 获取指定维度的评估器
   */
  getEvaluator(dimensionId: string): DimensionEvaluator | undefined {
    return this.evaluators.get(dimensionId)
  }

  /**
   * 获取维度权重
   */
  getWeight(dimensionId: string): number {
    return DimensionWeights[dimensionId as keyof typeof DimensionWeights] || 0
  }

  /**
   * 获取所有维度ID列表
   */
  getDimensionIds(): string[] {
    return Array.from(this.evaluators.keys())
  }

  /**
   * 获取已初始化的维度数量
   */
  getInitializedCount(): number {
    return this.evaluators.size
  }

  /**
   * 检查维度是否已加载
   */
  isDimensionLoaded(dimensionId: string): boolean {
    return this.evaluators.has(dimensionId)
  }

  /**
   * 重新加载指定维度
   */
  async reloadDimension(dimensionId: string): Promise<boolean> {
    try {
      const config = DimensionRegistry.find(c => c.id === dimensionId)
      if (!config || !config.enabled) {
        return false
      }

      const module = await config.evaluatorClass()
      // 根据维度ID获取对应的类名
      const className = config.id.split(/(?=[A-Z])/).map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join('') + 'Dimension'

      const EvaluatorClass = module[className]
      if (!EvaluatorClass) {
        throw new Error(`Class ${className} not found in module`)
      }

      const evaluator = new EvaluatorClass()

      this.evaluators.set(dimensionId, evaluator)

      console.log(`[DimensionFactory] Reloaded dimension: ${dimensionId}`)
      return true
    }
    catch (error) {
      console.error(
        `[DimensionFactory] Failed to reload dimension: ${dimensionId}`,
        error,
      )
      return false
    }
  }

  /**
   * 获取维度统计信息
   */
  getStats(): {
    total: number;
    enabled: number;
    loaded: number;
    failed: string[];
    } {
    const allDimensions = DimensionRegistry
    const enabled = allDimensions.filter((config) => config.enabled).length
    const loaded = this.evaluators.size
    const failed = allDimensions.filter(
      (config) => config.enabled && !this.evaluators.has(config.id),
    ).map((config) => config.id)

    return {
      total: allDimensions.length,
      enabled,
      loaded,
      failed,
    }
  }
}
