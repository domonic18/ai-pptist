/**
 * 增强版幻灯片处理工具函数
 * 集成智能模板匹配功能
 */

import type { PPTElement, PPTImageElement, PPTShapeElement, PPTTextElement, Slide } from '@/types/slides'
import type { AIPPTCover, AIPPTContents, AIPPTTransition, AIPPTContent, AIPPTEnd } from '@/types/AIPPT'
import { checkTextType, getNewTextElement, getNewImgElement, getUseableTemplates } from '../core/textUtils'
import { smartTemplateSelector } from '@/modules/templateMatching/integration'
import { isSmartMatchingEnabled } from '@/configs/templateMatching/featureToggle'
import { analyzeTemplateLayout } from '../layout/analysis'
import { pairComparisonLayout, pairHorizontalListLayout, pairGenericLayout } from '../pairing'
import type { ImagePoolItem } from '../types/index'

/**
 * 处理封面幻灯片（增强版）
 *
 * @param item - AIPPT封面幻灯片数据
 * @param coverTemplates - 封面模板列表
 * @param imgPool - 图片池
 * @returns 处理后的封面幻灯片或null
 */
export async function processCoverSlide(
  item: AIPPTCover,
  coverTemplates: Slide[],
  imgPool: ImagePoolItem[]
): Promise<Slide | null> {
  let coverTemplate: Slide | null = null

  try {
    // 尝试使用智能模板选择器
    if (isSmartMatchingEnabled('cover')) {
      coverTemplate = await smartTemplateSelector(item, coverTemplates, 'cover')
      if (coverTemplate) {
        console.log('[Enhanced Processor] 使用智能匹配的封面模板:', coverTemplate.id)
      }
    }

    // 降级到随机选择
    if (!coverTemplate) {
      coverTemplate = coverTemplates[Math.floor(Math.random() * coverTemplates.length)]
      console.log('[Enhanced Processor] 使用随机选择的封面模板:', coverTemplate.id)
    }
  }
  catch (error) {
    console.error('[Enhanced Processor] 封面模板选择失败:', error)
    coverTemplate = coverTemplates[Math.floor(Math.random() * coverTemplates.length)]
  }

  const elements = coverTemplate.elements.map(el => {
    if (el.type === 'image' && (el as PPTImageElement).imageType && imgPool.length) {
      return getNewImgElement(el as PPTImageElement, imgPool)
    }
    if (el.type !== 'text' && el.type !== 'shape') return el
    if (checkTextType(el, 'title') && item.data.title) {
      return getNewTextElement({ el: el as PPTTextElement | PPTShapeElement, text: item.data.title, maxLine: 1 })
    }
    if (checkTextType(el, 'content') && item.data.text) {
      return getNewTextElement({ el: el as PPTTextElement | PPTShapeElement, text: item.data.text, maxLine: 3 })
    }
    return el
  })

  return {
    ...coverTemplate,
    id: window.crypto.randomUUID(),
    elements,
  }
}

/**
 * 处理目录幻灯片（增强版）
 *
 * @param item - AIPPT目录幻灯片数据
 * @param contentsTemplates - 目录模板列表
 * @param imgPool - 图片池
 * @returns 处理后的目录幻灯片或null
 */
export async function processContentsSlide(
  item: AIPPTContents,
  contentsTemplates: Slide[],
  imgPool: ImagePoolItem[]
): Promise<Slide | null> {
  let contentsTemplate: Slide | null = null

  try {
    // 尝试使用智能模板选择器
    if (isSmartMatchingEnabled('contents')) {
      contentsTemplate = await smartTemplateSelector(item, contentsTemplates, 'contents')
      if (contentsTemplate) {
        console.log('[Enhanced Processor] 使用智能匹配的目录模板:', contentsTemplate.id)
      }
    }

    // 降级到容量筛选 + 随机选择
    if (!contentsTemplate) {
      const usableTemplates = getUseableTemplates(contentsTemplates, item.data.items.length, 'item')
      contentsTemplate = usableTemplates[Math.floor(Math.random() * usableTemplates.length)]
      console.log('[Enhanced Processor] 使用容量筛选+随机选择的目录模板:', contentsTemplate.id)
    }
  }
  catch (error) {
    console.error('[Enhanced Processor] 目录模板选择失败:', error)
    const usableTemplates = getUseableTemplates(contentsTemplates, item.data.items.length, 'item')
    contentsTemplate = usableTemplates[Math.floor(Math.random() * usableTemplates.length)]
  }

  const sortedNumberItems = contentsTemplate.elements.filter(el => checkTextType(el, 'itemNumber'))
  const sortedNumberItemIds = sortedNumberItems.sort((a, b) => {
    if (sortedNumberItems.length > 6) {
      let aContent = ''
      let bContent = ''
      if (a.type === 'text') aContent = (a as PPTTextElement).content
      if (a.type === 'shape') aContent = (a as PPTShapeElement).text!.content
      if (b.type === 'text') bContent = (b as PPTTextElement).content
      if (b.type === 'shape') bContent = (b as PPTShapeElement).text!.content

      if (aContent && bContent) {
        const aIndex = parseInt(aContent)
        const bIndex = parseInt(bContent)

        return aIndex - bIndex
      }
    }
    const aIndex = a.left + a.top * 2
    const bIndex = b.left + b.top * 2
    return aIndex - bIndex
  }).map(el => el.id)

  const sortedItems = contentsTemplate.elements.filter(el => checkTextType(el, 'item'))
  const sortedItemIds = sortedItems.sort((a, b) => {
    if (sortedItems.length > 6) {
      const aItemNumber = sortedNumberItems.find(item => item.groupId === a.groupId)
      const bItemNumber = sortedNumberItems.find(item => item.groupId === b.groupId)

      if (aItemNumber && bItemNumber) {
        let aContent = ''
        let bContent = ''
        if (aItemNumber.type === 'text') aContent = (aItemNumber as PPTTextElement).content
        if (aItemNumber.type === 'shape') aContent = (aItemNumber as PPTShapeElement).text!.content
        if (bItemNumber.type === 'text') bContent = (bItemNumber as PPTTextElement).content
        if (bItemNumber.type === 'shape') bContent = (bItemNumber as PPTShapeElement).text!.content

        if (aContent && bContent) {
          const aIndex = parseInt(aContent)
          const bIndex = parseInt(bContent)

          return aIndex - bIndex
        }
      }
    }

    const aIndex = a.left + a.top * 2
    const bIndex = b.left + b.top * 2
    return aIndex - bIndex
  }).map(el => el.id)

  const longestText = item.data.items.reduce((longest: string, current: string) => current.length > longest.length ? current : longest, '')

  const unusedElIds: string[] = []
  const unusedGroupIds: string[] = []
  const elements = contentsTemplate.elements.map(el => {
    if (el.type === 'image' && (el as PPTImageElement).imageType && imgPool.length) {
      return getNewImgElement(el as PPTImageElement, imgPool)
    }
    if (el.type !== 'text' && el.type !== 'shape') return el
    if (checkTextType(el, 'item')) {
      const index = sortedItemIds.findIndex(id => id === el.id)
      const itemTitle = item.data.items[index]
      if (itemTitle) return getNewTextElement({ el: el as PPTTextElement | PPTShapeElement, text: itemTitle, maxLine: 1, longestText })

      unusedElIds.push(el.id)
      if (el.groupId) unusedGroupIds.push(el.groupId)
    }
    if (checkTextType(el, 'itemNumber')) {
      const index = sortedNumberItemIds.findIndex(id => id === el.id)
      const offset = item.offset || 0
      return getNewTextElement({ el: el as PPTTextElement | PPTShapeElement, text: index + offset + 1 + '', maxLine: 1, digitPadding: true })
    }
    return el
  }).filter(el => !unusedElIds.includes(el.id) && !(el.groupId && unusedGroupIds.includes(el.groupId)))

  return {
    ...contentsTemplate,
    id: window.crypto.randomUUID(),
    elements,
  }
}

/**
 * 处理过渡幻灯片（增强版）
 *
 * @param item - AIPPT过渡幻灯片数据
 * @param transitionTemplate - 过渡模板
 * @param transitionIndex - 过渡索引
 * @param imgPool - 图片池
 * @returns 处理后的过渡幻灯片或null
 */
export function processTransitionSlide(
  item: AIPPTTransition,
  transitionTemplate: Slide | null,
  transitionIndex: number,
  imgPool: ImagePoolItem[]
): Slide | null {
  if (!transitionTemplate) return null

  const elements = transitionTemplate.elements.map(el => {
    if (el.type === 'image' && (el as PPTImageElement).imageType && imgPool.length) {
      return getNewImgElement(el as PPTImageElement, imgPool)
    }
    if (el.type !== 'text' && el.type !== 'shape') return el
    if (checkTextType(el, 'title') && item.data.title) {
      return getNewTextElement({ el: el as PPTTextElement | PPTShapeElement, text: item.data.title, maxLine: 1 })
    }
    if (checkTextType(el, 'content') && item.data.text) {
      return getNewTextElement({ el: el as PPTTextElement | PPTShapeElement, text: item.data.text, maxLine: 3 })
    }
    if (checkTextType(el, 'partNumber')) {
      return getNewTextElement({ el: el as PPTTextElement | PPTShapeElement, text: transitionIndex + '', maxLine: 1, digitPadding: true })
    }
    return el
  })

  return {
    ...transitionTemplate,
    id: window.crypto.randomUUID(),
    elements,
  }
}

/**
 * 处理内容幻灯片（增强版）
 *
 * @param item - AIPPT内容幻灯片数据
 * @param contentTemplates - 内容模板列表
 * @param imgPool - 图片池
 * @returns 处理后的内容幻灯片或null
 */
export async function processContentSlide(
  item: AIPPTContent,
  contentTemplates: Slide[],
  imgPool: ImagePoolItem[]
): Promise<Slide | null> {
  let contentTemplate: Slide | null = null

  try {
    // 尝试使用智能模板选择器
    if (isSmartMatchingEnabled('content')) {
      contentTemplate = await smartTemplateSelector(item, contentTemplates, 'content')
      if (contentTemplate) {
        console.log('[Enhanced Processor] 使用智能匹配的内容模板:', contentTemplate.id)
      }
    }

    // 降级到容量筛选 + 随机选择
    if (!contentTemplate) {
      const usableTemplates = getUseableTemplates(contentTemplates, item.data.items.length, 'item')
      contentTemplate = usableTemplates[Math.floor(Math.random() * usableTemplates.length)]
      console.log('[Enhanced Processor] 使用容量筛选+随机选择的内容模板:', contentTemplate.id)
    }
  }
  catch (error) {
    console.error('[Enhanced Processor] 内容模板选择失败:', error)
    const usableTemplates = getUseableTemplates(contentTemplates, item.data.items.length, 'item')
    contentTemplate = usableTemplates[Math.floor(Math.random() * usableTemplates.length)]
  }

  // 按照布局模式对标题和正文元素进行智能配对
  const titleElements = contentTemplate.elements.filter(el => checkTextType(el, 'itemTitle'))
  const textElements = contentTemplate.elements.filter(el => checkTextType(el, 'item'))

  // 分离有标题和无标题的数据项
  const itemsWithTitle = item.data.items.filter(item => item.title && item.title.trim())
  const itemsWithoutTitle = item.data.items.filter(item => !item.title || !item.title.trim())

  console.log('[Enhanced Processor] 配对前数据:', {
    titleElements: titleElements.length,
    textElements: textElements.length,
    itemsWithTitle: itemsWithTitle.length,
    itemsWithoutTitle: itemsWithoutTitle.length,
    itemsWithTitleData: itemsWithTitle,
    itemsWithoutTitleData: itemsWithoutTitle
  })

  // 构建智能配对映射
  const pairedElements = buildPairedElements(
    titleElements,
    textElements,
    itemsWithTitle,
    itemsWithoutTitle
  )

  console.log('[Enhanced Processor] 配对结果:', pairedElements)

  const sortedNumberItemIds = contentTemplate.elements.filter(el => checkTextType(el, 'itemNumber')).sort((a, b) => {
    const aIndex = a.left + a.top * 2
    const bIndex = b.left + b.top * 2
    return aIndex - bIndex
  }).map(el => el.id)

  const itemTitles: string[] = []
  const itemTexts: string[] = []

  for (const _item of item.data.items) {
    if (_item.title) itemTitles.push(_item.title)
    if (_item.text) itemTexts.push(_item.text)
  }
  const longestTitle = itemTitles.reduce((longest: string, current: string) => current.length > longest.length ? current : longest, '')
  const longestText = itemTexts.reduce((longest: string, current: string) => current.length > longest.length ? current : longest, '')

  const elements = contentTemplate.elements.map(el => {
    if (el.type === 'image' && (el as PPTImageElement).imageType && imgPool.length) {
      return getNewImgElement(el as PPTImageElement, imgPool)
    }
    if (el.type !== 'text' && el.type !== 'shape') return el
    
    // 处理单个内容项的特殊情况
    if (item.data.items.length === 1) {
      const contentItem = item.data.items[0]
      if (checkTextType(el, 'content') && contentItem.text) {
        return getNewTextElement({ el: el as PPTTextElement | PPTShapeElement, text: contentItem.text, maxLine: 6 })
      }
    }
    else {
      // 使用配对结果进行内容替换（避免索引错位）
      if (checkTextType(el, 'itemTitle')) {
        // 从配对结果中查找对应的数据项
        const paired = pairedElements.find(pair => pair.title?.id === el.id)
        if (paired && paired.dataItem && paired.dataItem.title && paired.dataItem.title.trim()) {
          return getNewTextElement({ 
            el: el as PPTTextElement | PPTShapeElement, 
            text: paired.dataItem.title, 
            longestText: longestTitle, 
            maxLine: 1 
          })
        }
      }
      if (checkTextType(el, 'item')) {
        // 从配对结果中查找对应的数据项
        const paired = pairedElements.find(pair => pair.text.id === el.id)
        console.log('[Enhanced Processor] 处理item元素:', {
          elementId: el.id,
          paired: paired ? { hasDataItem: !!paired.dataItem, dataItemText: paired.dataItem?.text } : null
        })
        if (paired && paired.dataItem) {
          const text = paired.dataItem.text || ''
          console.log('[Enhanced Processor] 准备替换文本:', { elementId: el.id, text })
          // 即使text为空，也要保留元素（避免删除模板元素）
          // 如果text为空，使用空字符串替换
          if (text.trim()) {
            return getNewTextElement({
              el: el as PPTTextElement | PPTShapeElement,
              text,
              longestText,
              maxLine: 4
            })
          }
          // text为空时，可以选择保留原内容或清空
          // 这里选择清空以保持一致性
          return getNewTextElement({
            el: el as PPTTextElement | PPTShapeElement,
            text: '',
            longestText,
            maxLine: 4
          })
        }
      }
      if (checkTextType(el, 'itemNumber')) {
        const index = sortedNumberItemIds.findIndex(id => id === el.id)
        const offset = item.offset || 0
        return getNewTextElement({ el: el as PPTTextElement | PPTShapeElement, text: index + offset + 1 + '', maxLine: 1, digitPadding: true })
      }
    }
    if (checkTextType(el, 'title') && item.data.title) {
      return getNewTextElement({ el: el as PPTTextElement | PPTShapeElement, text: item.data.title, maxLine: 1 })
    }
    return el
  })

  return {
    ...contentTemplate,
    id: window.crypto.randomUUID(),
    elements,
  }
}

/**
 * 处理结束幻灯片（增强版）
 *
 * @param item - AIPPT结束幻灯片数据
 * @param endTemplates - 结束模板列表
 * @param imgPool - 图片池
 * @returns 处理后的结束幻灯片或null
 */
export async function processEndSlide(
  item: AIPPTEnd,
  endTemplates: Slide[],
  imgPool: ImagePoolItem[]
): Promise<Slide | null> {
  let endTemplate: Slide | null = null

  try {
    // 尝试使用智能模板选择器
    if (isSmartMatchingEnabled('end')) {
      endTemplate = await smartTemplateSelector(item, endTemplates, 'end')
      if (endTemplate) {
        console.log('[Enhanced Processor] 使用智能匹配的结束模板:', endTemplate.id)
      }
    }

    // 降级到随机选择
    if (!endTemplate) {
      endTemplate = endTemplates[Math.floor(Math.random() * endTemplates.length)]
      console.log('[Enhanced Processor] 使用随机选择的结束模板:', endTemplate.id)
    }
  }
  catch (error) {
    console.error('[Enhanced Processor] 结束模板选择失败:', error)
    endTemplate = endTemplates[Math.floor(Math.random() * endTemplates.length)]
  }

  const elements = endTemplate.elements.map(el => {
    if (el.type === 'image' && (el as PPTImageElement).imageType && imgPool.length) {
      return getNewImgElement(el as PPTImageElement, imgPool)
    }
    return el
  })

  return {
    ...endTemplate,
    id: window.crypto.randomUUID(),
    elements,
  }
}

/**
 * 构建配对元素列表
 * 根据布局类型选择合适的配对策略
 *
 * @param titleElements - 标题元素列表
 * @param textElements - 正文元素列表
 * @param itemsWithTitle - 有标题的数据项列表
 * @param itemsWithoutTitle - 无标题的数据项列表
 * @returns 配对结果列表
 */
function buildPairedElements(
  titleElements: PPTElement[],
  textElements: PPTElement[],
  itemsWithTitle: any[],
  itemsWithoutTitle: any[]
) {
  console.log('[buildPairedElements] 开始构建配对元素', {
    titleElements: titleElements.length,
    textElements: textElements.length,
    itemsWithTitle: itemsWithTitle.length,
    itemsWithoutTitle: itemsWithoutTitle.length
  })

  // 1. 检测布局模式并分组元素
  const layoutAnalysis = analyzeTemplateLayout(titleElements, textElements)
  console.log('[buildPairedElements] 布局分析结果:', layoutAnalysis)

  // 2. 根据布局模式进行智能配对
  if (layoutAnalysis.layoutType === 'comparison') {
    // 左右对比布局模式
    return pairComparisonLayout(
      layoutAnalysis,
      itemsWithTitle,
      itemsWithoutTitle
    )
  }

  if (layoutAnalysis.layoutType === 'horizontal_list') {
    // 水平列表布局模式
    return pairHorizontalListLayout(
      layoutAnalysis,
      itemsWithTitle,
      itemsWithoutTitle
    )
  }

  // 通用布局模式（降级到原有算法）
  const result = pairGenericLayout(
    titleElements,
    textElements,
    itemsWithTitle,
    itemsWithoutTitle
  )
  console.log('[buildPairedElements] 通用布局配对结果:', result)
  return result
}

// 导出内部函数用于测试（从模块中重新导出）
export { analyzeTemplateLayout } from '../layout/analysis'
export { 
  pairComparisonLayout,
  pairHorizontalListLayout,
  pairGenericLayout,
  calculateLayoutMatchScore
} from '../pairing'
