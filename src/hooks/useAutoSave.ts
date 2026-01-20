/**
 * 自动保存 Hook
 * 提供自动保存和恢复功能
 */

import { ref, watch, onMounted, onUnmounted, provide, inject, type Ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useSlidesStore, useMainStore } from '@/store'
import { autoSaveStorage } from '@/utils/autoSaveStorage'
import type { AutoSaveData } from '@/types/autoSave'
import { AutoSaveStatus } from '@/types/autoSave'
import { debounce } from 'lodash'

/**
 * 自动保存状态的 Injection Key
 */
export const AUTO_SAVE_KEY = Symbol('autoSave')

/**
 * 使用自动保存（提供者）
 * @param options 配置选项
 * @returns 自动保存状态和方法
 */
export function useAutoSave(options: {
  /** 是否启用自动保存 */
  enabled?: boolean
  /** 保存间隔（毫秒），默认 30000 (30秒) */
  interval?: number
  /** 操作后延迟保存时间（毫秒），默认 5000 (5秒) */
  debounceDelay?: number
}) {
  const {
    enabled = true,
    interval = 30000,
    debounceDelay = 5000,
  } = options

  const slidesStore = useSlidesStore()
  const mainStore = useMainStore()

  // 状态
  const saveStatus = ref<AutoSaveStatus>(AutoSaveStatus.IDLE)
  const lastSavedTime = ref<number | null>(null)
  const canRestore = ref(false)

  // 定时器
  let saveTimer: number | null = null
  let intervalTimer: number | null = null

  /**
   * 收集当前状态数据
   */
  const collectData = (): AutoSaveData => {
    // 生成保存ID
    const saveId = `autosave_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`

    // 使用 JSON 序列化/反序列化来移除不可克隆的属性
    const slidesClone = JSON.parse(JSON.stringify(slidesStore.slides))
    const themeClone = JSON.parse(JSON.stringify(slidesStore.theme))

    return {
      id: saveId,
      timestamp: Date.now(),
      slidesStore: {
        slides: slidesClone,
        slideIndex: slidesStore.slideIndex,
        theme: themeClone,
        title: slidesStore.title,
      },
      mainStore: {
        selectedSlidesIndex: [...mainStore.selectedSlidesIndex],
        canvasScale: mainStore.canvasScale,
        canvasPercentage: mainStore.canvasPercentage,
      },
    }
  }

  /**
   * 保存数据
   */
  const save = async (): Promise<boolean> => {
    if (!enabled) {
      return false
    }

    try {
      saveStatus.value = AutoSaveStatus.SAVING

      const data = collectData()
      const success = await autoSaveStorage.save(data)

      if (success) {
        saveStatus.value = AutoSaveStatus.SAVED
        lastSavedTime.value = Date.now()
      } else {
        saveStatus.value = AutoSaveStatus.ERROR
      }

      return success
    } catch (error) {
      console.error('[AutoSave] 保存失败', error)
      saveStatus.value = AutoSaveStatus.ERROR
      return false
    }
  }

  /**
   * 防抖保存
   */
  const debouncedSave = debounce(save, debounceDelay)

  /**
   * 触发保存（使用防抖）
   */
  const triggerSave = () => {
    if (enabled) {
      debouncedSave()
    }
  }

  /**
   * 立即保存（不使用防抖）
   */
  const saveImmediately = async () => {
    if (saveTimer) {
      clearTimeout(saveTimer)
      saveTimer = null
    }
    return await save()
  }

  /**
   * 恢复数据
   */
  const restore = async (): Promise<boolean> => {
    try {
      const data = await autoSaveStorage.load()
      if (!data) {
        return false
      }

      // 恢复 slidesStore
      slidesStore.setSlides(data.slidesStore.slides)
      if (data.slidesStore.slideIndex !== undefined) {
        slidesStore.slideIndex = data.slidesStore.slideIndex
      }
      if (data.slidesStore.theme) {
        slidesStore.theme = data.slidesStore.theme
      }
      if (data.slidesStore.title) {
        slidesStore.title = data.slidesStore.title
      }

      // 恢复 mainStore
      if (data.mainStore) {
        if (data.mainStore.selectedSlidesIndex) {
          mainStore.selectedSlidesIndex = data.mainStore.selectedSlidesIndex
        }
        if (data.mainStore.canvasScale !== undefined) {
          mainStore.canvasScale = data.mainStore.canvasScale
        }
        if (data.mainStore.canvasPercentage !== undefined) {
          mainStore.canvasPercentage = data.mainStore.canvasPercentage
        }
      }

      canRestore.value = false
      console.log('[AutoSave] 恢复成功')
      return true
    } catch (error) {
      console.error('[AutoSave] 恢复失败', error)
      return false
    }
  }

  /**
   * 清除保存的数据
   */
  const clear = async () => {
    await autoSaveStorage.clear()
    canRestore.value = false
    lastSavedTime.value = null
  }

  /**
   * 检查是否可恢复
   */
  const checkCanRestore = async () => {
    canRestore.value = await autoSaveStorage.hasData()
  }

  /**
   * 获取保存时间文本
   */
  const getSavedTimeText = (): string => {
    if (!lastSavedTime.value) {
      return '未保存'
    }
    return autoSaveStorage.formatTimestamp(lastSavedTime.value)
  }

  /**
   * 启动自动保存
   */
  const startAutoSave = () => {
    if (!enabled) {
      return
    }

    // 定时保存
    if (interval > 0) {
      intervalTimer = window.setInterval(() => {
        save()
      }, interval)
    }

    // 监听 slidesStore 变化
    const { slides, slideIndex, theme, title } = storeToRefs(slidesStore)

    watch(
      [slides, slideIndex, theme, title],
      () => {
        triggerSave()
      },
      { deep: true },
    )

    // 监听 mainStore 部分状态变化
    const { selectedSlidesIndex, canvasScale } = storeToRefs(mainStore)

    watch(
      [selectedSlidesIndex, canvasScale],
      () => {
        triggerSave()
      },
      { deep: true },
    )

    console.log('[AutoSave] 自动保存已启动')
  }

  /**
   * 停止自动保存
   */
  const stopAutoSave = () => {
    if (intervalTimer) {
      clearInterval(intervalTimer)
      intervalTimer = null
    }

    if (saveTimer) {
      clearTimeout(saveTimer)
      saveTimer = null
    }

    console.log('[AutoSave] 自动保存已停止')
  }

  // 页面卸载前保存
  const handleBeforeUnload = () => {
    saveImmediately()
  }

  // 生命周期
  onMounted(() => {
    // 只启动自动保存，不自动检查恢复（由组件控制）
    startAutoSave()

    // 监听页面卸载
    window.addEventListener('beforeunload', handleBeforeUnload)
  })

  onUnmounted(() => {
    stopAutoSave()
    window.removeEventListener('beforeunload', handleBeforeUnload)
  })

  // 提供给子组件
  provide(AUTO_SAVE_KEY, {
    saveStatus,
    lastSavedTime,
    canRestore,
  })

  return {
    // 状态
    saveStatus,
    lastSavedTime,
    canRestore,

    // 方法
    save,
    saveImmediately,
    triggerSave,
    restore,
    clear,
    checkCanRestore,
    getSavedTimeText,
  }
}

/**
 * 自动保存状态接口
 */
export interface AutoSaveState {
  saveStatus: Ref<AutoSaveStatus>
  lastSavedTime: Ref<number | null>
  canRestore: Ref<boolean>
}

/**
 * 使用自动保存状态（消费者）
 * @returns 自动保存状态
 */
export function useAutoSaveState() {
  const autoSave = inject(AUTO_SAVE_KEY) || {
    saveStatus: ref(AutoSaveStatus.IDLE),
    lastSavedTime: ref<number | null>(null),
    canRestore: ref(false),
  }

  return autoSave as AutoSaveState
}
