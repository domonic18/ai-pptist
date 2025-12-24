/**
 * 大纲解析工具
 * 将markdown格式的大纲内容解析为结构化的OutlineData
 */

import type { OutlineData, SlideOutline } from '@/types/banana-generation'

/**
 * 解析markdown大纲为结构化数据
 * 
 * 支持的markdown格式示例:
 * # PPT标题
 * 
 * ## 第一页标题
 * - 要点1
 * - 要点2
 * 
 * ## 第二页标题
 * - 要点1
 * - 要点2
 * 
 * @param markdown markdown格式的大纲内容
 * @returns 解析后的OutlineData
 */
export function parseOutlineFromMarkdown(markdown: string): OutlineData | null {
  if (!markdown || !markdown.trim()) {
    return null
  }

  const lines = markdown.split('\n')
  let title = ''
  const slides: SlideOutline[] = []
  let currentSlide: SlideOutline | null = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // 跳过空行
    if (!line) continue

    // 解析主标题 (一级标题)
    if (line.startsWith('# ')) {
      title = line.substring(2).trim()
      continue
    }

    // 解析幻灯片标题 (支持二级 ## 和三级 ### 标题)
    if (line.startsWith('## ') || line.startsWith('### ')) {
      // 如果当前已经有一个幻灯片（即使没有要点，也可能是章节过渡页），保存它
      if (currentSlide) {
        slides.push(currentSlide)
      }

      // 创建新幻灯片
      const level = line.startsWith('### ') ? 3 : 2
      const slideTitle = line.substring(level + 1).trim()
      currentSlide = {
        title: slideTitle,
        points: [],
      }
      continue
    }

    // 解析要点 (列表项)
    if (line.startsWith('- ') || line.startsWith('* ') || line.match(/^\d+\.\s/)) {
      if (!currentSlide) {
        // 如果没有当前幻灯片，创建一个默认的
        currentSlide = {
          title: '未命名幻灯片',
          points: [],
        }
      }

      // 移除列表标记
      const point = line.replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, '').trim()
      if (point) {
        currentSlide.points.push(point)
      }
      continue
    }

    // 处理其他格式的文本（可能是标题或要点）
    if (currentSlide) {
      // 如果当前行不是标题，可能是要点的延续
      if (line && !line.startsWith('#')) {
        // 检查是否是缩进的要点
        if (line.startsWith('  ') || line.startsWith('\t')) {
          const point = line.trim()
          if (point && !point.startsWith('-') && !point.startsWith('*')) {
            currentSlide.points.push(point)
          }
        }
      }
    } 
    else if (!title && line) {
      // 如果还没有标题，将第一行作为标题
      title = line.replace(/^#+\s*/, '').trim()
    }
  }

  // 保存最后一个幻灯片
  if (currentSlide && currentSlide.points.length > 0) {
    slides.push(currentSlide)
  }

  // 如果没有解析到标题，使用默认值
  if (!title) {
    title = '未命名演示文稿'
  }

  // 如果没有解析到幻灯片，返回null
  if (slides.length === 0) {
    return null
  }

  return {
    title,
    slides,
  }
}

/**
 * 验证OutlineData的完整性
 */
export function validateOutlineData(outline: OutlineData): boolean {
  if (!outline.title || !outline.slides || outline.slides.length === 0) {
    return false
  }

  for (const slide of outline.slides) {
    if (!slide.title || !slide.points) {
      return false
    }
  }

  return true
}

