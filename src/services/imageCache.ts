/**
 * 图片缓存服务
 * 提供全局图片URL缓存和预加载功能
 */

interface CacheEntry {
  url: string
  timestamp: number
  accessCount: number
}

class ImageCacheService {
  private cache: Map<string, CacheEntry> = new Map()
  private preloadCache: Map<string, CacheEntry> = new Map()
  private maxCacheSize = 200
  private cacheTimeout = 30 * 60 * 1000 // 30分钟

  /**
   * 获取缓存的图片URL
   */
  getCachedUrl(imageKey: string): string | null {
    const entry = this.cache.get(imageKey)
    if (entry) {
      const now = Date.now()
      // 检查是否过期
      if (now - entry.timestamp < this.cacheTimeout) {
        entry.accessCount++
        entry.timestamp = now
        return entry.url
      } else {
        // 过期，删除缓存
        this.cache.delete(imageKey)
      }
    }
    return null
  }

  /**
   * 缓存图片URL
   */
  cacheUrl(imageKey: string, url: string): void {
    // 如果缓存已满，清理最久未使用的项
    if (this.cache.size >= this.maxCacheSize) {
      this.cleanup()
    }

    this.cache.set(imageKey, {
      url,
      timestamp: Date.now(),
      accessCount: 1
    })
  }

  /**
   * 预加载图片
   */
  async preloadImage(imageKey: string, proxyUrlGetter: (key: string) => string): Promise<boolean> {
    // 检查是否已缓存
    if (this.getCachedUrl(imageKey)) {
      return true
    }

    try {
      const proxyUrl = proxyUrlGetter(imageKey)
      return new Promise<boolean>((resolve) => {
        const img = new Image()

        const cleanup = () => {
          img.onload = null
          img.onerror = null
        }

        img.onload = () => {
          cleanup()
          // 预加载成功，缓存URL
          this.cacheUrl(imageKey, proxyUrl)
          resolve(true)
        }

        img.onerror = () => {
          cleanup()
          resolve(false)
        }

        // 设置超时（5秒）
        setTimeout(() => {
          cleanup()
          resolve(false)
        }, 5000)

        img.src = proxyUrl
      })
    } catch (error) {
      console.error('[ImageCache] 预加载失败:', error)
      return false
    }
  }

  /**
   * 批量预加载图片
   */
  async preloadImages(
    imageKeys: string[],
    proxyUrlGetter: (key: string) => string,
    concurrent: number = 3
  ): Promise<number> {
    let loadedCount = 0
    const total = imageKeys.length

    // 分批并发预加载
    for (let i = 0; i < total; i += concurrent) {
      const batch = imageKeys.slice(i, i + concurrent)
      const results = await Promise.allSettled(
        batch.map(key => this.preloadImage(key, proxyUrlGetter))
      )

      loadedCount += results.filter(r => r.status === 'fulfilled' && r.value).length
    }

    return loadedCount
  }

  /**
   * 清理过期的缓存
   */
  private cleanup(): void {
    const now = Date.now()
    const entries = Array.from(this.cache.entries())

    // 按访问时间和访问次数排序
    entries.sort((a, b) => {
      const [keyA, entryA] = a
      const [keyB, entryB] = b

      // 优先删除过期的
      const expiredA = now - entryA.timestamp > this.cacheTimeout
      const expiredB = now - entryB.timestamp > this.cacheTimeout
      if (expiredA && !expiredB) return -1
      if (!expiredA && expiredB) return 1

      // 然后按访问次数和最后访问时间排序
      if (entryA.accessCount !== entryB.accessCount) {
        return entryA.accessCount - entryB.accessCount
      }
      return entryA.timestamp - entryB.timestamp
    })

    // 删除最不重要的 25% 缓存项
    const toDelete = Math.floor(this.maxCacheSize * 0.25)
    for (let i = 0; i < toDelete && i < entries.length; i++) {
      this.cache.delete(entries[i][0])
    }
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear()
    this.preloadCache.clear()
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): { size: number; entries: Array<{ key: string; url: string; accessCount: number; age: number }> } {
    const now = Date.now()
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      url: entry.url,
      accessCount: entry.accessCount,
      age: now - entry.timestamp
    }))

    return {
      size: this.cache.size,
      entries
    }
  }

  /**
   * 检查缓存是否包含指定key
   */
  has(imageKey: string): boolean {
    return this.cache.has(imageKey)
  }

  /**
   * 删除指定缓存
   */
  delete(imageKey: string): boolean {
    return this.cache.delete(imageKey)
  }
}

// 导出单例
export const imageCacheService = new ImageCacheService()

// 也导出类，便于测试
export { ImageCacheService }
