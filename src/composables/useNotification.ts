import { h, render } from 'vue'
import { ElNotification } from 'element-plus'

export interface NotificationOptions {
  title?: string
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  showClose?: boolean
}

/**
 * 使用 Element Plus 通知组件的通知管理器
 */
export function useNotification() {
  /**
   * 显示成功通知
   */
  const showSuccess = (message: string, title?: string, duration = 3000) => {
    ElNotification({
      title: title || '成功',
      message,
      type: 'success',
      duration,
      showClose: true,
      position: 'top-right'
    })
  }

  /**
   * 显示错误通知
   */
  const showError = (message: string, title?: string, duration = 5000) => {
    ElNotification({
      title: title || '错误',
      message,
      type: 'error',
      duration,
      showClose: true,
      position: 'top-right'
    })
  }

  /**
   * 显示警告通知
   */
  const showWarning = (message: string, title?: string, duration = 4000) => {
    ElNotification({
      title: title || '警告',
      message,
      type: 'warning',
      duration,
      showClose: true,
      position: 'top-right'
    })
  }

  /**
   * 显示信息通知
   */
  const showInfo = (message: string, title?: string, duration = 3000) => {
    ElNotification({
      title: title || '提示',
      message,
      type: 'info',
      duration,
      showClose: true,
      position: 'top-right'
    })
  }

  /**
   * 显示通用通知
   */
  const showNotification = (options: NotificationOptions) => {
    ElNotification({
      title: options.title,
      message: options.message,
      type: options.type || 'info',
      duration: options.duration || 3000,
      showClose: options.showClose !== false,
      position: 'top-right'
    })
  }

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showNotification
  }
}
