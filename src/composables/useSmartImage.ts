/**
 * SmartImage 智能图片加载Composable
 * 提供图片加载、重试、缓存等功能的组合式API
 */

import { ref, shallowRef } from 'vue'
import { ElMessage } from 'element-plus'
import { API_CONFIG } from '@/configs/api'

// 加载状态
export enum ImageLoadingState {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error',
  RETRYING = 'retrying'
}

// 代理模式
export enum ProxyMode {
  REDIRECT = 'redirect',
  PROXY = 'proxy'
}

// 错误类型
export enum ImageErrorType {
  NETWORK_ERROR = 'network_error',
  TIMEOUT = 'timeout',
  NOT_FOUND = 'not_found',
  SERVER_ERROR = 'server_error',
  UNKNOWN = 'unknown'
}

// SmartImage选项
export interface SmartImageOptions {
  maxRetries?: number          // 最大重试次数
  retryDelay?: number          // 重试延迟（毫秒）
  timeout?: number             // 请求超时（毫秒）
  useProxy?: boolean           // 是否使用代理
  proxyMode?: ProxyMode        // 代理模式
  fallbackSrc?: string         // 失败时的占位图
  retryOnHttpErrors?: boolean  // 是否在HTTP错误时重试
  preloaded?: boolean          // 是否已预加载
}

// 加载结果
export interface ImageLoadResult {
  success: boolean
  src: string
  fromCache?: boolean
  responseTime?: number
  error?: ImageError
}

// 图片错误
export class ImageError extends Error {
  constructor(
    message: string,
    public type: ImageErrorType,
    public statusCode?: number,
    public originalError?: any
  ) {
    super(message)
    this.name = 'ImageError'
  }
}

// 指数退避
function exponentialBackoff(attempt: number, baseDelay: number = 1000): number {
  const delay = baseDelay * Math.pow(2, attempt)
  const jitter = delay * 0.1 * Math.random()
  return delay + jitter
}

// 获取图片状态
async function getImageStatus(imageKey: string): Promise<any> {
  const response = await fetch(API_CONFIG.IMAGE_PROXY.STATUS(imageKey))
  if (!response.ok) {
    throw new Error(`获取图片状态失败: ${response.statusText}`)
  }
  return response.json()
}

// 刷新图片URL
async function refreshImageUrl(imageKey: string): Promise<any> {
  const response = await fetch(API_CONFIG.IMAGE_PROXY.REFRESH(imageKey), {
    method: 'POST'
  })
  if (!response.ok) {
    throw new Error(`刷新图片URL失败: ${response.statusText}`)
  }
  return response.json()
}

// 预加载图片
async function preloadImage(imageKey: string): Promise<void> {
  const proxyUrl = API_CONFIG.IMAGE_PROXY.PROXY(imageKey)
  const img = new Image()
  img.src = proxyUrl
}

/**
 * SmartImage 组合式API
 */
export function useSmartImage() {
  // 状态
  const loadingState = ref<ImageLoadingState>(ImageLoadingState.IDLE)
  const currentImageKey = ref<string | null>(null)
  const currentUrl = shallowRef<string>('')
  const error = ref<ImageError | null>(null)
  const retryCount = ref(0)
  const loadStartTime = ref<number>(0)

  // 配置
  const defaultOptions: Required<SmartImageOptions> = {
    maxRetries: 3,
    retryDelay: 1000,
    timeout: 10000,
    useProxy: true,
    proxyMode: ProxyMode.REDIRECT,
    fallbackSrc: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuWbvueJh+acquWKoOi9veWksei0pTwvdGV4dD48L3N2Zz4=',
    retryOnHttpErrors: true,
    preloaded: false
  }

  /**
   * 加载图片
   */
  async function loadImage(
    imageKey: string,
    options: SmartImageOptions = {}
  ): Promise<ImageLoadResult> {
    const config = { ...defaultOptions, ...options }

    // 重置状态
    currentImageKey.value = imageKey
    error.value = null
    retryCount.value = 0
    loadStartTime.value = Date.now()
    loadingState.value = ImageLoadingState.LOADING

    try {
      // 如果已预加载，直接返回
      if (config.preloaded && currentUrl.value) {
        loadingState.value = ImageLoadingState.SUCCESS
        return {
          success: true,
          src: currentUrl.value,
          fromCache: true
        }
      }

      // 尝试从缓存获取
      const cachedUrl = await getCachedUrl(imageKey)
      if (cachedUrl) {
        currentUrl.value = cachedUrl
        loadingState.value = ImageLoadingState.SUCCESS
        return {
          success: true,
          src: cachedUrl,
          fromCache: true,
          responseTime: Date.now() - loadStartTime.value
        }
      }

      // 使用代理或直接加载
      const url = config.useProxy
        ? `${API_CONFIG.IMAGE_PROXY.PROXY(imageKey)}?mode=${config.proxyMode}`
        : imageKey

      // 测试图片是否可以访问
      const isValid = await testImageLoad(url, config.timeout)

      if (isValid) {
        currentUrl.value = url
        await cacheUrl(imageKey, url)
        loadingState.value = ImageLoadingState.SUCCESS

        return {
          success: true,
          src: url,
          fromCache: false,
          responseTime: Date.now() - loadStartTime.value
        }
      }

      throw new ImageError('图片加载失败', ImageErrorType.UNKNOWN)

    } catch (err) {
      return handleLoadError(err, imageKey, config)
    }
  }

  /**
   * 处理加载错误
   */
  async function handleLoadError(
    err: any,
    imageKey: string,
    config: Required<SmartImageOptions>
  ): Promise<ImageLoadResult> {
    let imageError: ImageError

    // 分类错误类型
    if (err instanceof ImageError) {
      imageError = err
    } else if (err.name === 'ImageError') {
      imageError = err
    } else {
      // 网络错误
      imageError = new ImageError(
        err.message || '网络错误',
        ImageErrorType.NETWORK_ERROR,
        undefined,
        err
      )
    }

    error.value = imageError

    // 超过最大重试次数
    if (retryCount.value >= config.maxRetries) {
      loadingState.value = ImageLoadingState.ERROR
      return {
        success: false,
        src: config.fallbackSrc,
        error: imageError
      }
    }

    // 记录重试
    retryCount.value++
    loadingState.value = ImageLoadingState.RETRYING

    // 根据错误类型决定是否重试
    const shouldRetry = shouldRetryError(imageError, config)

    if (shouldRetry) {
      const delay = exponentialBackoff(retryCount.value - 1, config.retryDelay)
      await new Promise(resolve => setTimeout(resolve, delay))

      try {
        // 尝试刷新URL
        await refreshImageUrl(imageKey)
        return await loadImage(imageKey, { ...config, preloaded: false })
      } catch (refreshErr) {
        // 刷新失败，继续重试
        return await loadImage(imageKey, config)
      }
    } else {
      loadingState.value = ImageLoadingState.ERROR
      return {
        success: false,
        src: config.fallbackSrc,
        error: imageError
      }
    }
  }

  /**
   * 判断错误是否应该重试
   */
  function shouldRetryError(err: ImageError, config: Required<SmartImageOptions>): boolean {
    // HTTP错误且配置允许重试
    if (err.statusCode && err.statusCode >= 400 && config.retryOnHttpErrors) {
      return true
    }

    // 网络错误和超时错误
    if (err.type === ImageErrorType.NETWORK_ERROR || err.type === ImageErrorType.TIMEOUT) {
      return true
    }

    return false
  }

  /**
   * 测试图片加载
   */
  function testImageLoad(url: string, timeout: number): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image()
      let timeoutId: number

      const cleanup = () => {
        clearTimeout(timeoutId)
        img.onload = null
        img.onerror = null
      }

      // 设置超时
      timeoutId = setTimeout(() => {
        cleanup()
        resolve(false)
      }, timeout)

      img.onload = () => {
        cleanup()
        resolve(true)
      }

      img.onerror = (err) => {
        cleanup()
        resolve(false)
      }

      img.src = url
    })
  }

  /**
   * 获取缓存的URL
   */
  async function getCachedUrl(imageKey: string): Promise<string | null> {
    // TODO: 实现本地缓存逻辑（如IndexedDB）
    // 现在先返回null，后续可以优化
    return null
  }

  /**
   * 缓存URL
   */
  async function cacheUrl(imageKey: string, url: string): Promise<void> {
    // TODO: 实现本地缓存逻辑（如IndexedDB）
    // 现在先不实现
  }

  /**
   * 手动重试
   */
  async function retry(): Promise<ImageLoadResult | null> {
    if (!currentImageKey.value) {
      return null
    }

    const oldUrl = currentUrl.value
    error.value = null
    retryCount.value = 0
    loadingState.value = ImageLoadingState.LOADING

    try {
      return await loadImage(currentImageKey.value, {
        fallbackSrc: oldUrl
      })
    } catch (err) {
      console.error('重试失败:', err)
      return null
    }
  }

  /**
   * 手动刷新
   */
  async function refresh(imageKey?: string): Promise<ImageLoadResult | null> {
    const key = imageKey || currentImageKey.value
    if (!key) {
      return null
    }

    try {
      await refreshImageUrl(key)
      return await loadImage(key)
    } catch (err) {
      console.error('刷新失败:', err)
      return null
    }
  }

  /**
   * 预加载图片
   */
  async function preload(imageKey: string): Promise<boolean> {
    try {
      await preloadImage(imageKey)
      return true
    } catch (err) {
      console.error('预加载失败:', err)
      return false
    }
  }

  /**
   * 获取图片状态
   */
  async function getStatus(imageKey?: string): Promise<any> {
    const key = imageKey || currentImageKey.value
    if (!key) {
      return null
    }

    try {
      return await getImageStatus(key)
    } catch (err) {
      console.error('获取状态失败:', err)
      return null
    }
  }

  /**
   * 获取代理URL
   */
  function getProxyUrl(imageKey: string, mode: ProxyMode = ProxyMode.REDIRECT): string {
    return `${API_CONFIG.IMAGE_PROXY.PROXY(imageKey)}?mode=${mode}`
  }

  /**
   * 获取统计信息
   */
  async function getStats(): Promise<any> {
    try {
      const response = await fetch(API_CONFIG.IMAGE_PROXY.STATS)
      if (!response.ok) {
        throw new Error('获取统计信息失败')
      }
      return response.json()
    } catch (err) {
      console.error('获取统计信息失败:', err)
      return null
    }
  }

  /**
   * 清理缓存
   */
  async function cleanup(): Promise<boolean> {
    try {
      const response = await fetch(API_CONFIG.IMAGE_PROXY.CLEANUP, {
        method: 'POST'
      })
      return response.ok
    } catch (err) {
      console.error('清理缓存失败:', err)
      return false
    }
  }

  /**
   * 重置状态
   */
  function reset() {
    loadingState.value = ImageLoadingState.IDLE
    currentImageKey.value = null
    currentUrl.value = '' as any
    error.value = null
    retryCount.value = 0
    loadStartTime.value = 0
  }

  return {
    // 状态
    loadingState,
    currentImageKey,
    currentUrl,
    error,
    retryCount,

    // 方法
    loadImage,
    retry,
    refresh,
    preload,
    getStatus,
    getProxyUrl,
    getStats,
    cleanup,
    reset
  }
}
