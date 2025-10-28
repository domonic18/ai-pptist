<template>
  <div v-if="showUploadPanel" class="upload-status-panel">
    <div class="upload-panel-header">
      <h3>上传状态</h3>
      <button
        class="close-btn"
        @click="showUploadPanel = false"
        title="关闭面板"
      >
        ×
      </button>
    </div>

    <div class="upload-tasks">
      <div
        v-for="task in getAllTasks()"
        :key="task.id"
        class="upload-task"
        :class="task.status"
      >
        <div class="task-info">
          <div class="filename">{{ task.filename }}</div>
          <div class="status">{{ getStatusText(task.status) }}</div>
          <div v-if="task.error" class="error-message">{{ task.error }}</div>
        </div>

        <div class="progress-section">
          <div v-if="task.status === 'uploading'" class="progress-bar">
            <div
              class="progress-fill"
              :style="{ width: task.progress + '%' }"
            ></div>
          </div>
          <div class="progress-text">
            {{ task.progress }}%
          </div>
        </div>

        <button
          v-if="task.status === 'failed' || task.status === 'success'"
          class="remove-btn"
          @click="removeUploadTask(task.id)"
          title="移除任务"
        >
          ×
        </button>
      </div>
    </div>

    <div v-if="getAllTasks().length === 0" class="no-tasks">
      没有上传任务
    </div>
  </div>
</template>

<script setup lang="ts">
import useUploadStatus, { UploadStatus } from '@/hooks/useUploadStatus'

const {
  showUploadPanel,
  getAllTasks,
  removeUploadTask
} = useUploadStatus()

// 获取状态文本
const getStatusText = (status: UploadStatus): string => {
  const statusMap = {
    [UploadStatus.IDLE]: '等待上传',
    [UploadStatus.UPLOADING]: '上传中',
    [UploadStatus.SUCCESS]: '上传成功',
    [UploadStatus.FAILED]: '上传失败'
  }
  return statusMap[status] || status
}
</script>

<style scoped>
.upload-status-panel {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 320px;
  max-height: 400px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  overflow: hidden;
}

.upload-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
}

.upload-panel-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.close-btn:hover {
  background: #e0e0e0;
  color: #333;
}

.upload-tasks {
  max-height: 300px;
  overflow-y: auto;
  padding: 8px;
}

.upload-task {
  display: flex;
  align-items: center;
  padding: 8px;
  margin-bottom: 8px;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
  background: #fafafa;
}

.upload-task.uploading {
  border-left: 4px solid #1890ff;
}

.upload-task.success {
  border-left: 4px solid #52c41a;
}

.upload-task.failed {
  border-left: 4px solid #ff4d4f;
}

.task-info {
  flex: 1;
  min-width: 0;
}

.filename {
  font-size: 12px;
  font-weight: 500;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status {
  font-size: 11px;
  color: #666;
  margin-top: 2px;
}

.error-message {
  font-size: 11px;
  color: #ff4d4f;
  margin-top: 2px;
}

.progress-section {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 8px;
}

.progress-bar {
  width: 60px;
  height: 6px;
  background: #e0e0e0;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #1890ff;
  transition: width 0.3s ease;
  border-radius: 3px;
}

.progress-text {
  font-size: 11px;
  color: #666;
  min-width: 30px;
  text-align: right;
}

.remove-btn {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  color: #999;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  margin-left: 8px;
}

.remove-btn:hover {
  background: #e0e0e0;
  color: #666;
}

.no-tasks {
  padding: 16px;
  text-align: center;
  color: #999;
  font-size: 12px;
}
</style>