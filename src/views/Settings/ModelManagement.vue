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
      <el-table-column prop="name" label="模型名称" />
      <el-table-column prop="type" label="模型类型">
        <template #default="{ row }">
          <el-tag :type="row.type === 'text' ? 'primary' : 'success'">
            {{ row.type === 'text' ? '文本模型' : '文生图模型' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="provider" label="Provider" width="120">
        <template #default="{ row }">
          <el-tag :type="getProviderTagType(row.provider)">
            {{ getProviderLabel(row.provider) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="baseUrl" label="Base URL" show-overflow-tooltip />
      <el-table-column prop="modelName" label="Model Name" />
      <el-table-column prop="maxTokens" label="最大Token数" width="120" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.isEnabled ? 'success' : 'danger'">
            {{ row.isEnabled ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="默认" width="80">
        <template #default="{ row }">
          <el-tag v-if="row.isDefault" type="primary">默认</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200">
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
    size="1200px"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <div class="p-4">
      <el-form ref="formRef" :model="modelForm" :rules="rules" label-width="120px">
        <el-form-item label="显示名称" prop="name">
          <el-input v-model="modelForm.name" placeholder="请输入模型显示名称，该名称用于在下拉列表中显示" />
        </el-form-item>
        <el-form-item label="模型类型" prop="type">
          <el-select
            v-model="modelForm.type"
            placeholder="请选择模型类型"
            teleported
            popper-class="model-type-dropdown"
            @change="handleTypeChange"
          >
            <el-option label="文本模型" value="text" />
            <el-option label="文生图模型" value="image" />
          </el-select>
        </el-form-item>
        <el-form-item label="Provider" prop="provider">
          <el-select
            v-model="modelForm.provider"
            placeholder="请选择Provider"
            teleported
            popper-class="provider-dropdown"
          >
            <el-option
              v-for="provider in providerOptions"
              :key="provider.value"
              :label="provider.label"
              :value="provider.value"
            />
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
        <el-form-item label="是否支持视觉" prop="supportsVision">
          <el-switch v-model="modelForm.supportsVision" />
          <template #label>
            <span class="flex items-center" style="width: 120px;">
              是否支持视觉
              <el-tooltip
                content="该模型是否支持多模态视觉功能（如图片识别、分析等）"
                placement="top"
              >
                <el-icon class="ml-1 cursor-help"><QuestionFilled /></el-icon>
              </el-tooltip>
            </span>
          </template>
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
import { defineComponent, ref, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, Edit, Delete, CopyDocument, QuestionFilled } from '@element-plus/icons-vue'
import { useModelStore, type ModelData } from '../../store/model'
import apiService from '../../services'

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

    const modelForm = ref<ModelData>({
      id: '',
      name: '',
      type: 'text',
      provider: 'opencompatible',
      baseUrl: '',
      apiKey: '',
      modelName: '',
      parameters: '',
      maxTokens: '8192',
      isEnabled: true,
      isDefault: false,
      supportsVision: false,
      createTime: ''
    } as ModelData)

    // Provider选项配置
    const providerOptions = ref([
      { label: 'OpenAI兼容模式', value: 'opencompatible' },
      { label: 'Gemini', value: 'gemini' }
    ])

    const rules = {
      name: [{ required: true, message: '请输入模型名称', trigger: 'blur' }],
      type: [{ required: true, message: '请选择模型类型', trigger: 'change' }],
      provider: [{ required: true, message: '请选择Provider', trigger: 'change' }],
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

    const filteredModels = computed(() => {
      let filtered = modelStore.models

      if (searchQuery.value) {
        filtered = filtered.filter(model =>
          model.name.toLowerCase().includes(searchQuery.value.toLowerCase())
        )
      }

      if (activeTab.value !== 'all') {
        filtered = filtered.filter(model => model.type === activeTab.value)
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

          modelForm.value = {
            id: modelDetail.id,
            name: modelDetail.name,
            type: modelDetail.supports_image_generation ? 'image' : 'text', // Use supports_image_generation field
            provider: modelDetail.provider || 'opencompatible',
            baseUrl: modelDetail.base_url || '',
            apiKey: modelDetail.api_key || '',
            modelName: modelDetail.ai_model_name || '',
            parameters: modelDetail.parameters || '',
            maxTokens: modelDetail.max_tokens || '8192',
            isEnabled: modelDetail.is_enabled,
            isDefault: modelDetail.is_default,
            supportsVision: modelDetail.supports_vision || false,
            createTime: modelDetail.created_at || new Date().toISOString()
          } as ModelData
        }
        catch (error) {
          console.error('获取模型详情失败:', error)
          // 如果获取详情失败，确保使用正确的类型
          // 优先使用row中的type，如果不存在则根据supports_image_generation判断
          const modelType = row.type || (row.supports_image_generation ? 'image' : 'text')

          modelForm.value = {
            id: row.id,
            name: row.name,
            type: modelType,
            provider: row.provider || 'opencompatible',
            baseUrl: row.baseUrl,
            apiKey: row.apiKey || '', // 使用空字符串作为默认值
            modelName: row.modelName,
            parameters: row.parameters,
            maxTokens: row.maxTokens,
            isEnabled: row.isEnabled,
            isDefault: row.isDefault,
            supportsVision: row.supportsVision || false,
            createTime: row.createTime
          } as ModelData
        }
      }
      else if (type === 'add' && row) {
        // 复制功能：使用传入的row数据填充表单
        modelForm.value = {
          id: '',
          name: row.name,
          type: row.type,
          provider: row.provider || 'opencompatible',
          baseUrl: row.baseUrl,
          apiKey: row.apiKey || '',
          modelName: row.modelName,
          parameters: row.parameters,
          maxTokens: row.maxTokens,
          isEnabled: row.isEnabled,
          isDefault: false, // 复制时默认不设为默认模型
          supportsVision: row.supportsVision || false,
          createTime: ''
        } as ModelData
      }
      else {
        // 完全新增：使用空表单
        modelForm.value = {
          id: '',
          name: '',
          type: 'text',
          provider: 'opencompatible',
          baseUrl: '',
          apiKey: '',
          modelName: '',
          parameters: '',
          maxTokens: '8192',
          isEnabled: true,
          isDefault: false,
          supportsVision: false,
          createTime: ''
        } as ModelData
      }
    }

    const handleSubmit = async () => {
      if (!formRef.value) return

      await formRef.value.validate((valid: boolean) => {
        if (valid) {
          // Trim whitespace from base_url and api_key fields
          const sanitizedData = {
            ...modelForm.value,
            baseUrl: modelForm.value.baseUrl?.trim() || '',
            apiKey: modelForm.value.apiKey?.trim() || '',
            type: modelForm.value.type as 'text' | 'image'
          }

          if (drawerType.value === 'add') {
            modelStore.addModel({
              ...sanitizedData,
              id: Date.now().toString(),
              createTime: new Date().toISOString()
            })
            ElMessage.success('添加成功')
          }
          else {
            modelStore.updateModel(sanitizedData)
            ElMessage.success('更新成功')
          }
          drawerVisible.value = false
        }
      })
    }

    const handleDelete = (row: ModelData) => {
      ElMessageBox.confirm('确认删除该模型吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        modelStore.deleteModel(row.id)
        ElMessage.success('删除成功')
      })
    }

    const handleCopy = async (row: ModelData) => {
      try {
        // 获取完整的模型详情（包含API密钥等敏感信息）
        const modelDetail = await apiService.getAIModelDetail(row.id)
        const copyData = {
          id: '',
          name: `${modelDetail.name} - 副本`,
          type: modelDetail.supports_image_generation ? 'image' : 'text',
          provider: modelDetail.provider || 'opencompatible',
          baseUrl: modelDetail.base_url || '',
          apiKey: modelDetail.api_key || '',
          modelName: modelDetail.ai_model_name || '',
          parameters: modelDetail.parameters || '',
          maxTokens: modelDetail.max_tokens || '8192',
          isEnabled: modelDetail.is_enabled,
          isDefault: false, // 复制时默认不设为默认模型
          supportsVision: modelDetail.supports_vision || false,
          createTime: ''
        } as ModelData
        openDrawer('add', copyData)
      }
      catch (error) {
        console.error('获取模型详情失败:', error)
        // 如果获取详情失败，使用列表中的基本信息（不包含API_KEY）
        const copyData = { ...row }
        copyData.name = `${copyData.name} - 副本`
        copyData.id = ''
        copyData.isDefault = false
        copyData.createTime = ''
        openDrawer('add', copyData)
        ElMessage.warning('无法获取完整模型信息，部分字段需要手动填写')
      }
    }

    const handleCurrentChange = (page: number) => {
      currentPage.value = page
    }

    const handleSizeChange = (size: number) => {
      pageSize.value = size
      currentPage.value = 1
    }

    // 处理模型类型变更
    const handleTypeChange = (value: string) => {
      // 根据类型调整Provider选项
      if (value === 'image') {
        // 文生图模型默认选择OpenAI兼容模式
        modelForm.value.provider = 'opencompatible'
        // 设置默认的Base URL
        if (!modelForm.value.baseUrl) {
          modelForm.value.baseUrl = 'https://api.openai.com'
        }
      }
      else if (value === 'text') {
        // 文本模型默认选择OpenAI兼容模式
        modelForm.value.provider = 'opencompatible'
        // 设置默认的Base URL
        if (!modelForm.value.baseUrl) {
          modelForm.value.baseUrl = 'https://api.openai.com'
        }
      }
    }

    // Provider相关的辅助函数
    const getProviderLabel = (provider: string) => {
      const providerMap: Record<string, string> = {
        'opencompatible': 'OpenAI兼容',
        'gemini': 'Gemini'
      }
      return providerMap[provider] || provider
    }

    const getProviderTagType = (provider: string) => {
      const typeMap: Record<string, string> = {
        'opencompatible': 'warning',
        'gemini': 'success'
      }
      return typeMap[provider] || 'info'
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
      providerOptions,
      openDrawer,
      handleSubmit,
      handleDelete,
      handleCopy,
      handleCurrentChange,
      handleSizeChange,
      handleTypeChange,
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
  max-height: 200px;
  overflow-y: auto;
}

.el-select-dropdown__item {
  padding: 8px 12px;
  line-height: 20px;
}

.el-select-dropdown__item:hover {
  background-color: #f5f7fa;
}

.el-select-dropdown__item.selected {
  color: #409eff;
  font-weight: 500;
}
</style>