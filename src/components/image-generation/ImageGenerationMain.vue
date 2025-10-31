<template>
  <div class="ai-image-generation-container">
    <!-- 顶部导航栏 -->
    <NavigationBar
      :model-count="availableModels.length"
      :image-count="generatedImages.length"
      @go-back="goBackToMain"
      @clear-all="clearAllImages"
    />

    <!-- 主要内容区域 -->
    <div class="main-content-area">
      <!-- 左侧主内容区域 -->
      <div class="main-content">
        <!-- 图像生成控制面板 -->
        <ControlPanel
          v-model:form="generationForm"
          :available-models="availableModels"
          :loading="loading"
          :quick-prompts="quickPrompts"
          @select-prompt="selectPrompt"
          @generate="generateImage"
        />

        <!-- 图片生成结果展示 -->
        <ImageGallery
          :images="generatedImages"
          @preview="handlePreview"
          @store="handleStoreImage"
          @delete="handleDeleteImage"
          @image-load="handleImageLoad"
          @image-error="handleImageError"
        />
      </div>

      <!-- 右侧日志面板 -->
      <div class="sidebar">
        <GenerationLog
          :logs="logs"
          @clear-logs="clearLogs"
        />
      </div>
    </div>

    <!-- 图片预览模态框 -->
    <ImagePreviewModal
      v-model:visible="previewVisible"
      :image="previewImage"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useMainStore } from '@/store'

// 导入组件
import NavigationBar from './NavigationBar.vue'
import ControlPanel from './ControlPanel.vue'
import ImageGallery from './ImageGallery.vue'
import GenerationLog from './GenerationLog.vue'
import ImagePreviewModal from './ImagePreviewModal.vue'

// 导入服务
import { API_CONFIG } from '@/configs/api'
import axios from 'axios'
import apiService from '@/services'

// 导入类型
import type { GenerationForm, ModelInfo, GeneratedImage, LogEntry } from './types'

const mainStore = useMainStore()

// 响应式数据
const loading = ref(false)
const generatedImages = ref<GeneratedImage[]>([])
const logs = ref<LogEntry[]>([])
const availableModels = ref<ModelInfo[]>([])
const previewImage = ref<GeneratedImage | null>(null)
const previewVisible = ref(false)

// 表单数据
const generationForm = ref<GenerationForm>({
  prompt: '',
  generation_model: '',
  width: 1024,
  height: 1024,
  quality: 'standard',
  style: 'vivid',
  search_enabled: false,
  match_threshold: 0.8,
  confidence_threshold: 0.7,
  search_limit: 10
})

// 快速示例提示词
const quickPrompts = ref([
  '一个美丽的日落风景，山脉和湖泊',
  '现代科技风格的办公室环境',
  '可爱的卡通动物角色',
  '抽象的几何艺术图案',
  '古典建筑的内部装饰',
  '小学数学教育插图，两条平行的直线，清晰简洁的几何图形，白色背景，教育风格，适合六年级学生理解平行线概念。线条笔直整齐，间距均匀，标注平行符号∥，采用明亮的蓝色或红色线条，数学课件配图'
])

// 方法
const goBackToMain = () => {
  mainStore.setImageGenerationPageState(false)
}

const selectPrompt = (prompt: string) => {
  generationForm.value.prompt = prompt
}

const addLog = (level: LogEntry['level'], message: string) => {
  const log: LogEntry = {
    id: Date.now().toString(),
    timestamp: new Date(),
    level,
    message
  }
  logs.value.unshift(log)

  // 保持日志数量限制
  if (logs.value.length > 100) {
    logs.value = logs.value.slice(0, 100)
  }
}

const clearLogs = () => {
  logs.value = []
  addLog('info', '日志已清空')
}

const clearAllImages = () => {
  generatedImages.value = []
  addLog('info', '已清空所有生成图片')
  ElMessage.success('已清空所有生成图片')
}

const generateImage = async () => {
  if (!generationForm.value.prompt.trim()) {
    ElMessage.warning('请输入图片描述')
    return
  }
  if (!generationForm.value.generation_model) {
    ElMessage.warning('请选择生成模型')
    return
  }

  const imageId = Date.now().toString()
  const newImage: GeneratedImage = {
    id: imageId,
    url: '',
    prompt: generationForm.value.prompt.trim(),
    generation_model: generationForm.value.generation_model,
    width: generationForm.value.width,
    height: generationForm.value.height,
    status: 'generating',
    timestamp: new Date()
  }

  // 添加到历史记录
  generatedImages.value.unshift(newImage)
  loading.value = true

  addLog('info', '开始图片生成流程')
  addLog('info', `提示词: ${generationForm.value.prompt}`)
  addLog('info', `模型: ${generationForm.value.generation_model}`)
  addLog('info', `尺寸: ${generationForm.value.width}×${generationForm.value.height}`)

  try {
    const response = await axios.post(API_CONFIG.IMAGE_GENERATION.GENERATE, generationForm.value)

    if (response.data.status === 'success') {
      const result = response.data.data

      if (result.success) {
        if (result.reused) {
          addLog('success', '找到相似图片，直接复用')
        }
        else {
          addLog('success', '图片生成成功')
        }

        // 更新图片信息
        const imageIndex = generatedImages.value.findIndex(img => img.id === imageId)
        if (imageIndex !== -1) {
          generatedImages.value[imageIndex] = {
            ...generatedImages.value[imageIndex],
            url: result.image?.url || '',
            status: 'success',
            reused: result.reused || false,
            created_at: result.image?.created_at
          }
        }

        ElMessage.success(result.message || '图片生成成功')
      }
      else {
        addLog('error', result.error || '图片生成失败')
        ElMessage.error(result.error || '图片生成失败')

        // 更新为失败状态
        const imageIndex = generatedImages.value.findIndex(img => img.id === imageId)
        if (imageIndex !== -1) {
          generatedImages.value[imageIndex] = {
            ...generatedImages.value[imageIndex],
            status: 'error',
            error: result.error || '生成失败'
          }
        }
      }
    }
    else {
      addLog('error', '请求失败')
      ElMessage.error('请求失败')
    }
  }
  catch (error: any) {
    addLog('error', `生成失败: ${error.message}`)
    ElMessage.error(`生成失败: ${error.message}`)
  }
  finally {
    loading.value = false
  }
}


// 图片操作方法
const handlePreview = (image: GeneratedImage) => {
  previewImage.value = image
  previewVisible.value = true
}

const handleStoreImage = async (image: GeneratedImage) => {
  try {
    addLog('info', `开始入库图片: ${image.id}`)

    const requestData = {
      prompt: image.prompt,
      generation_model: image.generation_model,
      width: image.width,
      height: image.height,
      description: `AI生成图片 - ${image.prompt.substring(0, 50)}...`,
      tags: ['AI生成'],
      is_public: false
    }

    addLog('info', `入库图片提示词: ${image.prompt}`)
    addLog('info', `入库图片模型: ${image.generation_model}`)
    addLog('info', `入库图片尺寸: ${image.width}×${image.height}`)

    const response = await axios.post(API_CONFIG.IMAGE_GENERATION.GENERATE_AND_STORE, requestData)

    if (response.data.status === 'success' && response.data.data.success) {
      const result = response.data.data

      addLog('success', '图片入库成功')
      addLog('info', `图片ID: ${result.image_id}`)
      addLog('info', `COS存储键: ${result.cos_key}`)

      ElMessage.success('图片入库成功！')
    }
    else {
      addLog('error', response.data.message || '图片入库失败')
      ElMessage.error(response.data.message || '图片入库失败')
    }
  }
  catch (error: any) {
    console.error('图片入库失败:', error)
    addLog('error', `请求失败: ${error.response?.data?.message || error.message}`)
    ElMessage.error(error.response?.data?.message || '图片入库失败')
  }
}


const handleDeleteImage = (image: GeneratedImage) => {
  generatedImages.value = generatedImages.value.filter(img => img.id !== image.id)
  addLog('info', '图片已删除')
  ElMessage.success('图片已删除')
}

const handleImageLoad = (image: GeneratedImage) => {
  addLog('success', '图片加载成功')
}

const handleImageError = (image: GeneratedImage) => {
  addLog('error', '图片加载失败')
  ElMessage.error('图片加载失败')
}

// 工具方法
const getStatusType = (status: string) => {
  switch (status) {
    case 'generating':
      return 'warning'
    case 'success':
      return 'success'
    case 'error':
      return 'danger'
    default:
      return 'info'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'generating':
      return '生成中'
    case 'success':
      return '成功'
    case 'error':
      return '失败'
    default:
      return '未知'
  }
}

const loadModels = async () => {
  try {
    addLog('info', '正在加载图片生成模型列表...')
    const models = await apiService.getImageGenerationModels()

    // 过滤启用的模型并转换为选项格式
    availableModels.value = models.filter((m: any) => m.is_enabled)

    // 设置默认模型
    const defaultModel = models.find((m: any) => m.is_default && m.is_enabled)
    if (defaultModel) {
      generationForm.value.generation_model = defaultModel.ai_model_name || defaultModel.name
    }

    addLog('info', `成功加载 ${availableModels.value.length} 个可用模型`)
  }
  catch (error: any) {
    addLog('error', '加载图片生成模型列表失败')
    ElMessage.error('加载模型列表失败')
  }
}

// 生命周期
onMounted(() => {
  loadModels()
  addLog('info', 'AI图片生成页面已加载')
})
</script>

<style scoped lang="scss">
.ai-image-generation-container {
  width: 100%;
  height: 100vh;
  background-color: #f5f7fa;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-sizing: border-box;

  .main-content-area {
    display: flex;
    flex: 1;
    overflow: hidden;

    .main-content {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .sidebar {
      width: 350px;
      padding: 16px 16px 16px 0;
      height: 100%;
      display: flex;
      flex-direction: column;
    }
  }
}

@media (max-width: 1200px) {
  .main-content-area {
    .sidebar {
      width: 300px;
    }
  }
}

@media (max-width: 768px) {
  .main-content-area {
    flex-direction: column;

    .sidebar {
      width: 100%;
      padding: 0 16px 16px 16px;
    }
  }
}
</style>