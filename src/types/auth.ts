/**
 * 认证相关类型定义
 */

// 用户角色
export type UserRole = 'USER' | 'ADMIN'

// 认证类型
export type AuthType = 'password' | 'saml'

// 用户信息
export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  is_active: boolean
  is_superuser: boolean
  auth_type: AuthType
  avatar_url: string | null
  bio: string | null
  created_at: string
  last_login_at: string
}

// 登录请求
export interface LoginRequest {
  email: string
  password: string
}

// 注册请求
export interface RegisterRequest {
  email: string
  name: string
  password: string
  confirm_password: string
}

// Token响应
export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_at: string
  refresh_expires_at: string
  user: User
}

// 刷新Token请求
export interface RefreshTokenRequest {
  refresh_token: string
}

// 刷新Token响应
export interface RefreshTokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_at: string
  refresh_expires_at: string
}

// 标准API响应格式
export interface StandardResponse<T> {
  status: 'success' | 'error'
  message: string
  data?: T
  error?: {
    code: string
    message: string
    details?: unknown
  }
  timestamp: string
  request_id: string
}

// 会话信息
export interface Session {
  id: string
  ip_address: string
  user_agent: string
  created_at: string
  expires_at: string
  is_current: boolean
}

// 会话列表响应
export interface SessionsResponse {
  sessions: Session[]
  total: number
}

// 存储的认证状态
export interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: User | null
  isAuthenticated: boolean
}
