/**
 * 自动保存类型定义
 */

/**
 * 自动保存元数据（存储在 LocalStorage）
 */
export interface AutoSaveMetadata {
  /** 保存的唯一标识 */
  saveId: string
  /** 最后保存时间戳 */
  lastSavedTime: number
  /** 幻灯片数量 */
  slidesCount: number
  /** 演示文稿标题 */
  title: string
  /** 当前页面索引 */
  currentSlideIndex: number
  /** 数据版本（用于兼容性检查） */
  version: number
}

/**
 * 自动保存完整数据（存储在 IndexedDB）
 */
export interface AutoSaveData {
  /** 保存ID */
  id: string
  /** 保存时间戳 */
  timestamp: number
  /** 幻灯片存储状态 */
  slidesStore: {
    /** 所有幻灯片 */
    slides: any[]
    /** 当前页面索引 */
    slideIndex: number
    /** 主题配置 */
    theme: any
    /** 演示文稿标题 */
    title: string
  }
  /** 主编辑器状态（可选） */
  mainStore?: {
    /** 选中的幻灯片索引 */
    selectedSlidesIndex: number[]
    /** 画布缩放比例 */
    canvasScale: number
    /** 画布缩放百分比 */
    canvasPercentage: number
  }
}

/**
 * 自动保存配置
 */
export interface AutoSaveConfig {
  /** LocalStorage key */
  storageKey: string
  /** IndexedDB 数据库名 */
  databaseName: string
  /** IndexedDB 表名 */
  storeName: string
  /** 最大保存版本数 */
  maxVersions: number
  /** 自动保存间隔（毫秒） */
  saveInterval: number
  /** 操作后延迟保存时间（毫秒） */
  debounceDelay: number
  /** 单个数据最大大小（字节） */
  maxSize: number
  /** 当前数据版本 */
  currentVersion: number
}

/**
 * 恢复选项
 */
export interface RestoreOptions {
  /** 是否清除恢复后的数据 */
  clearAfterRestore: boolean
  /** 是否显示确认对话框 */
  showConfirm: boolean
}

/**
 * 保存状态
 */
export enum AutoSaveStatus {
  /** 空闲 */
  IDLE = 'idle',
  /** 正在保存 */
  SAVING = 'saving',
  /** 已保存 */
  SAVED = 'saved',
  /** 保存失败 */
  ERROR = 'error',
}
