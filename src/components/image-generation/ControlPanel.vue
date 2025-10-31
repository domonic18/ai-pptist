<template>
  <el-card class="control-panel compact">
    <template #header>
      <div class="card-header">
        <div class="header-title">
          <el-icon class="title-icon"><MagicStick /></el-icon>
          <span>图像生成控制面板</span>
        </div>
      </div>
    </template>

    <div class="control-content compact">
      <!-- 主要控件网格布局 -->
      <div class="control-grid">
        <!-- 左侧：模型选择 -->
        <div class="grid-section model-section">
          <div class="form-item compact">
            <label class="form-label">选择模型</label>
            <el-select
              v-model="form.generation_model"
              placeholder="选择模型"
              class="model-select"
              :disabled="loading"
            >
              <el-option
                v-for="model in availableModels"
                :key="model.id"
                :label="`${model.name} (${model.provider})`"
                :value="model.ai_model_name || model.name"
              >
                <div class="model-option">
                  <div class="model-info">
                    <span class="model-name">{{ model.name }}</span>
                    <span class="model-provider">{{ model.provider }}</span>
                  </div>
                  <el-tag type="info" size="small">{{ model.provider }}</el-tag>
                </div>
              </el-option>
            </el-select>
          </div>
        </div>

        <!-- 右侧：高级参数 -->
        <div class="grid-section params-section">
          <div class="params-row">
            <div class="form-item compact inline">
              <label class="form-label">尺寸</label>
              <el-select v-model="imageSize" placeholder="尺寸" :disabled="loading" size="small">
                <el-option label="256×256" value="256x256" />
                <el-option label="512×512" value="512x512" />
                <el-option label="1024×1024" value="1024x1024" />
                <el-option label="1792×1024" value="1792x1024" />
                <el-option label="1024×1792" value="1024x1792" />
              </el-select>
            </div>
            <div class="form-item compact inline">
              <label class="form-label">质量</label>
              <el-select v-model="form.quality" placeholder="质量" :disabled="loading" size="small">
                <el-option label="标准" value="standard" />
                <el-option label="高清" value="hd" />
              </el-select>
            </div>
            <div class="form-item compact inline">
              <label class="form-label">风格</label>
              <el-select v-model="form.style" placeholder="风格" :disabled="loading" size="small">
                <el-option label="生动" value="vivid" />
                <el-option label="自然" value="natural" />
              </el-select>
            </div>
          </div>
        </div>
      </div>

      <!-- 提示词输入区域 -->
      <div class="prompt-section">
        <div class="form-item compact">
          <label class="form-label">图像描述</label>
          <el-input
            v-model="form.prompt"
            type="textarea"
            :rows="2"
            placeholder="请详细描述您想要生成的图像..."
            :disabled="loading"
            maxlength="2000"
            show-word-limit
            resize="none"
          />
        </div>

        <!-- 快速示例 -->
        <div class="quick-prompts compact">
          <span class="quick-label">快速示例：</span>
          <div class="prompt-buttons">
            <el-button
              v-for="(prompt, index) in quickPrompts"
              :key="index"
              size="small"
              @click="$emit('selectPrompt', prompt)"
              :disabled="loading"
              class="prompt-btn"
            >
              {{ prompt }}
            </el-button>
          </div>
        </div>
      </div>

      <!-- 操作区域 -->
      <div class="action-section">
        <div class="action-left">
          <!-- 预留空间供将来使用 -->
        </div>
        <div class="action-right">
          <el-button
            type="primary"
            :loading="loading"
            :disabled="!canGenerate"
            @click="$emit('generate')"
            class="generate-btn"
          >
            <el-icon v-if="!loading"><MagicStick /></el-icon>
            {{ loading ? '生成中...' : '生成图片' }}
          </el-button>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { MagicStick, Upload } from '@element-plus/icons-vue'
import type { GenerationForm, ModelInfo } from './types'

interface Props {
  form: GenerationForm
  availableModels: ModelInfo[]
  loading: boolean
  quickPrompts: string[]
}

interface Emits {
  (e: 'update:form', value: GenerationForm): void
  (e: 'selectPrompt', prompt: string): void
  (e: 'generate'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const form = computed({
  get: () => props.form,
  set: (value) => emit('update:form', value)
})

const imageSize = computed({
  get: () => `${props.form.width}x${props.form.height}`,
  set: (value) => {
    const [width, height] = value.split('x').map(Number)
    emit('update:form', {
      ...props.form,
      width,
      height
    })
  }
})

const canGenerate = computed(() =>
  props.form.prompt.trim() && props.form.generation_model
)
</script>

<style scoped lang="scss">
.control-panel {
  margin-bottom: 16px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .header-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      color: #303133;

      .title-icon {
        color: #409eff;
      }
    }
  }

  .control-content {
    &.compact {
      .control-grid {
        display: grid;
        grid-template-columns: 1fr 2fr;
        gap: 20px;
        align-items: start;

        .grid-section {
          &.model-section {
            .form-item {
              margin-bottom: 0;
            }
          }

          &.params-section {
            .params-row {
              display: flex;
              gap: 12px;
              align-items: end;

              .form-item {
                margin-bottom: 0;
                flex: 1;

                &.inline {
                  .form-label {
                    font-size: 12px;
                    margin-bottom: 4px;
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  .prompt-section {
    margin-top: 16px;

    .quick-prompts {
      margin-top: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;

      .quick-label {
        font-size: 12px;
        color: #909399;
        white-space: nowrap;
      }

      .prompt-buttons {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;

        .prompt-btn {
          font-size: 11px;
          padding: 4px 8px;
        }
      }
    }
  }

  .action-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 16px;

    .action-right {
      display: flex;
      gap: 8px;

      .generate-btn {
        min-width: 120px;
      }

      .generate-store-btn {
        min-width: 120px;
        background: linear-gradient(135deg, #67c23a, #85ce61);
        border-color: #67c23a;

        &:hover {
          background: linear-gradient(135deg, #85ce61, #67c23a);
          border-color: #85ce61;
        }
      }
    }
  }
}
</style>