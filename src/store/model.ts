import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiService from '../services'
import type { ModelCapability, ProviderMapping } from '../types/ai-model'

export interface ModelData {
  id: string
  name: string
  modelName: string
  baseUrl: string
  apiKey?: string
  capabilities: ModelCapability[]
  provider_mapping: ProviderMapping
  parameters?: Record<string, any>
  maxTokens?: number
  contextWindow?: number
  isEnabled: boolean
  isDefault: boolean
  createTime?: string
}

interface BackendModelData {
  id: string
  name: string
  ai_model_name: string
  base_url?: string
  api_key?: string
  capabilities: string[]
  provider_mapping: Record<string, string>
  parameters?: Record<string, any>
  max_tokens?: number
  context_window?: number
  is_enabled: boolean
  is_default: boolean
  created_at?: string
  updated_at?: string
}

export const useModelStore = defineStore('model', () => {
  const models = ref<ModelData[]>([])

  const loadModels = async () => {
    const backendModels = await apiService.getAIModels()
    models.value = backendModels.map((model: BackendModelData) => ({
      id: model.id,
      name: model.name,
      modelName: model.ai_model_name,
      baseUrl: model.base_url || '',
      capabilities: model.capabilities as ModelCapability[],
      provider_mapping: model.provider_mapping as ProviderMapping,
      parameters: model.parameters || {},
      maxTokens: model.max_tokens,
      contextWindow: model.context_window,
      isEnabled: model.is_enabled,
      isDefault: model.is_default,
      createTime: model.created_at || new Date().toISOString()
    }))
  }

  const addModel = async (model: any) => {
    // Convert to backend format
    const backendModel = {
      name: model.name,
      ai_model_name: model.ai_model_name || model.modelName,
      base_url: model.base_url || model.baseUrl,
      api_key: model.api_key || model.apiKey,
      capabilities: model.capabilities || [],
      provider_mapping: model.provider_mapping || {},
      parameters: model.parameters || {},
      max_tokens: model.max_tokens || model.maxTokens,
      context_window: model.context_window || model.contextWindow,
      is_enabled: model.is_enabled !== undefined ? model.is_enabled : model.isEnabled,
      is_default: model.is_default !== undefined ? model.is_default : model.isDefault
    }

    // Call backend API to create model
    await apiService.createAIModel(backendModel)

    // Reload models to get fresh data
    await loadModels()
  }

  const updateModel = async (updatedModel: any) => {
    // Convert to backend format
    const backendModel = {
      name: updatedModel.name,
      ai_model_name: updatedModel.ai_model_name || updatedModel.modelName,
      base_url: updatedModel.base_url || updatedModel.baseUrl,
      api_key: updatedModel.api_key || updatedModel.apiKey,
      capabilities: updatedModel.capabilities || [],
      provider_mapping: updatedModel.provider_mapping || {},
      parameters: updatedModel.parameters || {},
      max_tokens: updatedModel.max_tokens || updatedModel.maxTokens,
      context_window: updatedModel.context_window || updatedModel.contextWindow,
      is_enabled: updatedModel.is_enabled !== undefined ? updatedModel.is_enabled : updatedModel.isEnabled,
      is_default: updatedModel.is_default !== undefined ? updatedModel.is_default : updatedModel.isDefault
    }

    // Call backend API to update model
    await apiService.updateAIModel(updatedModel.id || updatedModel.id, backendModel)

    // Reload models to get fresh data
    await loadModels()
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
    return models.value.filter(model => {
      if (type === 'text') {
        return model.capabilities.includes('chat') || model.capabilities.includes('vision')
      }
      else if (type === 'image') {
        return model.capabilities.includes('image_gen')
      }
      return false
    })
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