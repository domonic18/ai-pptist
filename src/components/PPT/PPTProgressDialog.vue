<template>
  <el-dialog
    v-model="dialogVisible"
    :title="title"
    width="680px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="!isGenerating"
    @close="handleClose"
  >
    <!-- 进度条 -->
    <div class="progress-section">
      <div class="progress-header">
        <span>总体进度</span>
        <span class="progress-text">{{ completedCount }} / {{ totalCount }}</span>
      </div>
      <el-progress :percentage="progressPercentage" :stroke-width="18" />
      <div v-if="hasProcessingSlides" class="progress-status">
        <el-icon class="is-loading"><Loading /></el-icon>
        正在生成中...
      </div>
      <div v-else-if="allCompleted" class="progress-status success">
        <el-icon><CheckCircle /></el-icon>
        生成完成
      </div>
    </div>

    <!-- 幻灯片状态列表 -->
    <div class="slides-list" :class="{ 'auto-scroll': isGenerating }">
      <div
        v-for="slide in slidesList"
        :key="slide.index"
        class="slide-item"
        :class="slide.status"
      >
        <!-- 幻灯片预览 -->
        <div class="slide-preview">
          <el-image
            v-if="slide.imageUrl"
            :src="slide.imageUrl"
            fit="cover"
            :preview-src-list="[slide.imageUrl]"
          >
            <template #error>
              <div class="preview-error">
                <el-icon><Picture /></el-icon>
              </div>
            </template>
          </el-image>
          <div v-else-if="slide.status === 'processing'" class="preview-loading">
            <el-icon class="is-loading"><Loading /></el-icon>
          </div>
          <div v-else-if="slide.status === 'failed'" class="preview-error">
            <el-icon><Warning /></el-icon>
          </div>
          <div v-else class="preview-placeholder">
            <el-icon><Document /></el-icon>
          </div>
        </div>

        <!-- 幻灯片信息 -->
        <div class="slide-info">
          <h4 class="slide-title" :title="slide.title">{{ slide.title }}</h4>
          <div class="slide-status">
            <el-tag :type="getStatusTagType(slide.status)" size="small">
              {{ getStatusText(slide.status) }}
            </el-tag>
            <span v-if="slide.generationTime" class="generation-time">
              {{ slide.generationTime.toFixed(1) }}s
            </span>
          </div>
          <div class="slide-meta">
            <span class="slide-index">第 {{ slide.index + 1 }} 页</span>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="slide-actions">
          <el-button
            v-if="slide.status === 'failed'"
            type="primary"
            size="small"
            plain
            @click="handleRegenerate(slide.index)"
          >
            重新生成
          </el-button>
          <el-button
            v-if="slide.imageUrl"
            type="success"
            size="small"
            plain
            @click="handleDownload(slide.imageUrl, slide.index)"
          >
            下载
          </el-button>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="!slidesList.length" class="empty-state">
        <el-icon><DocumentCopy /></el-icon>
        <p>暂无幻灯片数据</p>
      </div>
    </div>

    <!-- 底部操作 -->
    <template #footer>
      <div class="dialog-footer">
        <el-button
          :disabled="!allCompleted"
          type="success"
          @click="handleApplyToEditor"
        >
          应用到编辑器
        </el-button>
        <el-button
          v-if="isGenerating"
          type="danger"
          plain
          @click="handleStop"
        >
          停止生成
        </el-button>
        <el-button @click="handleClose">
          {{ allCompleted ? '关闭' : '隐藏' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import type { PropType } from 'vue'
import {
  ElMessage,
  ElMessageBox
} from 'element-plus'
import {
  Loading,
  CheckCircle,
  Picture,
  Warning,
  Document,
  DocumentCopy
} from '@element-plus/icons-vue'
import type { SlideGenerationResult, Template } from '@/types/banana-generation'
import bananaGenerationService from '@/services/bananaGenerationService'

interface Emits {
  (e: 'update:visible', visible: boolean): void
  (e: 'slide-generated', slide: SlideGenerationResult): void
  (e: 'apply-to-editor'): void
  (e: 'stop'): void
}

export interface ProgressDialogProps {
  visible: boolean
  taskId: string
  templates: Template[]
  slides: SlideGenerationResult[]
  isGenerating: boolean
}

const props = defineProps<{
  visible: boolean
  taskId: string
  slides: SlideGenerationResult[]
  isGenerating: boolean
}>()

const emit = defineEmits<Emits>()

// 状态
const title = ref('生成进度')
const autoScrollInterval = ref<number | null>(null)

// 计算属性
const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

const slidesList = computed(() => {
  // 按索引排序
  return [...props.slides].sort((a, b) => a.index - b.index)
})

const totalCount = computed(() => slidesList.value.length)

const completedCount = computed(() => {
  return slidesList.value.filter(s => s.status === 'completed').length
})

const hasProcessingSlides = computed(() => {
  return slidesList.value.some(s => s.status === 'processing')
})

const allCompleted = computed(() => {
  return completedCount.value > 0 && !hasProcessingSlides.value
})

const progressPercentage = computed(() => {
  if (totalCount.value === 0) return 0
  return Math.round((completedCount.value / totalCount.value) * 100)
})

// 监听生成状态，自动滚动到最新完成的幻灯片
watch(() => props.slides, async (newSlides, oldSlides) => {
  if (!props.visible) return

  // 检查是否有新完成的幻灯片
  const newCompleted = newSlides.filter(
    s => s.status === 'completed' && !oldSlides.find(os => os.index === s.index)?.imageUrl
  )

  if (newCompleted.length > 0) {
    // 触发事件，通知父组件更新编辑器
    newCompleted.forEach(slide => {
      emit('slide-generated', slide)
    })

    // 自动滚动到最新完成的幻灯片
    await nextTick()
    const lastCompletedIndex = Math.max(...newCompleted.map(s => s.index))
    scrollToSlide(lastCompletedIndex)
  }

  // 启动/停止自动滚动
  if (props.isGenerating) {
    startAutoScroll()
  } else {
    stopAutoScroll()
  }
}, { deep: true })

watch(() => props.isGenerating, (isGenerating) => {
  if (isGenerating) {
    startAutoScroll()
  } else {
    stopAutoScroll()
  }
})

/**
 * 自动滚动到指定幻灯片
 */
const scrollToSlide = (index: number) => {
  const container = document.querySelector('.slides-list')
  const slideElement = document.querySelector(`[data-slide-index="${index}"]`)

  if (container && slideElement) {
    slideElement.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    })
  }
}

/**
 * 启动自动滚动
 */
const startAutoScroll = () => {
  if (autoScrollInterval.value) return

  autoScrollInterval.value = window.setInterval(() => {
    const container = document.querySelector('.slides-list') as HTMLElement
    if (!container) return

    const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 10

    if (!isAtBottom) {
      container.scrollTop += 1
    }
  }, 100)
}

/**
 * 停止自动滚动
 */
const stopAutoScroll = () => {
  if (autoScrollInterval.value) {
    window.clearInterval(autoScrollInterval.value)
    autoScrollInterval.value = null
  }
}

/**
 * 获取状态标签类型
 */
const getStatusTagType = (status: string) => {
  switch (status) {
    case 'completed':
      return 'success'
    case 'processing':
      return 'primary'
    case 'failed':
      return 'danger'
    default:
      return 'info'
  }
}

/**
 * 获取状态文本
 */
const getStatusText = (status: string) => {
  switch (status) {
    case 'completed':
      return '已完成'
    case 'processing':
      return '生成中'
    case 'failed':
      return '生成失败'
    default:
      return '等待中'
  }
}

/**
 * 重新生成单张幻灯片
 */
const handleRegenerate = async (slideIndex: number) => {
  try {
    await bananaGenerationService.regenerateSlide({
      task_id: props.taskId,
      slide_index: slideIndex
    })

    ElMessage.success('重新生成已启动')
  } catch (error: any) {
    console.error('重新生成失败:', error)
    ElMessage.error('重新生成失败：' + error.message)
  }
}

/**
 * 下载生成的图片
 */
const handleDownload = (imageUrl: string, index: number) => {
  const link = document.createElement('a')
  link.href = imageUrl
  link.download = `slide_${index + 1}.png`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  ElMessage.success(`第 ${index + 1} 页已下载`)
}

/**
 * 应用到编辑器
 */
const handleApplyToEditor = () => {
  emit('apply-to-editor')
  dialogVisible.value = false
  ElMessage.success('已应用到编辑器')
}

/**
 * 停止生成
 */
const handleStop = async () => {
  try {
    await ElMessageBox.confirm('确定要停止生成吗？已生成的图片将保留。', '确认停止', {
      confirmButtonText: '停止',
      cancelButtonText: '继续生成',
      type: 'warning'
    })

    emit('stop')
    dialogVisible.value = false
    ElMessage.info('已停止生成')
  } catch {
    // 用户取消
  }
}

/**
 * 关闭对话框
 */
const handleClose = () => {
  if (props.isGenerating) {
    // 如果还在生成，提示用户
    ElMessageBox.confirm(
      '生成正在进行中，关闭后将无法查看进度，确定要关闭吗？',
      '提示',
      {
        confirmButtonText: '关闭',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(() => {
      emit('update:visible', false)
      stopAutoScroll()
    }).catch(() => {})
  } else {
    emit('update:visible', false)
    stopAutoScroll()
  }
}

// 清理
import { onUnmounted } from 'vue'
onUnmounted(() => {
  stopAutoScroll()
})
</script>

<style scoped lang="scss">
.progress-section {
  margin-bottom: 24px;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 8px;

  .progress-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    font-size: 14px;
    color: #666;

    .progress-text {
      font-weight: 500;
    }
  }

  .progress-status {
    margin-top: 12px;
    text-align: center;
    font-size: 14px;
    color: #666;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;

    &.success {
      color: var(--el-color-success);
    }
  }
}

.slides-list {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  padding: 12px;

  &.auto-scroll {
    scroll-behavior: smooth;
  }

  .slide-item {
    display: flex;
    align-items: center;
    padding: 12px;
    margin-bottom: 12px;
    border-radius: 8px;
    transition: background-color 0.3s;

    &:last-child {
      margin-bottom: 0;
    }

    &.completed {
      background-color: var(--el-color-success-light-9);
    }

    &.processing {
      background-color: var(--el-color-primary-light-9);
    }

    &.failed {
      background-color: var(--el-color-danger-light-9);
    }
  }

  .slide-preview {
    width: 120px;
    height: 68px;
    margin-right: 16px;
    border-radius: 4px;
    overflow: hidden;
    background-color: #f5f5f5;
    flex-shrink: 0;

    .el-image {
      width: 100%;
      height: 100%;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .preview-loading,
    .preview-error,
    .preview-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #999;

      .el-icon {
        font-size: 24px;
      }
    }

    .preview-error {
      background-color: var(--el-color-danger-light-5);
      color: var(--el-color-danger);
    }
  }

  .slide-info {
    flex: 1;
    min-width: 0;

    .slide-title {
      margin: 0 0 8px 0;
      font-size: 14px;
      font-weight: 500;
      color: #333;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .slide-status {
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 8px;

      .generation-time {
        font-size: 12px;
        color: #999;
      }
    }

    .slide-meta {
      .slide-index {
        font-size: 12px;
        color: #999;
      }
    }
  }

  .slide-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .empty-state {
    text-align: center;
    padding: 40px 20px;
    color: #999;

    .el-icon {
      font-size: 48px;
      margin-bottom: 16px;
      color: #ccc;
    }

    p {
      margin: 0;
      font-size: 16px;
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;

  .el-button {
    flex: 1;
  }
}
</style>
