<template>
  <el-dialog
    :model-value="visible"
    title="图片预览"
    width="80%"
    :before-close="handleClose"
    @update:model-value="$emit('update:visible', $event)"
    class="preview-modal"
    destroy-on-close
  >
    <div v-if="previewImage" class="preview-content">
      <div class="preview-image">
        <img
          :src="previewImage.url"
          :alt="previewImage.prompt"
          @load="imageLoaded = true"
          @error="imageError = true"
        />
        <div v-if="!imageLoaded && !imageError" class="loading">
          <el-icon class="loading-icon"><Loading /></el-icon>
          <span>加载中...</span>
        </div>
        <div v-if="imageError" class="error">
          <el-icon class="error-icon"><Warning /></el-icon>
          <span>加载失败</span>
        </div>
      </div>

      <div class="preview-info">
        <div class="info-section">
          <h3>图片信息</h3>
          <div class="info-item">
            <span class="label">提示词：</span>
            <span class="value">{{ previewImage.prompt }}</span>
          </div>
          <div class="info-item">
            <span class="label">模型：</span>
            <span class="value">{{ previewImage.generation_model }}</span>
          </div>
          <div class="info-item">
            <span class="label">尺寸：</span>
            <span class="value">{{ previewImage.width }} × {{ previewImage.height }}</span>
          </div>
          <div class="info-item">
            <span class="label">生成时间：</span>
            <span class="value">{{ formatDateTime(previewImage.timestamp) }}</span>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="copyPrompt" :disabled="!previewImage">
          <el-icon><CopyDocument /></el-icon>
          复制提示词
        </el-button>
        <el-button type="primary" @click="downloadImage" :disabled="!previewImage">
          <el-icon><Download /></el-icon>
          下载图片
        </el-button>
        <el-button @click="handleClose">关闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Loading, Warning, CopyDocument, Download } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { GeneratedImage } from './types'

interface Props {
  visible: boolean
  image: GeneratedImage | null
}

interface Emits {
  (e: 'update:visible', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const visible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const previewImage = ref(props.image)
const imageLoaded = ref(false)
const imageError = ref(false)

// 监听图片变化
watch(() => props.image, (newImage) => {
  previewImage.value = newImage
  imageLoaded.value = false
  imageError.value = false
})

const formatDateTime = (time: Date | string) => {
  const date = typeof time === 'string' ? new Date(time) : time
  return date.toLocaleString('zh-CN')
}

const handleClose = () => {
  visible.value = false
}

const copyPrompt = async () => {
  if (!previewImage.value) return

  try {
    await navigator.clipboard.writeText(previewImage.value.prompt)
    ElMessage.success('提示词已复制到剪贴板')
  }
  catch (error) {
    ElMessage.error('复制失败')
  }
}

const downloadImage = () => {
  if (!previewImage.value) return

  const link = document.createElement('a')
  link.href = previewImage.value.url
  link.download = `generated-image-${previewImage.value.id}.png`
  link.click()
}
</script>

<style scoped lang="scss">
.preview-modal {
  .preview-content {
    display: flex;
    gap: 24px;

    .preview-image {
      flex: 1;
      position: relative;
      border: 1px solid #e4e7ed;
      border-radius: 8px;
      overflow: hidden;
      background: #f5f7fa;
      min-height: 400px;
      display: flex;
      align-items: center;
      justify-content: center;

      img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }

      .loading,
      .error {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        color: #909399;

        .loading-icon {
          font-size: 32px;
          animation: spin 1s linear infinite;
        }

        .error-icon {
          font-size: 32px;
          color: #f56c6c;
        }
      }
    }

    .preview-info {
      width: 300px;
      flex-shrink: 0;

      .info-section {
        h3 {
          margin: 0 0 16px 0;
          font-size: 16px;
          color: #303133;
          border-bottom: 1px solid #e4e7ed;
          padding-bottom: 8px;
        }

        .info-item {
          margin-bottom: 12px;
          font-size: 14px;

          .label {
            font-weight: 500;
            color: #606266;
            margin-right: 8px;
          }

          .value {
            color: #303133;
            word-break: break-all;
          }
        }
      }
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>