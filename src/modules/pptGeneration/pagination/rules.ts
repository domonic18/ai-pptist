/**
 * 分页规则配置管理器
 * 将硬编码的分页逻辑提取为可配置的规则
 */

/**
 * 分页规则接口
 */
export interface PaginationRule {
  name: string
  condition: PaginationCondition
  strategy: PaginationStrategy
  priority: number
}

/**
 * 分页条件接口
 */
export interface PaginationCondition {
  minItems?: number
  maxItems?: number
  contentType?: string[]
  templateType?: string
  customValidator?: (items: any[]) => boolean
}

/**
 * 分页策略接口
 */
export interface PaginationStrategy {
  splitPoints: number[]
  maxItemsPerPage: number
  balanceStrategy: 'even' | 'front-heavy' | 'back-heavy'
  preserveStructure: boolean
}

/**
 * 分页规则配置
 * 预定义的分页规则，覆盖常见的分页场景
 */
export const PAGINATION_RULES: PaginationRule[] = [
  {
    name: 'standard-content-5-6-items',
    condition: { minItems: 5, maxItems: 6, contentType: ['content'] },
    strategy: { splitPoints: [3], maxItemsPerPage: 4, balanceStrategy: 'even', preserveStructure: true },
    priority: 100
  },
  {
    name: 'standard-content-7-8-items',
    condition: { minItems: 7, maxItems: 8, contentType: ['content'] },
    strategy: { splitPoints: [4], maxItemsPerPage: 4, balanceStrategy: 'even', preserveStructure: true },
    priority: 100
  },
  {
    name: 'standard-content-9-10-items',
    condition: { minItems: 9, maxItems: 10, contentType: ['content'] },
    strategy: { splitPoints: [3, 6], maxItemsPerPage: 4, balanceStrategy: 'even', preserveStructure: true },
    priority: 100
  },
  {
    name: 'standard-content-over-10-items',
    condition: { minItems: 11, contentType: ['content'] },
    strategy: { splitPoints: [4, 8], maxItemsPerPage: 4, balanceStrategy: 'even', preserveStructure: true },
    priority: 100
  },
  {
    name: 'contents-11-items',
    condition: { minItems: 11, maxItems: 11, contentType: ['contents'] },
    strategy: { splitPoints: [6], maxItemsPerPage: 6, balanceStrategy: 'even', preserveStructure: true },
    priority: 150
  },
  {
    name: 'contents-over-11-items',
    condition: { minItems: 12, contentType: ['contents'] },
    strategy: { splitPoints: [10], maxItemsPerPage: 10, balanceStrategy: 'even', preserveStructure: true },
    priority: 150
  }
]

/**
 * 分页规则管理器
 * 负责管理分页规则和应用分页策略
 */
export class PaginationRuleManager {
  private rules: PaginationRule[]

  /**
   * 创建分页规则管理器
   * @param customRules - 自定义规则列表
   */
  constructor(customRules: PaginationRule[] = []) {
    this.rules = [...PAGINATION_RULES, ...customRules]
      .sort((a, b) => b.priority - a.priority)
  }

  /**
   * 根据条件查找适用的分页规则
   * @param slideType - 幻灯片类型
   * @param items - 项目列表
   * @returns 适用的分页规则或null
   */
  findApplicableRule(slideType: string, items: any[]): PaginationRule | null {
    for (const rule of this.rules) {
      if (this.evaluateCondition(rule.condition, slideType, items)) {
        return rule
      }
    }
    return null
  }

  /**
   * 评估分页条件
   * @param condition - 分页条件
   * @param slideType - 幻灯片类型
   * @param items - 项目列表
   * @returns 条件是否满足
   */
  private evaluateCondition(condition: PaginationCondition, slideType: string, items: any[]): boolean {
    const { minItems, maxItems, contentType, templateType, customValidator } = condition

    // 检查项目数量
    if (minItems !== undefined && items.length < minItems) return false
    if (maxItems !== undefined && items.length > maxItems) return false

    // 检查内容类型
    if (contentType && !contentType.includes(slideType)) return false

    // 检查模板类型
    if (templateType && templateType !== slideType) return false

    // 检查自定义验证器
    if (customValidator && !customValidator(items)) return false

    return true
  }

  /**
   * 应用分页规则
   * @param items - 要分页的项目列表
   * @param rule - 分页规则
   * @returns 分页后的结果数组
   */
  applyPaginationRule(items: any[], rule: PaginationRule): any[][] {
    const { splitPoints, maxItemsPerPage, balanceStrategy, preserveStructure } = rule.strategy
    const results: any[][] = []
    let offset = 0

    // 应用分割点
    for (const splitPoint of splitPoints) {
      const chunk = items.slice(offset, splitPoint)
      if (chunk.length > 0) {
        results.push(chunk)
      }
      offset = splitPoint
    }

    // 处理剩余项目
    if (offset < items.length) {
      const remainingItems = items.slice(offset)
      results.push(remainingItems)
    }

    // 确保每页不超过最大项目数
    return this.ensureMaxItemsPerPage(results, maxItemsPerPage, balanceStrategy)
  }

  /**
   * 确保每页不超过最大项目数
   * @param chunks - 分块数据
   * @param maxItemsPerPage - 每页最大项目数
   * @param balanceStrategy - 平衡策略
   * @returns 调整后的分块数据
   */
  private ensureMaxItemsPerPage(chunks: any[][], maxItemsPerPage: number, balanceStrategy: string): any[][] {
    const results: any[][] = []

    for (const chunk of chunks) {
      if (chunk.length <= maxItemsPerPage) {
        results.push(chunk)
      }
      else {
        // 需要进一步分割
        const subChunks = this.splitChunk(chunk, maxItemsPerPage, balanceStrategy)
        results.push(...subChunks)
      }
    }

    return results
  }

  /**
   * 分割大块数据
   * @param chunk - 要分割的数据块
   * @param maxItemsPerPage - 每页最大项目数
   * @param balanceStrategy - 平衡策略
   * @returns 分割后的数据块数组
   */
  private splitChunk(chunk: any[], maxItemsPerPage: number, balanceStrategy: string): any[][] {
    const results: any[][] = []
    const totalItems = chunk.length
    const numPages = Math.ceil(totalItems / maxItemsPerPage)

    for (let i = 0; i < numPages; i++) {
      const start = i * maxItemsPerPage
      const end = Math.min(start + maxItemsPerPage, totalItems)
      results.push(chunk.slice(start, end))
    }

    return results
  }

  /**
   * 获取所有规则
   * @returns 所有分页规则
   */
  getAllRules(): PaginationRule[] {
    return [...this.rules]
  }

  /**
   * 添加自定义规则
   * @param rule - 要添加的分页规则
   */
  addRule(rule: PaginationRule): void {
    this.rules.push(rule)
    this.rules.sort((a, b) => b.priority - a.priority)
  }

  /**
   * 移除规则
   * @param ruleName - 要移除的规则名称
   */
  removeRule(ruleName: string): void {
    this.rules = this.rules.filter(rule => rule.name !== ruleName)
  }
}