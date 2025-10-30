<template>
  <div class="optimize-slide-dialog">
    <div class="header">
      <span class="title">优化幻灯片</span>
    </div>

    <div class="input-section">
      <div class="input-wrapper">
        <Input
          ref="inputRef"
          :value="prompt"
          @input="(e: any) => prompt = e.target.value"
          type="textarea"
          :rows="6"
          placeholder="描述您希望的优化效果，例如：调整布局让页面更协调、统一字体风格、优化色彩搭配..."
          @keydown.enter.ctrl="handleOptimize"
          @keydown.enter.meta="handleOptimize"
        />
        <div class="input-actions">
          <Button
            class="send-button"
            type="primary"
            :disabled="!prompt.trim() || loading"
            :loading="loading"
            @click="handleOptimize"
            v-tooltip="'发送给AI'"
          >
            <IconSend class="send-icon" />
          </Button>
        </div>
      </div>
    </div>

    <div class="quick-actions">
      <div class="action-buttons">
        <Button
          class="quick-btn"
          size="small"
          @click="setPrompt('尝试新布局')"
        >
          尝试新布局
        </Button>
        <Button
          class="quick-btn"
          size="small"
          @click="setPrompt('添加适当的图片元素，提升视觉效果')"
        >
          添加图像
        </Button>
        <Button
          class="quick-btn"
          size="small"
          @click="setPrompt('统一字体和色彩风格，提升整体美观度')"
        >
          美化样式
        </Button>
        <Button
          class="quick-btn"
          size="small"
          @click="setPrompt('优化元素对齐和间距，让布局更加专业')"
        >
          对齐布局
        </Button>
      </div>
    </div>

    <div class="model-section">
      <div class="config-grid">
        <div class="config-item">
          <label>对话模型</label>
          <Select
            :value="selectedChatModel"
            @update:value="(value: string | number) => selectedChatModel = String(value)"
            placeholder="选择对话模型"
            :loading="modelsLoading"
            :options="chatModelOptions"
            class="model-select"
          />
        </div>
        <div class="config-item">
          <label>文生图模型</label>
          <Select
            :value="selectedImageModel"
            @update:value="(value: string | number) => selectedImageModel = String(value)"
            placeholder="选择文生图模型"
            :loading="modelsLoading"
            :options="imageModelOptions"
            class="model-select"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, useTemplateRef } from 'vue'
import { storeToRefs } from 'pinia'
import { useSlidesStore, useMainStore } from '@/store'
import { optimizeSlideLayout } from '@/services/optimization'
import apiService from '@/services'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'
import message from '@/utils/message'
import Input from '@/components/Input.vue'
import Button from '@/components/Button.vue'
import Select from '@/components/Select.vue'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const slidesStore = useSlidesStore()
const mainStore = useMainStore()
const { currentSlide, viewportSize, viewportRatio } = storeToRefs(slidesStore)
const { addHistorySnapshot } = useHistorySnapshot()

// 状态
const prompt = ref('')
const loading = ref(false)
const inputRef = useTemplateRef<InstanceType<typeof Input>>('inputRef')

// 模型相关
const modelsLoading = ref(false)
const selectedChatModel = ref('')
const selectedImageModel = ref('')
const chatModelOptions = ref<Array<{ label: string; value: string }>>([])
const imageModelOptions = ref<Array<{ label: string; value: string }>>([])


// 获取AI模型列表
const fetchAIModels = async () => {
  modelsLoading.value = true
  try {
    const models = await apiService.getAIModels()

    // 分类模型
    const chatModels = models.filter(m =>
      m.is_enabled && (m.supports_chat || (!m.supports_chat && !m.supports_image_generation))
    )
    const imageModels = models.filter(m =>
      m.is_enabled && m.supports_image_generation
    )

    // 转换为选项格式
    chatModelOptions.value = chatModels.map(m => ({
      label: m.name,
      value: m.name
    }))

    imageModelOptions.value = imageModels.map(m => ({
      label: m.name,
      value: m.name
    }))

    // 设置默认模型 - 优先选择标记为默认的模型，否则选择第一个
    const defaultChatModel = models.find((m: any) => m.is_default && m.is_enabled &&
      (m.supports_chat || (!m.supports_chat && !m.supports_image_generation)))
    if (defaultChatModel) {
      selectedChatModel.value = defaultChatModel.name
    }
    else if (chatModelOptions.value.length > 0) {
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

// 设置提示词
const setPrompt = (text: string) => {
  prompt.value = text
  inputRef.value?.focus()
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

  loading.value = true

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
      }
    )

    if (response.status === 'success' && response.data) {
      // 更新幻灯片元素
      slidesStore.updateSlide({
        elements: currentSlide.value.elements.map(originalEl => {
          const optimizedEl = response.data!.elements.find(
            opt => opt.id === originalEl.id
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
      emit('close')
    } else {
      throw new Error(response.message || '优化失败')
    }
  } catch (error: any) {
    message.error(`优化失败：${error.message}`)
  } finally {
    loading.value = false
  }
}

// 组件挂载时获取模型列表
onMounted(() => {
  fetchAIModels()
})
</script>

<style lang="scss" scoped>
.optimize-slide-dialog {
  padding: 24px;
  min-width: 520px;
  background: linear-gradient(135deg, #fafbfc 0%, #f6f8fa 100%);
}

.header {
  margin-bottom: 24px;
  text-align: center;

  .title {
    font-size: 22px;
    font-weight: 700;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    background-clip: text;
    color: transparent;
    display: block;
    margin-bottom: 4px;
  }
}

.input-section {
  margin-bottom: 24px;

  .input-wrapper {
    position: relative;

    :deep(.el-textarea__inner) {
      border: 2px solid #e4e7ed;
      border-radius: 12px;
      padding: 16px;
      font-size: 15px;
      line-height: 1.6;
      resize: none;
      transition: all 0.3s ease;
      background: white;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

      &:focus {
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        outline: none;
      }

      &::placeholder {
        color: #909399;
        font-style: italic;
      }
    }

    .input-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 12px;

      .send-button {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        border-radius: 8px;
        padding: 10px 20px;
        display: flex;
        align-items: center;
        gap: 6px;
        font-weight: 600;
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);

        &:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
        }

        &:active:not(:disabled) {
          transform: translateY(0);
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .send-icon {
          width: 16px;
          height: 16px;
        }
      }
    }
  }
}

.quick-actions {
  margin-bottom: 24px;

  .action-buttons {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;

    .quick-btn {
      background: white;
      border: 1px solid #e4e7ed;
      border-radius: 8px;
      padding: 10px 16px;
      font-size: 13px;
      font-weight: 500;
      color: #606266;
      transition: all 0.2s ease;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

      &:hover {
        border-color: #667eea;
        color: #667eea;
        background: #f8f9ff;
        transform: translateY(-1px);
        box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
      }

      &:active {
        transform: translateY(0);
      }
    }
  }
}

.model-section {
  margin-bottom: 8px;

  .config-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;

    .config-item {
      display: flex;
      flex-direction: column;
      gap: 8px;

      label {
        font-size: 13px;
        font-weight: 600;
        color: #303133;
        margin-bottom: 4px;
      }

      .model-select {
        :deep(.el-input__inner) {
          border-radius: 8px;
          border: 1px solid #e4e7ed;
          background: white;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;

          &:focus {
            border-color: #667eea;
            box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
          }
        }

        :deep(.el-select__caret) {
          color: #909399;
        }
      }
    }
  }
}

/* 响应式设计 */
@media (max-width: 600px) {
  .optimize-slide-dialog {
    padding: 16px;
    min-width: auto;
  }

  .quick-actions .action-buttons {
    grid-template-columns: 1fr;
  }

  .model-section .config-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

/* 加载动画 */
:deep(.el-loading-spinner) {
  .circular {
    animation: loading-rotate 2s linear infinite;
  }
}

@keyframes loading-rotate {
  100% {
    transform: rotate(360deg);
  }
}

/* 焦点状态优化 */
:deep(.el-textarea__inner:focus),
:deep(.el-input__inner:focus) {
  border-color: #667eea !important;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1) !important;
}

/* 按钮禁用状态 */
:deep(.el-button.is-disabled) {
  background: #f5f7fa !important;
  border-color: #e4e7ed !important;
  color: #c0c4cc !important;
}
</style>