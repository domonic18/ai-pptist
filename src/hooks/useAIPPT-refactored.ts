/**
 * AI PPT生成 Hook
 * 重构版本 - 将原始大函数拆分为多个职责单一的小函数
 * 使用提取的工具函数模块
 */

import type { Slide } from '@/types/slides'
import type { AIPPTSlide } from '@/types/AIPPT'
import { useSlidesStore } from '@/store'
import useAddSlidesOrElements from './useAddSlidesOrElements'
import useSlideHandler from './useSlideHandler'

// 导入工具函数
import {
  getMdContent,
  getJSONContent,
  PaginationProcessor,
  processCoverSlide,
  processContentsSlide,
  processTransitionSlide,
  processContentSlide,
  processEndSlide,
} from '@/modules/pptGeneration'

interface ImgPoolItem {
  id: string
  src: string
  width: number
  height: number
}

/**
 * 图片池管理类
 */
class ImagePoolManager {
  private imgPool: ImgPoolItem[] = []

  /**
   * 预设图片池
   */
  presetImgPool(imgs: ImgPoolItem[]): void {
    this.imgPool = imgs
  }

  /**
   * 获取图片池
   */
  getImgPool(): ImgPoolItem[] {
    return this.imgPool
  }

  /**
   * 从图片池中移除图片
   */
  removeImageFromPool(imgId: string): void {
    this.imgPool = this.imgPool.filter((item) => item.id !== imgId)
  }

  /**
   * 清空图片池
   */
  clearImgPool(): void {
    this.imgPool = []
  }
}

/**
 * 模板管理器
 */
class TemplateManager {
  private transitionTemplate: Slide | null = null
  private transitionIndex = 0

  /**
   * 获取过渡模板
   */
  getTransitionTemplate(transitionTemplates: Slide[]): Slide {
    if (!this.transitionTemplate) {
      this.transitionTemplate =
        transitionTemplates[
          Math.floor(Math.random() * transitionTemplates.length)
        ]
    }
    return this.transitionTemplate
  }

  /**
   * 增加过渡索引
   */
  incrementTransitionIndex(): number {
    this.transitionIndex += 1
    return this.transitionIndex
  }

  /**
   * 重置过渡索引
   */
  resetTransitionIndex(): void {
    this.transitionIndex = 0
  }

  /**
   * 获取当前过渡索引
   */
  getTransitionIndex(): number {
    return this.transitionIndex
  }
}

/**
 * 幻灯片生成器
 */
class SlideGenerator {
  private imagePoolManager: ImagePoolManager
  private templateManager: TemplateManager

  constructor(
    imagePoolManager: ImagePoolManager,
    templateManager: TemplateManager,
  ) {
    this.imagePoolManager = imagePoolManager
    this.templateManager = templateManager
  }

  /**
   * 生成幻灯片
   */
  async generateSlides(AISlides: AIPPTSlide[], templateSlides: Slide[]): Promise<Slide[]> {
    const coverTemplates = templateSlides.filter(
      (slide) => slide.type === 'cover',
    )
    const contentsTemplates = templateSlides.filter(
      (slide) => slide.type === 'contents',
    )
    const transitionTemplates = templateSlides.filter(
      (slide) => slide.type === 'transition',
    )
    const contentTemplates = templateSlides.filter(
      (slide) => slide.type === 'content',
    )
    const endTemplates = templateSlides.filter((slide) => slide.type === 'end')

    const slides: Slide[] = []

    for (const item of AISlides) {
      const imgPool = this.imagePoolManager.getImgPool()

      switch (item.type) {
        case 'cover': {
          const coverSlide = await processCoverSlide(item, coverTemplates, imgPool)
          if (coverSlide) slides.push(coverSlide)
          break
        }

        case 'contents': {
          const contentsSlide = await processContentsSlide(
            item,
            contentsTemplates,
            imgPool,
          )
          if (contentsSlide) slides.push(contentsSlide)
          break
        }

        case 'transition': {
          const transitionIndex =
            this.templateManager.incrementTransitionIndex()
          const transitionSlide = await processTransitionSlide(
            item,
            this.templateManager.getTransitionTemplate(transitionTemplates),
            transitionIndex,
            imgPool,
          )
          if (transitionSlide) slides.push(transitionSlide)
          break
        }

        case 'content': {
          const contentSlide = await processContentSlide(
            item,
            contentTemplates,
            imgPool,
          )
          if (contentSlide) slides.push(contentSlide)
          break
        }

        case 'end': {
          const endSlide = await processEndSlide(item, endTemplates, imgPool)
          if (endSlide) slides.push(endSlide)
          break
        }

        default: {
          console.warn(`Unknown slide type: ${(item as any).type}`)
          break
        }
      }
    }

    return slides
  }
}

export default () => {
  const slidesStore = useSlidesStore()
  const { addSlidesFromData } = useAddSlidesOrElements()
  const { isEmptySlide } = useSlideHandler()

  // 初始化管理器
  const imagePoolManager = new ImagePoolManager()
  const templateManager = new TemplateManager()
  const slideGenerator = new SlideGenerator(imagePoolManager, templateManager)
  const paginationProcessor = new PaginationProcessor()

  /**
   * 预设图片池
   */
  const presetImgPool = (imgs: ImgPoolItem[]) => {
    imagePoolManager.presetImgPool(imgs)
  }

  /**
   * 主AIPPT函数 - 重构版本
   */
  const AIPPT = async (
    templateSlides: Slide[],
    _AISlides: AIPPTSlide[],
    imgs?: ImgPoolItem[],
  ) => {
    slidesStore.updateSlideIndex(slidesStore.slides.length - 1)

    // 设置图片池
    if (imgs) {
      imagePoolManager.presetImgPool(imgs)
    }

    // 处理分页
    const paginatedSlides = paginationProcessor.processPagination(_AISlides)

    // 生成幻灯片
    const slides = await slideGenerator.generateSlides(
      paginatedSlides,
      templateSlides,
    )

    // 添加幻灯片到画布
    if (isEmptySlide.value) {
      slidesStore.setSlides(slides)
    }
    else {
      addSlidesFromData(slides)
    }
  }

  return {
    presetImgPool,
    AIPPT,
    getMdContent,
    getJSONContent,
  }
}
