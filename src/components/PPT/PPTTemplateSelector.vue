<template>
  <el-dialog
    v-model="dialogVisible"
    title="选择PPT模板样式"
    width="80%"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    @close="handleClose"
  >
    <!-- 模板网格 -->
    <div v-loading="loading" class="template-grid">
      <div
        v-for="template in templates"
        :key="template.id"
        :class="['template-item', { selected: selectedTemplate?.id === template.id }]"
        @click="selectTemplate(template)"
      >
        <!-- 缩略图 -->
        <div class="template-image">
          <el-image
            :src="template.coverUrl"
            :preview-src-list="[template.fullImageUrl]"
            fit="cover"
            loading="lazy"
          >
            <template #error>
              <div class="image-error">
                <el-icon><Picture /></el-icon>
                <span>图片加载失败</span>
              </div>
            </template>
            <template #placeholder>
              <div class="image-loading">
                <el-icon class="is-loading"><Loading /></el-icon>
              </div>
            </template>
          </el-image>
          <!-- 选中状态 -->
          <div v-if="selectedTemplate?.id === template.id" class="selected-badge">
            <el-icon><Check /></el-icon>
          </div>
        </div>

        <!-- 模板信息 -->
        <div class="template-info">
          <h4 class="template-name">{{ template.name }}</h4>
          <p v-if="template.description" class="template-desc">
            {{ template.description }}
          </p>
          <div class="template-meta">
            <el-tag size="small" :type="template.type === 'system' ? 'info' : 'success'">
              {{ template.type === 'system' ? '系统模板' : '用户上传' }}
            </el-tag>
            <span class="usage-count">
              <el-icon><Star /></el-icon>
              {{ template.usageCount }}
            </span>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="!loading && templates.length === 0" class="empty-state">
        <el-icon><Files /></el-icon>
        <p>暂无可用模板</p>
      </div>
    </div>

    <!-- 底部操作 -->
    <template #footer>
      <el-button @click="handleClose">
        取消
      </el-button>
      <el-button
        type="primary"
        :disabled="!selectedTemplate || isGenerating"
        :loading="isGenerating"
        @click="handleConfirm"
      >
        {{ isGenerating ? '生成中...' : '自动生成' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { PropType } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Check,
  Picture,
  Loading,
  Files,
  Star
} from '@element-plus/icons-vue'
import type { BananaTemplate, OutlineData } from '@/types/banana-generation'
import bananaGenerationService from '@/services/bananaGenerationService'

export interface TemplateSelectorProps {
  visible: boolean
  outline: OutlineData
}

interface Emits {
  (e: 'update:visible', visible: boolean): void
  (e: 'confirm', template: BananaTemplate, taskId: string): void
}

const props = defineProps({
  visible: {
    type: Boolean,
    required: true
  },
  outline: {
    type: Object as PropType<OutlineData>,
    required: true
  }
})

const emit = defineEmits<Emits>()

// 状态
const loading = ref(false)
const templates = ref<BananaTemplate[]>([])
const selectedTemplate = ref<BananaTemplate | null>(null)
const isGenerating = ref(false)

// 计算属性
const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

// 监听对话框显示/隐藏
watch(() => props.visible, (visible) => {
  if (visible) {
    loadTemplates()
  } else {
    reset()
  }
})

/**
 * 加载模板列表
 */
const loadTemplates = async () => {
  loading.value = true
  try {
    const response = await bananaGenerationService.getTemplates()

    if (response.success) {
      templates.value = response.data?.templates || []
    } else {
      ElMessage.error('加载模板失败：' + (response.error?.message || '未知错误'))
    }
  } catch (error: any) {
    console.error('加载模板失败:', error)
    ElMessage.error('加载模板失败：' + error.message)
  } finally {
    loading.value = false
  }
}

/**
 * 选择模板
 */
const selectTemplate = (template: BananaTemplate) => {
  selectedTemplate.value = template
}

/**
 * 确认选择
 */
const handleConfirm = async () => {
  if (!selectedTemplate.value || !props.outline?.slides?.length) return

  // 预览用户的选择
  const confirmResult = await ElMessageBox.confirm(
    `确定使用模板 "${selectedTemplate.value.name}" 生成 ${props.outline.slides.length} 页PPT吗？
\n这可能需要几分钟时间。`,
    '确认生成',
    {
      confirmButtonText: '开始生成',
      cancelButtonText: '取消',
      type: 'info'
    }
  ).catch(() => false)

  if (!confirmResult) return

  isGenerating.value = true

  try {
    // 调用父组件传入的生成方法
    emit('confirm', selectedTemplate.value, '')

    // 关闭对话框
    handleClose()
  } catch (error: any) {
    console.error('生成失败:', error)
    ElMessage.error('生成失败：' + error.message)
  } finally {
    isGenerating.value = false
  }
}

/**
 * 关闭对话框
 */
const handleClose = () => {
  emit('update:visible', false)
}

/**
 * 重置状态
 */
const reset = () => {
  selectedTemplate.value = null
  isGenerating.value = false
}
</script>

<style scoped lang="scss">
.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  max-height: 60vh;
  overflow-y: auto;
  padding: 10px;
}

.template-item {
  border: 2px solid var(--el-border-color);
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    border-color: var(--el-color-primary);
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  }

  &.selected {
    border-color: var(--el-color-primary);
    background-color: var(--el-color-primary-light-9);
  }
}

.template-image {
  position: relative;
  width: 100%;
  height: 160px;
  overflow: hidden;
  background-color: var(--el-fill-color-light);

  .el-image {
    width: 100%;
    height: 100%;
  }

  .image-error,
  .image-loading {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: var(--el-text-color-secondary);

    .el-icon {
      font-size: 32px;
      margin-bottom: 8px;
    }
  }

  .selected-badge {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 32px;
    height: 32px;
    background-color: var(--el-color-primary);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
  }
}

.template-info {
  padding: 12px;

  .template-name {
    margin: 0 0 8px 0;
    font-size: 16px;
    font-weight: 500;
    color: var(--el-text-color-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .template-desc {
    margin: 0 0 12px 0;
    font-size: 14px;
    color: var(--el-text-color-secondary);
    line-height: 1.5;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .template-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .usage-count {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      color: var(--el-text-color-secondary);

      .el-icon {
        font-size: 14px;
      }
    }
  }
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 60px 20px;
  color: var(--el-text-color-secondary);

  .el-icon {
    font-size: 48px;
    margin-bottom: 16px;
    color: var(--el-text-color-placeholder);
  }

  p {
    margin: 0;
    font-size: 16px;
  }
}
</style>
