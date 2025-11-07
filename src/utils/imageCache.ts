/**
 * 前端图片缓存管理
 * 使用IndexedDB实现本地图片缓存，提升加载性能
 */

import { ElMessage } from 'element-plus'

// 缓存项接口
export interface CacheItem {
  id: string                    // 缓存ID（通常是imageKey）
  url: string                   // 图片URL
  blob: Blob                    // 图片数据
  type: string                  // MIME类型
  size: number                  // 文件大小
  createdAt: number             // 创建时间
  lastAccessed: number          // 最后访问时间
  accessCount: number           // 访问次数
  expiresAt: number             // 过期时间
  metadata?: any                // 额外元数据
}

// 缓存配置
export interface CacheConfig {
  maxSize: number               // 最大缓存大小（MB）
  maxItems: number              // 最大缓存项数
  defaultTTL: number            // 默认过期时间（毫秒）
  cleanupInterval: number       // 清理间隔（毫秒）
  enableLRU: boolean            // 启用LRU淘汰
  enableTTL: boolean            // 启用TTL过期
}

// 默认配置
const DEFAULT_CONFIG: CacheConfig = {
  maxSize: 50,                  // 50MB
  maxItems: 1000,               // 1000张图片
  defaultTTL: 3600000,          // 1小时
  cleanupInterval: 300000,      // 5分钟
  enableLRU: true,
  enableTTL: true
}

// 缓存统计
export interface CacheStats {
  totalItems: number
  totalSize: number
  hitCount: number
  missCount: number
  hitRate: number
  expiredItems: number
}

// 图片缓存管理类
export class ImageCache {
  private dbName = 'SmartImageCache'
  private dbVersion = 1
  private storeName = 'images'
  private db: IDBDatabase | null = null
  private config: CacheConfig
  private hitCount = 0
  private missCount = 0
  private cleanupTimer: number | null = null

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * 初始化缓存
   */
  async init(): Promise<void> {
    try {
      this.db = await this.openDB()
      this.startCleanupTimer()
      console.log('图片缓存初始化成功')
    } catch (error) {
      console.error('图片缓存初始化失败:', error)
      throw error
    }
  }

  /**
   * 关闭缓存
   */
  async close(): Promise<void> {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
    if (this.db) {
      this.db.close()
      this.db = null
    }
  }

  /**
   * 打开IndexedDB
   */
  private openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // 创建对象存储
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' })
          // 创建索引
          store.createIndex('lastAccessed', 'lastAccessed', { unique: false })
          store.createIndex('expiresAt', 'expiresAt', { unique: false })
          store.createIndex('createdAt', 'createdAt', { unique: false })
        }
      }
    })
  }

  /**
   * 存储图片
   */
  async set(
    id: string,
    url: string,
    blob: Blob,
    ttl?: number,
    metadata?: any
  ): Promise<boolean> {
    if (!this.db) {
      throw new Error('缓存未初始化')
    }

    try {
      // 检查缓存大小
      if (await this.isCacheFull()) {
        await this.evictLRU()
      }

      const now = Date.now()
      const expiresAt = ttl ? now + ttl : (this.config.enableTTL ? now + this.config.defaultTTL : 0)

      const item: CacheItem = {
        id,
        url,
        blob,
        type: blob.type,
        size: blob.size,
        createdAt: now,
        lastAccessed: now,
        accessCount: 0,
        expiresAt,
        metadata
      }

      await this.putItem(item)
      return true
    } catch (error) {
      console.error('存储图片缓存失败:', error)
      return false
    }
  }

  /**
   * 获取图片
   */
  async get(id: string): Promise<CacheItem | null> {
    if (!this.db) {
      throw new Error('缓存未初始化')
    }

    try {
      const item = await this.getItem(id)

      if (!item) {
        this.missCount++
        return null
      }

      // 检查是否过期
      if (this.config.enableTTL && item.expiresAt > 0 && Date.now() > item.expiresAt) {
        await this.delete(id)
        this.missCount++
        return null
      }

      // 更新访问信息
      item.lastAccessed = Date.now()
      item.accessCount++
      await this.putItem(item)

      this.hitCount++
      return item
    } catch (error) {
      console.error('获取图片缓存失败:', error)
      this.missCount++
      return null
    }
  }

  /**
   * 删除缓存项
   */
  async delete(id: string): Promise<boolean> {
    if (!this.db) {
      throw new Error('缓存未初始化')
    }

    try {
      await this.deleteItem(id)
      return true
    } catch (error) {
      console.error('删除图片缓存失败:', error)
      return false
    }
  }

  /**
   * 清空所有缓存
   */
  async clear(): Promise<boolean> {
    if (!this.db) {
      throw new Error('缓存未初始化')
    }

    try {
      const store = this.db.transaction(this.storeName, 'readwrite').objectStore(this.storeName)
      await this.requestToPromise(store.clear())
      this.hitCount = 0
      this.missCount = 0
      return true
    } catch (error) {
      console.error('清空图片缓存失败:', error)
      return false
    }
  }

  /**
   * 获取缓存统计
   */
  async getStats(): Promise<CacheStats> {
    if (!this.db) {
      return {
        totalItems: 0,
        totalSize: 0,
        hitCount: 0,
        missCount: 0,
        hitRate: 0,
        expiredItems: 0
      }
    }

    try {
      const store = this.db.transaction(this.storeName, 'readonly').objectStore(this.storeName)
      const items = await this.getAllItems(store)

      const totalItems = items.length
      const totalSize = items.reduce((sum, item) => sum + item.size, 0)
      const expiredItems = this.config.enableTTL
        ? items.filter(item => item.expiresAt > 0 && Date.now() > item.expiresAt).length
        : 0

      const totalRequests = this.hitCount + this.missCount
      const hitRate = totalRequests > 0 ? (this.hitCount / totalRequests) * 100 : 0

      return {
        totalItems,
        totalSize,
        hitCount: this.hitCount,
        missCount: this.missCount,
        hitRate: Math.round(hitRate * 100) / 100,
        expiredItems
      }
    } catch (error) {
      console.error('获取缓存统计失败:', error)
      return {
        totalItems: 0,
        totalSize: 0,
        hitCount: 0,
        missCount: 0,
        hitRate: 0,
        expiredItems: 0
      }
    }
  }

  /**
   * 预加载图片
   */
  async preload(url: string, id?: string, ttl?: number): Promise<boolean> {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const blob = await response.blob()
      const cacheId = id || url

      return await this.set(cacheId, url, blob, ttl)
    } catch (error) {
      console.error('预加载图片失败:', error)
      return false
    }
  }

  /**
   * 批量预加载
   */
  async batchPreload(
    urls: string[],
    ttl?: number,
    onProgress?: (completed: number, total: number) => void
  ): Promise<{ success: number; failed: number }> {
    let success = 0
    let failed = 0

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i]
      const result = await this.preload(url, undefined, ttl)
      if (result) {
        success++
      } else {
        failed++
      }

      if (onProgress) {
        onProgress(i + 1, urls.length)
      }
    }

    return { success, failed }
  }

  /**
   * 清理过期缓存
   */
  async cleanup(): Promise<number> {
    if (!this.db || !this.config.enableTTL) {
      return 0
    }

    try {
      const store = this.db.transaction(this.storeName, 'readwrite').objectStore(this.storeName)
      const items = await this.getAllItems(store)

      const now = Date.now()
      const expiredItems = items.filter(item => item.expiresAt > 0 && now > item.expiresAt)

      for (const item of expiredItems) {
        await this.requestToPromise(store.delete(item.id))
      }

      return expiredItems.length
    } catch (error) {
      console.error('清理过期缓存失败:', error)
      return 0
    }
  }

  /**
   * 检查缓存是否已满
   */
  private async isCacheFull(): Promise<boolean> {
    if (!this.db) {
      return false
    }

    const stats = await this.getStats()
    return stats.totalSize >= this.config.maxSize * 1024 * 1024 ||
           stats.totalItems >= this.config.maxItems
  }

  /**
   * 淘汰最少使用的缓存项
   */
  private async evictLRU(): Promise<void> {
    if (!this.db || !this.config.enableLRU) {
      return
    }

    try {
      const store = this.db.transaction(this.storeName, 'readwrite').objectStore(this.storeName)
      const index = store.index('lastAccessed')
      const items = await this.getAllItemsFromIndex(index)

      // 按最后访问时间排序
      items.sort((a, b) => a.lastAccessed - b.lastAccessed)

      // 淘汰10%或至少1个
      const evictCount = Math.max(1, Math.floor(items.length * 0.1))

      for (let i = 0; i < evictCount; i++) {
        await this.requestToPromise(store.delete(items[i].id))
      }
    } catch (error) {
      console.error('LRU淘汰失败:', error)
    }
  }

  /**
   * 启动清理定时器
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
    }

    this.cleanupTimer = setInterval(async () => {
      try {
        const cleaned = await this.cleanup()
        if (cleaned > 0) {
          console.log(`清理了 ${cleaned} 个过期缓存项`)
        }
      } catch (error) {
        console.error('定时清理失败:', error)
      }
    }, this.config.cleanupInterval)
  }

  /**
   * 存储缓存项
   */
  private async putItem(item: CacheItem): Promise<void> {
    if (!this.db) {
      throw new Error('缓存未初始化')
    }

    const transaction = this.db.transaction(this.storeName, 'readwrite')
    const store = transaction.objectStore(this.storeName)
    await this.requestToPromise(store.put(item))
  }

  /**
   * 获取缓存项
   */
  private async getItem(id: string): Promise<CacheItem | null> {
    if (!this.db) {
      throw new Error('缓存未初始化')
    }

    const store = this.db.transaction(this.storeName, 'readonly').objectStore(this.storeName)
    const item = await this.requestToPromise(store.get(id)) as CacheItem | undefined
    return item || null
  }

  /**
   * 删除缓存项
   */
  private async deleteItem(id: string): Promise<void> {
    if (!this.db) {
      throw new Error('缓存未初始化')
    }

    const store = this.db.transaction(this.storeName, 'readwrite').objectStore(this.storeName)
    await this.requestToPromise(store.delete(id))
  }

  /**
   * 获取所有缓存项
   */
  private async getAllItems(store: IDBObjectStore): Promise<CacheItem[]> {
    return await this.requestToPromise(store.getAll()) as CacheItem[]
  }

  /**
   * 从索引获取所有缓存项
   */
  private async getAllItemsFromIndex(index: IDBIndex): Promise<CacheItem[]> {
    return await this.requestToPromise(index.getAll()) as CacheItem[]
  }

  /**
   * 将IndexedDB请求转换为Promise
   */
  private requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }
}

// 全局缓存实例
export const imageCache = new ImageCache()

// 自动初始化
if (typeof window !== 'undefined') {
  imageCache.init().catch(error => {
    console.error('自动初始化图片缓存失败:', error)
  })
}
