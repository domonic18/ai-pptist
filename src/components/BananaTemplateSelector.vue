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
        <span class="subtitle">选择一个模板作为生成PPT的参考样式</span>
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

      <div class="templates-container" v-if="!loading">
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
            <div class="template-info">
              <div class="template-name">{{ template.name }}</div>
              <div class="template-type">{{ template.type === 'system' ? '系统模板' : '用户模板' }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="loading" v-if="loading">
        <span>加载模板中...</span>
      </div>

      <div class="footer">
        <Button class="btn" @click="handleClose">取消</Button>
        <Button
          class="btn"
          type="primary"
          :disabled="!selectedTemplateId"
          @click="handleConfirm"
        >
          自动生成
        </Button>
      </div>
    </div>
  </Modal>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import Modal from '@/components/Modal.vue'
import Button from '@/components/Button.vue'
import Select from '@/components/Select.vue'
import { BANANA_TEMPLATE_CONFIGS, type BananaTemplateConfig } from '@/configs/bananaTemplates'
import apiService from '@/services'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  close: []
  confirm: [templateId: string, modelId: string]
}>()

const templates = ref<BananaTemplateConfig[]>([])
const selectedTemplateId = ref<string>('')
const loading = ref(false)
const selectedModelId = ref<string>('')
const modelOptions = ref<Array<{ label: string; value: string }>>([])
const modelsLoading = ref(false)

const loadTemplates = () => {
  loading.value = true
  try {
    // 直接使用本地配置，不需要API调用
    templates.value = BANANA_TEMPLATE_CONFIGS.filter(t => t.type === 'system')
    
    // 默认选择第一个模板
    if (templates.value.length > 0 && !selectedTemplateId.value) {
      selectedTemplateId.value = templates.value[0].id
    }
  } catch (error) {
    console.error('加载模板失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取图片生成模型列表
const fetchImageGenerationModels = async () => {
  modelsLoading.value = true
  try {
    const models = await apiService.getImageGenerationModels()

    // 过滤启用的图片生成模型并转换为选项格式
    modelOptions.value = models
      .filter(m => m.is_enabled && m.capabilities?.includes('image_gen'))
      .map(m => ({
        label: m.name,
        value: m.id
      }))

    // 设置默认模型 - 优先选择标记为默认的模型，否则选择第一个
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

const handleClose = () => {
  emit('update:visible', false)
  emit('close')
}

const handleConfirm = () => {
  if (!selectedTemplateId.value) {
    return
  }
  if (!selectedModelId.value) {
    ElMessage.warning('请先选择文生图模型')
    return
  }
  emit('confirm', selectedTemplateId.value, selectedModelId.value)
}

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = './imgs/image-placeholder.svg'
}

// 当对话框打开时加载模板和模型列表
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

  // 自定义滚动条样式
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
    height: 200px;
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

  .template-info {
    padding: 14px;
    background: #fff;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    .template-name {
      font-size: 15px;
      font-weight: 500;
      color: #333;
      margin-bottom: 6px;
    }

    .template-type {
      font-size: 12px;
      color: #999;
    }
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

// 响应式设计
@media (max-width: 768px) {
  .templates-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .template-item .template-image-wrapper {
    height: 160px;
  }
}
</style>

