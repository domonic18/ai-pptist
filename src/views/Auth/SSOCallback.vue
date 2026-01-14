<template>
  <div class="sso-callback-container">
    <div class="loading-box">
      <div class="spinner"></div>
      <p class="loading-text">{{ loadingText }}</p>
      <p v-if="error" class="error-text">{{ error }}</p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/store/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const loadingText = ref('正在处理SSO登录...')
const error = ref('')

onMounted(async () => {
  try {
    // 处理SSO回调
    const success = await authStore.handleSSOCallback()

    if (success) {
      loadingText.value = '登录成功，正在跳转...'

      // 获取重定向地址
      const redirect = (route.query.redirect as string) || '/'

      // 延迟一下再跳转，让用户看到成功提示
      setTimeout(() => {
        router.push(redirect)
      }, 500)
    } else {
      // 没有找到token，可能用户直接访问了这个页面
      error.value = '无效的登录回调，请重新登录'
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    }
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : '登录失败，请重试'
    setTimeout(() => {
      router.push('/login')
    }, 2000)
  }
})
</script>

<style lang="scss" scoped>
.sso-callback-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.loading-box {
  text-align: center;
  padding: 40px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.spinner {
  width: 48px;
  height: 48px;
  margin: 0 auto 24px;
  border: 4px solid #f0f0f0;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  font-size: 16px;
  color: #333;
  margin: 0;
}

.error-text {
  font-size: 14px;
  color: #ff4d4f;
  margin-top: 16px;
}
</style>
