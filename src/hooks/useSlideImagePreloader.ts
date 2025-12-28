/**
 * 幻灯片图片预加载 Hook
 * 在切换幻灯片时自动预加载前后几张幻灯片的图片
 */

import { watch, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useSlidesStore } from '@/store'
import type { PPTElement, Slide } from '@/types/slides'
import { imageCacheService } from '@/services/imageCache'
import { API_CONFIG } from '@/configs/api'

interface PreloadOptions {
  /** 预加载前后各几张幻灯片，默认 1 */
  preloadRange?: number
  /** 并发预加载数量，默认 3 */
  concurrent?: number
  /** 预加载延迟（毫秒），避免影响当前页面性能 */
  delay?: number
}

/**
 * 从幻灯片中提取所有图片的 cosKey
 */
function extractImageKeysFromSlide(slide: Slide | undefined): string[] {
  if (!slide) return []

  const imageKeys: string[] = []

  for (const element of slide.elements) {
    if (element.type === 'image') {
      const src = element.src || ''
      // 提取 cosKey：可能是完整 URL 或相对路径
      if (src.includes('cos.')) {
        // 从 URL 中提取 cosKey
        try {
          const url = new URL(src)
          const pathParts = url.pathname.split('/')
          // 通常 cosKey 格式为: ai-generated/ppt/xxx/slide_0.png
          const cosKey = pathParts.slice(1).join('/')
          if (cosKey) {
            imageKeys.push(cosKey)
          }
        } catch {
          // URL 解析失败，直接使用 src
          imageKeys.push(src)
        }
      } else if (!src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('data:')) {
        // 看起来像 cosKey
        imageKeys.push(src)
      }
    }
  }

  return imageKeys
}

/**
 * 幻灯片图片预加载 Hook
 */
export default function useSlideImagePreloader(options: PreloadOptions = {}) {
  const {
    preloadRange = 1,
    concurrent = 3,
    delay = 500
  } = options

  const slidesStore = useSlidesStore()
  const { slides, currentSlide } = storeToRefs(slidesStore)
  const { slideIndex } = storeToRefs(slidesStore)

  let preloadTimer: number | null = null

  /**
   * 预加载指定范围的幻灯片图片
   */
  async function preloadSlideImages(targetIndex: number) {
    if (!slides.value || slides.value.length === 0) return

    const totalSlides = slides.value.length
    const keysToPreload: string[] = []

    // 收集前后幻灯片的图片 keys
    for (let offset = -preloadRange; offset <= preloadRange; offset++) {
      if (offset === 0) continue // 跳过当前幻灯片

      const targetIndex = slideIndex.value + offset
      if (targetIndex >= 0 && targetIndex < totalSlides) {
        const slide = slides.value[targetIndex]
        const imageKeys = extractImageKeysFromSlide(slide)
        keysToPreload.push(...imageKeys)
      }
    }

    // 去重（过滤掉已缓存的）
    const uniqueKeys = [...new Set(keysToPreload)].filter(key => !imageCacheService.has(key))

    if (uniqueKeys.length === 0) return

    console.log('[SlideImagePreloader] 预加载图片:', uniqueKeys.length, '张')

    // 批量预加载
    const loadedCount = await imageCacheService.preloadImages(
      uniqueKeys,
      (key) => `${API_CONFIG.IMAGE_PROXY.PROXY(key)}?mode=redirect`,
      concurrent
    )

    console.log('[SlideImagePreloader] 预加载完成:', loadedCount, '/', uniqueKeys.length)
  }

  /**
   * 延迟预加载（避免影响当前页面性能）
   */
  function schedulePreload(targetIndex: number) {
    if (preloadTimer !== null) {
      clearTimeout(preloadTimer)
    }

    preloadTimer = setTimeout(() => {
      preloadSlideImages(targetIndex)
      preloadTimer = null
    }, delay) as unknown as number
  }

  // 监听当前幻灯片变化
  watch(
    () => slideIndex.value,
    (newIndex, oldIndex) => {
      if (newIndex !== oldIndex && newIndex !== undefined) {
        schedulePreload(newIndex)
      }
    },
    { immediate: false }
  )

  // 清理
  onUnmounted(() => {
    if (preloadTimer !== null) {
      clearTimeout(preloadTimer)
    }
  })

  return {
    preloadSlideImages,
    schedulePreload
  }
}

/**
 * 从所有幻灯片中提取所有图片 keys
 */
export function extractAllImageKeys(slides: Slide[]): string[] {
  const allKeys: string[] = []

  for (const slide of slides) {
    const keys = extractImageKeysFromSlide(slide)
    allKeys.push(...keys)
  }

  return [...new Set(allKeys)]
}
