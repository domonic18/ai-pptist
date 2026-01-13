/**
 * 认证状态管理 Store
 */

import { defineStore } from 'pinia'
import type { User } from '@/types/auth'
import * as authService from '@/services/authService'

export interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: User | null
  isLoading: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    accessToken: authService.getAccessToken(),
    refreshToken: authService.getRefreshToken(),
    user: authService.getLocalUser(),
    isLoading: false,
  }),

  getters: {
    /**
     * 是否已登录
     */
    isAuthenticated: (state) => !!state.accessToken && !!state.user,

    /**
     * 用户显示名称
     */
    userDisplayName: (state) => state.user?.name || '',

    /**
     * 用户邮箱
     */
    userEmail: (state) => state.user?.email || '',

    /**
     * 用户角色
     */
    userRole: (state) => state.user?.role || 'USER',

    /**
     * 是否为管理员
     */
    isAdmin: (state) => state.user?.role === 'ADMIN',

    /**
     * 认证类型
     */
    authType: (state) => state.user?.auth_type || 'password',
  },

  actions: {
    /**
     * 用户登录
     */
    async login(email: string, password: string) {
      this.isLoading = true
      try {
        const response = await authService.login({ email, password })
        this.accessToken = response.access_token
        this.refreshToken = response.refresh_token
        this.user = response.user
        return response
      } finally {
        this.isLoading = false
      }
    },

    /**
     * 用户注册
     */
    async register(email: string, name: string, password: string, confirmPassword: string) {
      this.isLoading = true
      try {
        const response = await authService.register({
          email,
          name,
          password,
          confirm_password: confirmPassword,
        })
        this.accessToken = response.access_token
        this.refreshToken = response.refresh_token
        this.user = response.user
        return response
      } finally {
        this.isLoading = false
      }
    },

    /**
     * 刷新访问令牌
     */
    async refreshAccessToken() {
      if (!this.refreshToken) {
        throw new Error('No refresh token available')
      }

      try {
        const response = await authService.refreshToken(this.refreshToken)
        this.accessToken = response.access_token
        this.refreshToken = response.refresh_token
        return response
      } catch (error) {
        // Token 刷新失败，清除认证状态
        this.clearAuth()
        throw error
      }
    },

    /**
     * 获取当前用户信息
     */
    async fetchCurrentUser() {
      if (!this.accessToken) {
        throw new Error('Not authenticated')
      }

      this.isLoading = true
      try {
        const user = await authService.getCurrentUser()
        this.user = user
        return user
      } catch (error) {
        // 获取用户信息失败，可能 token 已过期
        this.clearAuth()
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * 用户登出
     */
    async logout() {
      this.isLoading = true
      try {
        await authService.logout()
      } finally {
        this.clearAuth()
        this.isLoading = false
      }
    },

    /**
     * 清除认证状态
     */
    clearAuth() {
      this.accessToken = null
      this.refreshToken = null
      this.user = null
    },

    /**
     * 初始化认证状态
     * 从本地存储恢复用户信息
     */
    async initAuth() {
      const token = authService.getAccessToken()
      const user = authService.getLocalUser()

      if (token && user) {
        this.accessToken = token
        this.user = user

        // 尝试从服务器获取最新用户信息
        try {
          await this.fetchCurrentUser()
        } catch {
          // 如果获取失败，可能 token 已过期，尝试刷新
          const refreshToken = authService.getRefreshToken()
          if (refreshToken) {
            try {
              await this.refreshAccessToken()
              await this.fetchCurrentUser()
            } catch {
              // 刷新也失败，清除认证状态
              this.clearAuth()
            }
          } else {
            this.clearAuth()
          }
        }
      }
    },

    /**
     * 检查是否需要刷新 token
     * 如果 access_token 过期时间在 5 分钟内，则自动刷新
     */
    async checkAndRefreshToken() {
      // 这里可以添加 token 过期时间检查逻辑
      // 由于 JWT 的 payload 包含 exp 字段，可以解析检查
      // 为简化实现，这里只在 401 错误时刷新
    },
  },
})
