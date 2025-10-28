import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiService from '../services'

export interface ModelData {
  id: string
  name: string
  type: 'text' | 'image'
  provider: string
  baseUrl: string
  apiKey: string
  modelName: string
  parameters: string
  maxTokens: string
  isEnabled: boolean
  isDefault: boolean
  createTime: string
}

interface BackendModelData {
  id: string
  name: string
  provider: string
  base_url?: string
  api_key?: string
  model_name?: string
  parameters?: string
  max_tokens?: string
  is_enabled: boolean
  is_default: boolean
  supports_image_generation?: boolean
  supports_chat?: boolean
  supports_embeddings?: boolean
  supports_vision?: boolean
  supports_tools?: boolean
  created_at?: string
}

export const useModelStore = defineStore('model', () => {
  const models = ref<ModelData[]>([])

  const loadModels = async () => {
    const backendModels = await apiService.getAIModels()
    models.value = backendModels.map((model: BackendModelData) => ({
      id: model.id,
      name: model.name,
      type: model.supports_image_generation ? 'image' : 'text', // Use supports_image_generation field to determine type
      provider: model.provider,
      baseUrl: model.base_url || '',
      apiKey: model.api_key || '',
      modelName: model.model_name || '',
      parameters: model.parameters || '',
      maxTokens: model.max_tokens || '8192',
      isEnabled: model.is_enabled,
      isDefault: model.is_default,
      createTime: model.created_at || new Date().toISOString()
    }))
  }

  const addModel = async (model: ModelData) => {
    // Convert to backend format
    const backendModel = {
      name: model.name,
      provider: model.provider,
      base_url: model.baseUrl,
      api_key: model.apiKey,
      model_name: model.modelName,
      parameters: model.parameters,
      max_tokens: model.maxTokens,
      is_enabled: model.isEnabled,
      is_default: model.isDefault,
      // Convert frontend type to backend capability fields
      supports_image_generation: model.type === 'image',
      supports_chat: model.type === 'text',
      supports_embeddings: false,
      supports_vision: false,
      supports_tools: false
    }

    // Call backend API to create model
    const createdModel = await apiService.createAIModel(backendModel)

    // Add to local store with backend ID
    const newModel: ModelData = {
      id: createdModel.id,
      name: createdModel.name,
      type: createdModel.supports_image_generation ? 'image' : 'text',
      provider: createdModel.provider,
      baseUrl: createdModel.base_url || '',
      apiKey: createdModel.api_key || '',
      modelName: createdModel.model_name || '',
      parameters: createdModel.parameters || '',
      maxTokens: createdModel.max_tokens || '8192',
      isEnabled: createdModel.is_enabled,
      isDefault: createdModel.is_default,
      createTime: createdModel.created_at || new Date().toISOString()
    }

    models.value.push(newModel)
  }

  const updateModel = async (updatedModel: ModelData) => {
    // Convert to backend format
    const backendModel = {
      name: updatedModel.name,
      provider: updatedModel.provider,
      base_url: updatedModel.baseUrl,
      api_key: updatedModel.apiKey,
      model_name: updatedModel.modelName,
      parameters: updatedModel.parameters,
      max_tokens: updatedModel.maxTokens,
      is_enabled: updatedModel.isEnabled,
      is_default: updatedModel.isDefault,
      // Convert frontend type to backend capability fields
      supports_image_generation: updatedModel.type === 'image',
      supports_chat: updatedModel.type === 'text',
      supports_embeddings: false,
      supports_vision: false,
      supports_tools: false
    }

    // Call backend API to update model
    await apiService.updateAIModel(updatedModel.id, backendModel)

    // Update local store
    const index = models.value.findIndex(model => model.id === updatedModel.id)
    if (index !== -1) {
      models.value[index] = updatedModel
    }
  }

  const deleteModel = async (id: string) => {
    // Call backend API to delete model
    await apiService.deleteAIModel(id)

    // Remove from local store
    const index = models.value.findIndex(model => model.id === id)
    if (index !== -1) {
      models.value.splice(index, 1)
    }
  }

  const getModelById = (id: string) => {
    return models.value.find(model => model.id === id)
  }

  const getModelsByType = (type: 'text' | 'image') => {
    return models.value.filter(model => model.type === type)
  }

  return {
    models,
    loadModels,
    addModel,
    updateModel,
    deleteModel,
    getModelById,
    getModelsByType
  }
})