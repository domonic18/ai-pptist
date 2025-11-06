<template>
  <el-dialog
    :model-value="visible"
    title="优化幻灯片提示词"
    width="600px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    @update:model-value="handleUpdateVisible"
    @close="handleDialogCloseEvent"
    @closed="handleDialogClosedEvent"
    :before-close="handleBeforeClose"
    append-to-body
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

          <!-- Temperature调节区域 -->
          <div class="temperature-controls">
            <div class="temperature-group">
              <div class="temperature-label">
                <span>生成多样性</span>
                <el-tooltip
                  content="控制AI生成内容的多样性。较低值（如0.2）更确定，较高值（如1.0）更随机"
                  placement="top"
                >
                  <el-icon class="info-icon"><InfoFilled /></el-icon>
                </el-tooltip>
              </div>
              <div class="temperature-slider-container">
                <el-slider
                  v-model="temperature"
                  :min="0.0"
                  :max="2.0"
                  :step="0.1"
                  :format-tooltip="formatTemperatureTooltip"
                  show-stops
                  :marks="TEMPERATURE_MARKS"
                  class="temperature-slider"
                />
                <div class="temperature-value">{{ temperature.toFixed(1) }}</div>
              </div>
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
              v-for="(quickPrompt, index) in TEXT_QUICK_PROMPTS"
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
              v-for="(quickPrompt, index) in IMAGE_QUICK_PROMPTS"
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
import { onMounted, nextTick, toRef } from 'vue'
import { ElDialog, ElSelect, ElOption, ElOptionGroup, ElIcon, ElButton, ElSlider, ElTooltip } from 'element-plus'
import { Promotion, Loading, InfoFilled } from '@element-plus/icons-vue'
import useOptimizeDialog from '@/hooks/useOptimizeDialog'
import useAIModelSelection from '@/hooks/useAIModelSelection'
import useSlideOptimization from '@/hooks/useSlideOptimization'
import { 
  TEXT_QUICK_PROMPTS, 
  IMAGE_QUICK_PROMPTS, 
  TEMPERATURE_MARKS 
} from '@/configs/optimizePrompts'

// ==================== Props & Emits ====================

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'close'): void
}>()

// ==================== Hooks ====================

// 对话框状态管理
const { optimizing } = useSlideOptimization()
const {
  prompt,
  temperature,
  inputRef,
  handleDialogClosed,
  handleDialogClose,
  handleBeforeClose,
  setPrompt,
  formatTemperatureTooltip,
} = useOptimizeDialog(toRef(props, 'visible'), optimizing)

// AI模型选择
const {
  modelsLoading,
  selectedChatModel,
  selectedImageModel,
  chatModelOptions,
  imageModelOptions,
  fetchAIModels,
} = useAIModelSelection()

// 幻灯片优化
const {
  loading,
  executeOptimization,
  cancelOptimize,
  clearOptimizationState,
} = useSlideOptimization()

// ==================== Event Handlers ====================

/**
 * 处理visible属性更新
 * 这是v-model:visible的关键处理函数
 */
const handleUpdateVisible = (value: boolean) => {
  emit('update:visible', value)
}

/**
 * 处理对话框close事件
 */
const handleDialogCloseEvent = () => {
  handleDialogClose({
    onClose: () => emit('close')
  })
}

/**
 * 处理对话框完全关闭后的回调
 */
const handleDialogClosedEvent = () => {
  clearOptimizationState()
  handleDialogClosed()
}

/**
 * 取消优化
 */
const handleCancelOptimize = async () => {
  await cancelOptimize({
    onCancel: async () => {
      emit('update:visible', false)
      await nextTick()
      emit('close')
    }
  })
}

/**
 * 处理优化请求
 */
const handleOptimize = async () => {
  await executeOptimization(
    {
      prompt: prompt.value,
      chatModel: selectedChatModel.value,
      temperature: temperature.value,
    },
    {
      onSuccess: async () => {
        emit('update:visible', false)
        await nextTick()
        emit('close')
      },
      // 失败时保持对话框打开，让用户可以修改参数重试
    }
  )
}

// ==================== Lifecycle ====================

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
    border: none;
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
      border-left: none;
    }

    .send-button-container {
      display: flex;
      align-items: center;
      border-left: none;
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

  .temperature-controls {
    border-top: 1px solid #e5e7eb;
    padding: 1rem;
    background-color: #f9fafb;

    .temperature-group {
      .temperature-label {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.875rem;
        color: #374151;
        margin-bottom: 0.75rem;
        font-weight: 500;

        .info-icon {
          color: #9ca3af;
          cursor: help;
          font-size: 0.75rem;

          &:hover {
            color: #6b7280;
          }
        }
      }

      .temperature-slider-container {
        display: flex;
        align-items: center;
        gap: 1rem;

        .temperature-slider {
          flex: 1;
        }

        .temperature-value {
          min-width: 2.5rem;
          text-align: center;
          font-size: 0.875rem;
          font-weight: 600;
          color: #3b82f6;
          background-color: #eff6ff;
          padding: 0.25rem 0.5rem;
          border-radius: 0.375rem;
          border: 1px solid #dbeafe;
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
      font-size: 0.875rem;
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
        font-size: 0.75rem;
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
