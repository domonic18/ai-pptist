/**
 * 幻灯片优化Hook
 * 处理幻灯片的AI优化逻辑，包括API调用、数据处理和错误处理
 */

/* eslint-disable no-console */

import { ref, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useSlidesStore } from '@/store'
import { optimizeSlideLayout } from '@/services/optimization'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'
import message from '@/utils/message'
import { processOptimizedElements } from '@/utils/slideElementProcessor'
import { 
  OPTIMIZE_TIMEOUT_MS, 
  SUCCESS_CLOSE_DELAY_MS 
} from '@/configs/optimizePrompts'

export interface OptimizationOptions {
  prompt: string
  chatModel: string
  temperature: number
}

export interface OptimizationCallbacks {
  onSuccess?: () => void
  onError?: (error: Error) => void
  onTimeout?: () => void
  onCancel?: () => void
}

/**
 * 使用幻灯片优化
 * @returns 优化相关的状态和方法
 */
export default function useSlideOptimization() {
  const slidesStore = useSlidesStore()
  const { currentSlide, viewportSize, viewportRatio } = storeToRefs(slidesStore)
  const { addHistorySnapshot } = useHistorySnapshot()

  // 状态
  const optimizing = ref(false)
  const loading = ref(false)
  const optimizeTimeout = ref<number | null>(null)

  /**
   * 清理优化状态
   */
  const clearOptimizationState = () => {
    optimizing.value = false
    loading.value = false
    
    if (optimizeTimeout.value) {
      clearTimeout(optimizeTimeout.value)
      optimizeTimeout.value = null
    }
  }

  /**
   * 处理优化超时
   */
  const handleOptimizeTimeout = async (callbacks?: OptimizationCallbacks) => {
    clearOptimizationState()
    message.error('优化超时，请检查网络连接或稍后重试')
    await nextTick()
    callbacks?.onTimeout?.()
  }

  /**
   * 取消优化
   */
  const cancelOptimize = async (callbacks?: OptimizationCallbacks) => {
    clearOptimizationState()
    message.info('已取消优化')
    await nextTick()
    callbacks?.onCancel?.()
  }

  /**
   * 验证优化前提条件
   * @param prompt 用户输入的提示词
   * @returns 是否通过验证
   */
  const validateOptimization = (prompt: string): boolean => {
    if (!prompt.trim()) {
      message.warning('请输入优化需求')
      return false
    }

    if (!currentSlide.value || currentSlide.value.elements.length === 0) {
      message.warning('当前幻灯片没有可优化的元素')
      return false
    }

    return true
  }

  /**
   * 执行幻灯片优化
   * @param options 优化选项
   * @param callbacks 回调函数
   */
  const executeOptimization = async (
    options: OptimizationOptions,
    callbacks?: OptimizationCallbacks
  ) => {
    // 验证前提条件
    if (!validateOptimization(options.prompt)) {
      return
    }

    // 设置优化状态
    optimizing.value = true
    loading.value = true

    // 设置超时处理
    optimizeTimeout.value = setTimeout(() => {
      if (optimizing.value) {
        handleOptimizeTimeout(callbacks)
      }
    }, OPTIMIZE_TIMEOUT_MS) as unknown as number

    try {
      // 添加历史快照
      addHistorySnapshot()

      // 调用优化服务
      const response = await optimizeSlideLayout(
        currentSlide.value.id,
        currentSlide.value.elements,
        {
          width: viewportSize.value,
          height: viewportSize.value * viewportRatio.value,
        },
        undefined,
        options.prompt.trim(),
        {
          model: options.chatModel
        },
        options.temperature
      )

      // 处理成功响应
      if (response.status === 'success' && response.data) {
        try {
          // 清除超时定时器
          if (optimizeTimeout.value) {
            clearTimeout(optimizeTimeout.value)
            optimizeTimeout.value = null
          }

          // 验证响应数据
          if (!response.data.elements || !Array.isArray(response.data.elements)) {
            throw new Error('后端返回的elements不是数组格式')
          }

          // 处理优化后的元素
          const processedElements = processOptimizedElements(
            currentSlide.value.elements,
            response.data.elements
          )

          // 打印详细调试信息
          console.log('=== 优化处理调试信息 ===')
          console.log('原始元素数量:', currentSlide.value.elements.length)
          console.log('优化后元素数量:', response.data?.elements?.length || 0)
          console.log('处理后元素数量:', processedElements.length)

          // 检查ID匹配情况
          const originalIds = new Set(currentSlide.value.elements.map(el => el.id))
          const optimizedIds = new Set(response.data?.elements?.map(el => el.id) || [])
          const matchedIds = [...originalIds].filter(id => optimizedIds.has(id))
          const newIds = [...optimizedIds].filter(id => !originalIds.has(id))

          console.log('匹配的元素ID:', matchedIds)
          console.log('新增的元素ID:', newIds)

          // 检查元素属性变化
          currentSlide.value.elements.forEach((originalEl, index) => {
            const optimizedEl = response.data?.elements?.find(opt => opt.id === originalEl.id)
            if (optimizedEl) {
              console.log(`元素 ${index} (${originalEl.id}) 属性变化:`)
              if (originalEl.left !== optimizedEl.left || originalEl.top !== optimizedEl.top) {
                console.log(`  - 位置: (${originalEl.left},${originalEl.top}) -> (${optimizedEl.left},${optimizedEl.top})`)
              }
              // 只有非线条元素才有width和height属性
              if (originalEl.type !== 'line' && optimizedEl.type !== 'line') {
                if (originalEl.width !== optimizedEl.width || originalEl.height !== optimizedEl.height) {
                  console.log(`  - 尺寸: ${originalEl.width}x${originalEl.height} -> ${optimizedEl.width}x${optimizedEl.height}`)
                }
              }
              if (originalEl.type === 'text' && originalEl.content !== optimizedEl.content) {
                console.log(`  - 内容: "${originalEl.content}" -> "${optimizedEl.content}"`)
              }
            }
          })

          // 打印统计信息
          console.log('正在更新幻灯片，元素数量:', {
            原有: currentSlide.value.elements.length,
            优化后: response.data?.elements?.length || 0,
            新增: (response.data?.elements?.length || 0) - currentSlide.value.elements.length,
            合并后: processedElements.length
          })

          // 更新幻灯片
          slidesStore.updateSlide({
            elements: processedElements,
          })

          // 清除loading状态（必须在显示消息前）
          clearOptimizationState()

          // 等待DOM更新，确保loading动画消失
          await nextTick()

          // 显示成功提示
          message.success('幻灯片优化完成！')

          // 短暂延迟，让用户看到成功消息和更新后的幻灯片
          await new Promise(resolve => setTimeout(resolve, SUCCESS_CLOSE_DELAY_MS))

          // 触发成功回调
          callbacks?.onSuccess?.()
        }
        catch (innerError: any) {
          // 处理成功响应中的数据处理错误
          throw new Error(`处理优化结果失败：${innerError.message}`)
        }
      }
      else {
        throw new Error(response.message || '优化失败')
      }
    }
    catch (error: any) {
      // 优化失败处理
      
      // 立即清理所有状态
      clearOptimizationState()
      
      // 等待DOM更新
      await nextTick()
      
      // 显示错误消息
      message.error(`优化失败：${error.message}`)
      
      // 触发错误回调
      callbacks?.onError?.(error)
    }
  }

  return {
    // 状态
    optimizing,
    loading,
    
    // 方法
    executeOptimization,
    cancelOptimize,
    clearOptimizationState,
  }
}

