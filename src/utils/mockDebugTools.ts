/**
 * Mock调试工具
 * 提供浏览器控制台可用的调试命令
 */

import {
  getMockConfig,
  updateMockConfig,
  enableMock,
  disableMock,
  toggleMock,
  isMockEnabled,
  resetMockConfig
} from '@/configs/mock'

/**
 * 初始化Mock调试工具
 * 将调试命令挂载到window对象上
 */
export function initMockDebugTools(): void {
  if (typeof window === 'undefined') return

  // @ts-ignore
  window.mockTools = {
    /**
     * 获取当前Mock配置
     */
    getConfig: () => {
      const config = getMockConfig()
      console.log('📋 当前Mock配置:', config)
      return config
    },

    /**
     * 启用Mock功能
     */
    enable: () => {
      enableMock()
      console.log('✅ Mock功能已启用')
    },

    /**
     * 禁用Mock功能
     */
    disable: () => {
      disableMock()
      console.log('❌ Mock功能已禁用')
    },

    /**
     * 切换Mock功能状态
     */
    toggle: () => {
      const newState = toggleMock()
      console.log(newState ? '✅ Mock功能已启用' : '❌ Mock功能已禁用')
      return newState
    },

    /**
     * 检查Mock功能状态
     */
    status: () => {
      const enabled = isMockEnabled()
      console.log(enabled ? '🟢 Mock功能已启用' : '🔴 Mock功能已禁用')
      return enabled
    },

    /**
     * 设置Mock延迟
     * @param delay 延迟时间（毫秒）
     */
    setDelay: (delay: number) => {
      updateMockConfig({ mockDelay: delay })
      console.log(`⏱️ Mock延迟已设置为: ${delay}ms`)
    },

    /**
     * 设置Mock响应类型
     * @param success 是否模拟成功响应
     */
    setResponseType: (success: boolean) => {
      updateMockConfig({ mockSuccess: success })
      console.log(success ? '✅ 设置为成功响应' : '❌ 设置为失败响应')
    },

    /**
     * 重置Mock配置
     */
    reset: () => {
      resetMockConfig()
      console.log('🔄 Mock配置已重置为默认值')
    },

    /**
     * 显示帮助信息
     */
    help: () => {
      console.log('🎯 Mock调试工具命令:')
      console.log('  mockTools.getConfig()      - 获取当前Mock配置')
      console.log('  mockTools.enable()         - 启用Mock功能')
      console.log('  mockTools.disable()        - 禁用Mock功能')
      console.log('  mockTools.toggle()         - 切换Mock功能状态')
      console.log('  mockTools.status()         - 检查Mock功能状态')
      console.log('  mockTools.setDelay(1000)   - 设置Mock延迟为1000ms')
      console.log('  mockTools.setResponseType(true) - 设置为成功响应')
      console.log('  mockTools.reset()          - 重置Mock配置')
      console.log('  mockTools.help()           - 显示此帮助信息')
    }
  }

  console.log('🎯 Mock调试工具已加载')
  console.log('💡 使用 mockTools.help() 查看可用命令')
}

/**
 * 自动初始化调试工具
 */
if (typeof window !== 'undefined') {
  // 延迟初始化，确保DOM已加载
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMockDebugTools)
  }
  else {
    initMockDebugTools()
  }
}