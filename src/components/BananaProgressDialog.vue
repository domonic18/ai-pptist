<template>
  <div class="banana-progress-dialog" v-if="visible">
    <div class="dialog-content">
      <div class="header">
        <span class="title">生成进度</span>
        <span class="close" @click="handleClose">×</span>
      </div>

      <div class="progress-info">
        <div class="progress-text">
          <span>已完成 {{ progress.completed }} / {{ progress.total }} 页</span>
          <span class="status" :class="statusClass">{{ statusText }}</span>
        </div>
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{ width: `${progressPercent}%` }"
          ></div>
        </div>
      </div>

      <div class="slides-list" v-if="slides.length > 0">
        <div
          class="slide-item"
          v-for="slide in slides"
          :key="slide.index"
          :class="slide.status"
        >
          <div class="slide-index">第 {{ slide.index + 1 }} 页</div>
          <div class="slide-title">{{ slide.title }}</div>
          <div class="slide-status">
            <span v-if="slide.status === 'completed'">✓ 已完成</span>
            <span v-else-if="slide.status === 'processing'">⏳ 生成中...</span>
            <span v-else-if="slide.status === 'failed'">
              ✗ 失败
              <Button
                class="retry-btn"
                size="small"
                @click="handleRetry(slide.index)"
              >
                重试
              </Button>
            </span>
            <span v-else>⏸ 等待中</span>
          </div>
        </div>
      </div>

      <div class="footer">
        <Button class="btn" @click="handleStop" :disabled="!canStop">
          停止生成
        </Button>
        <Button class="btn" type="primary" @click="handleClose" v-if="isCompleted">
          完成
        </Button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import Button from '@/components/Button.vue'
import type { GenerationStatusResponse, SlideGenerationResult } from '@/types/banana-generation'
import { GenerationStatus } from '@/types/banana-generation'

interface Props {
  visible: boolean
  statusData: GenerationStatusResponse | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  stop: []
  retry: [slideIndex: number]
}>()

const progress = computed(() => {
  if (!props.statusData) {
    return { total: 0, completed: 0, failed: 0, pending: 0 }
  }
  return props.statusData.progress
})

const slides = computed(() => {
  return props.statusData?.slides || []
})

const status = computed(() => {
  return props.statusData?.status || GenerationStatus.PENDING
})

const progressPercent = computed(() => {
  if (progress.value.total === 0) return 0
  return Math.round((progress.value.completed / progress.value.total) * 100)
})

const statusClass = computed(() => {
  return {
    'status-processing': status.value === GenerationStatus.PROCESSING,
    'status-completed': status.value === GenerationStatus.COMPLETED,
    'status-failed': status.value === GenerationStatus.FAILED,
    'status-pending': status.value === GenerationStatus.PENDING,
  }
})

const statusText = computed(() => {
  switch (status.value) {
    case GenerationStatus.PROCESSING:
      return '生成中'
    case GenerationStatus.COMPLETED:
      return '已完成'
    case GenerationStatus.FAILED:
      return '生成失败'
    case GenerationStatus.CANCELLED:
      return '已取消'
    default:
      return '等待中'
  }
})

const isCompleted = computed(() => {
  return (
    status.value === GenerationStatus.COMPLETED ||
    status.value === GenerationStatus.FAILED ||
    status.value === GenerationStatus.CANCELLED
  )
})

const canStop = computed(() => {
  return status.value === GenerationStatus.PROCESSING || status.value === GenerationStatus.PENDING
})

const handleClose = () => {
  emit('close')
}

const handleStop = () => {
  emit('stop')
}

const handleRetry = (slideIndex: number) => {
  emit('retry', slideIndex)
}
</script>

<style lang="scss" scoped>
.banana-progress-dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog-content {
  width: 600px;
  max-height: 80vh;
  background: #fff;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header {
  padding: 20px;
  border-bottom: 1px solid #e5e5e5;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .title {
    font-size: 18px;
    font-weight: 600;
    color: #333;
  }

  .close {
    font-size: 24px;
    color: #999;
    cursor: pointer;
    line-height: 1;
    user-select: none;

    &:hover {
      color: #333;
    }
  }
}

.progress-info {
  padding: 20px;
  border-bottom: 1px solid #e5e5e5;

  .progress-text {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    font-size: 14px;
    color: #666;

    .status {
      font-weight: 500;

      &.status-processing {
        color: $themeColor;
      }

      &.status-completed {
        color: #52c41a;
      }

      &.status-failed {
        color: #ff4d4f;
      }

      &.status-pending {
        color: #999;
      }
    }
  }

  .progress-bar {
    height: 8px;
    background: #f0f0f0;
    border-radius: 4px;
    overflow: hidden;

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, $themeColor, #33bcfc);
      transition: width 0.3s;
    }
  }
}

.slides-list {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  max-height: 400px;
}

.slide-item {
  padding: 12px;
  margin-bottom: 8px;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  background: #fafafa;

  &.completed {
    background: #f6ffed;
    border-color: #b7eb8f;
  }

  &.processing {
    background: #e6f7ff;
    border-color: #91d5ff;
  }

  &.failed {
    background: #fff1f0;
    border-color: #ffccc7;
  }

  .slide-index {
    font-size: 12px;
    color: #999;
    margin-bottom: 4px;
  }

  .slide-title {
    font-size: 14px;
    font-weight: 500;
    color: #333;
    margin-bottom: 8px;
  }

  .slide-status {
    font-size: 12px;
    color: #666;
    display: flex;
    align-items: center;
    gap: 8px;

    .retry-btn {
      padding: 2px 8px;
      font-size: 12px;
    }
  }
}

.footer {
  padding: 16px 20px;
  border-top: 1px solid #e5e5e5;
  display: flex;
  justify-content: flex-end;
  gap: 12px;

  .btn {
    min-width: 100px;
  }
}
</style>

