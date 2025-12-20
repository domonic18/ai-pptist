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

        <!-- 参考图上传区域 -->
        <div class="form-item compact ref-images-section">
          <label class="form-label">
            参考图片（可选）
            <el-tooltip placement="top" effect="light">
              <template #content>
                <div style="max-width: 300px;">
                  <p><strong>Nano Banana Pro 模型支持：</strong></p>
                  <p>上传参考图片，AI将参考其风格和构图生成新图片</p>
                  <p>• 支持上传1-3张参考图</p>
                  <p>• 适合PPT模板风格复用</p>
                </div>
              </template>
              <el-icon class="info-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </label>
          <div class="ref-images-upload">
            <el-upload
              v-model:file-list="refImagesList"
              :auto-upload="false"
              :limit="3"
              :on-change="handleRefImageChange"
              :on-remove="handleRefImageRemove"
              list-type="picture-card"
              accept="image/*"
              :disabled="loading"
            >
              <el-icon><Plus /></el-icon>
            </el-upload>
            <div class="upload-tip">最多上传3张参考图，支持 JPG、PNG 格式</div>
          </div>
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
              {{ typeof prompt === 'string' ? prompt : prompt.label }}
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
import { computed, ref } from 'vue'
import { MagicStick, Upload, Plus, QuestionFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { UploadFile, UploadUserFile } from 'element-plus'
import type { GenerationForm, ModelInfo } from './types'

interface Props {
  form: GenerationForm
  availableModels: ModelInfo[]
  loading: boolean
  quickPrompts: (string | { label: string; text: string })[]
}

interface Emits {
  (e: 'update:form', value: GenerationForm): void
  (e: 'selectPrompt', prompt: string | { label: string; text: string }): void
  (e: 'generate'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 参考图片列表
const refImagesList = ref<UploadUserFile[]>([])

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

/**
 * 将文件转换为base64
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * 处理参考图片上传变化
 */
const handleRefImageChange = async (uploadFile: UploadFile) => {
  try {
    if (!uploadFile.raw) return
    
    // 验证文件大小（限制5MB）
    const maxSize = 5 * 1024 * 1024
    if (uploadFile.raw.size > maxSize) {
      ElMessage.warning('图片大小不能超过5MB')
      // 移除超大文件
      const index = refImagesList.value.findIndex(f => f.uid === uploadFile.uid)
      if (index !== -1) {
        refImagesList.value.splice(index, 1)
      }
      return
    }
    
    // 转换为base64
    const base64 = await fileToBase64(uploadFile.raw)
    
    // 更新表单数据
    const currentRefImages = props.form.ref_images || []
    emit('update:form', {
      ...props.form,
      ref_images: [...currentRefImages, base64]
    })
    
    ElMessage.success('参考图片添加成功')
  } catch (error) {
    console.error('处理参考图片失败:', error)
    ElMessage.error('处理参考图片失败')
  }
}

/**
 * 处理参考图片移除
 */
const handleRefImageRemove = (uploadFile: UploadFile) => {
  // 找到移除的图片索引
  const index = refImagesList.value.findIndex(f => f.uid === uploadFile.uid)
  
  if (index !== -1 && props.form.ref_images) {
    // 移除对应的base64数据
    const newRefImages = [...props.form.ref_images]
    newRefImages.splice(index, 1)
    
    emit('update:form', {
      ...props.form,
      ref_images: newRefImages.length > 0 ? newRefImages : undefined
    })
  }
}
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
      .form-item {
        margin-bottom: 12px;

        .form-label {
          display: block;
          margin-bottom: 6px;
          font-size: 13px;
          font-weight: 500;
          color: #606266;
        }

        &.compact {
          margin-bottom: 0;
        }
      }

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

    .ref-images-section {
      margin-top: 12px;

      .form-label {
        display: flex;
        align-items: center;
        gap: 4px;

        .info-icon {
          color: #909399;
          font-size: 14px;
          cursor: help;

          &:hover {
            color: #409eff;
          }
        }
      }

      .ref-images-upload {
        .upload-tip {
          margin-top: 8px;
          font-size: 12px;
          color: #909399;
        }

        :deep(.el-upload-list) {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        :deep(.el-upload--picture-card) {
          width: 100px;
          height: 100px;
          line-height: 100px;
        }

        :deep(.el-upload-list__item) {
          width: 100px;
          height: 100px;
        }
      }
    }

    .quick-prompts {
      margin-top: 12px;
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