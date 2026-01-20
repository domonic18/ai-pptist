/**
 * 自动保存存储工具
 * 使用 LocalStorage + IndexedDB 混合存储
 */

import Dexie, { type Table } from 'dexie'
import type {
  AutoSaveData,
  AutoSaveMetadata,
  AutoSaveConfig,
} from '@/types/autoSave'

/**
 * 自动保存数据库类
 */
class AutoSaveDatabase extends Dexie {
  autoSaves!: Table<AutoSaveData>

  constructor(databaseName: string) {
    super(databaseName)
    this.version(1).stores({
      autoSaves: 'id, timestamp',
    })
  }
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG: AutoSaveConfig = {
  storageKey: 'PPTIST_AUTOSAVE',
  databaseName: 'PPTist_AutoSave',
  storeName: 'autoSaves',
  maxVersions: 2, // 保留最新2个版本（当前版本和上一个版本作为备份）
  saveInterval: 30000, // 30秒
  debounceDelay: 5000, // 5秒
  maxSize: 10 * 1024 * 1024, // 10MB
  currentVersion: 1,
}

/**
 * 自动保存存储类
 */
export class AutoSaveStorage {
  private config: AutoSaveConfig
  private db: AutoSaveDatabase

  constructor(config: Partial<AutoSaveConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.db = new AutoSaveDatabase(this.config.databaseName)
  }

  /**
   * 获取 LocalStorage key
   */
  private getStorageKey(): string {
    return this.config.storageKey
  }

  /**
   * 估算数据大小（字节）
   */
  private estimateSize(data: any): number {
    return new Blob([JSON.stringify(data)]).size
  }

  /**
   * 保存数据
   */
  async save(data: AutoSaveData): Promise<boolean> {
    try {
      // 深度克隆数据以移除任何不可序列化的属性
      const clonedData = JSON.parse(JSON.stringify(data))

      // 检查数据大小
      const size = this.estimateSize(clonedData)
      if (size > this.config.maxSize) {
        console.warn('[AutoSave] 数据过大，跳过保存', { size, maxSize: this.config.maxSize })
        return false
      }

      // 保存到 IndexedDB
      await this.db.autoSaves.put(clonedData)

      // 清理旧版本
      await this.cleanupOldVersions()

      // 更新元数据
      const metadata: AutoSaveMetadata = {
        saveId: data.id,
        lastSavedTime: data.timestamp,
        slidesCount: data.slidesStore.slides.length,
        title: data.slidesStore.title,
        currentSlideIndex: data.slidesStore.slideIndex,
        version: this.config.currentVersion,
      }
      localStorage.setItem(this.getStorageKey(), JSON.stringify(metadata))

      console.log('[AutoSave] 保存成功', { saveId: data.id, size })
      return true
    } catch (error) {
      console.error('[AutoSave] 保存失败', error)
      return false
    }
  }

  /**
   * 加载最新数据
   */
  async load(): Promise<AutoSaveData | null> {
    try {
      // 读取元数据
      const metadataStr = localStorage.getItem(this.getStorageKey())
      if (!metadataStr) {
        return null
      }

      const metadata: AutoSaveMetadata = JSON.parse(metadataStr)

      // 检查版本兼容性
      if (metadata.version !== this.config.currentVersion) {
        console.warn('[AutoSave] 版本不兼容', {
          metadataVersion: metadata.version,
          currentVersion: this.config.currentVersion,
        })
        return null
      }

      // 从 IndexedDB 加载完整数据
      const data = await this.db.autoSaves.get(metadata.saveId)
      if (!data) {
        console.warn('[AutoSave] 数据不存在', { saveId: metadata.saveId })
        return null
      }

      console.log('[AutoSave] 加载成功', { saveId: data.id })
      return data
    } catch (error) {
      console.error('[AutoSave] 加载失败', error)
      return null
    }
  }

  /**
   * 清理旧版本（保留最新的 N 个版本）
   */
  private async cleanupOldVersions(): Promise<void> {
    try {
      const allSaves = await this.db.autoSaves
        .orderBy('timestamp')
        .reverse()
        .toArray()

      if (allSaves.length <= this.config.maxVersions) {
        return
      }

      // 删除最旧的版本
      const toDelete = allSaves.slice(this.config.maxVersions)
      const idsToDelete = toDelete.map((s) => s.id)

      await this.db.autoSaves.bulkDelete(idsToDelete)
      console.log('[AutoSave] 清理旧版本', { deleted: idsToDelete.length })
    } catch (error) {
      console.error('[AutoSave] 清理失败', error)
    }
  }

  /**
   * 清除所有数据
   */
  async clear(): Promise<void> {
    try {
      // 清除 IndexedDB
      await this.db.autoSaves.clear()

      // 清除 LocalStorage
      localStorage.removeItem(this.getStorageKey())

      console.log('[AutoSave] 清除成功')
    } catch (error) {
      console.error('[AutoSave] 清除失败', error)
    }
  }

  /**
   * 检查是否有可恢复的数据
   */
  async hasData(): Promise<boolean> {
    try {
      const metadataStr = localStorage.getItem(this.getStorageKey())
      if (!metadataStr) {
        return false
      }

      const metadata: AutoSaveMetadata = JSON.parse(metadataStr)

      // 检查数据是否过期（24小时）
      const EXPIRY_TIME = 24 * 60 * 60 * 1000
      const isExpired = Date.now() - metadata.lastSavedTime > EXPIRY_TIME

      if (isExpired) {
        // 清除过期数据
        await this.clear()
        return false
      }

      // 验证 IndexedDB 中是否存在
      const data = await this.db.autoSaves.get(metadata.saveId)
      return !!data
    } catch (error) {
      console.error('[AutoSave] 检查数据失败', error)
      return false
    }
  }

  /**
   * 获取元数据
   */
  getMetadata(): AutoSaveMetadata | null {
    try {
      const metadataStr = localStorage.getItem(this.getStorageKey())
      return metadataStr ? (JSON.parse(metadataStr) as AutoSaveMetadata) : null
    } catch (error) {
      console.error('[AutoSave] 获取元数据失败', error)
      return null
    }
  }

  /**
   * 格式化保存时间
   */
  formatTimestamp(timestamp: number): string {
    const now = Date.now()
    const diff = now - timestamp

    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)

    if (minutes < 1) {
      return '刚刚'
    } else if (minutes < 60) {
      return `${minutes} 分钟前`
    } else if (hours < 24) {
      return `${hours} 小时前`
    } else {
      const date = new Date(timestamp)
      return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
    }
  }
}

/**
 * 导出单例实例
 */
export const autoSaveStorage = new AutoSaveStorage()

/**
 * 导出默认配置（用于其他模块）
 */
export { DEFAULT_CONFIG }
