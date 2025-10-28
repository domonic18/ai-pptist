<template>
  <el-card class="log-panel expanded">
    <template #header>
      <div class="card-header">
        <div class="header-title">
          <el-icon class="title-icon"><Clock /></el-icon>
          <span>生成日志</span>
        </div>
        <div class="header-actions">
          <el-button
            type="text"
            size="small"
            @click="$emit('clearLogs')"
            :disabled="logs.length === 0"
          >
            <el-icon><Delete /></el-icon>
            清空日志
          </el-button>
        </div>
      </div>
    </template>

    <div class="log-content">
      <div v-if="logs.length === 0" class="empty-logs">
        <el-empty description="暂无生成日志" />
      </div>

      <div v-else class="log-list">
        <div
          v-for="log in logs"
          :key="log.id"
          class="log-item"
          :class="`log-${log.level}`"
        >
          <div class="log-time">{{ formatTime(log.timestamp) }}</div>
          <div class="log-message">{{ log.message }}</div>
          <el-tag
            :type="getTagType(log.level)"
            size="small"
            class="log-tag"
          >
            {{ getLevelText(log.level) }}
          </el-tag>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { Clock, Delete } from '@element-plus/icons-vue'
import type { LogEntry } from './types'

interface Props {
  logs: LogEntry[]
}

interface Emits {
  (e: 'clearLogs'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const formatTime = (time: Date) => {
  return time.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const getTagType = (level: string) => {
  switch (level) {
    case 'success':
      return 'success'
    case 'error':
      return 'danger'
    case 'warning':
      return 'warning'
    default:
      return 'info'
  }
}

const getLevelText = (level: string) => {
  switch (level) {
    case 'success':
      return '成功'
    case 'error':
      return '错误'
    case 'warning':
      return '警告'
    case 'info':
      return '信息'
    default:
      return '未知'
  }
}
</script>

<style scoped lang="scss">
.log-panel {
  height: 100%;
  display: flex;
  flex-direction: column;

  &.expanded {
    height: 100%;
    display: flex;
    flex-direction: column;

    :deep(.el-card__body) {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 0;
    }

    .card-header {
      flex-shrink: 0;

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

      .header-actions {
        display: flex;
        gap: 8px;
      }
    }

    .log-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 300px;

      .empty-logs {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .log-list {
        flex: 1;
        overflow-y: auto;
        padding: 8px;
        background: #fafafa;
        border-radius: 4px;

        .log-item {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 4px 0;
          border-bottom: 1px solid #f0f0f0;

          &:last-child {
            border-bottom: none;
          }

          .log-time {
            font-size: 11px;
            color: #909399;
            font-family: monospace;
            min-width: 60px;
            flex-shrink: 0;
          }

          .log-message {
            flex: 1;
            font-size: 12px;
            line-height: 1.4;
            color: #606266;
            word-break: break-all;
          }

          .log-tag {
            flex-shrink: 0;
            font-size: 10px;
          }

          &.log-success {
            .log-message {
              color: #67c23a;
            }
          }

          &.log-error {
            .log-message {
              color: #f56c6c;
            }
          }

          &.log-warning {
            .log-message {
              color: #e6a23c;
            }
          }

          &.log-info {
            .log-message {
              color: #409eff;
            }
          }
        }
      }
    }
  }
}
</style>