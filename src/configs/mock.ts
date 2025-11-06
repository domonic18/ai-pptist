/**
 * Mock功能配置
 * 用于前端调试和测试，避免依赖后端服务
 */

/**
 * Mock功能配置接口
 */
export interface MockConfig {
  /**
   * 是否启用幻灯片优化Mock
   * 启用后，优化请求将返回Mock数据而不是调用真实API
   */
  enableOptimizationMock: boolean

  /**
   * Mock响应延迟（毫秒）
   * 模拟网络延迟，使Mock响应更接近真实环境
   */
  mockDelay: number

  /**
   * 是否模拟成功响应
   * 如果为false，将返回错误响应
   */
  mockSuccess: boolean
}

/**
 * 默认Mock配置
 */
export const DEFAULT_MOCK_CONFIG: MockConfig = {
  enableOptimizationMock: false, // 默认关闭Mock
  mockDelay: 1000, // 1秒延迟
  mockSuccess: true // 默认模拟成功
}

/**
 * 开发环境Mock配置
 */
export const DEV_MOCK_CONFIG: MockConfig = {
  enableOptimizationMock: false, // 本地开发环境默认关闭
  mockDelay: 500, // 0.5秒延迟
  mockSuccess: true
}

/**
 * 获取当前Mock配置
 * 可以根据环境变量或其他条件动态调整
 */
export function getMockConfig(): MockConfig {
  // 优先使用localStorage中的配置
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const storedConfig = localStorage.getItem('pptist_mock_config')
      if (storedConfig) {
        const parsedConfig = JSON.parse(storedConfig)
        return { ...DEFAULT_MOCK_CONFIG, ...parsedConfig }
      }
    }
    catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to parse mock config from localStorage:', error)
    }
  }

  // 根据环境返回配置
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return DEV_MOCK_CONFIG
  }

  return DEFAULT_MOCK_CONFIG
}

/**
 * 更新Mock配置
 * @param config 新的配置
 */
export function updateMockConfig(config: Partial<MockConfig>): void {
  const currentConfig = getMockConfig()
  const newConfig = { ...currentConfig, ...config }

  // 保存到localStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem('pptist_mock_config', JSON.stringify(newConfig))
    }
    catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to save mock config to localStorage:', error)
    }
  }

  // eslint-disable-next-line no-console
  console.log('Mock配置已更新:', newConfig)
}

/**
 * 重置Mock配置为默认值
 */
export function resetMockConfig(): void {
  updateMockConfig(DEFAULT_MOCK_CONFIG)
}

/**
 * 启用Mock功能
 */
export function enableMock(): void {
  updateMockConfig({ enableOptimizationMock: true })
}

/**
 * 禁用Mock功能
 */
export function disableMock(): void {
  updateMockConfig({ enableOptimizationMock: false })
}

/**
 * 切换Mock功能状态
 */
export function toggleMock(): boolean {
  const currentConfig = getMockConfig()
  const newState = !currentConfig.enableOptimizationMock
  updateMockConfig({ enableOptimizationMock: newState })
  return newState
}

/**
 * 检查是否启用Mock
 */
export function isMockEnabled(): boolean {
  return getMockConfig().enableOptimizationMock
}

/**
 * 模拟网络延迟
 * @param delay 延迟时间（毫秒）
 */
export function mockDelay(delay?: number): Promise<void> {
  const config = getMockConfig()
  const delayTime = delay ?? config.mockDelay
  return new Promise(resolve => setTimeout(resolve, delayTime))
}