/**
 * AI模型选择Hook
 * 提供AI模型获取、选择和管理功能
 * 可在多个组件中复用（如AIPPTDialog、OptimizeSlideDialog等）
 */

import { ref } from 'vue'
import apiService from '@/services'
import message from '@/utils/message'

export interface ModelOption {
  label: string
  value: string
}

export interface AIModelSelectionState {
  // 加载状态
  modelsLoading: boolean
  
  // 选中的模型
  selectedChatModel: string
  selectedImageModel: string
  
  // 模型选项列表
  chatModelOptions: ModelOption[]
  imageModelOptions: ModelOption[]
}

/**
 * 使用AI模型选择
 * @returns AI模型选择相关的状态和方法
 */
export default function useAIModelSelection() {
  // 状态
  const modelsLoading = ref(false)
  const selectedChatModel = ref('')
  const selectedImageModel = ref('')
  const chatModelOptions = ref<ModelOption[]>([])
  const imageModelOptions = ref<ModelOption[]>([])

  /**
   * 获取AI模型列表
   * 从后端API获取可用的AI模型并分类
   */
  const fetchAIModels = async () => {
    modelsLoading.value = true
    try {
      const models = await apiService.getAIModels()

      // 分类模型
      const chatModels = models.filter((m: any) =>
        m.is_enabled && m.supports_chat
      )
      const imageModels = models.filter((m: any) =>
        m.is_enabled && m.supports_image_generation
      )

      // 转换为选项格式
      chatModelOptions.value = chatModels.map((m: any) => ({
        label: m.name,
        value: m.ai_model_name || m.name
      }))

      imageModelOptions.value = imageModels.map((m: any) => ({
        label: m.name,
        value: m.ai_model_name || m.name
      }))

      // 设置默认模型 - 优先选择标记为默认的模型，否则选择第一个
      const defaultChatModel = models.find((m: any) => 
        m.is_default && m.is_enabled && m.supports_chat
      )
      if (defaultChatModel) {
        selectedChatModel.value = defaultChatModel.ai_model_name || defaultChatModel.name
      }
      else if (chatModelOptions.value.length > 0) {
        selectedChatModel.value = chatModelOptions.value[0].value
      }

      const defaultImageModel = models.find((m: any) => 
        m.is_default && m.is_enabled && m.supports_image_generation
      )
      if (defaultImageModel) {
        selectedImageModel.value = defaultImageModel.ai_model_name || defaultImageModel.name
      }
      else if (imageModelOptions.value.length > 0) {
        selectedImageModel.value = imageModelOptions.value[0].value
      }
    }
    catch (error) {
      message.error('获取AI模型列表失败，使用默认模型')

      // 回退选项
      chatModelOptions.value = [
        { label: 'GLM-4.5-Air', value: 'GLM-4.5-Air' },
        { label: 'GLM-4.5-Flash', value: 'GLM-4.5-Flash' },
      ]
      imageModelOptions.value = [
        { label: 'DALL-E 3', value: 'dall-e-3' },
        { label: 'Stable Diffusion', value: 'stable-diffusion' },
      ]

      if (chatModelOptions.value.length > 0) {
        selectedChatModel.value = chatModelOptions.value[0].value
      }
      if (imageModelOptions.value.length > 0) {
        selectedImageModel.value = imageModelOptions.value[0].value
      }
    }
    finally {
      modelsLoading.value = false
    }
  }


  /**
   * 重置模型选择
   * 将选择重置为默认值
   */
  const resetModelSelection = () => {
    if (chatModelOptions.value.length > 0) {
      selectedChatModel.value = chatModelOptions.value[0].value
    }
    if (imageModelOptions.value.length > 0) {
      selectedImageModel.value = imageModelOptions.value[0].value
    }
  }

  return {
    // 状态
    modelsLoading,
    selectedChatModel,
    selectedImageModel,
    chatModelOptions,
    imageModelOptions,
    
    // 方法
    fetchAIModels,
    resetModelSelection,
  }
}

