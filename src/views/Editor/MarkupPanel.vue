<template>
  <MoveablePanel
    class="notes-panel"
    :width="360"
    :height="400"
    title="幻灯片类型标注"
    :left="-270"
    :top="90"
    @close="close()"
  >
    <div class="container">
      <!-- 进度显示区域 - 放在顶部 -->
      <div v-if="showProgress" class="annotate-progress-section">
        <div class="progress-header">
          <div class="progress-text">
            正在标注 {{ annotatingSlideIndex }} / {{ totalSlidesToAnnotate }}
            <span v-if="annotatingSlideTitle">
              - {{ annotatingSlideTitle }}
            </span>
          </div>
          <div class="progress-percentage">{{ annotatingProgress }}%</div>
        </div>
        <el-progress
          :percentage="annotatingProgress"
          :stroke-width="6"
          :show-text="false"
          class="main-progress"
        />
      </div>

      <!-- 结果统计 - 放在进度下方 -->
      <div v-if="showStats" class="annotate-stats-section">
        <span class="stat-item success">✓ {{ successCount }}页成功</span>
        <span v-if="failedCount > 0" class="stat-item failed">✗ {{ failedCount }}页失败</span>
      </div>

      <!-- 自动标注控制区域 -->
      <div class="auto-annotate-section">
        <div class="section-header">
          <IconMagic class="icon" />
          <span>AI 自动标注</span>
        </div>

        <div class="auto-annotate-buttons">
          <!-- 标注当前页按钮 -->
          <Button
            type="primary"
            size="small"
            :loading="isAnnotatingCurrent"
            :disabled="isAnnotatingAll"
            @click="annotateCurrentSlide(hiddenThumbnailsRef)"
            class="annotate-btn"
          >
            <template v-if="isAnnotatingCurrent">
              标注中...
            </template>
            <template v-else>
              标注当前页
            </template>
          </Button>

          <!-- 标注所有页按钮 -->
          <Button
            type="primary"
            size="small"
            :loading="isAnnotatingAll"
            :disabled="isAnnotatingCurrent"
            @click="annotateAllSlides(hiddenThumbnailsRef)"
            class="annotate-btn"
          >
            <template v-if="isAnnotatingAll">
              标注所有页...
            </template>
            <template v-else>
              标注所有页 ({{ totalSlides }}页)
            </template>
          </Button>
        </div>
      </div>

      <!-- 隐藏的缩略图容器（用于截图生成） -->
      <div class="hidden-thumbnails-view">
        <div class="hidden-thumbnails" ref="hiddenThumbnailsRef">
          <ThumbnailSlide
            v-for="slide in slidesStore.slides"
            :key="slide.id"
            :slide="slide"
            :size="800"
            class="hidden-thumbnail"
          />
        </div>
      </div>

      <!-- 手动标注区域 -->
      <div class="manual-annotate-section">
        <div class="section-header">
          <span>手动标注</span>
        </div>

        <!-- 页面类型标注 -->
        <div class="annotation-row">
          <div class="label">当前页面类型：</div>
          <Select
            class="annotation-select"
            :value="slideType"
            @update:value="(value) => updateSlide(value as SlideType | '')"
            :options="slideTypeOptions"
          />
        </div>

        <!-- 新增：内容类型和布局类型标注 - 仅在内容页时显示 -->
        <template v-if="slideType === 'content'">
          <!-- 布局类型标注 -->
          <div class="annotation-row">
            <div class="label">布局类型：</div>
            <Select
              class="annotation-select"
              :value="layoutType"
              @update:value="
                (value) => updateLayoutType(value as LayoutType | '')
              "
              :options="layoutTypeOptions"
              placeholder="选择布局类型（可选）"
            />
            <div class="optional-tag">可选</div>
          </div>

          <!-- 内容类型标注 -->
          <div class="annotation-row">
            <div class="label">内容类型：</div>
            <Select
              class="annotation-select"
              :value="contentType"
              @update:value="
                (value) => updateContentType(value as ContentType | '')
              "
              :options="contentTypeOptions"
              placeholder="选择内容类型（可选）"
            />
            <div class="optional-tag">可选</div>
          </div>
        </template>

        <!-- 元素类型标注 -->
        <div
          class="annotation-row"
          v-if="
            handleElement &&
            (handleElement.type === 'text' ||
              (handleElement.type === 'shape' && handleElement.text))
          "
        >
          <div class="label">当前文本类型：</div>
          <Select
            class="annotation-select"
            :value="textType"
            @update:value="(value) => updateElement(value as TextType | '')"
            :options="textTypeOptions"
          />
        </div>
        <div
          class="annotation-row"
          v-else-if="handleElement && handleElement.type === 'image'"
        >
          <div class="label">当前图片类型：</div>
          <Select
            class="annotation-select"
            :value="imageType"
            @update:value="(value) => updateElement(value as ImageType | '')"
            :options="imageTypeOptions"
          />
        </div>
        <div class="annotation-placeholder" v-else>
          选中图片、文字、带文字的形状，标记类型
        </div>
      </div>
    </div>
  </MoveablePanel>
</template>

<script lang="ts" setup>
import { useTemplateRef } from 'vue'
import { useMainStore, useSlidesStore } from '@/store'
import type {
  ImageType,
  SlideType,
  TextType,
  ContentType,
  LayoutType,
} from '@/types/slides'

import MoveablePanel from '@/components/MoveablePanel.vue'
import Select from '@/components/Select.vue'
import Button from '@/components/Button.vue'
import ThumbnailSlide from '@/views/components/ThumbnailSlide/index.vue'

// 组合式函数导入
import { useAutoAnnotation } from '@/composables/annotation/useAutoAnnotation'
import { useManualAnnotation } from '@/composables/annotation/useManualAnnotation'
import { useAnnotationOptions } from '@/composables/annotation/useAnnotationOptions'

// 主存储
const mainStore = useMainStore()
const slidesStore = useSlidesStore()

// 隐藏的缩略图容器引用（用于截图生成）
const hiddenThumbnailsRef = useTemplateRef<HTMLElement>('hiddenThumbnailsRef')

// 使用组合式函数
const {
  // 自动标注状态
  isAnnotatingCurrent,
  isAnnotatingAll,
  annotatingSlideIndex,
  totalSlidesToAnnotate,
  annotatingProgress,
  successCount,
  failedCount,

  // 自动标注计算属性
  totalSlides,
  annotatingSlideTitle,
  showProgress,
  showStats,

  // 自动标注方法
  annotateCurrentSlide,
  annotateAllSlides
} = useAutoAnnotation()

const {
  // 手动标注计算属性
  slideType,
  textType,
  imageType,
  contentType,
  layoutType,
  handleElement,

  // 手动标注方法
  updateSlide,
  updateElement,
  updateContentType,
  updateLayoutType
} = useManualAnnotation()

const {
  // 标注选项
  slideTypeOptions,
  textTypeOptions,
  imageTypeOptions,
  contentTypeOptions,
  layoutTypeOptions
} = useAnnotationOptions()

// 关闭面板
const close = () => {
  mainStore.setMarkupPanelState(false)
}
</script>

<style lang="scss" scoped>
.notes-panel {
  height: auto;
  max-height: 500px;
  font-size: 12px;
  user-select: none;
}

.container {
  height: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
}

// 进度显示区域
.annotate-progress-section {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 12px;
  border: 1px solid #e9ecef;
  animation: slideInDown 0.3s ease-out;

  .progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;

    .progress-text {
      font-size: 13px;
      font-weight: 500;
      color: #495057;

      span {
        color: #6c757d;
        font-weight: normal;
      }
    }

    .progress-percentage {
      font-size: 14px;
      font-weight: 600;
      color: #409eff;
      transition: color 0.3s ease;
    }
  }

  .main-progress {
    :deep(.el-progress-bar__outer) {
      background-color: #e9ecef;
      transition: background-color 0.3s ease;
    }

    :deep(.el-progress-bar__inner) {
      background-color: #409eff;
      transition: width 0.5s ease-in-out, background-color 0.3s ease;
    }
  }
}

// 结果统计区域
.annotate-stats-section {
  display: flex;
  gap: 16px;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;

  .stat-item {
    font-size: 12px;
    font-weight: 500;

    &.success {
      color: #67c23a;
    }

    &.failed {
      color: #f56c6c;
    }
  }
}

// 自动标注区域
.auto-annotate-section {
  .section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    font-size: 14px;
    font-weight: 600;
    color: #303133;

    .icon {
      font-size: 16px;
      color: #409eff;
    }
  }

  .auto-annotate-buttons {
    display: flex;
    gap: 12px;

    .annotate-btn {
      flex: 1;
      height: 32px;
      font-size: 13px;
      font-weight: 500;
      transition: all 0.2s ease-in-out;

      &:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
      }

      &:active {
        transform: translateY(0);
      }
    }
  }
}

// 手动标注区域
.manual-annotate-section {
  .section-header {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
    font-size: 14px;
    font-weight: 600;
    color: #303133;
  }

  .annotation-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    position: relative;

    .label {
      flex: 0 0 100px;
      font-size: 12px;
      color: #606266;
      text-align: right;
    }

    .annotation-select {
      flex: 1;
      min-width: 0;
    }

    .optional-tag {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 10px;
      color: #999;
      background: rgba(255, 255, 255, 0.9);
      padding: 1px 6px;
      border-radius: 3px;
      pointer-events: none;
      border: 1px solid #e4e7ed;
    }
  }

  .annotation-placeholder {
    height: 32px;
    line-height: 32px;
    text-align: center;
    color: #999;
    font-style: italic;
    border: 1px dashed #ccc;
    border-radius: 4px;
    font-size: 12px;
    background: #fafafa;
  }
}

// 隐藏的缩略图容器（用于截图生成）
.hidden-thumbnails-view {
  position: absolute;
  left: -9999px;
  top: -9999px;
  width: 0;
  height: 0;
  overflow: hidden;
  visibility: hidden;

  .hidden-thumbnails {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .hidden-thumbnail {
    flex-shrink: 0;
  }
}

// 响应式调整
@media (max-width: 768px) {
  .container {
    padding: 12px;
    gap: 12px;
  }

  .auto-annotate-buttons {
    flex-direction: column;
  }

  .annotation-row {
    flex-direction: column;
    align-items: stretch;

    .label {
      flex: none;
      text-align: left;
      margin-bottom: 4px;
    }
  }
}

// 动画定义
@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>