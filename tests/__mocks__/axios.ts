/**
 * @fileoverview Axios Mock
 * @description 为Axios提供测试用的mock实现
 */

import { vi } from 'vitest'

export const mockAxios = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  patch: vi.fn(),
  interceptors: {
    request: {
      use: vi.fn(),
    },
    response: {
      use: vi.fn(),
    },
  },
}

export default mockAxios
