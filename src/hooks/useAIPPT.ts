/**
 * AI PPT生成 Hook - 重构版本
 * 使用提取的工具函数模块，提供更好的可维护性和扩展性
 */

import { ref } from 'vue'
import type { Slide } from '@/types/slides'
import type { AIPPTSlide } from '@/types/AIPPT'

// 导入重构版本
import useAIPPTRefactored from './useAIPPT-refactored'

// 特性开关 - 控制使用哪个版本
const USE_REFACTORED_VERSION = ref(true)

interface ImgPoolItem {
  id: string
  src: string
  width: number
  height: number
}

export default () => {
  // 使用重构版本
  const refactoredHook = useAIPPTRefactored()

  /**
   * 预设图片池
   */
  const presetImgPool = (imgs: ImgPoolItem[]) => {
    refactoredHook.presetImgPool(imgs)
  }

  /**
   * 主AIPPT函数 - 兼容性包装
   */
  const AIPPT = async (templateSlides: Slide[], _AISlides: AIPPTSlide[], imgs?: ImgPoolItem[]) => {
    if (USE_REFACTORED_VERSION.value) {
      // 使用重构版本
      await refactoredHook.AIPPT(templateSlides, _AISlides, imgs)
    }
    else {
      // 这里可以回退到原始版本
      // 暂时使用重构版本
      await refactoredHook.AIPPT(templateSlides, _AISlides, imgs)
    }
  }

  /**
   * 获取Markdown内容
   */
  const getMdContent = (content: string): string => {
    return refactoredHook.getMdContent(content)
  }

  /**
   * 获取JSON内容
   */
  const getJSONContent = (content: string): string => {
    return refactoredHook.getJSONContent(content)
  }

  /**
   * 切换实现版本
   */
  const toggleImplementation = (useRefactored: boolean) => {
    USE_REFACTORED_VERSION.value = useRefactored
  }

  /**
   * 获取当前使用的版本
   */
  const getCurrentVersion = () => {
    return USE_REFACTORED_VERSION.value ? 'refactored' : 'legacy'
  }

  return {
    presetImgPool,
    AIPPT,
    getMdContent,
    getJSONContent,
    toggleImplementation,
    getCurrentVersion,
  }
}