/**
 * 测试环境全局设置
 * 每个测试文件运行前都会执行此设置
 */

import { beforeAll, afterEach, afterAll, vi } from 'vitest'
import { cleanup } from '@testing-library/vue'
import '@testing-library/jest-dom'

// 每个测试后清理DOM
afterEach(() => {
  cleanup()

  // 清除所有模拟
  vi.clearAllMocks()
  vi.restoreAllMocks()
})

// 全局错误处理
// 注意：在测试中需要模拟console.error时，请使用 vi.spyOn(console, 'error')
// console.error = vi.fn((message) => {
//   throw new Error(`Unexpected console.error: ${message}`)
// })

// console.warn = vi.fn()
