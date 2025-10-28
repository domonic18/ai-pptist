/**
 * 智能模板匹配功能开关配置
 */

import { reactive } from 'vue'

/**
 * 功能开关配置类型
 */
interface SmartMatchingConfigType {
  enabled: boolean
  slideTypes: {
    cover: boolean
    contents: boolean
    content: boolean
    transition: boolean
    end: boolean
  }
  debug: boolean
  fallback: {
    enabled: boolean
    logFailure: boolean
  }
}

/**
 * 功能开关配置
 * 使用响应式对象支持热重载
 */
export const SMART_MATCHING_CONFIG: SmartMatchingConfigType = reactive({
  // 总开关 - 控制是否启用智能匹配功能
  enabled: true,

  // 详细开关 - 按幻灯片类型控制
  slideTypes: {
    cover: false, // 封面页智能匹配 - 关闭，使用原有逻辑
    contents: false, // 目录页智能匹配 - 关闭，使用原有逻辑
    content: true, // 内容页智能匹配 - 仅内容页启用智能匹配
    transition: false, // 过渡页智能匹配 - 关闭，使用原有逻辑
    end: false // 结束页智能匹配 - 关闭，使用原有逻辑
  },

  // 调试模式
  debug: true,

  // 降级策略
  fallback: {
    enabled: true, // 启用降级到随机选择
    logFailure: true // 记录匹配失败日志
  }
})

/**
 * 检查指定类型的幻灯片是否启用智能匹配
 */
export function isSmartMatchingEnabled(slideType: string): boolean {
  if (!SMART_MATCHING_CONFIG.enabled) {
    return false
  }

  return SMART_MATCHING_CONFIG.slideTypes[slideType as keyof typeof SMART_MATCHING_CONFIG.slideTypes] || false
}

/**
 * 获取功能配置状态
 */
export function getSmartMatchingConfig() {
  return { ...SMART_MATCHING_CONFIG }
}

/**
 * 动态更新功能开关
 */
export function updateSmartMatchingConfig(config: Partial<typeof SMART_MATCHING_CONFIG>) {
  Object.assign(SMART_MATCHING_CONFIG, config)

  if (SMART_MATCHING_CONFIG.debug) {
    // eslint-disable-next-line no-console
    console.log('[SmartMatching] 配置已更新:', SMART_MATCHING_CONFIG)
  }
}

/**
 * 声明window对象扩展类型
 */
declare global {
  interface Window {
    smartMatchingConfig?: typeof SMART_MATCHING_CONFIG
    isSmartMatchingEnabled?: typeof isSmartMatchingEnabled
    updateSmartMatchingConfig?: typeof updateSmartMatchingConfig
  }
}

/**
 * 在开发环境下暴露配置到window对象
 */
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  window.smartMatchingConfig = SMART_MATCHING_CONFIG
  window.isSmartMatchingEnabled = isSmartMatchingEnabled
  window.updateSmartMatchingConfig = updateSmartMatchingConfig

  // eslint-disable-next-line no-console
  console.log('🎛️ 智能匹配功能开关已配置')
  // eslint-disable-next-line no-console
  console.log('使用 window.smartMatchingConfig 查看配置')
  // eslint-disable-next-line no-console
  console.log('使用 window.updateSmartMatchingConfig({enabled: false}) 关闭功能')
}