/**
 * 图片错误处理和重试机制工具
 * 提供统一的错误处理、重试策略和用户体验优化
 */

import { ElMessage, ElNotification } from 'element-plus'

// 错误类型枚举
export enum ImageErrorType {
  NETWORK_ERROR = 'network_error',
  TIMEOUT = 'timeout',
  NOT_FOUND = 'not_found',
  SERVER_ERROR = 'server_error',
  QUOTA_EXCEEDED = 'quota_exceeded',
  UNAUTHORIZED = 'unauthorized',
  FORBIDDEN = 'forbidden',
  BAD_REQUEST = 'bad_request',
  CLIENT_ERROR = 'client_error',
  UNKNOWN = 'unknown'
}

// 错误严重级别
export enum ErrorSeverity {
  LOW = 'low',        // 轻微错误，不影响使用
  MEDIUM = 'medium',  // 中等错误，部分功能受影响
  HIGH = 'high',      // 严重错误，影响主要功能
  CRITICAL = 'critical' // 关键错误，系统无法正常使用
}

// 重试策略
export interface RetryStrategy {
  maxAttempts: number          // 最大重试次数
  baseDelay: number            // 基础延迟（毫秒）
  maxDelay: number             // 最大延迟（毫秒）
  backoffMultiplier: number    // 退避倍数
  jitter: boolean              // 是否添加随机抖动
  retryableErrors: ImageErrorType[]  // 可重试的错误类型
}

// 默认重试策略
export const DEFAULT_RETRY_STRATEGY: RetryStrategy = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  jitter: true,
  retryableErrors: [
    ImageErrorType.NETWORK_ERROR,
    ImageErrorType.TIMEOUT,
    ImageErrorType.SERVER_ERROR
  ]
}

// 错误上下文
export interface ErrorContext {
  userId?: string
  imageKey?: string
  operation: string
  timestamp: number
  url?: string
  userAgent?: string
}

// 错误信息
export interface ImageErrorInfo {
  type: ImageErrorType
  message: string
  severity: ErrorSeverity
  recoverable: boolean
  context?: ErrorContext
  originalError?: any
}

// 用户操作建议
export interface UserActionSuggestion {
  title: string
  description: string
  action?: () => void
  primary?: boolean
}

// 错误处理器
export class ImageErrorHandler {
  private retryStrategies = new Map<string, RetryStrategy>()

  constructor() {
    // 注册默认重试策略
    this.registerRetryStrategy('default', DEFAULT_RETRY_STRATEGY)
  }

  /**
   * 注册重试策略
   */
  registerRetryStrategy(name: string, strategy: RetryStrategy): void {
    this.retryStrategies.set(name, strategy)
  }

  /**
   * 获取重试策略
   */
  getRetryStrategy(name: string = 'default'): RetryStrategy {
    return this.retryStrategies.get(name) || DEFAULT_RETRY_STRATEGY
  }

  /**
   * 处理错误
   */
  handleError(
    error: any,
    context: ErrorContext,
    strategyName: string = 'default'
  ): ImageErrorInfo {
    const info = this.categorizeError(error, context)

    // 记录错误
    this.logError(info)

    // 通知用户
    this.notifyUser(info, context)

    return info
  }

  /**
   * 分类错误
   */
  private categorizeError(error: any, context: ErrorContext): ImageErrorInfo {
    // 提取状态码
    const statusCode = this.extractStatusCode(error)

    // 确定错误类型
    let type: ImageErrorType = ImageErrorType.UNKNOWN
    let severity: ErrorSeverity = ErrorSeverity.MEDIUM
    let recoverable = false

    if (statusCode) {
      switch (statusCode) {
        case 400:
          type = ImageErrorType.BAD_REQUEST
          severity = ErrorSeverity.MEDIUM
          break
        case 401:
          type = ImageErrorType.UNAUTHORIZED
          severity = ErrorSeverity.HIGH
          break
        case 403:
          type = ImageErrorType.FORBIDDEN
          severity = ErrorSeverity.HIGH
          break
        case 404:
          type = ImageErrorType.NOT_FOUND
          severity = ErrorSeverity.LOW
          break
        case 408:
          type = ImageErrorType.TIMEOUT
          severity = ErrorSeverity.MEDIUM
          recoverable = true
          break
        case 429:
          type = ImageErrorType.QUOTA_EXCEEDED
          severity = ErrorSeverity.MEDIUM
          break
        case 500:
        case 502:
        case 503:
        case 504:
          type = ImageErrorType.SERVER_ERROR
          severity = ErrorSeverity.HIGH
          recoverable = true
          break
        default:
          if (statusCode >= 400 && statusCode < 500) {
            type = ImageErrorType.CLIENT_ERROR
            severity = ErrorSeverity.MEDIUM
          } else if (statusCode >= 500) {
            type = ImageErrorType.SERVER_ERROR
            severity = ErrorSeverity.HIGH
            recoverable = true
          }
      }
    } else {
      // 根据错误消息分类
      const message = (error.message || error.toString()).toLowerCase()

      if (message.includes('network') || message.includes('网络')) {
        type = ImageErrorType.NETWORK_ERROR
        severity = ErrorSeverity.MEDIUM
        recoverable = true
      } else if (message.includes('timeout') || message.includes('超时')) {
        type = ImageErrorType.TIMEOUT
        severity = ErrorSeverity.MEDIUM
        recoverable = true
      } else if (message.includes('not found') || message.includes('不存在')) {
        type = ImageErrorType.NOT_FOUND
        severity = ErrorSeverity.LOW
      }
    }

    return {
      type,
      message: this.getErrorMessage(error, type),
      severity,
      recoverable,
      context,
      originalError: error
    }
  }

  /**
   * 提取状态码
   */
  private extractStatusCode(error: any): number | null {
    if (error.response) {
      return error.response.status
    }
    if (error.status) {
      return error.status
    }
    if (error.statusCode) {
      return error.statusCode
    }
    return null
  }

  /**
   * 获取错误消息
   */
  private getErrorMessage(error: any, type: ImageErrorType): string {
    const messages: Partial<Record<ImageErrorType, string>> = {
      [ImageErrorType.NETWORK_ERROR]: '网络连接失败，请检查网络设置',
      [ImageErrorType.TIMEOUT]: '请求超时，请稍后重试',
      [ImageErrorType.NOT_FOUND]: '图片不存在或已被删除',
      [ImageErrorType.SERVER_ERROR]: '服务器错误，请稍后重试',
      [ImageErrorType.QUOTA_EXCEEDED]: '请求过于频繁，请稍后再试',
      [ImageErrorType.UNAUTHORIZED]: '没有访问权限',
      [ImageErrorType.FORBIDDEN]: '访问被禁止',
      [ImageErrorType.BAD_REQUEST]: '请求参数错误',
      [ImageErrorType.CLIENT_ERROR]: '客户端错误',
      [ImageErrorType.UNKNOWN]: error.message || '未知错误'
    }

    return messages[type] || error.message || '加载失败'
  }

  /**
   * 记录错误
   */
  private logError(info: ImageErrorInfo): void {
    // TODO: 发送到错误监控服务
    console.error('Image Error:', {
      type: info.type,
      message: info.message,
      severity: info.severity,
      context: info.context,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * 通知用户
   */
  private notifyUser(info: ImageErrorInfo, context: ErrorContext): void {
    // 根据严重级别决定通知方式
    switch (info.severity) {
      case ErrorSeverity.LOW:
        // 轻微错误，静默处理或仅在控制台提示
        console.warn('Image load warning:', info.message)
        break

      case ErrorSeverity.MEDIUM:
        // 中等错误，显示通知
        ElNotification({
          title: '图片加载提示',
          message: info.message,
          type: 'warning',
          duration: 3000
        })
        break

      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        // 严重错误，显示错误消息
        ElMessage.error(info.message)
        break
    }
  }

  /**
   * 执行重试
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    strategyName: string = 'default'
  ): Promise<{ success: boolean; result?: T; error?: ImageErrorInfo }> {
    const strategy = this.getRetryStrategy(strategyName)
    let lastError: ImageErrorInfo | null = null

    for (let attempt = 1; attempt <= strategy.maxAttempts; attempt++) {
      try {
        const result = await operation()
        return { success: true, result }
      } catch (error) {
        const errorInfo = this.handleError(error, context, strategyName)
        lastError = errorInfo

        // 检查是否可以重试
        if (!strategy.retryableErrors.includes(errorInfo.type)) {
          break
        }

        // 最后一次尝试
        if (attempt === strategy.maxAttempts) {
          break
        }

        // 计算延迟时间
        const delay = this.calculateDelay(attempt, strategy)

        // 显示重试提示
        if (attempt === 1) {
          ElNotification({
            title: '重试中',
            message: `正在重试... (${attempt}/${strategy.maxAttempts})`,
            type: 'info',
            duration: 2000
          })
        }

        // 等待延迟
        await this.delay(delay)
      }
    }

    return { success: false, error: lastError || undefined }
  }

  /**
   * 计算重试延迟
   */
  private calculateDelay(attempt: number, strategy: RetryStrategy): number {
    // 指数退避
    let delay = strategy.baseDelay * Math.pow(strategy.backoffMultiplier, attempt - 1)

    // 限制最大延迟
    delay = Math.min(delay, strategy.maxDelay)

    // 添加随机抖动
    if (strategy.jitter) {
      const jitterRange = delay * 0.1
      delay += (Math.random() - 0.5) * 2 * jitterRange
    }

    return Math.max(0, delay)
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 获取用户操作建议
   */
  getUserActionSuggestions(info: ImageErrorInfo): UserActionSuggestion[] {
    const suggestions: UserActionSuggestion[] = []

    switch (info.type) {
      case ImageErrorType.NETWORK_ERROR:
        suggestions.push({
          title: '检查网络连接',
          description: '请确保网络连接正常',
          primary: true
        })
        suggestions.push({
          title: '刷新页面',
          description: '尝试刷新浏览器页面'
        })
        break

      case ImageErrorType.TIMEOUT:
        suggestions.push({
          title: '重试加载',
          description: '点击重试按钮或等待几秒后再次尝试',
          primary: true
        })
        suggestions.push({
          title: '检查网络速度',
          description: '网络较慢可能导致超时'
        })
        break

      case ImageErrorType.NOT_FOUND:
        suggestions.push({
          title: '检查图片地址',
          description: '图片可能已被删除或移动'
        })
        break

      case ImageErrorType.SERVER_ERROR:
        suggestions.push({
          title: '稍后重试',
          description: '服务器正在维护，请稍后重试',
          primary: true
        })
        suggestions.push({
          title: '联系管理员',
          description: '如果问题持续存在，请联系系统管理员'
        })
        break

      case ImageErrorType.UNAUTHORIZED:
      case ImageErrorType.FORBIDDEN:
        suggestions.push({
          title: '重新登录',
          description: '请重新登录后再试',
          primary: true
        })
        break

      default:
        suggestions.push({
          title: '刷新页面',
          description: '尝试刷新浏览器页面'
        })
        suggestions.push({
          title: '重试加载',
          description: '点击重试按钮'
        })
    }

    return suggestions
  }

  /**
   * 检查错误是否可重试
   */
  isRetryableError(error: any, strategyName: string = 'default'): boolean {
    const strategy = this.getRetryStrategy(strategyName)
    const errorInfo = this.categorizeError(error, { operation: 'check', timestamp: Date.now() })
    return strategy.retryableErrors.includes(errorInfo.type)
  }

  /**
   * 获取错误统计
   */
  getErrorStats(): Record<string, number> {
    // TODO: 实现错误统计
    return {}
  }

  /**
   * 清除错误统计
   */
  clearErrorStats(): void {
    // TODO: 清除错误统计
  }
}

// 全局错误处理器实例
export const imageErrorHandler = new ImageErrorHandler()
