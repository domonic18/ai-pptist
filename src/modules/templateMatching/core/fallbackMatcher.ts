/**
 * 降级匹配器
 * 当智能匹配不可用时,使用基础的随机匹配算法
 */

import type { AIPPTSlideData } from '../types'
import type { Slide } from '@/types/slides'

/**
 * 降级匹配器
 */
export class FallbackMatcher {
  /**
   * 基础匹配算法(降级策略)
   * 基于元素数量进行简单匹配和随机选择
   */
  findBasicMatch(
    slideData: AIPPTSlideData,
    availableTemplates: Slide[],
  ): Slide {
    const itemCount = slideData.data.items?.length || 0

    // 1. 筛选容量足够的模板
    const compatibleTemplates = availableTemplates.filter((template) => {
      const capacity = this.getTemplateCapacity(template)
      return itemCount <= capacity
    })

    // 2. 如果有兼容模板,随机选择一个
    if (compatibleTemplates.length > 0) {
      const randomIndex = Math.floor(
        Math.random() * compatibleTemplates.length,
      )
      return compatibleTemplates[randomIndex]
    }

    // 3. 如果没有兼容模板,选择容量最大的模板
    const maxCapacityTemplate = availableTemplates.reduce((max, template) => {
      const templateCapacity = this.getTemplateCapacity(template)
      const maxCapacity = this.getTemplateCapacity(max)
      return templateCapacity > maxCapacity ? template : max
    })

    return maxCapacityTemplate
  }

  /**
   * 获取模板容量
   */
  private getTemplateCapacity(template: Slide): number {
    const itemElements = template.elements.filter(
      (el) => {
        if (el.type === 'text') {
          return (el as any).textType === 'item' || (el as any).textType === 'itemTitle'
        }
        if (el.type === 'shape' && (el as any).text) {
          return (el as any).text.type === 'item' || (el as any).text.type === 'itemTitle'
        }
        return false
      }
    )

    return Math.max(itemElements.length, 1)
  }

  /**
   * 根据幻灯片类型筛选模板
   */
  findMatchBySlideType(slideType: string, availableTemplates: Slide[]): Slide {
    const typeSpecificTemplates = availableTemplates.filter((template) => {
      // 这里可以根据slideType来筛选对应的模板
      // 例如: cover -> 封面模板, content -> 内容模板等
      return template.type === slideType
    })

    if (typeSpecificTemplates.length > 0) {
      const randomIndex = Math.floor(
        Math.random() * typeSpecificTemplates.length,
      )
      return typeSpecificTemplates[randomIndex]
    }

    // 如果没有找到对应类型的模板，返回第一个可用模板
    return availableTemplates[0] || this.createDefaultTemplate()
  }

  /**
   * 创建默认模板（紧急情况使用）
   */
  private createDefaultTemplate(): Slide {
    return {
      id: window.crypto.randomUUID(),
      elements: [
        {
          id: window.crypto.randomUUID(),
          type: 'text',
          left: 50,
          top: 50,
          width: 400,
          height: 60,
          rotate: 0,
          content:
            '<p style="font-size: 32px; text-align: center;">默认标题</p>',
          defaultFontName: 'Microsoft Yahei',
          defaultColor: '#000000',
          textType: 'title',
        },
        {
          id: window.crypto.randomUUID(),
          type: 'text',
          left: 50,
          top: 150,
          width: 400,
          height: 300,
          rotate: 0,
          content: '<p style="font-size: 16px;">默认内容</p>',
          defaultFontName: 'Microsoft Yahei',
          defaultColor: '#000000',
          textType: 'content',
        },
      ],
      background: {
        type: 'solid',
        color: '#ffffff',
      },
    }
  }

  /**
   * 获取降级原因描述
   */
  getFallbackReason(slideData: AIPPTSlideData): string {
    const reasons: string[] = []

    if (!slideData.data.semanticFeatures) {
      reasons.push('语义特征缺失')
    }

    if (!slideData.data.items || slideData.data.items.length === 0) {
      reasons.push('内容项缺失')
    }

    if (!slideData.data.title) {
      reasons.push('标题缺失')
    }

    return reasons.length > 0 ? reasons.join(', ') : '未知原因'
  }
}
