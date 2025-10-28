/**
 * 分页处理工具函数
 * 处理幻灯片的分页逻辑
 */

import type { AIPPTSlide, AIPPTContent, AIPPTContents } from '@/types/AIPPT'
import { PaginationRuleManager, type PaginationRule } from './rules'

/**
 * 分页处理结果
 */
export interface PaginationResult {
  slides: AIPPTSlide[]
  totalPages: number
}

/**
 * 分页统计信息
 */
export interface PaginationStats {
  totalSlides: number
  paginatedSlides: number
}

/**
 * 分页处理器
 * 负责处理幻灯片的分页逻辑
 */
export class PaginationProcessor {
  private ruleManager: PaginationRuleManager

  /**
   * 创建分页处理器
   * @param customRules - 自定义分页规则
   */
  constructor(customRules: PaginationRule[] = []) {
    this.ruleManager = new PaginationRuleManager(customRules)
  }

  /**
   * 处理幻灯片分页
   * @param _AISlides - 原始幻灯片列表
   * @returns 分页后的幻灯片列表
   */
  processPagination(_AISlides: AIPPTSlide[]): AIPPTSlide[] {
    const AISlides: AIPPTSlide[] = []

    for (const template of _AISlides) {
      if ((template.type === 'content' || template.type === 'contents') && 'data' in template) {
        const items = template.data.items
        const applicableRule = this.ruleManager.findApplicableRule(template.type, items)

        if (applicableRule) {
          const paginatedChunks = this.ruleManager.applyPaginationRule(items, applicableRule)

          for (let i = 0; i < paginatedChunks.length; i++) {
            const offset = i === 0 ? 0 : paginatedChunks.slice(0, i).reduce((sum, chunk) => sum + chunk.length, 0)

            if (template.type === 'content') {
              AISlides.push({
                ...template,
                data: { ...template.data, items: paginatedChunks[i] },
                offset
              } as AIPPTContent)
            }
            else if (template.type === 'contents') {
              AISlides.push({
                ...template,
                data: { ...template.data, items: paginatedChunks[i] },
                offset
              } as AIPPTContents)
            }
          }
        }
        else {
          AISlides.push(template)
        }
      }
      else {
        AISlides.push(template)
      }
    }

    return AISlides
  }

  /**
   * 获取分页统计信息
   * @param slides - 幻灯片列表
   * @returns 分页统计信息
   */
  getPaginationStats(slides: AIPPTSlide[]): PaginationStats {
    const totalSlides = slides.length
    const paginatedSlides = slides.filter(slide => ('offset' in slide) && slide.offset !== undefined).length

    return { totalSlides, paginatedSlides }
  }

  /**
   * 验证分页结果
   * @param originalSlides - 原始幻灯片列表
   * @param paginatedSlides - 分页后的幻灯片列表
   * @returns 分页结果是否有效
   */
  validatePagination(originalSlides: AIPPTSlide[], paginatedSlides: AIPPTSlide[]): boolean {
    // 验证所有原始项目都被包含在分页结果中
    const originalItems = this.getAllItems(originalSlides)
    const paginatedItems = this.getAllItems(paginatedSlides)

    if (originalItems.length !== paginatedItems.length) {
      return false
    }

    // 验证项目顺序和内容
    for (let i = 0; i < originalItems.length; i++) {
      if (originalItems[i] !== paginatedItems[i]) {
        return false
      }
    }

    return true
  }

  /**
   * 获取所有项目
   * @param slides - 幻灯片列表
   * @returns 所有项目列表
   */
  private getAllItems(slides: AIPPTSlide[]): any[] {
    const allItems: any[] = []

    for (const slide of slides) {
      if ('data' in slide && slide.data && 'items' in slide.data && slide.data.items) {
        allItems.push(...slide.data.items)
      }
    }

    return allItems
  }

  /**
   * 添加自定义分页规则
   * @param rule - 要添加的分页规则
   */
  addCustomRule(rule: PaginationRule): void {
    this.ruleManager.addRule(rule)
  }

  /**
   * 获取所有可用的分页规则
   * @returns 所有分页规则
   */
  getAllRules(): PaginationRule[] {
    return this.ruleManager.getAllRules()
  }
}

/**
 * 创建默认的分页处理器
 * @returns 默认的分页处理器实例
 */
export function createDefaultPaginationProcessor(): PaginationProcessor {
  return new PaginationProcessor()
}