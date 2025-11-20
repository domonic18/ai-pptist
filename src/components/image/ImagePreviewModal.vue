<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    :title="previewImage?.filename || previewImage?.original_filename"
    width="80%"
    :close-on-click-modal="false"
    custom-class="image-preview-modal"
    destroy-on-close
  >
    <div class="preview-content">
      <!-- 图片展示区 -->
      <div class="preview-image-container">
        <SmartImage
          :image-key="previewImage?.cos_key || previewImage?.url"
          :alt="previewImage?.filename || previewImage?.original_filename"
          size="custom"
          :width="'100%'"
          :height="'100%'"
          class="preview-image"
          :show-indicator="false"
          :show-actions="false"
          :preview="false"
        />

        <!-- 导航按钮 -->
        <div class="navigation-buttons">
          <el-button
            circle
            size="large"
            :disabled="!hasPrevious"
            @click="prevImage"
          >
            <el-icon><ArrowLeft /></el-icon>
          </el-button>
          <el-button
            circle
            size="large"
            :disabled="!hasNext"
            @click="nextImage"
          >
            <el-icon><ArrowRight /></el-icon>
          </el-button>
        </div>
      </div>

      <!-- 图片信息 -->
      <div class="preview-info">
        <div class="info-section">
          <h3 class="info-title">图片信息</h3>

          <div class="info-item">
            <span class="info-label">文件名：</span>
            <span class="info-value">{{ previewImage?.filename || previewImage?.original_filename }}</span>
          </div>

          <div class="info-item">
            <span class="info-label">来源：</span>
            <el-tag :type="previewImage?.source === 'AI' ? 'success' : 'info'">
              {{ previewImage?.source === 'AI' ? 'AI生成' : '用户上传' }}
            </el-tag>
          </div>

          <div v-if="previewImage?.file_size" class="info-item">
            <span class="info-label">文件大小：</span>
            <span class="info-value">{{ formatFileSize(previewImage.file_size) }}</span>
          </div>

          <div v-if="previewImage?.created_at" class="info-item">
            <span class="info-label">上传时间：</span>
            <span class="info-value">{{ formatDate(previewImage.created_at) }}</span>
          </div>
        </div>

        <!-- 标签管理 -->
        <div class="info-section">
          <div class="section-header">
            <h3 class="info-title">标签管理</h3>
            <el-button
              size="small"
              type="primary"
              @click="showAddTagInput = true"
            >
              <el-icon><Plus /></el-icon>
              添加标签
            </el-button>
          </div>

          <!-- 标签显示 -->
          <div v-if="previewImage?.tags?.length" class="tags-container">
            <el-tag
              v-for="tag in previewImage.tags"
              :key="tag"
              closable
              size="small"
              @close="removeTag(tag)"
            >
              {{ tag }}
            </el-tag>
          </div>

          <div v-else class="empty-tags">
            <span class="empty-text">暂无标签</span>
          </div>

          <!-- 添加标签输入框 -->
          <div v-if="showAddTagInput" class="add-tag-input">
            <el-input
              v-model="newTag"
              placeholder="输入新标签"
              size="small"
              @keyup.enter="addTag"
            >
              <template #append>
                <el-button @click="addTag">添加</el-button>
              </template>
            </el-input>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="action-buttons">
          <el-button
            type="primary"
            @click="handleDownload"
          >
            <el-icon><Download /></el-icon>
            下载图片
          </el-button>
          <el-button
            type="danger"
            @click="handleDelete"
          >
            <el-icon><Delete /></el-icon>
            删除图片
          </el-button>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ArrowLeft, ArrowRight, Plus, Download, Delete } from '@element-plus/icons-vue'
import SmartImage from '@/components/SmartImage.vue'

const props = defineProps<{
  visible: boolean
  previewImage: any
  images: any[]
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'prev'): void
  (e: 'next'): void
  (e: 'download', image: any): void
  (e: 'delete', image: any): void
  (e: 'add-tag', image: any, tag: string): void
  (e: 'remove-tag', image: any, tag: string): void
}>()

const showAddTagInput = ref(false)
const newTag = ref('')

const hasPrevious = computed(() => {
  if (!props.previewImage || !props.images.length) return false
  const currentIndex = props.images.findIndex(img => img.id === props.previewImage.id)
  return currentIndex > 0
})

const hasNext = computed(() => {
  if (!props.previewImage || !props.images.length) return false
  const currentIndex = props.images.findIndex(img => img.id === props.previewImage.id)
  return currentIndex < props.images.length - 1
})

const prevImage = () => {
  if (hasPrevious.value) {
    emit('prev')
  }
}

const nextImage = () => {
  if (hasNext.value) {
    emit('next')
  }
}

const handleDownload = () => {
  if (props.previewImage) {
    emit('download', props.previewImage)
  }
}

const handleDelete = () => {
  if (props.previewImage) {
    emit('delete', props.previewImage)
  }
}

const addTag = () => {
  if (newTag.value.trim() && props.previewImage) {
    emit('add-tag', props.previewImage, newTag.value.trim())
    newTag.value = ''
    showAddTagInput.value = false
  }
}

const removeTag = (tag: string) => {
  if (props.previewImage) {
    emit('remove-tag', props.previewImage, tag)
  }
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped lang="scss">
.preview-content {
  display: flex;
  gap: 24px;
  max-height: 70vh;
}

.preview-image-container {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  border-radius: 8px;
  overflow: hidden;
  min-height: 400px;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.navigation-buttons {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  padding: 0 20px;
  transform: translateY(-50%);
  pointer-events: none;

  .el-button {
    pointer-events: auto;
    background: rgba(255, 255, 255, 0.9);
    border: none;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);

    &:hover {
      background: white;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

.preview-info {
  flex: 0 0 300px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.info-section {
  .info-title {
    margin: 0 0 16px 0;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
  }
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  gap: 8px;

  &:last-child {
    margin-bottom: 0;
  }
}

.info-label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
  min-width: 80px;
}

.info-value {
  font-size: 14px;
  color: #303133;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.empty-tags {
  text-align: center;
  padding: 20px;
  color: #909399;
  font-size: 14px;
}

.add-tag-input {
  margin-top: 12px;
}

.action-buttons {
  display: flex;
  gap: 12px;
  margin-top: auto;

  .el-button {
    flex: 1;
  }
}

:deep(.image-preview-modal) {
  .el-dialog__body {
    padding: 20px;
  }
}

@media (max-width: 1024px) {
  .preview-content {
    flex-direction: column;
    max-height: 80vh;
  }

  .preview-info {
    flex: none;
    max-height: 300px;
    overflow-y: auto;
  }

  .preview-image-container {
    min-height: 300px;
  }
}

@media (max-width: 768px) {
  .preview-content {
    gap: 16px;
  }

  .preview-info {
    flex: none;
    max-height: 250px;
  }

  .navigation-buttons {
    padding: 0 12px;

    .el-button {
      width: 36px;
      height: 36px;
    }
  }

  .action-buttons {
    flex-direction: column;
  }
}
</style>