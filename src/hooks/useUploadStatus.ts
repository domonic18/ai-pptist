import { ref, reactive } from 'vue'

// 上传状态枚举
export enum UploadStatus {
  IDLE = 'idle',
  UPLOADING = 'uploading',
  SUCCESS = 'success',
  FAILED = 'failed'
}

// 上传任务接口
export interface UploadTask {
  id: string
  filename: string
  status: UploadStatus
  progress: number
  error?: string
  startTime: number
  endTime?: number
}

// 上传状态管理
export default function useUploadStatus() {
  // 上传任务列表
  const uploadTasks = reactive<Map<string, UploadTask>>(new Map())

  // 是否显示上传状态面板
  const showUploadPanel = ref(false)

  // 创建新的上传任务
  const createUploadTask = (filename: string): string => {
    const taskId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const task: UploadTask = {
      id: taskId,
      filename,
      status: UploadStatus.UPLOADING,
      progress: 0,
      startTime: Date.now()
    }

    uploadTasks.set(taskId, task)
    showUploadPanel.value = true

    return taskId
  }

  // 更新上传进度
  const updateUploadProgress = (taskId: string, progress: number) => {
    const task = uploadTasks.get(taskId)
    if (task) {
      task.progress = progress
    }
  }

  // 标记上传成功
  const markUploadSuccess = (taskId: string) => {
    const task = uploadTasks.get(taskId)
    if (task) {
      task.status = UploadStatus.SUCCESS
      task.progress = 100
      task.endTime = Date.now()

      // 3秒后自动移除成功的任务
      setTimeout(() => {
        uploadTasks.delete(taskId)
        if (uploadTasks.size === 0) {
          showUploadPanel.value = false
        }
      }, 3000)
    }
  }

  // 标记上传失败
  const markUploadFailed = (taskId: string, error: string) => {
    const task = uploadTasks.get(taskId)
    if (task) {
      task.status = UploadStatus.FAILED
      task.error = error
      task.endTime = Date.now()

      // 5秒后自动移除失败的任务
      setTimeout(() => {
        uploadTasks.delete(taskId)
        if (uploadTasks.size === 0) {
          showUploadPanel.value = false
        }
      }, 5000)
    }
  }

  // 移除上传任务
  const removeUploadTask = (taskId: string) => {
    uploadTasks.delete(taskId)
    if (uploadTasks.size === 0) {
      showUploadPanel.value = false
    }
  }

  // 获取所有上传任务
  const getAllTasks = () => {
    return Array.from(uploadTasks.values())
  }

  // 获取活跃的上传任务数量
  const getActiveUploadCount = () => {
    return Array.from(uploadTasks.values()).filter(
      task => task.status === UploadStatus.UPLOADING
    ).length
  }

  return {
    uploadTasks: uploadTasks,
    showUploadPanel,
    createUploadTask,
    updateUploadProgress,
    markUploadSuccess,
    markUploadFailed,
    removeUploadTask,
    getAllTasks,
    getActiveUploadCount
  }
}