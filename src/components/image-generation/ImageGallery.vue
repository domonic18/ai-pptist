<template>
  <el-card v-if="hasImages" class="gallery-panel expanded">
    <template #header>
      <div class="card-header">
        <div class="header-title">
          <el-icon class="title-icon"><Clock /></el-icon>
          <span>生成历史</span>
        </div>
        <span class="history-count">已生成 {{ imageCount }} 张图像</span>
      </div>
    </template>

    <div class="image-grid">
      <div
        v-for="image in images"
        :key="image.id"
        class="image-item"
      >
        <div class="image-container">
          <!-- 生成中状态 -->
          <div v-if="image.status === 'generating'" class="generating-state">
            <el-icon class="loading-icon"><Loading /></el-icon>
            <span>生成中...</span>
          </div>

          <!-- 成功状态 -->
          <img
            v-else-if="image.status === 'success' && image.url"
            :src="image.url"
            :alt="image.prompt"
            class="generated-image"
            @load="$emit('imageLoad', image)"
            @error="$emit('imageError', image)"
          />

          <!-- 错误状态 -->
          <div v-else-if="image.status === 'error'" class="error-state">
            <el-icon class="error-icon"><Warning /></el-icon>
            <span>生成失败</span>
          </div>

          <!-- 图片操作按钮 -->
          <div v-if="image.status === 'success'" class="image-actions">
            <el-button
              type="primary"
              size="small"
              circle
              @click="$emit('preview', image)"
              class="action-btn preview-btn"
            >
              <el-icon><Document /></el-icon>
            </el-button>
            <el-button
              type="success"
              size="small"
              circle
              @click="$emit('store', image)"
              class="action-btn store-btn"
            >
              <el-icon><Upload /></el-icon>
            </el-button>
            <el-button
              type="danger"
              size="small"
              circle
              @click="$emit('delete', image)"
              class="action-btn delete-btn"
            >
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>

        <!-- 图片信息 -->
        <div class="image-info">
          <div class="image-prompt" :title="image.prompt">
            {{ image.prompt }}
          </div>
          <div class="image-meta">
            <span class="model-name">{{ image.generation_model }}</span>
            <span class="timestamp">{{ formatTime(image.timestamp) }}</span>
          </div>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Clock, Loading, Document, Upload, Delete, Warning } from '@element-plus/icons-vue'
import type { GeneratedImage } from './types'

interface Props {
  images: GeneratedImage[]
}

interface Emits {
  (e: 'preview', image: GeneratedImage): void
  (e: 'store', image: GeneratedImage): void
  (e: 'delete', image: GeneratedImage): void
  (e: 'imageLoad', image: GeneratedImage): void
  (e: 'imageError', image: GeneratedImage): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const hasImages = computed(() => props.images.length > 0)
const imageCount = computed(() => props.images.length)

const formatTime = (time: Date | string) => {
  const date = typeof time === 'string' ? new Date(time) : time
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped lang="scss">
.gallery-panel {
  &.expanded {
    .card-header {
      .header-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        color: #303133;

        .title-icon {
          color: #409eff;
        }
      }

      .history-count {
        font-size: 12px;
        color: #909399;
      }
    }
  }

  .image-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 16px;
    max-height: 600px;
    overflow-y: auto;
    padding: 4px;

    .image-item {
      border: 1px solid #e4e7ed;
      border-radius: 8px;
      overflow: hidden;
      transition: all 0.3s ease;
      background: #fff;

      &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);

        .image-actions {
          opacity: 1;
        }
      }

      &:hover .image-actions {
        opacity: 1 !important;
      }

      // 确保按钮能够显示
      .image-actions {
        &:hover {
          opacity: 1 !important;
        }
      }

      .image-container {
        position: relative;
        width: 100%;
        height: 200px;
        background: #f5f7fa;
        display: flex;
        align-items: center;
        justify-content: center;

        .generated-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          z-index: 1;
          position: relative;
        }

        .generating-state,
        .error-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          color: #909399;

          .loading-icon {
            font-size: 24px;
            animation: spin 1s linear infinite;
          }

          .error-icon {
            font-size: 24px;
            color: #f56c6c;
          }
        }

        .image-actions {
          position: absolute;
          top: 8px;
          right: 8px;
          display: flex;
          gap: 4px;
          opacity: 0;
          transition: opacity 0.3s ease;
          z-index: 10;

          .action-btn {
            width: 28px;
            height: 28px;
            padding: 0;
            visibility: visible;
            display: flex;
            align-items: center;
            justify-content: center;

            &.preview-btn {
              background: rgba(64, 158, 255, 0.95);
              border-color: transparent;
              color: #fff;

              &:hover {
                background: rgba(64, 158, 255, 1);
              }
            }

            &.store-btn {
              background: rgba(103, 194, 58, 0.95);
              border-color: transparent;
              color: #fff;

              &:hover {
                background: rgba(103, 194, 58, 1);
              }
            }

            &.delete-btn {
              background: rgba(245, 108, 108, 0.95);
              border-color: transparent;
              color: #fff;

              &:hover {
                background: rgba(245, 108, 108, 1);
              }
            }
          }
        }
      }

      .image-info {
        padding: 12px;

        .image-prompt {
          font-size: 13px;
          color: #303133;
          line-height: 1.4;
          margin-bottom: 8px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .image-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          color: #909399;

          .model-name {
            font-weight: 500;
          }
        }
      }
    }
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>