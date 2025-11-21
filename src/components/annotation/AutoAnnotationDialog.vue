<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    title="自动标注"
    width="800px"
    :close-on-click-modal="false"
    :before-close="handleBeforeClose"
    destroy-on-close
  >
    <div class="auto-annotation-dialog">
      <!-- 配置区域 -->
      <div class="config-section" v-if="!isProcessing && !isCompleted">
        <h3 class="section-title">标注配置</h3>

        <!-- 模型选择 -->
        <div class="form-item">
          <label class="form-label">标注模型</label>
          <el-select
            v-model="selectedModel"
            placeholder="请选择标注模型"
            size="large"
            class="model-select"
          >
            <el-option
              v-for="model in availableModels"
              :key="model.id"
              :label="model.name"
              :value="model.id"
            />
          </el-select>
        </div>

        <!-- 标注选项 -->
        <div class="form-item">
          <label class="form-label">标注内容</label>
          <div class="annotation-options">
            <el-checkbox-group v-model="annotationOptions">
              <el-checkbox label="page_type">页面类型</el-checkbox>
              <el-checkbox label="layout_type">布局类型</el-checkbox>
              <el-checkbox label="element_annotations">元素标注</el-checkbox>
            </el-checkbox-group>
          </div>
        </div>

        <!-- 调试选项 -->
        <div class="form-item">
          <div class="annotation-options">
            <el-checkbox v-model="isDebugMode">开启调试模式（保存截图到本地）</el-checkbox>
          </div>
        </div>

        <!-- 幻灯片统计 -->
        <div class="slide-stats">
          <div class="stat-item">
            <span class="stat-label">待标注幻灯片</span>
            <span class="stat-value">{{ slideCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">预计时间</span>
            <span class="stat-value">{{ estimatedTime }}秒</span>
          </div>
        </div>
      </div>

      <!-- 进度区域 -->
      <div class="progress-section" v-if="isProcessing">
        <h3 class="section-title">标注进度</h3>

        <!-- 进度条 -->
        <div class="progress-container">
          <el-progress
            :percentage="progressPercentage"
            :status="progressStatus"
            :stroke-width="8"
            :show-text="true"
          />
          <div class="progress-details">
            <span class="progress-text">
              正在处理第 {{ currentPage }} / {{ totalPages }} 页
            </span>
            <span class="time-remaining" v-if="estimatedRemainingTime > 0">
              预计剩余时间：{{ estimatedRemainingTime }}秒
            </span>
          </div>
        </div>

        <!-- 当前处理信息 -->
        <div class="current-processing" v-if="currentSlideInfo">
          <div class="processing-info">
            <span class="info-label">当前处理：</span>
            <span class="info-value">{{ currentSlideInfo.title || '幻灯片' }}</span>
          </div>
        </div>
      </div>

      <!-- 结果区域 -->
      <div class="result-section" v-if="isCompleted">
        <h3 class="section-title">标注完成</h3>

        <div class="result-stats">
          <div class="stat-card success">
            <div class="stat-icon">✓</div>
            <div class="stat-content">
              <div class="stat-number">{{ successCount }}</div>
              <div class="stat-label">成功标注</div>
            </div>
          </div>
          <div class="stat-card failed" v-if="failedCount > 0">
            <div class="stat-icon">✗</div>
            <div class="stat-content">
              <div class="stat-number">{{ failedCount }}</div>
              <div class="stat-label">标注失败</div>
            </div>
          </div>
          <div class="stat-card confidence">
            <div class="stat-icon">★</div>
            <div class="stat-content">
              <div class="stat-number">{{ averageConfidence }}%</div>
              <div class="stat-label">平均置信度</div>
            </div>
          </div>
        </div>

        <!-- 结果预览 -->
        <div class="result-preview">
          <h4 class="preview-title">标注结果预览</h4>
          <div class="preview-content">
            <div class="preview-item" v-for="result in previewResults" :key="result.slide_id">
              <div class="preview-header">
                <span class="slide-title">{{ result.slide_id }}</span>
                <span class="slide-status" :class="result.status">
                  {{ result.status === 'success' ? '成功' : '失败' }}
                </span>
              </div>
              <div class="preview-details" v-if="result.status === 'success'">
                <span class="detail-item">页面类型：{{ result.page_type?.type }}</span>
                <span class="detail-item">布局类型：{{ result.layout_type?.type }}</span>
                <span class="detail-item">置信度：{{ Math.round(result.overall_confidence * 100) }}%</span>
              </div>
              <div class="preview-error" v-else>
                <span class="error-text">{{ result.error }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <el-button
          v-if="!isProcessing && !isCompleted"
          type="primary"
          size="large"
          @click="startAnnotation"
          :loading="isStarting"
          :disabled="!canStart"
        >
          {{ isStarting ? '正在生成截图...' : '开始标注' }}
        </el-button>

        <el-button
          v-if="isProcessing"
          type="danger"
          size="large"
          @click="cancelAnnotation"
          :loading="isCancelling"
        >
          取消标注
        </el-button>

        <el-button
          v-if="isCompleted"
          type="primary"
          size="large"
          @click="applyResults"
        >
          应用结果
        </el-button>

        <el-button
          v-if="isCompleted"
          type="default"
          size="large"
          @click="viewDetails"
        >
          查看详情
        </el-button>

        <el-button
          v-if="isCompleted"
          type="default"
          size="large"
          @click="closeDialog"
        >
          关闭
        </el-button>
      </div>
    </div>
    <div class="hidden-thumbnails-view">
      <div class="hidden-thumbnails" ref="hiddenThumbnailsRef">
        <ThumbnailSlide 
          v-for="slide in slides" 
          :key="slide.id" 
          :slide="slide" 
          :size="800" 
          class="hidden-thumbnail"
        />
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick, useTemplateRef } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useModelStore } from '@/store/model'
import ThumbnailSlide from '@/views/components/ThumbnailSlide/index.vue'
import { generateScreenshotsFromContainer } from '@/utils/screenshotHelper'

// Props
const props = defineProps<{
  visible: boolean
  slides: any[]
  taskId?: string
  isProcessing?: boolean
  isCompleted?: boolean
  progress?: {
    percentage: number
    currentPage: number
    totalPages: number
    estimatedRemainingTime: number
    currentSlide?: any
  }
  results?: any
}>()

// Emits
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'start-annotation', slides: any[], config: AnnotationConfig, screenshots: string[]): void
  (e: 'cancel-annotation'): void
  (e: 'apply-results', results: AnnotationResults): void
  (e: 'view-details', taskId: string): void
}>()

// 类型定义
interface AnnotationConfig {
  modelId: string
  options: string[]
}

interface AnnotationResults {
  taskId: string
  results: any[]
  statistics: {
    total_pages: number
    successful_pages: number
    failed_pages: number
    average_confidence: number
  }
}

// 响应式数据
const selectedModel = ref('')
const annotationOptions = ref(['page_type', 'layout_type', 'element_annotations'])
const isDebugMode = ref(false)
const isStarting = ref(false)
const hiddenThumbnailsRef = useTemplateRef<HTMLElement>('hiddenThumbnailsRef')

// 使用来自 props 的状态，如果没有则使用本地状态
const isProcessing = computed(() => props.isProcessing || false)
const isCancelling = ref(false)
const isCompleted = computed(() => props.isCompleted || false)

// 进度数据 - 使用来自 props 的进度数据
const progressPercentage = computed(() => props.progress?.percentage || 0)
const currentPage = computed(() => props.progress?.currentPage || 0)
const totalPages = computed(() => props.progress?.totalPages || 0)
const estimatedRemainingTime = computed(() => props.progress?.estimatedRemainingTime || 0)
const currentSlideInfo = computed(() => props.progress?.currentSlide || null)

// 结果数据 - 使用来自 props 的结果数据
const taskId = computed(() => props.taskId || '')
const successCount = computed(() => {
  if (props.results?.statistics?.successful_pages) {
    return props.results.statistics.successful_pages
  }
  return 0
})
const failedCount = computed(() => {
  if (props.results?.statistics?.failed_pages) {
    return props.results.statistics.failed_pages
  }
  return 0
})
const averageConfidence = computed(() => {
  if (props.results?.statistics?.average_confidence) {
    return Math.round(props.results.statistics.average_confidence * 100)
  }
  return 0
})
const previewResults = computed(() => {
  if (props.results?.results) {
    return props.results.results.slice(0, 5) // 只显示前5个结果预览
  }
  return []
})

// 模型管理
const modelStore = useModelStore()
const availableModels = ref<Array<{id: string, name: string}>>([])

// 计算属性
const slideCount = computed(() => props.slides?.length || 0)
const estimatedTime = computed(() => slideCount.value * 30) // 每页约30秒

const canStart = computed(() => {
  return slideCount.value > 0 &&
         selectedModel.value &&
         annotationOptions.value.length > 0
})

const progressStatus = computed(() => {
  if (progressPercentage.value === 100) return 'success'
  if (failedCount.value > 0) return 'exception'
  return undefined
})

// 生命周期
onMounted(async () => {
  await loadAvailableModels()
})

// 监听可见性变化
watch(() => props.visible, async (newVal) => {
  if (newVal) {
    await loadAvailableModels()
  }
})

// 监听slides变化，确保隐藏的thumbnails正确更新
watch(() => props.slides, async (newSlides) => {
  if (newSlides && newSlides.length > 0) {
    // 等待DOM更新
    await nextTick()
    console.log('幻灯片已更新，hiddenThumbnailsRef:', hiddenThumbnailsRef.value?.children.length)
  }
}, { deep: true })

// 方法
const loadAvailableModels = async () => {
  try {
    await modelStore.loadModels()

    // 过滤出支持视觉功能的对话模型
    const visionModels = modelStore.models.filter(model => {
      // 必须是文本模型（对话模型）且支持视觉功能
      return model.type === 'text' && model.supportsVision
    })

    availableModels.value = visionModels.map(model => ({
      id: model.id,
      name: model.name
    }))

    // 如果有可用模型，设置默认选中第一个
    if (availableModels.value.length > 0 && !selectedModel.value) {
      selectedModel.value = availableModels.value[0].id
    }
  }
  catch (error) {
    console.error('加载可用模型失败:', error)
    ElMessage.error('加载可用模型失败')
  }
}


const startAnnotation = async () => {
  if (!canStart.value) {
    ElMessage.warning('请先配置标注选项')
    return
  }

  isStarting.value = true
  ElMessage.info('正在生成幻灯片截图...')

  try {
    // 等待渲染完成
    await nextTick()

    // 调试信息：检查幻灯片和容器
    console.log('[自动标注] 幻灯片数量:', props.slides.length)
    console.log('[自动标注] hiddenThumbnailsRef:', hiddenThumbnailsRef.value)
    console.log('[自动标注] 子元素数量:', hiddenThumbnailsRef.value?.children.length)

    if (!hiddenThumbnailsRef.value) {
      throw new Error('无法获取缩略图容器')
    }

    // 详细检查每个子元素
    const elements = hiddenThumbnailsRef.value.children
    console.log('[自动标注] 缩略图元素详情:')
    for (let i = 0; i < elements.length; i++) {
      const el = elements[i] as HTMLElement
      const slide = props.slides[i]
      console.log(`  幻灯片 ${i}:`, {
        slideId: slide?.id,
        slideType: slide?.type,
        exists: !!el,
        tagName: el?.tagName,
        childrenCount: el?.children.length
      })
    }

    // 生成截图
    const screenshots = await generateScreenshotsFromContainer(
      hiddenThumbnailsRef.value,
      props.slides.length,
      {
        width: 800, // 与 ThumbnailSlide 的 size 保持一致
        quality: 0.95,
        saveToDisk: isDebugMode.value,
        filenamePrefix: 'annotation-debug'
      }
    )

    // 验证截图和幻灯片的对应关系
    console.log('[自动标注] 截图与幻灯片对应关系:')
    screenshots.forEach((screenshot, i) => {
      const slide = props.slides[i]
      console.log(`  索引 ${i}: 幻灯片ID=${slide?.id || '未定义'}, 截图有效=${!!(screenshot && screenshot.length > 1000)}, 截图长度=${screenshot?.length || 0}`)
    })

    // 检查有效截图数量
    const validCount = screenshots.filter(s => s && s.length > 1000).length
    console.log(`[自动标注] 生成截图完成，有效数量: ${validCount}/${screenshots.length}`)

    // 调试：详细检查每个截图
    screenshots.forEach((s, i) => {
      console.log(`[自动标注] 截图 ${i}:`, {
        exists: !!s,
        length: s?.length || 0,
        isValid: s && s.length > 1000
      })
    })

    if (validCount === 0) {
      console.error('[自动标注] 所有截图都无效')
      throw new Error('无法生成有效截图，请重试')
    }

    const config: AnnotationConfig = {
      modelId: selectedModel.value,
      options: annotationOptions.value
    }

    // 传递 slides 作为第一个参数
    emit('start-annotation', props.slides, config, screenshots)

    ElMessage.success('截图生成完毕，标注任务已开始')
  }
  catch (error) {
    console.error('启动标注失败:', error)
    ElMessage.error(error instanceof Error ? error.message : '启动标注失败')
  }
  finally {
    isStarting.value = false
  }
}

const cancelAnnotation = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要取消标注任务吗？已完成的标注将丢失。',
      '确认取消',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    isCancelling.value = true
    emit('cancel-annotation')

    // 取消操作由父组件处理，这里只显示消息
    ElMessage.info('正在取消标注任务...')
  }
  catch {
    // 用户取消操作
  }
}

const applyResults = () => {
  // 使用完整的 props.results 而不是截断的 previewResults
  if (!props.results || !props.results.results) {
    ElMessage.error('没有可用的完整标注结果')
    return
  }

  const results: AnnotationResults = {
    taskId: taskId.value,
    results: props.results.results,  // 使用完整的标注结果
    statistics: {
      total_pages: totalPages.value,
      successful_pages: successCount.value,
      failed_pages: failedCount.value,
      average_confidence: averageConfidence.value
    }
  }

  console.log('应用完整标注结果:', {
    totalSlides: results.results.length,
    firstSlide: results.results[0]?.slide_id,
    lastSlide: results.results[results.results.length - 1]?.slide_id
  })

  emit('apply-results', results)
  closeDialog()
}

const viewDetails = () => {
  if (taskId.value) {
    emit('view-details', taskId.value)
  }
}

const closeDialog = () => {
  emit('update:visible', false)
}

const handleBeforeClose = (done: () => void) => {
  if (isProcessing.value) {
    ElMessage.warning('标注任务正在进行中，请先取消或等待完成')
    return
  }
  done()
}

</script>

<style scoped lang="scss">
.auto-annotation-dialog {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.section-title {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.config-section {
  .form-item {
    margin-bottom: 20px;
  }

  .form-label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #606266;
  }

  .model-select {
    width: 100%;
  }

  .annotation-options {
    .el-checkbox-group {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
  }

  .slide-stats {
    display: flex;
    gap: 20px;
    padding: 16px;
    background: #f5f7fa;
    border-radius: 8px;

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }

    .stat-label {
      font-size: 12px;
      color: #909399;
    }

    .stat-value {
      font-size: 18px;
      font-weight: 600;
      color: #303133;
    }
  }
}

.progress-section {
  .progress-container {
    margin-bottom: 20px;
  }

  .progress-details {
    display: flex;
    justify-content: space-between;
    margin-top: 12px;
    font-size: 14px;
    color: #606266;
  }

  .current-processing {
    padding: 16px;
    background: #f0f9ff;
    border-radius: 8px;
    border: 1px solid #e1f5fe;

    .processing-info {
      .info-label {
        font-weight: 500;
        color: #606266;
      }

      .info-value {
        color: #303133;
        font-weight: 500;
      }
    }
  }
}

.result-section {
  .result-stats {
    display: flex;
    gap: 16px;
    margin-bottom: 24px;

    .stat-card {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      border-radius: 8px;
      background: #f5f7fa;

      &.success {
        background: #f0f9f4;
        border: 1px solid #e1f5e8;
      }

      &.failed {
        background: #fef0f0;
        border: 1px solid #fde2e2;
      }

      &.confidence {
        background: #f0f9ff;
        border: 1px solid #e1f5fe;
      }

      .stat-icon {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        font-size: 16px;
        font-weight: bold;

        .success & {
          background: #67c23a;
          color: white;
        }

        .failed & {
          background: #f56c6c;
          color: white;
        }

        .confidence & {
          background: #409eff;
          color: white;
        }
      }

      .stat-content {
        .stat-number {
          font-size: 20px;
          font-weight: 600;
          color: #303133;
        }

        .stat-label {
          font-size: 12px;
          color: #909399;
        }
      }
    }
  }

  .result-preview {
    .preview-title {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 600;
      color: #303133;
    }

    .preview-content {
      max-height: 200px;
      overflow-y: auto;
      border: 1px solid #e4e7ed;
      border-radius: 8px;
      padding: 12px;
    }

    .preview-item {
      padding: 12px;
      border-bottom: 1px solid #f0f0f0;

      &:last-child {
        border-bottom: none;
      }

      .preview-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;

        .slide-title {
          font-weight: 500;
          color: #303133;
        }

        .slide-status {
          font-size: 12px;
          padding: 2px 8px;
          border-radius: 12px;

          &.success {
            background: #f0f9f4;
            color: #67c23a;
          }

          &.failed {
            background: #fef0f0;
            color: #f56c6c;
          }
        }
      }

      .preview-details {
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: 12px;
        color: #606266;

        .detail-item {
          display: inline-block;
          margin-right: 12px;
        }
      }

      .preview-error {
        .error-text {
          font-size: 12px;
          color: #f56c6c;
        }
      }
    }
  }
}

.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 16px;
  border-top: 1px solid #e4e7ed;
}

:deep(.el-dialog__body) {
  padding: 20px;
}

@media (max-width: 768px) {
  .result-stats {
    flex-direction: column;
  }

  .action-buttons {
    flex-direction: column;
  }
}

.hidden-thumbnails-view {
  position: fixed;
  left: -9999px;
  top: 0;
  /* 不要使用 visibility: hidden，这会导致截图为空 */
  /* 不要使用 opacity: 0，因为截图可能继承该属性 */
  z-index: -9999;
  pointer-events: none;
  
  .hidden-thumbnail {
    margin: 0;
    padding: 0;
  }
}
</style>