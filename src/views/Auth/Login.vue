<template>
  <div class="auth-container">
    <!-- 左侧品牌区域 -->
    <div class="auth-brand">
      <div class="brand-content">
        <h1 class="brand-title">AI-PPTist</h1>
        <p class="brand-subtitle">智能 PPT 生成与编辑系统</p>
        <div class="brand-features">
          <div class="feature-item">
            <span class="feature-icon">✨</span>
            <span>AI 智能生成</span>
          </div>
          <div class="feature-item">
            <span class="feature-icon">🎨</span>
            <span>精美模板库</span>
          </div>
          <div class="feature-item">
            <span class="feature-icon">🚀</span>
            <span>高效编辑体验</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧表单区域 -->
    <div class="auth-form-wrapper">
      <div class="auth-form-container">
        <!-- Tab 切换 -->
        <div class="auth-tabs">
          <button
            :class="['tab-btn', { active: activeTab === 'login' }]"
            @click="activeTab = 'login'"
          >
            登录
          </button>
          <button
            :class="['tab-btn', { active: activeTab === 'register' }]"
            @click="activeTab = 'register'"
          >
            注册
          </button>
        </div>

        <!-- 登录表单 -->
        <div v-if="activeTab === 'login'" class="form-content">
          <h2 class="form-title">欢迎回来</h2>
          <p class="form-subtitle">登录到您的账户</p>

          <form @submit.prevent="handleLogin" class="auth-form">
            <div class="form-group">
              <label class="form-label">邮箱地址</label>
              <div class="input-wrapper">
                <span class="input-icon"><IconMail /></span>
                <input
                  v-model="loginForm.email"
                  type="email"
                  class="form-input"
                  placeholder="请输入邮箱地址"
                  required
                />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">密码</label>
              <div class="input-wrapper">
                <span class="input-icon"><IconLock /></span>
                <input
                  v-model="loginForm.password"
                  :type="showPassword ? 'text' : 'password'"
                  class="form-input"
                  placeholder="请输入密码"
                  required
                />
                <button
                  type="button"
                  class="password-toggle"
                  @click="showPassword = !showPassword"
                >
                  <IconEyes :class="{ 'is-visible': showPassword }" />
                </button>
              </div>
            </div>

            <div v-if="loginError" class="error-message">
              {{ loginError }}
            </div>

            <button type="submit" class="submit-btn" :disabled="isLoading">
              {{ isLoading ? '登录中...' : '登录' }}
            </button>
          </form>

          <!-- 分隔线 -->
          <div class="divider">
            <span>或</span>
          </div>

          <!-- SSO 登录按钮（预留） -->
          <button
            type="button"
            class="sso-btn"
            @click="handleSSOLogin"
            disabled
            title="SSO登录功能暂未开放"
          >
            <span class="sso-icon"><IconShield /></span>
            使用SSO快捷登录
            <span class="sso-badge">即将推出</span>
          </button>
        </div>

        <!-- 注册表单 -->
        <div v-else class="form-content">
          <h2 class="form-title">创建账户</h2>
          <p class="form-subtitle">开始您的 AI-PPT 之旅</p>

          <form @submit.prevent="handleRegister" class="auth-form">
            <div class="form-group">
              <label class="form-label">邮箱地址</label>
              <div class="input-wrapper">
                <span class="input-icon"><IconMail /></span>
                <input
                  v-model="registerForm.email"
                  type="email"
                  class="form-input"
                  placeholder="请输入邮箱地址"
                  required
                />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">用户名</label>
              <div class="input-wrapper">
                <span class="input-icon"><IconUser /></span>
                <input
                  v-model="registerForm.name"
                  type="text"
                  class="form-input"
                  placeholder="请输入用户名（2-100个字符）"
                  minlength="2"
                  maxlength="100"
                  required
                />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">密码</label>
              <div class="input-wrapper">
                <span class="input-icon"><IconLock /></span>
                <input
                  v-model="registerForm.password"
                  :type="showPassword ? 'text' : 'password'"
                  class="form-input"
                  placeholder="请输入密码（至少8位）"
                  minlength="8"
                  required
                />
                <button
                  type="button"
                  class="password-toggle"
                  @click="showPassword = !showPassword"
                >
                  <IconEyes :class="{ 'is-visible': showPassword }" />
                </button>
              </div>
              <div class="password-strength">
                <div
                  v-for="i in 4"
                  :key="i"
                  :class="['strength-bar', { active: passwordStrength >= i }]"
                ></div>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">确认密码</label>
              <div class="input-wrapper">
                <span class="input-icon"><IconLock /></span>
                <input
                  v-model="registerForm.confirmPassword"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  class="form-input"
                  placeholder="请再次输入密码"
                  required
                />
                <button
                  type="button"
                  class="password-toggle"
                  @click="showConfirmPassword = !showConfirmPassword"
                >
                  <IconEye v-if="showConfirmPassword" />
                  <IconEyeClose v-else />
                </button>
              </div>
            </div>

            <div v-if="registerError" class="error-message">
              {{ registerError }}
            </div>

            <button type="submit" class="submit-btn" :disabled="isLoading || !isFormValid">
              {{ isLoading ? '注册中...' : '注册' }}
            </button>
          </form>

          <!-- 分隔线 -->
          <div class="divider">
            <span>或</span>
          </div>

          <!-- SSO 注册按钮（预留） -->
          <button
            type="button"
            class="sso-btn"
            disabled
            title="SSO登录功能暂未开放"
          >
            <span class="sso-icon"><IconShield /></span>
            使用企业账号注册
            <span class="sso-badge">即将推出</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'

const router = useRouter()
const authStore = useAuthStore()

// 表单状态
const activeTab = ref<'login' | 'register'>('login')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const isLoading = ref(false)
const loginError = ref('')
const registerError = ref('')

// 登录表单
const loginForm = ref({
  email: '',
  password: '',
})

// 注册表单
const registerForm = ref({
  email: '',
  name: '',
  password: '',
  confirmPassword: '',
})

// 密码强度计算
const passwordStrength = computed(() => {
  const password = registerForm.value.password
  let strength = 0
  if (password.length >= 8) strength++
  if (/[a-z]/.test(password)) strength++
  if (/[A-Z]/.test(password)) strength++
  if (/[0-9]/.test(password)) strength++
  return strength
})

// 表单验证
const isFormValid = computed(() => {
  return (
    registerForm.value.email &&
    registerForm.value.name &&
    registerForm.value.password.length >= 8 &&
    registerForm.value.password === registerForm.value.confirmPassword
  )
})

// 处理登录
async function handleLogin() {
  loginError.value = ''
  isLoading.value = true

  try {
    await authStore.login(loginForm.value.email, loginForm.value.password)
    // 登录成功，跳转到主页
    router.push('/')
  } catch (error: unknown) {
    loginError.value = error instanceof Error ? error.message : '登录失败，请检查邮箱和密码'
  } finally {
    isLoading.value = false
  }
}

// 处理注册
async function handleRegister() {
  registerError.value = ''
  isLoading.value = true

  try {
    await authStore.register(
      registerForm.value.email,
      registerForm.value.name,
      registerForm.value.password,
      registerForm.value.confirmPassword
    )
    // 注册成功，跳转到主页
    router.push('/')
  } catch (error: unknown) {
    registerError.value = error instanceof Error ? error.message : '注册失败，请稍后重试'
  } finally {
    isLoading.value = false
  }
}

// 处理 SSO 登录（预留功能）
function handleSSOLogin() {
  // TODO: 实现 SSO 登录功能
  console.log('SSO login not implemented yet')
}
</script>

<style lang="scss" scoped>
.auth-container {
  display: flex;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

// 左侧品牌区域
.auth-brand {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;

  @media (max-width: 768px) {
    display: none;
  }
}

.brand-content {
  max-width: 400px;
}

.brand-title {
  font-size: 48px;
  font-weight: 700;
  margin-bottom: 16px;
  letter-spacing: -1px;
}

.brand-subtitle {
  font-size: 18px;
  opacity: 0.9;
  margin-bottom: 40px;
}

.brand-features {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 16px;
  opacity: 0.9;
}

.feature-icon {
  font-size: 24px;
  display: flex;
  align-items: center;
}

// 右侧表单区域
.auth-form-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background: #fff;
}

.auth-form-container {
  width: 100%;
  max-width: 420px;
}

// Tab 切换
.auth-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 32px;
  background: #f5f5f5;
  padding: 4px;
  border-radius: 12px;
}

.tab-btn {
  flex: 1;
  padding: 12px 24px;
  border: none;
  background: transparent;
  color: #666;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;

  &:hover {
    color: #333;
  }

  &.active {
    background: #fff;
    color: #667eea;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }
}

// 表单内容
.form-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.form-title {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 8px;
}

.form-subtitle {
  font-size: 15px;
  color: #666;
  margin-bottom: 32px;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 14px;
  display: flex;
  align-items: center;
  color: #999;
  font-size: 18px;
  pointer-events: none;
}

.form-input {
  width: 100%;
  padding: 12px 14px 12px 44px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 15px;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  &::placeholder {
    color: #aaa;
  }
}

.password-toggle {
  position: absolute;
  right: 12px;
  padding: 4px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: #999;
  display: flex;
  align-items: center;
  transition: all 0.2s;

  &:hover {
    color: #667eea;
  }

  :deep(.i-icon) {
    transition: all 0.2s;

    &.is-visible {
      color: #667eea;
    }
  }
}

// 密码强度指示器
.password-strength {
  display: flex;
  gap: 4px;
  margin-top: 4px;
}

.strength-bar {
  flex: 1;
  height: 4px;
  background: #e0e0e0;
  border-radius: 2px;
  transition: all 0.3s;

  &.active {
    background: #667eea;

    &:nth-child(1) {
      background: #ff4d4f;
    }
    &:nth-child(2) {
      background: #faad14;
    }
    &:nth-child(3) {
      background: #52c41a;
    }
    &:nth-child(4) {
      background: #1890ff;
    }
  }
}

// 错误提示
.error-message {
  padding: 12px 16px;
  background: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 8px;
  color: #ff4d4f;
  font-size: 14px;
}

// 提交按钮
.submit-btn {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

// 分隔线
.divider {
  position: relative;
  display: flex;
  align-items: center;
  margin: 24px 0;
  color: #999;
  font-size: 14px;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #e0e0e0;
  }

  span {
    padding: 0 16px;
  }
}

// SSO 按钮
.sso-btn {
  position: relative;
  width: 100%;
  padding: 14px;
  border: 2px dashed #d0d0d0;
  border-radius: 8px;
  background: #fafafa;
  color: #999;
  font-size: 15px;
  font-weight: 500;
  cursor: not-allowed;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  .sso-icon {
    display: flex;
    align-items: center;
  }

  .sso-badge {
    position: absolute;
    top: -8px;
    right: 12px;
    padding: 2px 8px;
    background: #ff4d4f;
    color: #fff;
    font-size: 11px;
    font-weight: 600;
    border-radius: 10px;
  }
}
</style>
