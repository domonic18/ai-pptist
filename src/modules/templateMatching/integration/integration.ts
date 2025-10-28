/**
 * 模板匹配工具集成模块
 * 将新的多维度匹配机制集成到现有的幻灯片处理流程中
 */

import type { Slide } from '@/types/slides'
import type { AIPPTSlide } from '@/types/AIPPT'
import { templateMatchingService } from '../core/matchingService'
import type { AIPPTSlideData } from '../types'

/**
 * 将AIPPTSlide转换为AIPPTSlideData格式
 * 保留原始semanticFeatures字段，不添加默认值
 */
function convertAIPPTSlideToSlideData(aiSlide: AIPPTSlide): AIPPTSlideData {
  // 处理AIPPTEnd类型（没有data属性）
  if (aiSlide.type === 'end') {
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
  const slideData = aiSlide as any
  const originalData = slideData.data || {}

  return {
    type: aiSlide.type,
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
 * 智能模板选择器
 * 替代原有的随机选择逻辑
 */
export async function smartTemplateSelector(
  aiSlide: AIPPTSlide,
  templates: Slide[],
  slideType: 'cover' | 'contents' | 'content' | 'transition' | 'end'
): Promise<Slide | null> {
  if (!templates || templates.length === 0) {
    console.warn(`[smartTemplateSelector] No ${slideType} templates available`)
    return null
  }

  try {
    // 转换数据格式
    const slideData = convertAIPPTSlideToSlideData(aiSlide)

    // 使用智能匹配服务
    const matchedTemplate = await templateMatchingService.findBestMatch(slideData, templates)

    console.log(`[smartTemplateSelector] Smart match for ${slideType}:`, {
      slideType,
      matchedTemplateId: matchedTemplate.id,
      serviceStatus: templateMatchingService.getServiceStatus()
    })

    return matchedTemplate
  }
  catch (error) {
    console.error(`[smartTemplateSelector] Smart matching failed for ${slideType}:`, error)

    // 降级到随机选择
    const randomTemplate = templates[Math.floor(Math.random() * templates.length)]
    console.log(`[smartTemplateSelector] Fallback to random selection: ${randomTemplate.id}`)
    return randomTemplate
  }
}

/**
 * 批量智能模板选择
 * 为多个幻灯片批量选择模板
 */
export async function batchSmartTemplateSelection(
  aiSlides: AIPPTSlide[],
  allTemplates: Slide[]
): Promise<Map<string, Slide>> {
  const resultMap = new Map<string, Slide>()

  try {
    // 按类型分组模板
    const templateGroups = {
      cover: allTemplates.filter(t => t.type === 'cover'),
      contents: allTemplates.filter(t => t.type === 'contents'),
      content: allTemplates.filter(t => t.type === 'content'),
      transition: allTemplates.filter(t => t.type === 'transition'),
      end: allTemplates.filter(t => t.type === 'end')
    }

    // 为每个幻灯片选择模板
    for (const aiSlide of aiSlides) {
      const templates = templateGroups[aiSlide.type as keyof typeof templateGroups] || []
      const matchedTemplate = await smartTemplateSelector(aiSlide, templates, aiSlide.type as any)

      if (matchedTemplate) {
        // 使用索引作为标识符，因为AIPPTSlide没有id
        resultMap.set(`${aiSlide.type}_${aiSlides.indexOf(aiSlide)}`, matchedTemplate)
      }
    }

    console.log(`[batchSmartTemplateSelection] Processed ${aiSlides.length} slides, matched ${resultMap.size} templates`)
    return resultMap

  }
  catch (error) {
    console.error('[batchSmartTemplateSelection] Batch processing failed:', error)
    return resultMap
  }
}

/**
 * 测试函数 - 在浏览器控制台中调用
 */
export async function testTemplateMatching() {
  console.log('=== 模板匹配功能测试 ===')

  try {
    // 获取服务状态
    const status = templateMatchingService.getServiceStatus()
    console.log('服务状态:', status)

    // 如果服务未初始化，先初始化
    if (!status.initialized) {
      console.log('初始化模板匹配服务...')
      await templateMatchingService.initialize()
      console.log('服务初始化完成')
    }

    console.log('测试完成！服务已就绪。')
    console.log('可以在控制台中使用以下命令进行测试：')
    console.log('- window.testSmartMatching() : 测试智能匹配功能')
    console.log('- window.getServiceStatus() : 查看服务状态')

    return { success: true, status }

  }
  catch (error) {
    console.error('测试失败:', error)
    return { success: false, error: (error as Error).message }
  }
}

// 添加类型声明
declare global {
  interface Window {
    testTemplateMatching: typeof testTemplateMatching
    templateMatchingService: typeof templateMatchingService
    getServiceStatus: () => any
  }
}

/**
 * 在window对象上暴露测试函数
 */
if (typeof window !== 'undefined') {
  window.testTemplateMatching = testTemplateMatching
  window.templateMatchingService = templateMatchingService

  // 获取服务状态的快捷方法
  window.getServiceStatus = () => templateMatchingService.getServiceStatus()
}