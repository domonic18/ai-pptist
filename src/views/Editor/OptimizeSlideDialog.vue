<template>
  <el-dialog
    :model-value="visible"
    title="优化幻灯片提示词"
    width="600px"
    :close-on-click-modal="false"
    :close-on-press-escape="true"
    @update:model-value="$emit('update:visible', $event)"
    @close="handleClose"
    :before-close="handleBeforeClose"
  >
    <!-- 优化中状态 -->
    <div v-if="optimizing" class="optimizing-overlay">
      <div class="optimizing-content">
        <el-icon class="loading-icon"><Loading /></el-icon>
        <div class="optimizing-text">AI正在优化幻灯片，请稍候...</div>
        <div class="optimizing-tip">优化完成后将自动更新幻灯片内容</div>
        <el-button
          type="danger"
          size="small"
          @click="handleCancelOptimize"
          class="cancel-button"
        >
          取消优化
        </el-button>
      </div>
    </div>

    <!-- 正常状态 -->
    <div v-else>
    <!-- 提示词编辑区域 -->
    <div class="prompt-section">
      <div class="input-container">
        <textarea
          ref="inputRef"
          v-model="prompt"
          placeholder="请输入优化幻灯片的提示词..."
          @keydown.enter.ctrl="handleOptimize"
          @keydown.enter.meta="handleOptimize"
        ></textarea>

        <!-- 模型切换区域 -->
        <div class="model-controls">
          <div class="model-group">
            <div class="model-label">对话模型</div>
            <el-select
              v-model="selectedChatModel"
              class="model-select"
              size="small"
              :loading="modelsLoading"
              placeholder="选择对话模型"
            >
              <el-option-group label="对话框模型">
                <el-option
                  v-for="model in chatModelOptions"
                  :key="model.value"
                  :label="model.label"
                  :value="model.value"
                />
              </el-option-group>
            </el-select>
          </div>

          <div class="model-group">
            <div class="model-label">文生图模型</div>
            <el-select
              v-model="selectedImageModel"
              class="model-select"
              size="small"
              :loading="modelsLoading"
              placeholder="选择文生图模型"
            >
              <el-option-group label="文生图模型">
                <el-option
                  v-for="model in imageModelOptions"
                  :key="model.value"
                  :label="model.label"
                  :value="model.value"
                />
              </el-option-group>
            </el-select>
          </div>

          <!-- 发送给AI按钮 -->
          <div class="send-button-container">
            <button
              @click="handleOptimize"
              :disabled="!prompt.trim() || loading"
              class="send-button"
              title="发送给AI优化幻灯片"
            >
              <el-icon><Promotion /></el-icon>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 快捷提示词区域 -->
    <div class="quick-prompts">
      <!-- 文字相关快捷提示词 -->
      <div class="prompt-category">
        <div class="category-label">文字优化</div>
        <div class="prompt-buttons">
          <button
            v-for="(quickPrompt, index) in textQuickPrompts"
            :key="index"
            @click="setPrompt(quickPrompt.text)"
            class="prompt-button"
          >
            <el-icon><component :is="quickPrompt.icon" /></el-icon>
            <span>{{ quickPrompt.label }}</span>
          </button>
        </div>
      </div>

      <!-- 图片相关快捷提示词 -->
      <div class="prompt-category">
        <div class="category-label">图像生成</div>
        <div class="prompt-buttons">
          <button
            v-for="(quickPrompt, index) in imageQuickPrompts"
            :key="index"
            @click="setPrompt(quickPrompt.text)"
            class="prompt-button"
          >
            <el-icon><component :is="quickPrompt.icon" /></el-icon>
            <span>{{ quickPrompt.label }}</span>
          </button>
        </div>
      </div>
      </div>
    </div>
  </el-dialog>
</template>

<script lang="ts" setup>
import { ref, onMounted, useTemplateRef } from 'vue'
import { storeToRefs } from 'pinia'
import { useSlidesStore, useMainStore } from '@/store'
import { optimizeSlideLayout } from '@/services/optimization'
import apiService from '@/services'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'
import message from '@/utils/message'
import { ElDialog, ElSelect, ElOption, ElOptionGroup, ElIcon, ElButton } from 'element-plus'
import { MagicStick, Promotion, View, Edit, Check, Expand, Picture, Loading } from '@element-plus/icons-vue'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'close'): void
}>()

const slidesStore = useSlidesStore()
const { currentSlide, viewportSize, viewportRatio } = storeToRefs(slidesStore)
const { addHistorySnapshot } = useHistorySnapshot()

// 状态
const prompt = ref('')
const loading = ref(false)
const optimizing = ref(false)
const optimizeTimeout = ref<number | null>(null)
const inputRef = useTemplateRef<HTMLTextAreaElement>('inputRef')

// 模型相关
const modelsLoading = ref(false)
const selectedChatModel = ref('')
const selectedImageModel = ref('')
const chatModelOptions = ref<Array<{ label: string; value: string }>>([])
const imageModelOptions = ref<Array<{ label: string; value: string }>>([])

// 文字相关快捷提示词列表
const textQuickPrompts = [
  { label: '尝试新的布局', text: '重新设计幻灯片布局，使其更具视觉吸引力。文字内容不要修改。', icon: View },
  { label: '改进写作', text: '优化幻灯片内容的表达方式，使其更清晰易懂', icon: Edit },
  { label: '修正拼写和语法', text: '检查并修正幻灯片中的拼写和语法错误', icon: Check },
  { label: '翻译', text: '将幻灯片内容翻译成英文', icon: MagicStick },
  { label: '使其更直观', text: '使内容表达更直观易懂，便于观众理解', icon: Expand }
]

// 图片相关快捷提示词列表
const imageQuickPrompts = [
  { label: '根据内容生成图片', text: '为幻灯片添加相关图像以增强视觉效果', icon: Picture }
]


// 获取AI模型列表
const fetchAIModels = async () => {
  modelsLoading.value = true
  try {
    const models = await apiService.getAIModels()

    // 分类模型
    const chatModels = models.filter((m: any) =>
      m.is_enabled && m.supports_chat
    )
    const imageModels = models.filter((m: any) =>
      m.is_enabled && m.supports_image_generation
    )

    // 转换为选项格式
    chatModelOptions.value = chatModels.map((m: any) => ({
      label: m.name,
      value: m.name
    }))

    imageModelOptions.value = imageModels.map((m: any) => ({
      label: m.name,
      value: m.name
    }))

    // 设置默认模型 - 优先选择标记为默认的模型，否则选择第一个
    const defaultChatModel = models.find((m: any) => m.is_default && m.is_enabled && m.supports_chat)
    if (defaultChatModel) {
      selectedChatModel.value = defaultChatModel.name
    } else if (chatModelOptions.value.length > 0) {
      selectedChatModel.value = chatModelOptions.value[0].value
    }

    const defaultImageModel = models.find((m: any) => m.is_default && m.is_enabled && m.supports_image_generation)
    if (defaultImageModel) {
      selectedImageModel.value = defaultImageModel.name
    } else if (imageModelOptions.value.length > 0) {
      selectedImageModel.value = imageModelOptions.value[0].value
    }
  } catch (error) {
    console.error('Failed to fetch AI models:', error)
    message.error('获取AI模型列表失败，使用默认模型')

    // 回退选项
    chatModelOptions.value = [
      { label: 'GLM-4.5-Air', value: 'GLM-4.5-Air' },
      { label: 'GLM-4.5-Flash', value: 'GLM-4.5-Flash' },
    ]
    imageModelOptions.value = [
      { label: 'DALL-E 3', value: 'dall-e-3' },
      { label: 'Stable Diffusion', value: 'stable-diffusion' },
    ]

    if (chatModelOptions.value.length > 0) {
      selectedChatModel.value = chatModelOptions.value[0].value
    }
    if (imageModelOptions.value.length > 0) {
      selectedImageModel.value = imageModelOptions.value[0].value
    }
  } finally {
    modelsLoading.value = false
  }
}

// 处理关闭对话框
const handleClose = () => {
  emit('close')
}

// 处理对话框关闭前
const handleBeforeClose = (done: () => void) => {
  if (optimizing.value) {
    // 优化中不允许关闭
    message.warning('优化进行中，请等待完成或取消优化')
    return
  }
  done()
}

// 设置提示词
const setPrompt = (text: string) => {
  if (prompt.value) {
    prompt.value += '\n' + text
  } else {
    prompt.value = text
  }
  inputRef.value?.focus()
}

// 处理优化超时
const handleOptimizeTimeout = () => {
  optimizing.value = false
  loading.value = false

  // 清理超时定时器
  if (optimizeTimeout.value) {
    clearTimeout(optimizeTimeout.value)
    optimizeTimeout.value = null
  }

  message.error('优化超时，请检查网络连接或稍后重试')

  // 重新打开对话框
  emit('update:visible', true)
}

// 处理取消优化
const handleCancelOptimize = () => {
  optimizing.value = false
  loading.value = false

  // 清理超时定时器
  if (optimizeTimeout.value) {
    clearTimeout(optimizeTimeout.value)
    optimizeTimeout.value = null
  }

  message.info('已取消优化')

  // 重新打开对话框
  emit('update:visible', true)
}

// 处理优化请求
const handleOptimize = async () => {
  if (!prompt.value.trim()) {
    message.warning('请输入优化需求')
    return
  }

  if (!currentSlide.value || currentSlide.value.elements.length === 0) {
    message.warning('当前幻灯片没有可优化的元素')
    return
  }

  // 立即关闭对话框，显示优化中状态
  emit('update:visible', false)
  optimizing.value = true
  loading.value = true

  // 设置超时处理（120秒超时）
  optimizeTimeout.value = setTimeout(() => {
    if (optimizing.value) {
      handleOptimizeTimeout()
    }
  }, 120000) as unknown as number

  try {
    // 添加历史快照
    addHistorySnapshot()

    // 调用优化服务
    const response = await optimizeSlideLayout(
      currentSlide.value.id,
      currentSlide.value.elements,
      {
        width: viewportSize.value,
        height: viewportSize.value * viewportRatio.value,
      },
      undefined,
      prompt.value.trim(),
      {
        model: selectedChatModel.value
      }
    )

    if (response.status === 'success' && response.data) {
      // 更新幻灯片元素
      slidesStore.updateSlide({
        elements: currentSlide.value.elements.map((originalEl: any) => {
          const optimizedEl = response.data!.elements.find(
            (opt: any) => opt.id === originalEl.id
          )
          if (optimizedEl) {
            const updatedElement = { ...originalEl }

            // 更新基础位置属性
            updatedElement.left = optimizedEl.left
            updatedElement.top = optimizedEl.top

            // 更新尺寸和旋转（线条元素没有这些属性）
            if (originalEl.type !== 'line') {
              if ('width' in updatedElement && optimizedEl.width !== undefined) {
                (updatedElement as any).width = optimizedEl.width
              }
              if ('height' in updatedElement && optimizedEl.height !== undefined) {
                (updatedElement as any).height = optimizedEl.height
              }
              if ('rotate' in updatedElement && optimizedEl.rotate !== undefined) {
                (updatedElement as any).rotate = optimizedEl.rotate
              }
            }

            return updatedElement
          }
          return originalEl
        }),
      })

      message.success('幻灯片优化完成！')

      // 优化成功后完全关闭对话框，不重新打开
      emit('close')
    } else {
      throw new Error(response.message || '优化失败')
    }
  } catch (error: any) {
    console.error('优化失败:', error)
    message.error(`优化失败：${error.message}`)

    // 优化失败时重新打开对话框
    emit('update:visible', true)
  } finally {
    // 清理状态
    optimizing.value = false
    loading.value = false
    if (optimizeTimeout.value) {
      clearTimeout(optimizeTimeout.value)
      optimizeTimeout.value = null
    }
  }
}

// 组件挂载时获取模型列表
onMounted(() => {
  fetchAIModels()
})
</script>

<style lang="scss" scoped>
.prompt-section {
  margin-bottom: 1.5rem;
  position: relative;

  .input-container {
    border: 1px solid #bfdbfe;
    border-radius: 0.5rem;
    overflow: hidden;
    box-sizing: border-box;
  }

  textarea {
    width: 100%;
    height: 160px;
    padding: 1rem;
    border: none; /* 去掉独立边框 */
    outline: none;
    resize: none;
    font-family: inherit;
    font-size: 14px;
    line-height: 1.5;
    box-sizing: border-box;

    &:focus {
      box-shadow: none;
    }

    &::placeholder {
      color: #9ca3af;
    }
  }

  .model-controls {
    display: flex;
    // border-top: 1px solid #bfdbfe; /* 只保留顶部边框作为分割 */
    overflow: hidden;
    box-sizing: border-box;

    .model-group {
      flex: 1;
      display: flex;
      align-items: center;

      .model-label {
        font-size: 0.75rem;
        color: #6b7280;
        padding: 0 0.5rem;
        width: 5rem;
      }

      .model-select {
        flex: 1;
      }
    }

    .model-group + .model-group {
      border-left: none; /* 去掉组之间的竖线 */
    }

    .send-button-container {
      display: flex;
      align-items: center;
      border-left: none; /* 去掉按钮容器的左边框 */
      padding: 0 0.5rem;

      .send-button {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2rem;
        height: 2rem;
        background-color: #3b82f6;
        color: white;
        border-radius: 50%;
        border: none;
        cursor: pointer;
        transition: background-color 0.2s ease;
        white-space: nowrap;

        &:hover:not(:disabled) {
          background-color: #2563eb;
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }
  }
}

.quick-prompts {
  margin-bottom: 1.5rem;

  .prompt-category {
    margin-bottom: 1rem;

    .category-label {
      font-size: 0.875rem; /* 增大分组文字大小 */
      color: #6b7280;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }

    .prompt-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;

      .prompt-button {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        color: #3b82f6;
        background: none;
        border: none;
        cursor: pointer;
        font-size: 0.75rem; /* 减小快捷文字大小 */
        white-space: nowrap;
        transition: color 0.2s ease;
        border-radius: 6px;
        padding: 0.25rem 0.5rem;

        &:hover {
          color: #1d4ed8;
          background-color: #eff6ff;
        }
      }
    }
  }
}

/* 优化中状态样式 */
.optimizing-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  border-radius: 8px;
}

.optimizing-content {
  text-align: center;
  padding: 2rem;
  max-width: 300px;
}

.loading-icon {
  font-size: 3rem;
  color: #3b82f6;
  margin-bottom: 1rem;
  animation: spin 1s linear infinite;
}

.optimizing-text {
  font-size: 1.1rem;
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.optimizing-tip {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 1.5rem;
}

.cancel-button {
  margin-top: 1rem;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 确保对话框在视口中居中 */
:deep(.el-select) {
  width: 100%;
}
:deep(.el-select .el-input__inner) {
  border-color: #bfdbfe;
  border-radius: 0;
  border: none;
  box-shadow: none;
}

:deep(.el-select .el-input__inner:focus) {
  box-shadow: none;
}

/* 加载状态样式 */
:deep(.el-loading-spinner .circular) {
  animation: loading-rotate 2s linear infinite;
}

@keyframes loading-rotate {
  100% {
    transform: rotate(360deg);
  }
}
</style>