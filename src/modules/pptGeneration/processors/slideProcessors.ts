/**
 * 幻灯片处理工具函数
 * 处理不同类型幻灯片的生成逻辑
 */

import type { PPTElement, PPTImageElement, PPTShapeElement, PPTTextElement, Slide } from '@/types/slides'
import type { AIPPTSlide, AIPPTCover, AIPPTContents, AIPPTTransition, AIPPTContent, AIPPTEnd } from '@/types/AIPPT'
import { checkTextType, getNewTextElement, getNewImgElement, getUseableTemplates } from '../core/textUtils'
import type { ImagePoolItem } from '../types/index'

/**
 * 处理封面幻灯片
 *
 * @param item - AIPPT封面幻灯片数据
 * @param coverTemplates - 封面模板列表
 * @param imgPool - 图片池
 * @returns 处理后的封面幻灯片或null
 */
export function processCoverSlide(
  item: AIPPTCover,
  coverTemplates: Slide[],
  imgPool: ImagePoolItem[]
): Slide | null {
  if (!coverTemplates || coverTemplates.length === 0) {
    return null
  }
  
  const coverTemplate = coverTemplates[Math.floor(Math.random() * coverTemplates.length)]
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
 * 处理目录幻灯片
 *
 * @param item - AIPPT目录幻灯片数据
 * @param contentsTemplates - 目录模板列表
 * @param imgPool - 图片池
 * @returns 处理后的目录幻灯片或null
 */
export function processContentsSlide(
  item: AIPPTContents,
  contentsTemplates: Slide[],
  imgPool: ImagePoolItem[]
): Slide | null {
  const _contentsTemplates = getUseableTemplates(contentsTemplates, item.data.items.length, 'item')
  const contentsTemplate = _contentsTemplates[Math.floor(Math.random() * _contentsTemplates.length)]

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
 * 处理过渡幻灯片
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
 * 处理内容幻灯片
 *
 * @param item - AIPPT内容幻灯片数据
 * @param contentTemplates - 内容模板列表
 * @param imgPool - 图片池
 * @returns 处理后的内容幻灯片或null
 */
export function processContentSlide(
  item: AIPPTContent,
  contentTemplates: Slide[],
  imgPool: ImagePoolItem[]
): Slide | null {
  const _contentTemplates = getUseableTemplates(contentTemplates, item.data.items.length, 'item')
  const contentTemplate = _contentTemplates[Math.floor(Math.random() * _contentTemplates.length)]

  const sortedTitleItemIds = contentTemplate.elements.filter(el => checkTextType(el, 'itemTitle')).sort((a, b) => {
    const aIndex = a.left + a.top * 2
    const bIndex = b.left + b.top * 2
    return aIndex - bIndex
  }).map(el => el.id)

  const sortedTextItemIds = contentTemplate.elements.filter(el => checkTextType(el, 'item')).sort((a, b) => {
    const aIndex = a.left + a.top * 2
    const bIndex = b.left + b.top * 2
    return aIndex - bIndex
  }).map(el => el.id)

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
    if (item.data.items.length === 1) {
      const contentItem = item.data.items[0]
      if (checkTextType(el, 'content') && contentItem.text) {
        return getNewTextElement({ el: el as PPTTextElement | PPTShapeElement, text: contentItem.text, maxLine: 6 })
      }
    }
    else {
      if (checkTextType(el, 'itemTitle')) {
        const index = sortedTitleItemIds.findIndex(id => id === el.id)
        const contentItem = item.data.items[index]
        if (contentItem && contentItem.title) {
          return getNewTextElement({ el: el as PPTTextElement | PPTShapeElement, text: contentItem.title, longestText: longestTitle, maxLine: 1 })
        }
      }
      if (checkTextType(el, 'item')) {
        const index = sortedTextItemIds.findIndex(id => id === el.id)
        const contentItem = item.data.items[index]
        if (contentItem && contentItem.text) {
          return getNewTextElement({ el: el as PPTTextElement | PPTShapeElement, text: contentItem.text, longestText, maxLine: 4 })
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
 * 处理结束幻灯片
 *
 * @param item - AIPPT结束幻灯片数据
 * @param endTemplates - 结束模板列表
 * @param imgPool - 图片池
 * @returns 处理后的结束幻灯片或null
 */
export function processEndSlide(
  item: AIPPTEnd,
  endTemplates: Slide[],
  imgPool: ImagePoolItem[]
): Slide | null {
  const endTemplate = endTemplates[Math.floor(Math.random() * endTemplates.length)]
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