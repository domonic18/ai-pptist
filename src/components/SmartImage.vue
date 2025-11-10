<template>
  <div
    class="smart-image"
    :class="[`smart-image--${size}`, { 'smart-image--rounded': rounded }]"
    :style="containerStyle"
  >
    <!-- 加载状态 -->
    <div
      v-if="isLoading"
      class="smart-image__loading"
    >
      <div class="loading-spinner">
        <el-icon class="is-loading" :size="spinnerSize">
          <Loading />
        </el-icon>
      </div>
      <div v-if="showLoadingText" class="loading-text">
        {{ loadingText }}
      </div>
    </div>

    <!-- 错误状态 -->
    <div
      v-else-if="hasError"
      class="smart-image__error"
      @click="handleRetry"
    >
      <div class="error-icon">
        <el-icon :size="errorIconSize">
          <Picture />
        </el-icon>
      </div>
      <div v-if="showErrorText" class="error-text">
        <p v-if="errorMessage">{{ errorMessage }}</p>
        <p v-else class="error-hint">点击重试</p>
        <el-button
          v-if="showRetryButton"
          size="small"
          type="primary"
          text
          @click.stop="handleRetry"
        >
          <el-icon><Refresh /></el-icon>
          重试
        </el-button>
      </div>
    </div>

    <!-- 成功状态 - 显示图片 -->
    <img
      v-else
      :src="displaySrc"
      :alt="alt"
      :draggable="false"
      :style="imageStyle"
      class="smart-image__content"
      @load="handleLoad"
      @error="handleError"
      @click="$emit('click', $event)"
    />

    <!-- 操作按钮 -->
    <div v-if="showActions" class="smart-image__actions">
      <el-button
        v-if="showRefreshButton"
        circle
        size="small"
        @click.stop="handleRefresh"
      >
        <el-icon><Refresh /></el-icon>
      </el-button>
    </div>

    <!-- 状态指示器 -->
    <div v-if="showIndicator" class="smart-image__indicator">
      <span
        v-if="fromCache"
        class="indicator indicator--cache"
        title="来自缓存"
      >
        <el-icon><Coin /></el-icon>
      </span>
      <span
        v-if="isRetrying"
        class="indicator indicator--retry"
        title="重试中"
      >
        <el-icon class="is-rotating"><Loading /></el-icon>
      </span>
    </div>

    <!-- 预览功能 -->
    <el-image
      v-if="preview && !hasError"
      :src="displaySrc"
      :preview-src-list="[displaySrc]"
      hide-on-click-modal
      fit="contain"
      class="smart-image__preview"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Picture, Refresh, Loading, Coin } from '@element-plus/icons-vue'
import { useSmartImage, ProxyMode, ImageLoadingState, type SmartImageOptions } from '@/composables/useSmartImage'
import { API_CONFIG } from '@/configs/api'

// Props
type ImageSize = 'small' | 'medium' | 'large' | 'custom'

// Emits
interface Emits {
  (e: 'load', event: Event): void
  (e: 'error', error: any): void
  (e: 'retry', imageKey?: string): void
  (e: 'refresh', imageKey?: string): void
  (e: 'click', event: Event): void
}

interface Props {
  // 图片键（通常是COS中的存储键）
  imageKey?: string
  // 直接URL（用于向后兼容）
  src?: string
  // 替代文本
  alt?: string
  // 尺寸
  size?: ImageSize
  // 自定义尺寸
  width?: number | string
  height?: number | string
  // 是否圆角
  rounded?: boolean
  // 是否显示预览
  preview?: boolean
  // 加载配置
  options?: SmartImageOptions
  // 显示控制
  showLoadingText?: boolean
  showErrorText?: boolean
  showRetryButton?: boolean
  showActions?: boolean
  showRefreshButton?: boolean
  showIndicator?: boolean
  // 自定义占位图
  placeholder?: string
  // 自定义错误图
  errorImage?: string
}

const emit = defineEmits<Emits>()

const props = withDefaults(defineProps<Props>(), {
  alt: '',
  size: 'medium',
  rounded: false,
  preview: true,
  showLoadingText: false,
  showErrorText: true,
  showRetryButton: true,
  showActions: false,
  showRefreshButton: true,
  showIndicator: true,
  options: () => ({})
})

// 使用SmartImage
const {
  loadingState,
  currentUrl,
  error,
  retryCount,
  loadImage,
  retry,
  refresh,
  getProxyUrl
} = useSmartImage()

// 状态计算
const isLoading = computed(() => loadingState.value === ImageLoadingState.LOADING)
const isRetrying = computed(() => loadingState.value === ImageLoadingState.RETRYING)
const hasError = computed(() => loadingState.value === ImageLoadingState.ERROR)
const isSuccess = computed(() => loadingState.value === ImageLoadingState.SUCCESS)
const fromCache = computed(() => currentUrl.value && isSuccess.value)

// 显示的URL
const displaySrc = computed(() => {
  if (currentUrl.value) {
    return currentUrl.value
  }
  // 移除直接返回props.src的逻辑，避免直接使用cos_key
  // 如果currentUrl为空，返回空字符串或占位图
  return props.placeholder || ''
})

// 错误信息
const errorMessage = computed(() => {
  if (!error.value) return ''
  switch (error.value.type) {
    case 'network_error':
      return '网络连接失败'
    case 'timeout':
      return '加载超时'
    case 'not_found':
      return '图片不存在'
    case 'server_error':
      return '服务器错误'
    default:
      return error.value.message || '加载失败'
  }
})

// 加载文本
const loadingText = computed(() => {
  if (isRetrying.value) {
    return `重试中 (${retryCount.value})...`
  }
  return '加载中...'
})

// 容器样式
const containerStyle = computed(() => {
  const style: Record<string, any> = {
    position: 'relative',
    overflow: 'hidden'
  }

  if (props.size === 'custom' && props.width && props.height) {
    style.width = typeof props.width === 'number' ? `${props.width}px` : props.width
    style.height = typeof props.height === 'number' ? `${props.height}px` : props.height
  } else {
    const sizeMap: Record<ImageSize, { width: string; height: string }> = {
      small: { width: '50px', height: '50px' },
      medium: { width: '100px', height: '100px' },
      large: { width: '200px', height: '200px' },
      custom: { width: '100px', height: '100px' }
    }
    const size = sizeMap[props.size || 'medium']
    style.width = size.width
    style.height = size.height
  }

  return style
})

// 图片样式
const imageStyle = computed(() => {
  const style: Record<string, any> = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: 'center'
  }

  if (props.rounded) {
    style.borderRadius = '50%'
  }

  return style
})

// 加载状态样式
const loadingStyle = computed(() => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  height: '100%',
  backgroundColor: '#f5f5f5'
}))

// 错误状态样式
const errorStyle = computed(() => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  height: '100%',
  backgroundColor: '#f5f5f5',
  cursor: 'pointer'
}))

// 尺寸相关
const spinnerSize = computed(() => {
  const sizeMap: Record<ImageSize, number> = {
    small: 20,
    medium: 30,
    large: 40,
    custom: 30
  }
  return sizeMap[props.size || 'medium']
})

const errorIconSize = computed(() => {
  const sizeMap: Record<ImageSize, number> = {
    small: 20,
    medium: 30,
    large: 40,
    custom: 30
  }
  return sizeMap[props.size || 'medium']
})

// 检查是否为base64数据URI
const isDataURI = (url: string): boolean => {
  return url.startsWith('data:')
}

// 检查是否为图片数据URI
const isImageDataURI = (url: string): boolean => {
  return url.startsWith('data:image/')
}

// 加载图片
async function load() {
  try {
    // 如果有imageKey，使用imageKey
    if (props.imageKey) {
      const result = await loadImage(props.imageKey, props.options)
      if (!result.success && result.error) {
        emit('error', result.error)
      }
    }
    // 如果没有imageKey但有src
    else if (props.src) {
      // 如果是base64数据URI，直接使用
      if (isDataURI(props.src)) {
        // 如果是图片数据URI，检查是否为支持的格式
        if (isImageDataURI(props.src)) {
          const unsupportedFormats = ['tiff', 'tif', 'bmp']
          const formatMatch = props.src.match(/^data:image\/(\w+)/i)
          const format = formatMatch ? formatMatch[1].toLowerCase() : ''

          if (unsupportedFormats.includes(format)) {
            console.warn(`SmartImage: 不支持的图片格式 ${format.toUpperCase()}，将使用占位图`)
            // 不支持的格式，标记为错误
            loadingState.value = ImageLoadingState.ERROR
            error.value = new ImageError(
              `不支持的图片格式: ${format.toUpperCase()}`,
              ImageErrorType.UNKNOWN
            )
            emit('error', error.value)
            return
          }
        }

        // 支持的数据URI，直接使用
        currentUrl.value = props.src
      } else {
        // 如果是cos_key（images/.../xxx.jpg），使用代理
        const proxyUrl = `${API_CONFIG.IMAGE_PROXY.PROXY(props.src)}?mode=redirect`
        currentUrl.value = proxyUrl
      }
    } else {
      console.warn('SmartImage: imageKey or src is required')
    }
  } catch (err) {
    console.error('SmartImage load error:', err)
    emit('error', err)
  }
}

// 事件处理
function handleLoad(event: Event) {
  // 图片加载成功，更新状态
  if (loadingState.value === ImageLoadingState.LOADING || loadingState.value === ImageLoadingState.IDLE) {
    loadingState.value = ImageLoadingState.SUCCESS
  }
  emit('load', event)
}

function handleError(event: Event) {
  // 图片加载失败，更新状态
  loadingState.value = ImageLoadingState.ERROR
  console.error('SmartImage error:', event)
  emit('error', event)
}

async function handleRetry() {
  try {
    const result = await retry()
    if (result) {
      emit('retry', props.imageKey || '')
    }
  } catch (err) {
    console.error('SmartImage retry error:', err)
  }
}

async function handleRefresh() {
  try {
    const result = await refresh()
    if (result) {
      emit('refresh', props.imageKey || '')
      ElMessage.success('图片刷新成功')
    }
  } catch (err) {
    console.error('SmartImage refresh error:', err)
    ElMessage.error('图片刷新失败')
  }
}

// 监听imageKey和src变化
watch(
  [() => props.imageKey, () => props.src],
  () => {
    load()
  },
  { immediate: true }
)
</script>

<style scoped>
.smart-image {
  display: inline-block;
  background-color: #f5f5f5;
}

.smart-image--rounded {
  border-radius: 50%;
}

.smart-image__loading,
.smart-image__error {
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}

.loading-text,
.error-text {
  font-size: 12px;
  color: #999;
  text-align: center;
}

.error-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  color: #ccc;
}

.error-hint {
  margin: 4px 0;
  color: #999;
}

.smart-image__content {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  transition: opacity 0.3s ease;
}

.smart-image__actions {
  position: absolute;
  top: 4px;
  right: 4px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.smart-image:hover .smart-image__actions {
  opacity: 1;
}

.smart-image__indicator {
  position: absolute;
  bottom: 4px;
  right: 4px;
  display: flex;
  gap: 4px;
}

.indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  font-size: 12px;
  backdrop-filter: blur(4px);
}

.indicator--cache {
  background-color: rgba(82, 196, 26, 0.8);
  color: white;
}

.indicator--retry {
  background-color: rgba(24, 144, 255, 0.8);
  color: white;
}

.smart-image__preview {
  cursor: zoom-in;
}

.is-rotating {
  animation: rotating 2s linear infinite;
}

@keyframes rotating {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
