<template>
  <el-dialog
    v-model="visible"
    title="批量设置标签"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="batch-tag-modal">
      <!-- 操作类型选择 -->
      <div class="operation-selector">
        <div class="selector-label">
          <el-icon><Operation /></el-icon>
          <span>操作类型</span>
        </div>
        <el-radio-group v-model="operation" class="operation-group">
          <el-radio value="add">
            <el-icon><Plus /></el-icon>
            添加标签
          </el-radio>
          <el-radio value="remove">
            <el-icon><Minus /></el-icon>
            删除标签
          </el-radio>
          <el-radio value="replace">
            <el-icon><RefreshRight /></el-icon>
            替换标签
          </el-radio>
        </el-radio-group>
      </div>

      <!-- 标签选择区域 -->
      <div class="tag-selector">
        <div class="selector-label">
          <el-icon><Collection /></el-icon>
          <span>选择标签</span>
        </div>

        <div class="tag-input-container">
          <el-select
            v-model="selectedTags"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="选择或输入标签"
            class="tag-select"
          >
            <el-option
              v-for="tag in availableTags"
              :key="tag"
              :label="tag"
              :value="tag"
            >
              <div class="tag-option">
                <span class="tag-name">{{ tag }}</span>
                <span class="tag-count">{{ getTagUsageCount(tag) }}</span>
              </div>
            </el-option>
          </el-select>

          <div class="selected-tags">
            <el-tag
              v-for="tag in selectedTags"
              :key="tag"
              closable
              @close="removeTag(tag)"
              class="selected-tag"
            >
              {{ tag }}
            </el-tag>
          </div>
        </div>
      </div>

      <!-- 选中的图片信息 -->
      <div class="selected-images-info">
        <div class="info-header">
          <el-icon><Picture /></el-icon>
          <span>已选择 {{ selectedImages.length }} 张图片</span>
        </div>

        <div class="image-preview-list">
          <div
            v-for="image in selectedImages.slice(0, 6)"
            :key="image.id"
            class="image-preview-item"
          >
            <img
              :src="image.url || image.image_url"
              :alt="image.name || image.original_filename"
              @error="handleImageError"
            />
            <div class="image-overlay">
              <el-icon><View /></el-icon>
            </div>
          </div>

          <div v-if="selectedImages.length > 6" class="more-images">
            <span>+{{ selectedImages.length - 6 }} 更多</span>
          </div>
        </div>
      </div>

      <!-- 操作预览 -->
      <div class="operation-preview">
        <div class="preview-label">
          <el-icon><InfoFilled /></el-icon>
          <span>操作预览</span>
        </div>
        <div class="preview-content">
          <div class="preview-item">
            <span class="preview-label">将 {{ operationText }} 以下标签：</span>
            <div class="preview-tags">
              <el-tag
                v-for="tag in selectedTags"
                :key="tag"
                :type="getTagType()"
                size="small"
              >
                {{ tag }}
              </el-tag>
            </div>
          </div>
          <div class="preview-item">
            <span class="preview-label">影响图片数量：</span>
            <span class="preview-count">{{ selectedImages.length }} 张</span>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <div class="footer-left">
          <el-button @click="handleClearTags">清空标签</el-button>
        </div>
        <div class="footer-right">
          <el-button @click="handleClose">取消</el-button>
          <el-button
            type="primary"
            :disabled="!canOperate"
            :loading="operating"
            @click="handleOperate"
          >
            {{ operationText }}标签
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, defineProps } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Operation,
  Plus,
  Minus,
  RefreshRight,
  Collection,
  Picture,
  View,
  InfoFilled
} from '@element-plus/icons-vue'
import { batchOperateImageTags } from '@/services/image'

interface ImageItem {
  id: string
  name?: string
  original_filename?: string
  url?: string
  image_url?: string
  tags?: string[]
}

interface Props {
  visible: boolean
  selectedImages: ImageItem[]
  availableTags: string[]
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'success'): void
  (e: 'refresh'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const visible = ref(false)
const operation = ref<'add' | 'remove' | 'replace'>('add')
const selectedTags = ref<string[]>([])
const operating = ref(false)

// 同步visible状态
watch(() => props.visible, (newVal) => {
  visible.value = newVal
  if (newVal) {
    // 重置状态
    operation.value = 'add'
    selectedTags.value = []
  }
})

// 计算属性
const canOperate = computed(() => {
  return props.selectedImages.length > 0 && selectedTags.value.length > 0
})

const operationText = computed(() => {
  return {
    'add': '添加',
    'remove': '删除',
    'replace': '替换'
  }[operation.value]
})

const getTagType = () => {
  switch (operation.value) {
    case 'add':
      return 'success'
    case 'remove':
      return 'danger'
    case 'replace':
      return 'warning'
    default:
      return 'info'
  }
}

const getTagUsageCount = (tag: string) => {
  // 这里可以根据需要实现标签使用次数统计
  return 0
}

// 方法
const handleClose = () => {
  emit('update:visible', false)
}

const removeTag = (tag: string) => {
  const index = selectedTags.value.indexOf(tag)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  }
}

const handleClearTags = () => {
  selectedTags.value = []
  ElMessage.success('已清空标签')
}

const handleOperate = async () => {
  if (!canOperate.value) return

  operating.value = true
  try {
    const imageIds = props.selectedImages.map(img => img.id)
    const response = await batchOperateImageTags({
      image_ids: imageIds,
      tags: selectedTags.value,
      operation: operation.value
    })

    if (response.success_count > 0) {
      ElMessage.success(`成功为 ${response.success_count} 张图片${operationText.value}标签`)

      // 如果有失败的，显示错误信息
      if (response.failed_count > 0) {
        ElMessage.warning(`${response.failed_count} 张图片操作失败`)
        if (response.errors && response.errors.length > 0) {
          console.error('批量操作失败详情:', response.errors)
        }
      }
    }
    else {
      ElMessage.error('批量操作失败')
    }

    emit('success')
    emit('refresh')
    handleClose()
  }
  catch (error) {
    console.error('批量操作失败:', error)
    ElMessage.error('批量操作失败')
  }
  finally {
    operating.value = false
  }
}

const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement
  target.src = '/placeholder-image.png' // 使用占位图片
}
</script>

<style scoped>
.batch-tag-modal .operation-selector,
.batch-tag-modal .tag-selector,
.batch-tag-modal .selected-images-info,
.batch-tag-modal .operation-preview {
  margin-bottom: 24px;
}

.batch-tag-modal .selector-label,
.batch-tag-modal .info-header,
.batch-tag-modal .preview-label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-weight: 500;
  color: #409eff;
}

.batch-tag-modal .operation-group {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.batch-tag-modal .operation-group .el-radio {
  flex: 1;
  min-width: 120px;
}

.batch-tag-modal .tag-input-container .tag-select {
  width: 100%;
  margin-bottom: 12px;
}

.batch-tag-modal .tag-input-container .selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.batch-tag-modal .tag-input-container .selected-tag {
  margin: 0;
}

.batch-tag-modal .image-preview-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-height: 120px;
  overflow: hidden;
  position: relative;
}

.batch-tag-modal .image-preview-list .image-preview-item {
  width: 60px;
  height: 60px;
  border-radius: 6px;
  overflow: hidden;
  position: relative;
  cursor: pointer;
  transition: all 0.2s ease;
}

.batch-tag-modal .image-preview-list .image-preview-item:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.batch-tag-modal .image-preview-list .image-preview-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.batch-tag-modal .image-preview-list .image-preview-item .image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.batch-tag-modal .image-preview-list .image-preview-item .image-overlay:hover {
  opacity: 1;
}

.batch-tag-modal .image-preview-list .more-images {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  border: 2px dashed #d9d9d9;
  border-radius: 6px;
  color: #999;
  font-size: 12px;
  background: #fafafa;
}

.batch-tag-modal .operation-preview {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
}

.batch-tag-modal .operation-preview .preview-content .preview-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.batch-tag-modal .operation-preview .preview-content .preview-item:last-child {
  margin-bottom: 0;
}

.batch-tag-modal .operation-preview .preview-content .preview-label {
  color: #666;
  font-size: 14px;
}

.batch-tag-modal .operation-preview .preview-content .preview-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.batch-tag-modal .operation-preview .preview-content .preview-count {
  font-weight: 500;
  color: #409eff;
}

.tag-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.tag-option .tag-name {
  flex: 1;
}

.tag-option .tag-count {
  font-size: 12px;
  color: #999;
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 4px;
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-left {
  display: flex;
  gap: 12px;
}

.footer-right {
  display: flex;
  gap: 12px;
}
</style>