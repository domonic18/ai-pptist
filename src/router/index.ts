/**
 * Vue Router 配置
 * 包含路由定义和认证守卫
 */

import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { isPC } from '@/utils/common'

// 路由懒加载
const Editor = () => import('@/views/Editor/index.vue')
const Screen = () => import('@/views/Screen/index.vue')
const Mobile = () => import('@/views/Mobile/index.vue')
const ImageGeneration = () => import('@/views/ImageGeneration/index.vue')
const Login = () => import('@/views/Auth/Login.vue')
const SSOCallback = () => import('@/views/Auth/SSOCallback.vue')

// 路由定义
const routes: RouteRecordRaw[] = [
  // 登录/注册页（无需认证）
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: {
      requiresAuth: false,
      title: '登录 - AI-PPTist',
    },
  },

  // SSO回调页（无需认证，处理SSO登录后的Token）
  {
    path: '/sso-callback',
    name: 'SSOCallback',
    component: SSOCallback,
    meta: {
      requiresAuth: false,
      title: 'SSO登录 - AI-PPTist',
    },
  },

  // 主页/编辑器（需要认证）
  {
    path: '/',
    name: 'Home',
    component: Editor,
    meta: {
      requiresAuth: true,
      title: 'AI-PPTist',
    },
  },

  // 图片生成页（需要认证）
  {
    path: '/image-generation',
    name: 'ImageGeneration',
    component: ImageGeneration,
    meta: {
      requiresAuth: true,
      title: '图片生成 - AI-PPTist',
    },
  },

  // 演示播放页（需要认证）
  {
    path: '/screen',
    name: 'Screen',
    component: Screen,
    meta: {
      requiresAuth: true,
      title: '演示播放 - AI-PPTist',
    },
  },

  // 移动端页（需要认证）
  {
    path: '/mobile',
    name: 'Mobile',
    component: Mobile,
    meta: {
      requiresAuth: true,
      title: '移动端 - AI-PPTist',
    },
  },

  // 404 页面
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    redirect: '/',
  },
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0 }
  },
})

// 全局前置守卫 - 认证检查
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // 设置页面标题
  if (to.meta.title) {
    document.title = to.meta.title as string
  }

  // 检查路由是否需要认证
  const requiresAuth = to.meta.requiresAuth !== false

  if (requiresAuth) {
    // 需要认证的路由
    if (authStore.isAuthenticated) {
      // 已登录，检查用户信息是否完整
      if (!authStore.user) {
        try {
          await authStore.fetchCurrentUser()
        } catch {
          // 获取用户信息失败，跳转到登录页
          next({
            name: 'Login',
            query: { redirect: to.fullPath },
          })
          return
        }
      }

      // 移动端设备检查
      if (to.name !== 'Mobile' && !isPC()) {
        next({ name: 'Mobile' })
        return
      }

      next()
    } else {
      // 未登录，尝试从本地存储恢复认证状态
      try {
        await authStore.initAuth()
        if (authStore.isAuthenticated) {
          next()
        } else {
          next({
            name: 'Login',
            query: { redirect: to.fullPath },
          })
        }
      } catch {
        next({
          name: 'Login',
          query: { redirect: to.fullPath },
        })
      }
    }
  } else {
    // 不需要认证的路由（登录/注册页）
    if (authStore.isAuthenticated && to.name === 'Login') {
      // 已登录用户访问登录页，跳转到首页或重定向地址
      const redirect = (to.query.redirect as string) || '/'
      next(redirect)
    } else {
      next()
    }
  }
})

// 全局后置钩头 - 可用于埋点等
router.afterEach((to, from) => {
  // 这里可以添加页面访问统计等逻辑
  // console.log('Navigation:', from.path, '->', to.path)
})

export default router
