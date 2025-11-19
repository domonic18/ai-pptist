/**
 * 自动标注功能组合式函数
 *
 * 提供标注任务的启动、进度查询、结果获取等功能。
 *
 * 重要改进（2025-11-18）：
 * - 截图机制已重新设计，使用现有缩略图进行截图
 * - 避免动态创建 Vue 应用带来的 store 依赖问题
 * - 每页幻灯片独立生成截图
 * - 修复了截图为0字节的问题
 */

import { ref, reactive, computed, readonly } from 'vue'
import { ElMessage } from 'element-plus'
import { storeToRefs } from 'pinia'
import { API_CONFIG } from '@/configs/api'
import { useSlidesStore } from '@/store'
import type { AnnotationConfig, AnnotationResults } from './annotation/types'

/**
 * 自动标注功能组合式函数
 * 提供标注任务的启动、进度查询、结果获取等功能
 */
export function useAnnotation() {
  // 状态管理
  const taskId = ref<string>('')
  const isProcessing = ref(false)
  const isCompleted = ref(false)
  const progress = reactive({
    percentage: 0,
    currentPage: 0,
    totalPages: 0,
    estimatedRemainingTime: 0,
    status: 'pending' as 'pending' | 'processing' | 'completed' | 'error'
  })

  const results = ref<AnnotationResults | null>(null)
  const error = ref<string>('')

  // 计算属性
  const hasActiveTask = computed(() => isProcessing.value || isCompleted.value)
  const canStartAnnotation = computed(() => !isProcessing.value && !isCompleted.value)

  /**
   * 启动自动标注任务
   */
  const startAnnotation = async (
    slides: any[],
    config: AnnotationConfig,
    screenshots?: string[]
  ): Promise<boolean> => {
    // 获取视口比例
    const slidesStore = useSlidesStore()
    const { viewportRatio } = storeToRefs(slidesStore)
    if (isProcessing.value) {
      ElMessage.warning('已有标注任务正在进行中')
      return false
    }

    if (!screenshots || screenshots.length !== slides.length) {
      console.error('截图数据缺失或数量不匹配', { 
        slidesCount: slides.length, 
        screenshotsCount: screenshots?.length 
      })
      ElMessage.error('截图数据缺失，无法启动标注任务')
      return false
    }

    try {
      isProcessing.value = true
      progress.status = 'processing'
      error.value = ''

      console.log('开始自动标注，幻灯片数量:', slides?.length)
      console.log('模型配置:', config)
      
      // 检查截图数据的有效性
      const validScreenshots = screenshots.filter(s => s && s.length > 1000)
      console.log(`有效截图数量: ${validScreenshots.length}/${screenshots.length}`)

      // 准备请求数据
      // 每页幻灯片独立的截图（由调用方传入）
      const requestData = {
        slides: slides.map((slide, index) => ({
          slide_id: slide.id || slide.slideId || `slide-${index}`,
          screenshot: screenshots[index] || '', 
          elements: slide.elements || [],
          index: slide.index || index
        })),
        model_config: {
          model_id: config.modelId,
          multimodal_enabled: true
        },
        extraction_config: {
          screenshot_quality: 'high',
          include_element_data: true
        }
      }

      console.log('发送标注请求到:', API_CONFIG.ANNOTATION.START)
      console.log('请求数据包含的幻灯片数量:', requestData.slides.length)
      console.log('截图数据有效性检查:', requestData.slides.map((s, i) => ({
        slide_id: s.slide_id,
        hasScreenshot: !!s.screenshot,
        screenshotLength: s.screenshot?.length || 0,
        isValid: s.screenshot && s.screenshot.length > 1000
      })))

      // 调用API
      const response = await fetch(API_CONFIG.ANNOTATION.START, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      })

      console.log('API响应状态:', response.status)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log('API响应数据:', result)

      if (result.status === 'success' && result.data) {
        taskId.value = result.data.task_id
        progress.totalPages = result.data.total_pages

        ElMessage.success('标注任务已启动')

        // 开始轮询进度
        startProgressPolling()
        return true
      } else {
        throw new Error(result.message || '启动标注任务失败')
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '启动标注任务失败'
      ElMessage.error(error.value)
      isProcessing.value = false
      progress.status = 'error'
      return false
    }
  }

  /**
   * 开始轮询进度
   */
  const startProgressPolling = () => {
    const pollInterval = setInterval(async () => {
      if (!taskId.value || !isProcessing.value) {
        clearInterval(pollInterval)
        return
      }

      try {
        await fetchProgress()
      } catch (err) {
        console.error('进度查询失败:', err)
      }
    }, 2000) // 每2秒查询一次进度
  }

  /**
   * 获取标注进度
   */
  const fetchProgress = async (): Promise<void> => {
    if (!taskId.value) return

    try {
      const response = await fetch(API_CONFIG.ANNOTATION.PROGRESS(taskId.value))

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.status === 'success' && result.data) {
        const progressData = result.data

        progress.percentage = progressData.progress.percentage || 0
        progress.currentPage = progressData.current_page || 0
        progress.totalPages = progressData.progress.total || progress.totalPages
        progress.estimatedRemainingTime = progressData.estimated_remaining_time || 0

        // 检查任务是否完成
        if (progressData.status === 'completed') {
          isProcessing.value = false
          isCompleted.value = true
          progress.status = 'completed'

          // 获取最终结果
          await fetchResults()
        } else if (progressData.status === 'error') {
          isProcessing.value = false
          progress.status = 'error'
          error.value = '标注任务执行失败'
          ElMessage.error(error.value)
        }
      }
    } catch (err) {
      console.error('获取进度失败:', err)
    }
  }

  /**
   * 获取标注结果
   */
  const fetchResults = async (): Promise<AnnotationResults | null> => {
    if (!taskId.value) return null

    try {
      const response = await fetch(API_CONFIG.ANNOTATION.RESULTS(taskId.value))

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.status === 'success' && result.data) {
        results.value = {
          taskId: taskId.value,
          results: result.data.results || [],
          statistics: result.data.statistics || {
            total_pages: 0,
            successful_pages: 0,
            failed_pages: 0,
            average_confidence: 0
          }
        }

        ElMessage.success('标注结果获取成功')
        return results.value
      } else {
        throw new Error(result.message || '获取标注结果失败')
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取标注结果失败'
      ElMessage.error(error.value)
      return null
    }
  }

  /**
   * 提交用户修正
   */
  const submitCorrections = async (
    corrections: Array<{
      slide_id: string
      element_id: string
      corrected_type: string
      reason?: string
    }>
  ): Promise<boolean> => {
    if (!taskId.value) {
      ElMessage.warning('没有可用的标注任务')
      return false
    }

    try {
      const requestData = {
        task_id: taskId.value,
        corrections
      }

      const response = await fetch(API_CONFIG.ANNOTATION.CORRECTIONS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.status === 'success') {
        ElMessage.success('用户修正已提交')
        return true
      } else {
        throw new Error(result.message || '提交修正失败')
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '提交修正失败'
      ElMessage.error(error.value)
      return false
    }
  }

  /**
   * 取消标注任务
   */
  const cancelAnnotation = async (): Promise<boolean> => {
    if (!isProcessing.value) {
      ElMessage.warning('没有正在进行的标注任务')
      return false
    }

    try {
      // 这里需要实现取消标注任务的API
      // 暂时模拟取消操作
      isProcessing.value = false
      progress.status = 'error'
      error.value = '用户取消标注任务'

      ElMessage.info('标注任务已取消')
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : '取消标注任务失败'
      ElMessage.error(error.value)
      return false
    }
  }

  /**
   * 重置状态
   */
  const reset = () => {
    taskId.value = ''
    isProcessing.value = false
    isCompleted.value = false
    progress.percentage = 0
    progress.currentPage = 0
    progress.totalPages = 0
    progress.estimatedRemainingTime = 0
    progress.status = 'pending'
    results.value = null
    error.value = ''
  }

  /**
   * 手动触发进度查询
   */
  const refreshProgress = async (): Promise<void> => {
    if (taskId.value && isProcessing.value) {
      await fetchProgress()
    }
  }

  /**
   * 手动触发结果查询
   */
  const refreshResults = async (): Promise<AnnotationResults | null> => {
    if (taskId.value && isCompleted.value) {
      return await fetchResults()
    }
    return null
  }

  // 计算属性 - 用于模板中直接使用
  const taskIdValue = computed(() => taskId.value)
  const isProcessingValue = computed(() => isProcessing.value)
  const isCompletedValue = computed(() => isCompleted.value)
  const resultsValue = computed(() => results.value)
  const errorValue = computed(() => error.value)

  return {
    // 状态（原始ref，用于在脚本中使用）
    taskId,
    isProcessing,
    isCompleted,
    progress: readonly(progress),
    results,
    error,

    // 状态（计算属性，用于模板中使用）
    taskIdValue,
    isProcessingValue,
    isCompletedValue,
    resultsValue,
    errorValue,

    // 计算属性
    hasActiveTask,
    canStartAnnotation,

    // 方法
    startAnnotation,
    fetchProgress,
    fetchResults,
    submitCorrections,
    cancelAnnotation,
    reset,
    refreshProgress,
    refreshResults
  }
}

// 导出类型定义
export type * from './annotation/types'