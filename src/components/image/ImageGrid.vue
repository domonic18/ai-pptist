<template>
  <div class="image-grid-container">
    <!-- 操作工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <!-- 全选/取消全选按钮 -->
        <el-button
          :disabled="!images.length"
          @click="toggleSelectAll"
        >
          <el-icon><Check /></el-icon>
          {{ isAllSelected ? '取消全选' : '全选' }}
        </el-button>
        <el-button type="primary" @click="triggerUpload">
          <el-icon><Upload /></el-icon>
          上传图片
        </el-button>
        <el-button
          type="primary"
          plain
          :disabled="!selectedImages.length"
          @click="handleBatchTag"
        >
          <el-icon><Collection /></el-icon>
          批量设置标签
        </el-button>
        <el-button
          type="danger"
          plain
          :disabled="!selectedImages.length"
          @click="handleBatchDelete"
        >
          <el-icon><Delete /></el-icon>
          批量删除
        </el-button>
      </div>

      <!-- 选中信息 -->
      <div v-if="selectedImages.length > 0" class="selection-info">
        <span class="selection-count">已选中 {{ selectedImages.length }} 张图片</span>
      </div>

      <div v-if="uploadProgress > 0" class="upload-progress">
        <span class="progress-text">上传进度：</span>
        <el-progress
          :percentage="uploadProgress"
          :stroke-width="12"
          :text-inside="true"
          style="width: 120px"
        />
      </div>
    </div>

    <!-- 文件上传输入 -->
    <input
      ref="fileInputRef"
      type="file"
      multiple
      accept="image/*"
      class="hidden"
      @change="handleFileChange"
    />

    <!-- 图片网格 -->
    <div class="image-grid">
      <div
        v-for="(image, index) in images"
        :key="image.id || index"
        class="image-grid-item"
        :class="{ selected: isImageSelected(image) }"
      >
        <div class="image-wrapper" @click="toggleImageSelection(image)">
          <!-- 选择复选框 -->
          <div class="selection-checkbox" @click.stop="handleCheckboxClick($event, image)">
            <el-checkbox
              :model-value="isImageSelected(image)"
              @update:model-value="handleImageSelect.bind(null, image)"
              @click.stop=""
              class="selection-control"
            />
          </div>

          <!-- 图片缩略图 -->
          <SmartImage
            :src="image.url"
            :alt="image.filename || image.original_filename"
            size="custom"
            :width="'100%'"
            :height="'100%'"
            class="image-thumbnail"
            :show-indicator="false"
            :show-actions="false"
            :preview="false"
            @load="handleImageLoad"
            @error="handleImageError"
          />

          <!-- 操作悬浮层 -->
          <div class="image-overlay">
            <div class="action-buttons">
              <el-tooltip content="插入图片" placement="top" popper-class="high-z-tooltip">
                <el-button
                  type="success"
                  circle
                  size="small"
                  class="insert-btn"
                  @click="handleInsert(image)"
                >
                  <el-icon><Plus /></el-icon>
                </el-button>
              </el-tooltip>
              <el-tooltip content="预览图片" placement="top" popper-class="high-z-tooltip">
                <el-button
                  type="primary"
                  circle
                  size="small"
                  @click="handlePreview(image)"
                >
                  <el-icon><ZoomIn /></el-icon>
                </el-button>
              </el-tooltip>
              <el-tooltip content="删除图片" placement="top" popper-class="high-z-tooltip">
                <el-button
                  type="danger"
                  circle
                  size="small"
                  @click="handleDelete(image)"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </el-tooltip>
            </div>
          </div>

          <!-- 图片来源角标 -->
          <div class="image-badge">
            <el-tag size="small" :type="getBadgeType(image)">
              {{ getBadgeText(image) }}
            </el-tag>
          </div>
        </div>

        <!-- 文件名 -->
        <div class="image-info">
          <div class="filename" :title="image.filename || image.original_filename">
            {{ image.filename || image.original_filename }}
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="!images.length && !loading" class="empty-state">
      <el-empty :description="searching ? '未找到相关图片' : '暂无图片'">
        <template #image>
          <el-icon size="64"><Picture /></el-icon>
        </template>
        <p>{{ searching ? '尝试调整搜索关键词' : '上传您的第一张图片开始使用' }}</p>
        <el-button type="primary" @click="triggerUpload">
          立即上传
        </el-button>
      </el-empty>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <el-skeleton :rows="6" animated />
    </div>

    <!-- 分页 -->
    <div v-if="total > 0 && !loading" class="pagination">
      <el-pagination
        :current-page="currentPage"
        @update:current-page="$emit('update:current-page', $event)"
        :page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next, jumper"
        background
        :pager-count="5"
        small
      />
    </div>

    <!-- 批量标签设置模态框 -->
    <BatchTagModal
      :visible="batchTagModalVisible"
      :selected-images="selectedImages"
      :available-tags="availableTags"
      @update:visible="batchTagModalVisible = $event"
      @success="handleBatchTagSuccess"
      @refresh="$emit('refresh')"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Upload, Delete, ZoomIn, Picture, Plus, Collection, Check } from '@element-plus/icons-vue'
import { ElTooltip } from 'element-plus'
import BatchTagModal from './BatchTagModal.vue'
import SmartImage from '@/components/SmartImage.vue'
import { getTags } from '@/services/image'

const props = defineProps<{
  images: any[]
  total: number
  currentPage: number
  pageSize: number
  loading: boolean
  uploadProgress: number
  searching?: boolean
  getSourceDisplay?: (image: any) => string
}>()

const emit = defineEmits<{
  (e: 'update:current-page', value: number): void
  (e: 'update:page-size', value: number): void
  (e: 'upload', files: FileList): void
  (e: 'preview', image: any): void
  (e: 'delete', image: any): void
  (e: 'batch-delete', images: any[]): void
  (e: 'image-load', image: any): void
  (e: 'image-error', image: any): void
  (e: 'insert', image: any): void
  (e: 'refresh'): void
}>()

const selectedImages = ref<any[]>([])
const fileInputRef = ref<HTMLInputElement | null>(null)
const batchTagModalVisible = ref(false)
const availableTags = ref<string[]>([])

// 计算属性：是否全选
const isAllSelected = computed(() => {
  if (!props.images.length) return false
  return props.images.every(image =>
    selectedImages.value.some(selected => selected.id === image.id)
  )
})

// 全选/取消全选
const toggleSelectAll = () => {
  if (isAllSelected.value) {
    // 取消全选
    selectedImages.value = []
  }
  else {
    // 全选当前页面的所有图片
    selectedImages.value = [...props.images]
  }
}

const isImageSelected = (image: any): boolean => {
  return selectedImages.value.some(selected => selected.id === image.id)
}

const handleImageSelect = (image: any, checked: boolean) => {
  const index = selectedImages.value.findIndex(selected => selected.id === image.id)

  if (checked && index === -1) {
    selectedImages.value.push(image)
  } 
  else if (!checked && index > -1) {
    selectedImages.value.splice(index, 1)
  }
}

const handleCheckboxClick = (event: MouseEvent, image: any) => {
  // 阻止事件冒泡，避免触发外层的 toggleImageSelection
  event.stopPropagation()

  // 直接操作选中状态，避免重复查找
  const index = selectedImages.value.findIndex(selected => selected.id === image.id)
  if (index === -1) {
    selectedImages.value.push(image)
  }
  else {
    selectedImages.value.splice(index, 1)
  }
}

const toggleImageSelection = (image: any) => {
  // 直接操作选中状态，避免重复查找
  const index = selectedImages.value.findIndex(selected => selected.id === image.id)

  if (index === -1) {
    selectedImages.value.push(image)
  }
  else {
    selectedImages.value.splice(index, 1)
  }
}

const triggerUpload = () => {
  fileInputRef.value?.click()
}

const handleFileChange = (event: Event) => {
  const files = (event.target as HTMLInputElement).files
  if (files && files.length > 0) {
    emit('upload', files)
    // 重置input
    if (fileInputRef.value) {
      fileInputRef.value.value = ''
    }
  }
}

const handlePreview = (image: any) => {
  emit('preview', image)
}

const handleDelete = (image: any) => {
  emit('delete', image)
}

const handleInsert = (image: any) => {
  emit('insert', image)
}

const handleBatchDelete = () => {
  if (selectedImages.value.length > 0) {
    emit('batch-delete', selectedImages.value)
    selectedImages.value = []
  }
}

const handleImageLoad = (event: Event) => {
  const target = event.target as HTMLImageElement
  const image = props.images.find(img => img.url === target.src)
  if (image) {
    emit('image-load', image)
  }
}

const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement
  const image = props.images.find(img => img.url === target.src)
  if (image) {
    emit('image-error', image)
  }
}

const getBadgeType = (image: any) => {
  const sourceText = props.getSourceDisplay ? props.getSourceDisplay(image) : image.source || '未知来源'
  return sourceText.includes('AI生成') ? 'success' : 'info'
}

const getBadgeText = (image: any) => {
  if (props.getSourceDisplay) {
    return props.getSourceDisplay(image)
  }

  // 备用逻辑：根据source_type判断
  if (image.source_type === 'generated') {
    return 'AI生成'
  }
  return image.source || '未知来源'
}

const handleBatchTag = () => {
  if (selectedImages.value.length > 0) {
    batchTagModalVisible.value = true
  }
}

const handleBatchTagSuccess = () => {
  // 清空选择
  selectedImages.value = []
  // 刷新列表
  emit('refresh')
}

// 加载可用标签
const loadAvailableTags = async () => {
  try {
    availableTags.value = await getTags()
  }
  catch (error) {
    console.error('加载标签列表失败:', error)
  }
}

// 组件挂载时加载标签
onMounted(() => {
  loadAvailableTags()
})
</script>

<style scoped lang="scss">
.image-grid-container {
  flex: 1;
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  min-height: 0; /* 防止flex容器溢出 */
  max-height: 800px; /* 固定最大高度，适应对话框 */
  overflow: hidden; /* 防止整体溢出 */
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e4e7ed;
}

.toolbar-left {
  display: flex;
  gap: 12px;
}

.selection-info {
  display: flex;
  align-items: center;

  .selection-count {
    font-size: 14px;
    color: #606266;
    font-weight: 500;
    padding: 6px 12px;
    background: #f5f7fa;
    border-radius: 6px;
    border: 1px solid #e4e7ed;
  }
}

.upload-progress {
  display: flex;
  align-items: center;
  gap: 8px;

  .progress-text {
    font-size: 14px;
    color: #606266;
  }
}

.hidden {
  display: none;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
  overflow-y: auto;
  min-height: 0; /* 允许flex子元素收缩 */
  flex: 1; /* 占据剩余空间，给分页留出固定空间 */
  max-height: 450px; /* 限制网格最大高度 */
}

.image-grid-item {
  position: relative;
  cursor: pointer;
  transition: transform 0.15s ease;

  &:hover {
    transform: translateY(-2px);
  }

  // 选中状态样式
  &.selected {
    .image-wrapper {
      position: relative;

      &::before {
        content: '';
        position: absolute;
        top: -2px;
        left: -2px;
        right: -2px;
        bottom: -2px;
        border: 2px solid #409eff;
        border-radius: 10px;
        background: rgba(64, 158, 255, 0.05);
        z-index: 5;
        pointer-events: none;
      }
    }
  }
}

.image-wrapper {
  position: relative;
  aspect-ratio: 4/3;
  border-radius: 8px;
  overflow: hidden;
  background: #f5f7fa;
  margin-bottom: 8px;
}

.selection-checkbox {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 10;
  opacity: 0;
  transition: opacity 0.2s ease;

  // 在选中状态下，复选框始终显示
  .image-grid-item.selected &,
  .image-grid-item:hover & {
    opacity: 1;
  }
}

.selection-control {
  background: transparent !important;
  backdrop-filter: none;
  border: none;
  padding: 2px;

  :deep(.el-checkbox__inner) {
    border-color: #409eff;
    border-radius: 50%;
    width: 18px;
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;

    &::after {
      border-width: 2px;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -60%) rotate(45deg);
      margin-left: 0;
      margin-top: 0;
    }
  }

  :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
    background-color: #409eff;
    border-color: #409eff;
  }
}

.image-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;

  .image-grid-item:hover & {
    transform: scale(1.05);
  }
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 20;

  .image-grid-item:hover & {
    opacity: 1;
  }
}

.action-buttons {
  display: flex;
  gap: 8px;
  position: relative;
  z-index: 6000;

  .insert-btn {
    background: linear-gradient(135deg, #10b981, #059669) !important;
    border-color: #059669 !important;
    box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);

    &:hover {
      background: linear-gradient(135deg, #059669, #047857) !important;
      border-color: #047857 !important;
      transform: scale(1.1);
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
    }

    &:active {
      transform: scale(0.95);
    }
  }

  .el-button {
    transition: all 0.2s ease;

    &:hover {
      transform: scale(1.1);
    }

    &:active {
      transform: scale(0.95);
    }
  }
}

.image-badge {
  position: absolute;
  bottom: 8px;
  left: 8px;
  opacity: 0;
  transition: opacity 0.2s;

  .image-grid-item:hover & {
    opacity: 1;
  }
}

.image-info {
  .filename {
    font-size: 14px;
    font-weight: 500;
    color: #303133;
    line-height: 1.4;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.empty-state,
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: auto; /* 推到底部 */
  padding: 12px 0;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  flex-shrink: 0; /* 防止分页区域被压缩 */
}

@media (max-width: 1024px) {
  .image-grid-container {
    max-height: 500px; /* 在中等屏幕上减小高度 */
  }
  
  .image-grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 12px;
    max-height: 350px;
  }
}

@media (max-width: 768px) {
  .image-grid-container {
    max-height: 400px; /* 在小屏幕上进一步减小高度 */
    padding: 16px;
  }
  
  .toolbar {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
    margin-bottom: 16px;
  }

  .toolbar-left {
    justify-content: center;
    flex-wrap: wrap;
  }

  .selection-info {
    justify-content: center;
  }

  .upload-progress {
    justify-content: center;
  }

  .image-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 8px;
    max-height: 280px;
  }

  .selection-checkbox {
    opacity: 1;
  }

  .image-badge {
    opacity: 1;
  }
  
  .pagination {
    padding: 8px 0;
  }
}
</style>