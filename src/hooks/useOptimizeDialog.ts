/**
 * 优化对话框状态管理Hook
 * 处理对话框的生命周期、状态管理和UI交互
 */

import { ref, watch, nextTick, onUnmounted, type Ref } from 'vue'
import message from '@/utils/message'
import { DEFAULT_TEMPERATURE } from '@/configs/optimizePrompts'

export interface DialogLifecycleCallbacks {
  onClosed?: () => void
  onClose?: () => void
}

/**
 * 使用优化对话框
 * @param visible 对话框可见性ref
 * @param optimizing 优化进行中ref
 * @returns 对话框相关的状态和方法
 */
export default function useOptimizeDialog(
  visible: Ref<boolean>,
  optimizing: Ref<boolean>
) {
  // 状态
  const prompt = ref('')
  const temperature = ref(DEFAULT_TEMPERATURE)
  const inputRef = ref<HTMLTextAreaElement>()

  /**
   * 清理body上可能残留的遮罩类
   * Element Plus对话框关闭时可能会留下body样式
   */
  const cleanupBodyStyles = () => {
    const body = document.querySelector('body')
    if (body) {
      body.classList.remove('el-popup-parent--hidden')
      body.style.removeProperty('overflow')
      body.style.removeProperty('padding-right')
    }
  }

  /**
   * 处理对话框完全关闭后的回调
   * 用于清理残留状态，确保下次打开对话框时是干净的
   */
  const handleDialogClosed = (callbacks?: DialogLifecycleCallbacks) => {
    // 确保移除body上的遮罩类（防御性代码）
    nextTick(() => {
      cleanupBodyStyles()
    })
    
    callbacks?.onClosed?.()
  }

  /**
   * 处理对话框close事件
   * 当用户点击关闭按钮或按ESC时触发
   */
  const handleDialogClose = (callbacks?: DialogLifecycleCallbacks) => {
    // 确保状态已清理
    if (!optimizing.value) {
      callbacks?.onClose?.()
    }
  }

  /**
   * 处理对话框关闭前的守卫
   * 防止在优化进行中关闭对话框
   */
  const handleBeforeClose = (done: () => void) => {
    if (optimizing.value) {
      message.warning('优化进行中，请等待完成或点击"取消优化"按钮')
      return
    }
    done()
  }

  /**
   * 设置提示词
   * @param text 要设置的提示词文本
   */
  const setPrompt = (text: string) => {
    if (prompt.value) {
      prompt.value += '\n' + text
    }
    else {
      prompt.value = text
    }
    inputRef.value?.focus()
  }


  /**
   * Temperature工具提示格式化
   */
  const formatTemperatureTooltip = (value: number) => {
    return `Temperature: ${value.toFixed(1)}`
  }

  /**
   * 监听visible变化
   * 对话框关闭时确保状态重置
   */
  watch(() => visible.value, (newValue, oldValue) => {
    if (!newValue && oldValue) {
      // 对话框从打开变为关闭
      nextTick(() => {
        // 重置提示词（可选，根据需求决定是否保留）
        // prompt.value = ''
      })
    }
  })

  /**
   * 组件卸载时清理
   * 确保没有残留的样式
   */
  onUnmounted(() => {
    cleanupBodyStyles()
  })

  return {
    // 状态
    prompt,
    temperature,
    inputRef,
    
    // 方法
    handleDialogClosed,
    handleDialogClose,
    handleBeforeClose,
    setPrompt,
    formatTemperatureTooltip,
    cleanupBodyStyles,
  }
}

