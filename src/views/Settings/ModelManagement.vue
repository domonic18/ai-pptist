<template>
<div class="min-h-screen bg-gray-50">
  <!-- 顶部操作区 -->
  <div class="top-controls bg-white shadow">
    <div class="controls-left">
      <el-input
        v-model="searchQuery"
        placeholder="搜索模型名称"
        class="search-input"
        :prefix-icon="Search"
      />
      <el-select 
        v-model="activeTab" 
        class="filter-select" 
        placeholder="模型类型"
        teleported
        popper-class="model-select-dropdown"
      >
        <el-option label="全部" value="all" />
        <el-option label="文本模型" value="text" />
        <el-option label="文生图模型" value="image" />
      </el-select>
    </div>
    <div class="controls-right">
      <el-button type="primary" @click="openDrawer('add')" class="!rounded-button add-button">
        <el-icon class="mr-1"><Plus /></el-icon>新增模型
      </el-button>
    </div>
  </div>

  <!-- 内容区域 -->
  <div class="px-6 py-4">
    <el-table :data="filteredModels.data" style="width: 100%" v-loading="loading">
      <el-table-column prop="name" label="模型名称" width="150" />
      <el-table-column prop="capabilities" label="模型能力" width="180">
        <template #default="{ row }">
          <div class="flex flex-wrap gap-1">
            <el-tag
              v-for="capability in row.capabilities"
              :key="capability"
              :type="getCapabilityType(capability)"
              size="small"
            >
              {{ getCapabilityLabel(capability) }}
            </el-tag>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="baseUrl" label="Base URL" show-overflow-tooltip width="200" />
      <el-table-column prop="modelName" label="Model Name" min-width="150" show-overflow-tooltip />
      <el-table-column prop="maxTokens" label="Token限制" width="95" />
      <el-table-column label="状态" width="85">
        <template #default="{ row }">
          <el-tag :type="row.isEnabled ? 'success' : 'danger'">
            {{ row.isEnabled ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="默认" width="75" align="center">
        <template #default="{ row }">
          <el-tag v-if="row.isDefault" type="primary" size="small">默认</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" align="center">
        <template #default="{ row }">
          <el-button-group>
            <el-button type="primary" @click="openDrawer('edit', row)" class="!rounded-button whitespace-nowrap">
              <el-icon><Edit /></el-icon>
            </el-button>
            <el-button type="info" @click="handleCopy(row)" class="!rounded-button whitespace-nowrap">
              <el-icon><CopyDocument /></el-icon>
            </el-button>
            <el-button type="danger" @click="handleDelete(row)" class="!rounded-button whitespace-nowrap">
              <el-icon><Delete /></el-icon>
            </el-button>
          </el-button-group>
        </template>
      </el-table-column>
    </el-table>
    <div class="flex justify-end mt-4">
      <el-pagination
        :current-page="currentPage"
        @current-change="handleCurrentChange"
        :page-size="pageSize"
        @size-change="handleSizeChange"
        :total="filteredModels.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next"
      />
    </div>
  </div>

  <!-- 抽屉 -->
  <el-drawer
    v-model="drawerVisible"
    :title="drawerType === 'add' ? '新增模型' : '编辑模型'"
    :size="1200"
    :close-on-click-modal="false"
    destroy-on-close
    class="model-drawer"
  >
    <div class="p-4 form-container">
      <el-form ref="formRef" :model="modelForm" :rules="rules" label-width="120px">
        <el-form-item label="显示名称" prop="name">
          <el-input v-model="modelForm.name" placeholder="请输入模型显示名称，该名称用于在下拉列表中显示" />
        </el-form-item>

        <!-- 能力选择 -->
        <el-form-item label="模型能力" prop="capabilities">
          <el-checkbox-group v-model="modelForm.capabilities" @change="handleCapabilitiesChange">
            <el-checkbox
              v-for="capability in availableCapabilities"
              :key="capability.value"
              :label="capability.value"
            >
              <el-tooltip :content="capability.description" placement="top">
                <span>{{ capability.label }}</span>
              </el-tooltip>
            </el-checkbox>
          </el-checkbox-group>
          <div class="text-sm text-gray-500 mt-2">
            选择模型支持的能力，至少选择一项
          </div>
        </el-form-item>

        <!-- Provider配置 -->
        <el-form-item
          v-for="capability in modelForm.capabilities"
          :key="capability"
          :label="`${getCapabilityLabel(capability)} Provider`"
          :prop="`provider_mapping.${capability}`"
        >
          <el-select
            v-model="modelForm.provider_mapping[capability]"
            placeholder="请选择Provider"
            teleported
            popper-class="provider-dropdown"
            :popper-options="{
              strategy: 'fixed',
              modifiers: [
                {
                  name: 'flip',
                  options: {
                    fallbackPlacements: ['bottom-start', 'top-start'],
                  },
                },
              ],
            }"
          >
            <el-option
              v-for="provider in getProvidersForCapability(capability)"
              :key="provider.value"
              :label="provider.label"
              :value="provider.value"
            >
              <div class="provider-option-content">
                <div class="font-medium">{{ provider.label }}</div>
                <div class="text-xs text-gray-400 mt-1">{{ provider.description }}</div>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="Base URL" prop="baseUrl">
          <el-input
            v-model="modelForm.baseUrl"
            placeholder="请输入模型服务基础地址"
            @blur="modelForm.baseUrl = modelForm.baseUrl?.trim() || ''"
          />
        </el-form-item>
        <el-form-item label="API Key" prop="apiKey">
          <el-input
            v-model="modelForm.apiKey"
            placeholder="请输入API密钥"
            show-password
            @blur="modelForm.apiKey = modelForm.apiKey?.trim() || ''"
          />
        </el-form-item>
        <el-form-item label="模型名称" prop="modelName">
          <el-input v-model="modelForm.modelName" placeholder="请输入具体模型名称，该名称用于模型调用，例如：deepseek-chat" />
        </el-form-item>
        <el-form-item label="最大Token数" prop="maxTokens">
          <el-input
            v-model="modelForm.maxTokens"
            placeholder="请输入最大Token数（默认：8192）"
          />
        </el-form-item>
        <el-form-item label="是否启用" prop="isEnabled">
          <el-switch v-model="modelForm.isEnabled" />
        </el-form-item>
        <el-form-item label="设为默认" prop="isDefault">
          <el-switch v-model="modelForm.isDefault" />
        </el-form-item>
        <el-form-item label="上下文窗口" prop="contextWindow">
          <el-input
            v-model="modelForm.contextWindow"
            placeholder="上下文窗口大小（可选）"
            type="number"
          />
        </el-form-item>
      </el-form>
    </div>
    <template #footer>
      <div class="flex justify-end space-x-2">
        <el-button @click="drawerVisible = false" class="!rounded-button whitespace-nowrap">取消</el-button>
        <el-button type="primary" @click="handleSubmit" class="!rounded-button whitespace-nowrap">确定</el-button>
      </div>
    </template>
  </el-drawer>
</div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, Edit, Delete, CopyDocument, QuestionFilled } from '@element-plus/icons-vue'
import { useModelStore } from '../../store/model'
import apiService from '../../services'
import {
  type ModelCapability,
  type ProviderMapping,
  CAPABILITY_CONFIGS,
  getProviderOptionsForCapability,
  getCapabilityConfig,
  getProviderLabel as getProviderLabelUtil,
  getProviderTagType as getProviderTagTypeUtil
} from '../../types/ai-model'

export default defineComponent({
  name: 'ModelManagement',
  setup() {
    const loading = ref(false)
    const searchQuery = ref('')
    const activeTab = ref('all')
    const drawerVisible = ref(false)
    const drawerType = ref<'add' | 'edit'>('add')
    const currentPage = ref(1)
    const pageSize = ref(10)
    const total = ref(0)

    interface ModelFormData {
      id?: string
      name: string
      modelName: string
      baseUrl: string
      apiKey: string
      capabilities: ModelCapability[]
      provider_mapping: ProviderMapping
      maxTokens: string
      contextWindow?: string
      isEnabled: boolean
      isDefault: boolean
    }

    const modelForm = reactive<ModelFormData>({
      id: '',
      name: '',
      modelName: '',
      baseUrl: '',
      apiKey: '',
      capabilities: [],
      provider_mapping: {},
      maxTokens: '8192',
      contextWindow: '',
      isEnabled: true,
      isDefault: false
    })

    // 可用的能力选项
    const availableCapabilities = CAPABILITY_CONFIGS

    const rules = {
      name: [{ required: true, message: '请输入模型名称', trigger: 'blur' }],
      capabilities: [
        { 
          required: true, 
          message: '请至少选择一个模型能力', 
          trigger: 'change',
          type: 'array',
          min: 1
        }
      ],
      baseUrl: [
        { required: true, message: '请输入模型服务基础地址', trigger: 'blur' },
        {
          validator: (_rule: any, value: string, callback: any) => {
            if (value && value.trim() !== value) {
              callback(new Error('URL地址不能包含首尾空格'))
            }
            else if (value && !value.startsWith('http://') && !value.startsWith('https://')) {
              callback(new Error('URL地址必须以 http:// 或 https:// 开头'))
            }
            else {
              callback()
            }
          },
          trigger: 'blur'
        }
      ],
      apiKey: [
        { required: true, message: '请输入API密钥', trigger: 'blur' },
        {
          validator: (_rule: any, value: string, callback: any) => {
            if (value && value.trim() !== value) {
              callback(new Error('API密钥不能包含首尾空格'))
            }
            else {
              callback()
            }
          },
          trigger: 'blur'
        }
      ],
      modelName: [{ required: true, message: '请输入具体的模型名称', trigger: 'blur' }]
    }

    const formRef = ref()
    const modelStore = useModelStore()

    // 能力相关辅助函数
    const getCapabilityLabel = (capability: ModelCapability): string => {
      const config = getCapabilityConfig(capability)
      return config?.label || capability
    }

    const getCapabilityType = (capability: ModelCapability) => {
      const config = getCapabilityConfig(capability)
      return config?.type || 'info'
    }

    const getProvidersForCapability = (capability: ModelCapability) => {
      return getProviderOptionsForCapability(capability)
    }

    // 处理能力变更
    const handleCapabilitiesChange = (capabilities: ModelCapability[]) => {
      // 清理不再选中的能力的Provider配置
      Object.keys(modelForm.provider_mapping).forEach(key => {
        if (!capabilities.includes(key as ModelCapability)) {
          delete modelForm.provider_mapping[key as ModelCapability]
        }
      })

      // 为新选中的能力设置默认Provider
      capabilities.forEach(capability => {
        if (!modelForm.provider_mapping[capability]) {
          const providers = getProviderOptionsForCapability(capability)
          if (providers.length > 0) {
            modelForm.provider_mapping[capability] = providers[0].value
          }
        }
      })
    }

    const filteredModels = computed(() => {
      let filtered = modelStore.models

      if (searchQuery.value) {
        filtered = filtered.filter(model =>
          model.name.toLowerCase().includes(searchQuery.value.toLowerCase())
        )
      }

      if (activeTab.value !== 'all') {
        // 新架构：根据capabilities筛选
        filtered = filtered.filter(model => {
          if (activeTab.value === 'text') {
            return model.capabilities?.includes('chat' as ModelCapability) || 
                   model.capabilities?.includes('vision' as ModelCapability)
          }
          else if (activeTab.value === 'image') {
            return model.capabilities?.includes('image_gen' as ModelCapability)
          }
          return true
        })
      }

      const start = (currentPage.value - 1) * pageSize.value
      const end = start + pageSize.value

      return {
        data: filtered.slice(start, end),
        total: filtered.length
      }
    })

    const openDrawer = async (type: 'add' | 'edit', row?: any) => {
      drawerType.value = type
      drawerVisible.value = true

      if (type === 'edit' && row) {
        try {
          // 获取完整的模型详情（包含API密钥等敏感信息）
          const modelDetail = await apiService.getAIModelDetail(row.id)

          // 使用新架构
          Object.assign(modelForm, {
            id: modelDetail.id,
            name: modelDetail.name,
            modelName: modelDetail.ai_model_name || '',
            baseUrl: modelDetail.base_url || '',
            apiKey: modelDetail.api_key || '',
            capabilities: modelDetail.capabilities || [],
            provider_mapping: modelDetail.provider_mapping || {},
            maxTokens: modelDetail.max_tokens?.toString() || '8192',
            contextWindow: modelDetail.context_window?.toString() || '',
            isEnabled: modelDetail.is_enabled,
            isDefault: modelDetail.is_default
          })
        }
        catch (error) {
          // 获取模型详情失败
          // 如果获取详情失败，使用列表数据
          Object.assign(modelForm, {
            id: row.id,
            name: row.name,
            modelName: row.modelName || '',
            baseUrl: row.baseUrl || '',
            apiKey: '', // API密钥需要重新输入
            capabilities: row.capabilities || [],
            provider_mapping: row.provider_mapping || {},
            maxTokens: row.maxTokens?.toString() || '8192',
            contextWindow: row.contextWindow?.toString() || '',
            isEnabled: row.isEnabled,
            isDefault: row.isDefault
          })
        }
      }
      else if (type === 'add' && row) {
        // 复制功能：使用传入的row数据填充表单
        Object.assign(modelForm, {
          id: '',
          name: `${row.name} - 副本`,
          modelName: row.modelName || '',
          baseUrl: row.baseUrl || '',
          apiKey: row.apiKey || '',
          capabilities: [...(row.capabilities || [])],
          provider_mapping: { ...(row.provider_mapping || {}) },
          maxTokens: row.maxTokens?.toString() || '8192',
          contextWindow: row.contextWindow?.toString() || '',
          isEnabled: row.isEnabled,
          isDefault: false // 复制时默认不设为默认模型
        })
      }
      else {
        // 完全新增：使用空表单
        Object.assign(modelForm, {
          id: '',
          name: '',
          modelName: '',
          baseUrl: '',
          apiKey: '',
          capabilities: [],
          provider_mapping: {},
          maxTokens: '8192',
          contextWindow: '',
          isEnabled: true,
          isDefault: false
        })
      }
    }

    const handleSubmit = async () => {
      if (!formRef.value) return

      await formRef.value.validate((valid: boolean) => {
        if (valid) {
          // 验证至少选择了一个能力
          if (!modelForm.capabilities || modelForm.capabilities.length === 0) {
            ElMessage.error('请至少选择一个模型能力')
            return
          }

          // 验证所有能力都配置了Provider
          for (const capability of modelForm.capabilities) {
            if (!modelForm.provider_mapping[capability]) {
              ElMessage.error(`请为"${getCapabilityLabel(capability)}"能力选择Provider`)
              return
            }
          }

          // 准备提交数据
          const submitData = {
            id: modelForm.id,
            name: modelForm.name.trim(),
            ai_model_name: modelForm.modelName.trim(),
            base_url: modelForm.baseUrl.trim(),
            api_key: modelForm.apiKey.trim(),
            capabilities: modelForm.capabilities,
            provider_mapping: modelForm.provider_mapping,
            max_tokens: parseInt(modelForm.maxTokens) || 8192,
            context_window: modelForm.contextWindow ? parseInt(modelForm.contextWindow) : undefined,
            is_enabled: modelForm.isEnabled,
            is_default: modelForm.isDefault
          }

          if (drawerType.value === 'add') {
            modelStore.addModel(submitData)
            ElMessage.success('添加成功')
          }
          else {
            modelStore.updateModel(submitData)
            ElMessage.success('更新成功')
          }
          drawerVisible.value = false
        }
      })
    }

    const handleDelete = (row: any) => {
      ElMessageBox.confirm('确认删除该模型吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        modelStore.deleteModel(row.id)
        ElMessage.success('删除成功')
      })
    }

    const handleCopy = async (row: any) => {
      try {
        // 获取完整的模型详情（包含API密钥等敏感信息）
        const modelDetail = await apiService.getAIModelDetail(row.id)
        const copyData = {
          name: modelDetail.name,
          modelName: modelDetail.ai_model_name || '',
          baseUrl: modelDetail.base_url || '',
          apiKey: modelDetail.api_key || '',
          capabilities: modelDetail.capabilities || [],
          provider_mapping: modelDetail.provider_mapping || {},
          maxTokens: modelDetail.max_tokens?.toString() || '8192',
          contextWindow: modelDetail.context_window?.toString() || '',
          isEnabled: modelDetail.is_enabled,
          isDefault: false
        }
        openDrawer('add', copyData)
      }
      catch (error) {
        // 获取模型详情失败
        // 如果获取详情失败，使用列表中的基本信息
        const copyData = {
          name: row.name,
          modelName: row.modelName || '',
          baseUrl: row.baseUrl || '',
          apiKey: '',
          capabilities: row.capabilities || [],
          provider_mapping: row.provider_mapping || {},
          maxTokens: row.maxTokens?.toString() || '8192',
          contextWindow: row.contextWindow?.toString() || '',
          isEnabled: row.isEnabled,
          isDefault: false
        }
        openDrawer('add', copyData)
        ElMessage.warning('无法获取完整模型信息，API密钥需要重新填写')
      }
    }

    const handleCurrentChange = (page: number) => {
      currentPage.value = page
    }

    const handleSizeChange = (size: number) => {
      pageSize.value = size
      currentPage.value = 1
    }

    // Provider相关的辅助函数
    const getProviderLabel = (provider: string) => {
      return getProviderLabelUtil(provider)
    }

    const getProviderTagType = (provider: string) => {
      return getProviderTagTypeUtil(provider)
    }

    onMounted(() => {
      modelStore.loadModels()
    })

    return {
      loading,
      searchQuery,
      activeTab,
      drawerVisible,
      drawerType,
      currentPage,
      pageSize,
      total,
      modelForm,
      rules,
      formRef,
      filteredModels,
      availableCapabilities,
      getCapabilityLabel,
      getCapabilityType,
      getProvidersForCapability,
      handleCapabilitiesChange,
      openDrawer,
      handleSubmit,
      handleDelete,
      handleCopy,
      handleCurrentChange,
      handleSizeChange,
      getProviderLabel,
      getProviderTagType,
      Search,
      Plus,
      Edit,
      Delete,
      CopyDocument,
      QuestionFilled
    }
  }
})
</script>

<style scoped>
.el-drawer :deep(.el-drawer__header) {
  margin-bottom: 0;
  padding: 16px 20px;
  border-bottom: 1px solid #e4e7ed;
}

.el-table :deep(.el-button-group) {
  display: flex;
  gap: 4px;
}

.bg-gray-50 {
  background-color: #f9fafb;
}

/* Element Plus 下拉列表修复 */
:deep(.el-select-dropdown) {
  z-index: 99999 !important;
}

:deep(.el-popper) {
  z-index: 99999 !important;
}

:deep(.el-select) {
  z-index: auto;
}

:deep(.el-select__popper) {
  z-index: 99999 !important;
}

:deep(.el-select-dropdown__wrap) {
  z-index: 99999 !important;
}

:deep(.el-popper__arrow) {
  z-index: 99999 !important;
}

/* 自定义下拉列表样式类 */
:deep(.model-select-dropdown) {
  z-index: 99999 !important;
}

:deep(.model-type-dropdown) {
  z-index: 99999 !important;
}

/* 确保抽屉内容有正确的z-index上下文 */
.el-drawer :deep(.el-drawer__body) {
  position: relative;
  z-index: 1;
  height: 100%;
  overflow-y: auto;
}

/* 增加抽屉高度 */
:deep(.el-drawer) {
  height: 85vh !important;
  max-height: 85vh;
}

/* 表单内容区域增加内边距和间距 */
.el-form-item {
  margin-bottom: 20px;
}

/* 调整Element Plus自动生成的星号位置 */
:deep(.el-form-item.is-required.asterisk-left .el-form-item__label:before) {
  margin-right: 4px;
}

.el-input,
.el-select,
.el-textarea {
  width: 100%;
}

.el-textarea :deep(.el-textarea__inner) {
  min-height: 100px;
}

/* 顶部操作区域样式 */
.top-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  flex-wrap: nowrap;
  min-height: 72px;
  gap: 16px;
}

.controls-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 1;
  min-width: 0;
}

.controls-right {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.search-input {
  width: 240px;
  flex-shrink: 0;
}

.filter-select {
  width: 120px;
  flex-shrink: 0;
}

.add-button {
  white-space: nowrap;
  flex-shrink: 0;
}

/* 响应式设计 - 小屏幕优化 */
@media (max-width: 768px) {
  .search-input {
    width: 200px;
  }
  
  .filter-select {
    width: 100px;
  }
  
  .top-controls {
    padding: 12px 16px;
    gap: 12px;
  }
  
  .controls-left {
    gap: 8px;
  }
}

@media (max-width: 640px) {
  .search-input {
    width: 160px;
  }
  
  .top-controls {
    padding: 10px 12px;
  }
}

/* 全局下拉列表修复 - 针对teleported到body的下拉列表 */
</style>

<style>
/* 全局样式 - 修复Element Plus下拉列表显示问题 */
.el-select-dropdown,
.el-popper,
.el-select__popper {
  z-index: 99999 !important;
}

/* 确保确认对话框显示在最顶层 */
.el-overlay.is-message-box,
.el-overlay-message-box,
.el-message-box__wrapper,
.el-message-box {
  z-index: 10000 !important;
}

/* 针对所有消息框相关的元素 */
div[class*="el-overlay"].is-message-box,
div[role="dialog"][class*="el-overlay-message-box"] {
  z-index: 10000 !important;
}

.model-select-dropdown,
.model-type-dropdown,
.provider-dropdown {
  z-index: 99999 !important;
}

/* Provider 选项内容样式 */
.provider-option-content {
  width: 100%;
  pointer-events: none;
}

/* 确保下拉选项不会被遮挡 */
.el-select-dropdown__item {
  padding: 8px 12px;
  line-height: normal;
  height: auto;
  min-height: 50px;
  display: block;
}

.el-select-dropdown__item:hover {
  background-color: #f5f7fa;
}

.el-select-dropdown__item.selected {
  color: #409eff;
  font-weight: 500;
}
</style>