/**
 * 增强版处理器功能开关配置
 * 控制是否启用集成了智能匹配功能的幻灯片处理器
 */

/**
 * 功能开关配置
 */
export const USE_ENHANCED_PROCESSORS = true // 设置为true启用增强版处理器

/**
 * 检查是否启用增强版处理器
 */
export function isEnhancedProcessorsEnabled(): boolean {
  return USE_ENHANCED_PROCESSORS
}

/**
 * 在开发环境下暴露配置到window对象
 */
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  window.USE_ENHANCED_PROCESSORS = USE_ENHANCED_PROCESSORS

  // eslint-disable-next-line no-console
  console.log('🔧 增强版处理器功能开关:', USE_ENHANCED_PROCESSORS ? '启用' : '禁用')
}

/**
 * 声明window对象扩展类型
 */
declare global {
  interface Window {
    USE_ENHANCED_PROCESSORS?: boolean
  }
}