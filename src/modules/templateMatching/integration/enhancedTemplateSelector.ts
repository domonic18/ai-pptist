/**
 * 增强的模板选择器
 * 为现有代码提供非侵入式的智能匹配集成
 */

import type { Slide } from '@/types/slides'
import type { AIPPTSlide } from '@/types/AIPPT'
import { templateMatchingService } from '../core/matchingService'
import { isSmartMatchingEnabled, SMART_MATCHING_CONFIG } from '@/configs/templateMatching/featureToggle'
import type { AIPPTSlideData } from '../types'

/**
 * 智能模板选择器
 * 可以直接替换现有的随机选择逻辑
 */
export async function enhancedTemplateSelector(
  slideData: AIPPTSlide,
  templates: Slide[],
  slideType?: string
): Promise<Slide> {
  const actualSlideType = slideType || slideData.type

  // 记录调试信息
  if (SMART_MATCHING_CONFIG.debug) {
    console.log(`[enhancedTemplateSelector] 选择模板: ${actualSlideType}`, {
      templatesCount: templates.length,
      smartMatchingEnabled: isSmartMatchingEnabled(actualSlideType)
    })
  }

  try {
    // 1. 检查是否启用智能匹配
    if (isSmartMatchingEnabled(actualSlideType)) {
      const smartTemplate = await trySmartMatching(slideData, templates, actualSlideType)
      if (smartTemplate) {
        if (SMART_MATCHING_CONFIG.debug) {
          console.log(`[enhancedTemplateSelector] 智能匹配成功: ${smartTemplate.id}`)
        }
        return smartTemplate
      }
    }

    // 2. 降级到原有逻辑
    if (SMART_MATCHING_CONFIG.debug) {
      console.log(`[enhancedTemplateSelector] 降级到随机选择`)
    }
    return randomTemplateSelector(templates, actualSlideType)

  }
  catch (error) {
    console.error(`[enhancedTemplateSelector] 模板选择失败:`, error)
    return randomTemplateSelector(templates, actualSlideType)
  }
}

/**
 * 尝试智能匹配
 */
async function trySmartMatching(
  slideData: AIPPTSlide,
  templates: Slide[],
  slideType: string
): Promise<Slide | null> {
  try {
    // 确保服务已初始化
    await ensureServiceInitialized()

    // 转换数据格式
    const slideDataForMatching = convertToSlideData(slideData)

    // 使用智能匹配服务
    const matchedTemplate = await templateMatchingService.findBestMatch(slideDataForMatching, templates)

    if (SMART_MATCHING_CONFIG.debug) {
      console.log(`[trySmartMatching] 匹配结果:`, {
        slideType,
        matchedTemplateId: matchedTemplate.id,
        serviceStatus: templateMatchingService.getServiceStatus()
      })
    }

    return matchedTemplate

  }
  catch (error) {
    if (SMART_MATCHING_CONFIG.fallback.logFailure) {
      console.warn(`[trySmartMatching] 智能匹配失败，降级到随机选择:`, error)
    }
    return null
  }
}

/**
 * 确保服务已初始化
 */
async function ensureServiceInitialized() {
  const status = templateMatchingService.getServiceStatus()
  if (!status.initialized) {
    await templateMatchingService.initialize()
    if (SMART_MATCHING_CONFIG.debug) {
      console.log('[ensureServiceInitialized] 模板匹配服务已初始化')
    }
  }
}

/**
 * 转换AIPPTSlide为AIPPTSlideData
 * 保留原始semanticFeatures字段，不添加默认值
 */
function convertToSlideData(slideData: AIPPTSlide): AIPPTSlideData {
  // 处理AIPPTEnd类型（没有data属性）
  if (slideData.type === 'end') {
    return {
      type: 'end',
      data: {
        title: '',
        items: [],
        semanticFeatures: undefined
      }
    }
  }

  // 对于其他类型，保留原始数据
  const slide = slideData as any
  const originalData = slide.data || {}

  return {
    type: slideData.type,
    data: {
      title: originalData.title || '',
      semanticFeatures: originalData.semanticFeatures,
      // 确保items数组格式正确
      items: (originalData.items || []).map((item: any) => {
        if (typeof item === 'string') {
          // 处理contents类型的字符串数组
          return {
            title: item,
            text: '',
            metadata: {}
          }
        }
        // 处理content类型的对象数组
        return {
          title: item.title || '',
          text: item.text || '',
          metadata: item.metadata || {}
        }
      })
    }
  }
}

/**
 * 随机模板选择器（原有逻辑）
 */
function randomTemplateSelector(templates: Slide[], slideType: string): Slide {
  if (!templates || templates.length === 0) {
    throw new Error(`[randomTemplateSelector] 没有可用的${slideType}模板`)
  }

  const randomIndex = Math.floor(Math.random() * templates.length)
  const selectedTemplate = templates[randomIndex]

  if (SMART_MATCHING_CONFIG.debug) {
    console.log(`[randomTemplateSelector] 随机选择模板:`, {
      slideType,
      selectedIndex: randomIndex,
      templateId: selectedTemplate.id,
      totalTemplates: templates.length
    })
  }

  return selectedTemplate
}

/**
 * 批量模板选择器
 * 为多个幻灯片选择模板
 */
export async function batchEnhancedTemplateSelector(
  slidesData: AIPPTSlide[],
  allTemplates: Slide[]
): Promise<Map<string, Slide>> {
  const resultMap = new Map<string, Slide>()

  // 按类型分组模板
  const templateGroups = {
    cover: allTemplates.filter(t => t.type === 'cover'),
    contents: allTemplates.filter(t => t.type === 'contents'),
    content: allTemplates.filter(t => t.type === 'content'),
    transition: allTemplates.filter(t => t.type === 'transition'),
    end: allTemplates.filter(t => t.type === 'end')
  }

  for (const slideData of slidesData) {
    const templates = templateGroups[slideData.type as keyof typeof templateGroups] || []
    const selectedTemplate = await enhancedTemplateSelector(slideData, templates)
    // 使用索引作为标识符，因为AIPPTSlide没有id
    resultMap.set(`${slideData.type}_${slidesData.indexOf(slideData)}`, selectedTemplate)
  }

  return resultMap
}

/**
 * 兼容性函数 - 提供与现有代码相同的接口
 * 可以直接替换现有的模板选择逻辑
 */
export function selectTemplateWithFallback(
  slideData: AIPPTSlide,
  templates: Slide[],
  slideType?: string
): Promise<Slide> {
  return enhancedTemplateSelector(slideData, templates, slideType)
}

// 添加类型声明
declare global {
  interface Window {
    enhancedTemplateSelector: typeof enhancedTemplateSelector
    batchEnhancedTemplateSelector: typeof batchEnhancedTemplateSelector
    templateMatchingService: typeof templateMatchingService
  }
}

/**
 * 在window对象上暴露测试函数（开发环境）
 */
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  window.enhancedTemplateSelector = enhancedTemplateSelector
  window.batchEnhancedTemplateSelector = batchEnhancedTemplateSelector
  window.templateMatchingService = templateMatchingService

  console.log('🎯 增强模板选择器已加载')
  console.log('使用方法:')
  console.log('- window.enhancedTemplateSelector(slideData, templates)')
  console.log('- window.templateMatchingService.getServiceStatus()')
}