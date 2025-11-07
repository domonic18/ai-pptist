/**
 * 分页规则测试用例
 */

import { PaginationRuleManager, PAGINATION_RULES } from '../../../../src/modules/pptGeneration/pagination/rules'

describe('Pagination Rules', () => {
  let ruleManager: PaginationRuleManager

  beforeEach(() => {
    ruleManager = new PaginationRuleManager()
  })

  describe('PaginationRuleManager', () => {
    it('应该正确初始化规则管理器', () => {
      expect(ruleManager.getAllRules().length).toBeGreaterThan(0)
    })

    it('应该根据条件找到适用的分页规则', () => {
      const items = Array(6).fill('item')
      const rule = ruleManager.findApplicableRule('content', items)

      expect(rule).toBeDefined()
      expect(rule?.name).toBe('standard-content-5-6-items')
    })

    it('应该返回null当没有适用的规则时', () => {
      const items = Array(2).fill('item')
      const rule = ruleManager.findApplicableRule('content', items)

      expect(rule).toBeNull()
    })

    it('应该正确应用分页规则', () => {
      const items = Array(6).fill('item')
      const rule = ruleManager.findApplicableRule('content', items)

      if (rule) {
        const result = ruleManager.applyPaginationRule(items, rule)

        expect(result.length).toBe(2)
        expect(result[0].length).toBe(3)
        expect(result[1].length).toBe(3)
      }
    })

    it('应该支持添加自定义规则', () => {
      const customRule = {
        name: 'custom-rule',
        condition: { minItems: 3, maxItems: 4, contentType: ['content'] },
        strategy: { splitPoints: [2], maxItemsPerPage: 2, balanceStrategy: 'even' as const, preserveStructure: true },
        priority: 200
      }

      ruleManager.addRule(customRule)
      const rules = ruleManager.getAllRules()

      expect(rules.find(r => r.name === 'custom-rule')).toBeDefined()
    })
  })

  describe('Pagination Rules Configuration', () => {
    it('应该包含预定义的分页规则', () => {
      expect(PAGINATION_RULES.length).toBeGreaterThan(0)
    })

    it('应该正确配置标准内容分页规则', () => {
      const standardRule = PAGINATION_RULES.find(r => r.name === 'standard-content-5-6-items')

      expect(standardRule).toBeDefined()
      expect(standardRule?.condition.minItems).toBe(5)
      expect(standardRule?.condition.maxItems).toBe(6)
      expect(standardRule?.strategy.splitPoints).toEqual([3])
    })

    it('应该正确配置内容分页规则', () => {
      const contentsRule = PAGINATION_RULES.find(r => r.name === 'contents-11-items')

      expect(contentsRule).toBeDefined()
      expect(contentsRule?.condition.minItems).toBe(11)
      expect(contentsRule?.condition.maxItems).toBe(11)
      expect(contentsRule?.strategy.splitPoints).toEqual([6])
    })
  })
})