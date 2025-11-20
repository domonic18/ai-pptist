<template>
  <div class="image-manager">
    <div class="layout-container">
      <!-- 左侧功能区 -->
      <ImageSidebar
        v-model:search-query="searchQuery"
        v-model:search-limit="searchLimit"
        v-model:match-degree="matchDegree"
        v-model:filename-filter="filenameFilter"
        v-model:selected-tags="selectedTags"
        :available-tags="availableTags"
        @search="handleSearch"
        @manage-tags="showTagManager = true"
      />

      <!-- 右侧图片展示区 -->
      <ImageGrid
        :images="filteredImages"
        :total="total"
        :current-page="currentPage"
        :page-size="pageSize"
        :loading="loading"
        :upload-progress="uploadProgress"
        :searching="searching"
        :get-source-display="getSourceDisplay"
        @update:current-page="currentPage = $event"
        @update:page-size="pageSize = $event"
        @upload="handleFileUpload"
        @preview="handlePreview"
        @delete="handleImageDelete"
        @batch-delete="handleBatchDelete"
        @image-load="handleImageLoad"
        @image-error="handleImageError"
        @insert="handleImageInsert"
        @refresh="loadImages"
      />
    </div>

    <!-- 图片预览模态框 -->
    <ImagePreviewModal
      :visible="previewVisible"
      :preview-image="previewImage"
      :images="filteredImages"
      @update:visible="previewVisible = $event"
      @prev="prevImage"
      @next="nextImage"
      @download="handleImageDownload"
      @delete="handleImageDelete"
      @add-tag="addImageTag"
      @remove-tag="removeImageTag"
    />

    <!-- 标签管理模态框 -->
    <TagManagerModal
      :visible="showTagManager"
      :tags="availableTags"
      @update:visible="showTagManager = $event"
      @add-tag="addTag"
      @remove-tag="removeTag"
      @clear-tags="clearAllTags"
    />

    <!-- 删除确认对话框 -->
    <el-dialog
      v-model="deleteConfirmVisible"
      title="确认删除"
      width="400px"
      :close-on-click-modal="false"
    >
      <div class="delete-confirm-content">
        <p>确定要删除选中的 {{ imagesToDelete.length }} 张图片吗？</p>
        <p class="warning-text">此操作不可恢复，请谨慎操作！</p>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="deleteConfirmVisible = false">取消</el-button>
          <el-button
            type="danger"
            :loading="deleting"
            @click="confirmDelete"
          >
            确定删除
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getImageList,
  getImageDetail,
  deleteImage,
  deleteImages,
  getTags,
  createTag,
  deleteTag,
  addImageTags,
  deleteSpecificImageTag,
  searchImages,
  uploadImage,
  type ImageItem
} from '@/services/image'

// 导入新组件
import ImageSidebar from './ImageSidebar.vue'
import ImageGrid from './ImageGrid.vue'
import ImagePreviewModal from './ImagePreviewModal.vue'
import TagManagerModal from './TagManagerModal.vue'

// 事件定义
const emit = defineEmits<{
  (e: 'insert', image: any): void
}>()

// 状态管理
const images = ref<ImageItem[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(24)
const loading = ref(false)

// 搜索和筛选状态
const searchQuery = ref('')
const searchLimit = ref(20)
const matchDegree = ref(70)
const filenameFilter = ref('')
const selectedTags = ref<string[]>([])
const availableTags = ref<string[]>([])

// UI 状态
const previewVisible = ref(false)
const previewImage = ref<ImageItem | null>(null)
const showTagManager = ref(false)
const deleteConfirmVisible = ref(false)
const imagesToDelete = ref<ImageItem[]>([])
const deleting = ref(false)
const uploadProgress = ref(0)
const searching = ref(false)

// 计算属性

const filteredImages = computed(() => {
  return images.value.filter(image => {
    // 文件名筛选
    const matchesFilename = !filenameFilter.value ||
      (image.filename || image.original_filename).toLowerCase()
        .includes(filenameFilter.value.toLowerCase())

    // 标签筛选
    const matchesTags = selectedTags.value.length === 0 ||
      selectedTags.value.every(tag => image.tags?.includes(tag))

    return matchesFilename && matchesTags
  })
})

// 数据加载方法
const loadImages = async () => {
  loading.value = true
  searching.value = !!searchQuery.value.trim()

  try {
    // 如果有搜索关键词，使用 MetaInsight 搜索
    if (searchQuery.value.trim()) {
      const searchParams = {
        query: searchQuery.value,
        limit: searchLimit.value,
        threshold: matchDegree.value,
        tags: selectedTags.value.length > 0 ? selectedTags.value : undefined
      }

      const response = await searchImages(searchParams)
      images.value = response.images
      total.value = response.total

      // 显示搜索提示
      if (response.images.length > 0) {
        ElMessage.success(`通过MetaInsight搜索找到 ${response.images.length} 张相关图片`)
        
        // 调试信息（生产环境可移除）
      }
      else {
        ElMessage.info('未找到相关图片，请尝试其他搜索词')
      }
    }
    else {
      // 普通列表查询
      const params = {
        page: currentPage.value,
        limit: pageSize.value,
        tags: selectedTags.value.length > 0 ? selectedTags.value : undefined,
        sort_by: 'created_at' as const,
        sort_order: 'desc' as const
      }

      const response = await getImageList(params)
      images.value = response.images
      total.value = response.total
    }
  }
  catch (error) {
    const errorMessage = searching.value ? '搜索图片失败' : '加载图片列表失败'
    ElMessage.error(errorMessage)
  }
  finally {
    loading.value = false
    searching.value = false
  }
}

const loadTags = async () => {
  try {
    availableTags.value = await getTags()
  }
  catch (error) {
    ElMessage.error('加载标签失败')
  }
}

// 搜索处理
const handleSearch = () => {
  currentPage.value = 1
  loadImages()
}

// 根据source_type生成本地化显示文本
const getSourceDisplay = (image: ImageItem) => {
  // 如果已经有source字段，直接返回
  if (image.source) {
    return image.source
  }

  // 根据source_type生成显示文本
  switch (image.source_type) {
    case 'generated':
      return 'AI生成'
    case 'uploaded':
      return '用户上传'
    default:
      return '未知来源'
  }
}

// 文件上传处理
const handleFileUpload = async (...args: any[]) => {
  const files = args[0] as FileList
  uploadProgress.value = 0
  const totalFiles = files.length
  let uploadedCount = 0

  for (const file of Array.from(files)) {
    try {
      // 使用实际的API上传图片，带进度回调
      const uploadResult = await uploadImage(file, (progress) => {
        uploadProgress.value = progress
      })

      // 检查上传结果
      if (!uploadResult.success) {
        throw new Error(uploadResult.message || '上传失败')
      }

      // 添加到图片列表 - 获取图片详情（现在返回的是cos_key）
      const imageDetail = await getImageDetail(uploadResult.image_id)

      const newImage = {
        id: imageDetail.id,
        original_filename: imageDetail.original_filename || '',
        filename: imageDetail.filename || '',
        file_size: imageDetail.file_size || 0,
        mime_type: imageDetail.mime_type || '',
        url: imageDetail.cos_key, // 使用cos_key，让SmartImage通过代理访问
        thumbnail_url: imageDetail.cos_key, // 缩略图也使用cos_key
        width: imageDetail.width,
        height: imageDetail.height,
        created_at: imageDetail.created_at,
        tags: imageDetail.tags || [],
        cos_key: imageDetail.cos_key // 存储cos_key备用
      } as ImageItem & { source?: string }

      newImage.source_type = 'uploaded'
      newImage.source = '用户上传'
      images.value.unshift(newImage)
      uploadedCount++
      uploadProgress.value = Math.round((uploadedCount / totalFiles) * 100)

    }
    catch (error) {
      ElMessage.error(`文件 ${file.name} 上传失败`)
    }
  }

  // 上传完成
  uploadProgress.value = 0
  if (uploadedCount > 0) {
    ElMessage.success(`成功上传 ${uploadedCount} 张图片`)
    loadTags()
  }
}

// 图片操作
const handlePreview = (...args: any[]) => {
  const image = args[0] as ImageItem
  previewImage.value = image
  previewVisible.value = true
}

const prevImage = () => {
  if (!previewImage.value) return

  const currentIndex = filteredImages.value.findIndex(
    img => img.id === previewImage.value?.id
  )

  if (currentIndex > 0) {
    previewImage.value = filteredImages.value[currentIndex - 1]
  }
}

const nextImage = () => {
  if (!previewImage.value) return

  const currentIndex = filteredImages.value.findIndex(
    img => img.id === previewImage.value?.id
  )

  if (currentIndex < filteredImages.value.length - 1) {
    previewImage.value = filteredImages.value[currentIndex + 1]
  }
}

const handleImageDownload = (image: ImageItem) => {
  const link = document.createElement('a')
  link.href = image.url
  link.download = image.filename || image.original_filename
  link.click()
}

const handleImageDelete = (...args: any[]) => {
  const image = args[0] as ImageItem
  imagesToDelete.value = [image]
  deleteConfirmVisible.value = true
}

const handleBatchDelete = (...args: any[]) => {
  const selectedImages = args[0] as ImageItem[]
  imagesToDelete.value = selectedImages
  deleteConfirmVisible.value = true
}

const confirmDelete = async () => {
  deleting.value = true

  try {
    if (imagesToDelete.value.length === 1) {
      await deleteImage(imagesToDelete.value[0].id)
    }
    else {
      await deleteImages(imagesToDelete.value.map(img => img.id))
    }

    ElMessage.success('删除成功')
    await loadImages()
    await loadTags()
    deleteConfirmVisible.value = false
    imagesToDelete.value = []
  }
  catch (error) {
    ElMessage.error('删除失败')
  }
  finally {
    deleting.value = false
  }
}

// 标签管理
const addTag = async (tag: string) => {
  try {
    // 调用后端API创建标签
    await createTag(tag)

    // 重新加载标签列表以确保数据一致性
    await loadTags()

  }
  catch (error) {
    ElMessage.error('创建标签失败')
    throw error // 抛出错误让调用方知道操作失败
  }
}

const removeTag = async (tag: string) => {
  try {
    // 调用后端API删除标签
    await deleteTag(tag)

    // 从本地标签列表中移除
    const index = availableTags.value.indexOf(tag)
    if (index > -1) {
      availableTags.value.splice(index, 1)
    }

    ElMessage.success('标签删除成功')
  }
  catch (error) {
    ElMessage.error('删除标签失败')
  }
}

const clearAllTags = async () => {
  try {
    // 删除所有标签
    const deletePromises = availableTags.value.map(tag => deleteTag(tag))
    await Promise.all(deletePromises)

    availableTags.value = []
    ElMessage.success('所有标签已清空')
  }
  catch (error) {
    ElMessage.error('清空标签失败')
  }
}

const addImageTag = async (image: ImageItem, tag: string) => {
  try {
    if (!image.tags) {
      image.tags = []
    }

    if (!image.tags.includes(tag)) {
      // 调用后端API添加标签
      await addImageTags(image.id, [tag])
      image.tags.push(tag)

      // 如果标签不存在于可用标签中，则添加
      if (!availableTags.value.includes(tag)) {
        availableTags.value.push(tag)
      }

      ElMessage.success('标签添加成功')
    }
  }
  catch (error) {
    ElMessage.error('添加图片标签失败')
  }
}

const removeImageTag = async (image: ImageItem, tag: string) => {
  try {
    if (image.tags && image.tags.includes(tag)) {
      // 调用后端API删除标签
      await deleteSpecificImageTag(image.id, tag)
      const index = image.tags.indexOf(tag)
      if (index > -1) {
        image.tags.splice(index, 1)
      }
      ElMessage.success('标签删除成功')
    }
  }
  catch (error) {
    ElMessage.error('删除图片标签失败')
  }
}

// 图片加载事件
const handleImageLoad = () => {
  // 图片加载成功处理
}

const handleImageError = () => {
  // 图片加载失败处理
}

const handleImageInsert = (...args: any[]) => {
  const image = args[0] as ImageItem
  emit('insert', image)
}

// 监听变化
watch([currentPage, pageSize], () => {
  loadImages()
})

watch([searchQuery, selectedTags, filenameFilter], () => {
  currentPage.value = 1
  loadImages()
})

// 初始化
onMounted(() => {
  loadImages()
  loadTags()
})
</script>

<style scoped lang="scss">
.image-manager {
  min-height: 600px;
  max-height: 70vh;
  background-color: #f5f7fa;
  padding: 20px;
}

.layout-container {
  display: flex;
  gap: 20px;
  height: 100%;
}

.delete-confirm-content {
  text-align: center;

  .warning-text {
    color: #f56c6c;
    font-weight: 500;
    margin-top: 8px;
  }
}

@media (max-width: 1024px) {
  .layout-container {
    flex-direction: column;
  }
}

@media (max-width: 768px) {
  .image-manager {
    padding: 12px;
  }

  .layout-container {
    gap: 16px;
  }
}
</style>