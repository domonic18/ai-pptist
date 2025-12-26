<template>
  <Modal
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    :width="900"
    :contentStyle="{ height: '80vh', display: 'flex', flexDirection: 'column' }"
    :closeButton="true"
    :closeOnClickMask="false"
  >
    <div class="banana-template-selector">
      <div class="header">
        <span class="title">选择模板样式</span>
        <span class="subtitle">选择一个模板作为生成PPT的参考样式，或上传自定义参考图</span>
        <div class="model-selector">
          <span class="label">文生图模型：</span>
          <Select
            v-model:value="selectedModelId"
            :options="modelOptions"
            :loading="modelsLoading"
            placeholder="选择图片生成模型"
            style="width: 300px;"
          />
        </div>
      </div>

      <!-- 选项卡切换 -->
      <div class="tabs">
        <div
          class="tab-item"
          :class="{ active: activeTab === 'system' }"
          @click="activeTab = 'system'"
        >
          系统模板
        </div>
        <div
          class="tab-item"
          :class="{ active: activeTab === 'custom' }"
          @click="activeTab = 'custom'"
        >
          自定义上传
        </div>
      </div>

      <!-- 系统模板面板 -->
      <div class="templates-container" v-if="activeTab === 'system' && !loading">
        <div class="templates-grid">
          <div
            class="template-item"
            :class="{ selected: selectedTemplateId === template.id }"
            v-for="template in templates"
            :key="template.id"
            @click="selectTemplate(template.id)"
          >
            <div class="template-image-wrapper">
              <img :src="template.coverUrl" :alt="template.name" @error="handleImageError" />
              <div class="selected-mask" v-if="selectedTemplateId === template.id">
                <span class="check-icon">✓</span>
              </div>
            </div>
            <div class="template-name">{{ template.name }}</div>
          </div>
        </div>
      </div>

      <!-- 自定义上传面板 -->
      <div class="custom-upload-container" v-if="activeTab === 'custom'">
        <div class="upload-area" :class="{ 'has-image': customImageUrl }">
          <div v-if="!customImageUrl" class="upload-placeholder" @click="triggerFileInput">
            <svg class="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M12 4v16m8-8H4" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <span class="upload-text">点击上传参考图</span>
            <span class="upload-hint">支持 JPG、PNG 格式，建议 16:9 比例</span>
          </div>
          <div v-else class="uploaded-image-wrapper">
            <img :src="customImageUrl" alt="自定义模板" class="uploaded-image" />
            <button class="remove-btn" @click="removeCustomImage">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M6 18L18 6M6 6l12 12" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
          <input
            ref="fileInput"
            type="file"
            accept="image/jpeg,image/png"
            style="display: none"
            @change="handleFileChange"
          />
        </div>
        <div v-if="uploadProgress > 0 && uploadProgress < 100" class="upload-progress">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: uploadProgress + '%' }"></div>
          </div>
          <span class="progress-text">上传中... {{ uploadProgress }}%</span>
        </div>
      </div>

      <div class="loading" v-if="loading && activeTab === 'system'">
        <span>加载模板中...</span>
      </div>

      <div class="footer">
        <Button class="btn" @click="handleClose">取消</Button>
        <Button
          class="btn"
          type="primary"
          :disabled="!canConfirm"
          @click="handleConfirm"
        >
          自动生成
        </Button>
      </div>
    </div>
  </Modal>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import Modal from '@/components/Modal.vue'
import Button from '@/components/Button.vue'
import Select from '@/components/Select.vue'
import { bananaGenerationService } from '@/services/bananaGenerationService'
import type { BananaTemplate } from '@/types/banana-generation'
import apiService from '@/services'
import { API_CONFIG } from '@/configs/api'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  close: []
  confirm: [templateId: string | null, customTemplateUrl: string | null, modelId: string]
}>()

const templates = ref<BananaTemplate[]>([])
const selectedTemplateId = ref<string>('')
const loading = ref(false)
const selectedModelId = ref<string>('')
const modelOptions = ref<Array<{ label: string; value: string }>>([])
const modelsLoading = ref(false)

// 自定义上传相关
const activeTab = ref<'system' | 'custom'>('system')
const customImageUrl = ref<string>('')
const customTemplateUrl = ref<string>('')
const fileInput = ref<HTMLInputElement | null>(null)
const uploadProgress = ref<number>(0)

// 计算属性：是否可以确认
const canConfirm = computed(() => {
  if (!selectedModelId.value) {
    return false
  }
  if (activeTab.value === 'system') {
    return !!selectedTemplateId.value
  } else {
    return !!customTemplateUrl.value
  }
})

const loadTemplates = async () => {
  loading.value = true
  try {
    const response = await bananaGenerationService.getTemplates('system')
    templates.value = response.templates

    if (templates.value.length > 0 && !selectedTemplateId.value) {
      selectedTemplateId.value = templates.value[0].id
    }
  } catch (error) {
    console.error('加载模板失败:', error)
    ElMessage.error('加载模板列表失败，请确保已初始化模板数据')
  } finally {
    loading.value = false
  }
}

const fetchImageGenerationModels = async () => {
  modelsLoading.value = true
  try {
    const models = await apiService.getImageGenerationModels()

    modelOptions.value = models
      .filter(m => m.is_enabled && m.capabilities?.includes('image_gen'))
      .map(m => ({
        label: m.name,
        value: m.id
      }))

    const defaultModel = models.find((m: any) =>
      m.is_default && m.is_enabled && m.capabilities?.includes('image_gen')
    )
    if (defaultModel) {
      selectedModelId.value = defaultModel.id
    }
    else if (modelOptions.value.length > 0) {
      selectedModelId.value = modelOptions.value[0].value
    }
  }
  catch (error) {
    console.error('Failed to fetch image generation models:', error)
    ElMessage.error('获取图片生成模型列表失败')
  }
  finally {
    modelsLoading.value = false
  }
}

const selectTemplate = (templateId: string) => {
  selectedTemplateId.value = templateId
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) {
    return
  }

  // 验证文件类型
  const validTypes = ['image/jpeg', 'image/png', 'image/jpg']
  if (!validTypes.includes(file.type)) {
    ElMessage.error('仅支持 JPG、PNG 格式的图片')
    return
  }

  // 验证文件大小（10MB）
  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    ElMessage.error('图片大小不能超过 10MB')
    return
  }

  uploadProgress.value = 0

  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('description', 'Banana自定义模板图片')

    // 使用 XMLHttpRequest 以支持进度监控
    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        uploadProgress.value = Math.round((e.loaded / e.total) * 100)
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText)
        if (response.status === 'success' && response.data) {
          // 前端显示使用图片代理URL
          const cosKey = response.data.cos_key
          const proxyUrl = `/api/v1/img-access/${cosKey}`
          customImageUrl.value = proxyUrl

          // 后端生成使用原始的COS URL，后端会自动处理生成预签名URL
          customTemplateUrl.value = response.data.image_url

          ElMessage.success('图片上传成功')
        } else {
          ElMessage.error('图片上传失败')
        }
      } else {
        ElMessage.error('图片上传失败')
      }
      uploadProgress.value = 0
    })

    xhr.addEventListener('error', () => {
      ElMessage.error('图片上传失败')
      uploadProgress.value = 0
    })

    xhr.open('POST', API_CONFIG.IMAGE_UPLOAD.UPLOAD)
    xhr.send(formData)
  } catch (error) {
    console.error('上传图片失败:', error)
    ElMessage.error('图片上传失败')
    uploadProgress.value = 0
  }

  // 清空input，允许重复上传同一文件
  target.value = ''
}

const removeCustomImage = () => {
  customImageUrl.value = ''
  customTemplateUrl.value = ''
}

const handleClose = () => {
  emit('update:visible', false)
  emit('close')
}

const handleConfirm = () => {
  if (!canConfirm.value) {
    return
  }

  if (activeTab.value === 'system') {
    emit('confirm', selectedTemplateId.value, null, selectedModelId.value)
  } else {
    emit('confirm', null, customTemplateUrl.value, selectedModelId.value)
  }
}

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = './imgs/image-placeholder.svg'
}

watch(() => props.visible, (newVal) => {
  if (newVal) {
    loadTemplates()
    fetchImageGenerationModels()
  }
})

onMounted(() => {
  if (props.visible) {
    loadTemplates()
    fetchImageGenerationModels()
  }
})
</script>

<style lang="scss" scoped>
.banana-template-selector {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.header {
  padding: 20px 20px 16px;
  border-bottom: 1px solid #e5e5e5;
  flex-shrink: 0;

  .title {
    font-size: 20px;
    font-weight: 600;
    color: #333;
    margin-bottom: 8px;
    display: block;
  }

  .model-selector {
    margin-top: 16px;
    display: flex;
    align-items: center;
    gap: 12px;

    .label {
      font-size: 14px;
      color: #666;
      white-space: nowrap;
    }
  }

  .subtitle {
    font-size: 14px;
    color: #666;
    display: block;
  }
}

.tabs {
  display: flex;
  padding: 0 20px;
  border-bottom: 1px solid #e5e5e5;
  flex-shrink: 0;

  .tab-item {
    padding: 12px 16px;
    cursor: pointer;
    font-size: 14px;
    color: #666;
    border-bottom: 2px solid transparent;
    transition: all 0.3s;

    &:hover {
      color: #333;
    }

    &.active {
      color: #33bcfc;
      border-bottom-color: #33bcfc;
      font-weight: 500;
    }
  }
}

.templates-container {
  flex: 1;
  min-height: 0;
  padding: 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.templates-grid {
  flex: 1;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  padding-right: 8px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;

    &:hover {
      background: #a8a8a8;
    }
  }
}

.template-item {
  border: 2px solid #e5e5e5;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
  background: #fff;
  display: flex;
  flex-direction: column;

  &:hover {
    border-color: $themeColor;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }

  &.selected {
    border-color: $themeColor;
    box-shadow: 0 4px 16px rgba(51, 188, 252, 0.3);
  }

  .template-image-wrapper {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    background: #f5f5f5;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: transform 0.3s;
    }

    &:hover img {
      transform: scale(1.05);
    }

    .selected-mask {
      position: absolute;
      top: 12px;
      right: 12px;
      width: 28px;
      height: 28px;
      background: $themeColor;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(51, 188, 252, 0.4);

      .check-icon {
        color: #fff;
        font-size: 18px;
        font-weight: bold;
      }
    }
  }

  .template-name {
    padding: 8px 12px;
    font-size: 13px;
    color: #666;
    text-align: center;
    background: #f9f9f9;
  }
}

.custom-upload-container {
  flex: 1;
  min-height: 0;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.upload-area {
  width: 100%;
  max-width: 500px;
  border: 2px dashed #ddd;
  border-radius: 8px;
  transition: all 0.3s;

  &:hover {
    border-color: $themeColor;
  }

  &.has-image {
    border-style: solid;
    border-color: #e5e5e5;
  }
}

.upload-placeholder {
  padding: 60px 20px;
  text-align: center;
  cursor: pointer;

  .upload-icon {
    width: 48px;
    height: 48px;
    color: #999;
    margin: 0 auto 16px;
  }

  .upload-text {
    display: block;
    font-size: 16px;
    color: #333;
    margin-bottom: 8px;
  }

  .upload-hint {
    display: block;
    font-size: 13px;
    color: #999;
  }
}

.uploaded-image-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;

  .uploaded-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
  }

  .remove-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.6);
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s;

    &:hover {
      background: rgba(0, 0, 0, 0.8);
    }

    svg {
      width: 16px;
      height: 16px;
      color: #fff;
    }
  }
}

.upload-progress {
  margin-top: 16px;
  width: 100%;
  max-width: 500px;

  .progress-bar {
    height: 4px;
    background: #f0f0f0;
    border-radius: 2px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: $themeColor;
    transition: width 0.3s;
  }

  .progress-text {
    display: block;
    text-align: center;
    font-size: 13px;
    color: #666;
    margin-top: 8px;
  }
}

.loading {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #999;
}

.footer {
  padding: 16px 20px;
  border-top: 1px solid #e5e5e5;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-shrink: 0;
  background: #fff;

  .btn {
    min-width: 100px;
  }
}

@media (max-width: 768px) {
  .templates-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}
</style>
