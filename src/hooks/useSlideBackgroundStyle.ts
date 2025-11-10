import { type Ref, computed } from 'vue'
import type { SlideBackground } from '@/types/slides'
import { API_CONFIG } from '@/configs/api'

// 获取图片代理URL
const getProxyUrl = (imageKey: string): string => {
  return `${API_CONFIG.IMAGE_PROXY.PROXY(imageKey)}?mode=redirect`
}

// 将页面背景数据转换为css样式
export default (background: Ref<SlideBackground | undefined>) => {
  const backgroundStyle = computed(() => {
    if (!background.value) return { backgroundColor: '#fff' }

    const {
      type,
      color,
      image,
      gradient,
    } = background.value

    // 纯色背景
    if (type === 'solid') return { backgroundColor: color }

    // 背景图模式
    // 包括：背景图、背景大小，是否重复
    else if (type === 'image' && image) {
      const { src, size } = image
      if (!src) return { backgroundColor: '#fff' }
      // 使用代理URL访问图片，确保URL过期后仍可访问
      const proxyUrl = getProxyUrl(src)
      if (size === 'repeat') {
        return {
          backgroundImage: `url(${proxyUrl}`,
          backgroundRepeat: 'repeat',
          backgroundSize: 'contain',
        }
      }
      return {
        backgroundImage: `url(${proxyUrl}`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: size || 'cover',
      }
    }

    // 渐变色背景
    else if (type === 'gradient' && gradient) {
      const { type, colors, rotate } = gradient
      const list = colors.map(item => `${item.color} ${item.pos}%`)

      if (type === 'radial') return { backgroundImage: `radial-gradient(${list.join(',')}` }
      return { backgroundImage: `linear-gradient(${rotate}deg, ${list.join(',')}` }
    }

    return { backgroundColor: '#fff' }
  })

  return {
    backgroundStyle,
  }
}