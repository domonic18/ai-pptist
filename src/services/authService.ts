/**
 * 认证服务
 * 处理用户登录、注册、登出等认证相关操作
 */

import axios from './config'
import { API_CONFIG } from '@/configs/api'
import type {
  LoginRequest,
  RegisterRequest,
  TokenResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  StandardResponse,
  User,
  SessionsResponse,
} from '@/types/auth'

// LocalStorage 键名
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
} as const

/**
 * 用户登录
 */
export async function login(data: LoginRequest): Promise<TokenResponse> {
  const response: StandardResponse<TokenResponse> = await axios.post(
    API_CONFIG.AUTH.LOGIN,
    data
  )

  if (response.status === 'success' && response.data) {
    // 保存 token 和用户信息
    saveTokens(response.data.access_token, response.data.refresh_token)
    saveUser(response.data.user)
    return response.data
  }

  throw new Error(response.error?.message || response.message || '登录失败')
}

/**
 * 用户注册
 */
export async function register(data: RegisterRequest): Promise<TokenResponse> {
  const response: StandardResponse<TokenResponse> = await axios.post(
    API_CONFIG.AUTH.REGISTER,
    data
  )

  if (response.status === 'success' && response.data) {
    // 保存 token 和用户信息
    saveTokens(response.data.access_token, response.data.refresh_token)
    saveUser(response.data.user)
    return response.data
  }

  throw new Error(response.error?.message || response.message || '注册失败')
}

/**
 * 刷新访问令牌
 */
export async function refreshToken(refreshTokenValue: string): Promise<RefreshTokenResponse> {
  const response: StandardResponse<RefreshTokenResponse> = await axios.post(
    API_CONFIG.AUTH.REFRESH,
    { refresh_token: refreshTokenValue } as RefreshTokenRequest
  )

  if (response.status === 'success' && response.data) {
    // 更新 token（注意：refresh_token 也会更新）
    saveTokens(response.data.access_token, response.data.refresh_token)
    return response.data
  }

  throw new Error(response.error?.message || response.message || 'Token刷新失败')
}

/**
 * 用户登出
 */
export async function logout(): Promise<void> {
  try {
    await axios.post(
      API_CONFIG.AUTH.LOGOUT,
      {},
      {
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
        },
      }
    )
  } finally {
    // 无论请求成功与否，都清除本地存储
    clearTokens()
    clearUser()
  }
}

/**
 * 获取当前用户信息
 */
export async function getCurrentUser(): Promise<User> {
  const response: StandardResponse<User> = await axios.get(API_CONFIG.AUTH.ME, {
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
    },
  })

  if (response.status === 'success' && response.data) {
    saveUser(response.data)
    return response.data
  }

  throw new Error(response.error?.message || response.message || '获取用户信息失败')
}

/**
 * 获取用户会话列表
 */
export async function getSessions(skip = 0, limit = 20): Promise<SessionsResponse> {
  const response: StandardResponse<SessionsResponse> = await axios.get(
    `${API_CONFIG.AUTH.SESSIONS}?skip=${skip}&limit=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
      },
    }
  )

  if (response.status === 'success' && response.data) {
    return response.data
  }

  throw new Error(response.error?.message || response.message || '获取会话列表失败')
}

/**
 * 撤销指定会话
 */
export async function revokeSession(sessionId: string): Promise<void> {
  const response: StandardResponse<{ session_id: string }> = await axios.post(
    API_CONFIG.AUTH.REVOKE_SESSION(sessionId),
    {},
    {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
      },
    }
  )

  if (response.status !== 'success') {
    throw new Error(response.error?.message || response.message || '撤销会话失败')
  }
}

/**
 * 登出所有设备
 */
export async function logoutAll(): Promise<{ revoked_count: number }> {
  const response: StandardResponse<{ revoked_count: number }> = await axios.post(
    API_CONFIG.AUTH.LOGOUT_ALL,
    {},
    {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
      },
    }
  )

  if (response.status === 'success' && response.data) {
    // 登出所有设备后，也要清除当前设备的 token
    clearTokens()
    clearUser()
    return response.data
  }

  throw new Error(response.error?.message || response.message || '登出所有设备失败')
}

// ==================== Token 管理 ====================

/**
 * 保存 Token 到 LocalStorage
 */
function saveTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken)
  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken)
}

/**
 * 获取访问令牌
 */
export function getAccessToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
}

/**
 * 获取刷新令牌
 */
export function getRefreshToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
}

/**
 * 清除 Token
 */
function clearTokens(): void {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
}

// ==================== 用户信息管理 ====================

/**
 * 保存用户信息到 LocalStorage
 */
function saveUser(user: User): void {
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user))
}

/**
 * 获取本地存储的用户信息
 */
export function getLocalUser(): User | null {
  const userStr = localStorage.getItem(STORAGE_KEYS.USER)
  if (userStr) {
    try {
      return JSON.parse(userStr) as User
    } catch {
      return null
    }
  }
  return null
}

/**
 * 清除用户信息
 */
function clearUser(): void {
  localStorage.removeItem(STORAGE_KEYS.USER)
}

/**
 * 检查是否已登录
 */
export function isAuthenticated(): boolean {
  return !!getAccessToken()
}

/**
 * 设置认证头部
 */
export function getAuthHeader(): Record<string, string> | {} {
  const token = getAccessToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}
