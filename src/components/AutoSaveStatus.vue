<template>
  <div class="autosave-status" :class="`status-${saveStatus}`">
    <div class="status-icon">
      <i v-if="saveStatus === 'saving'" class="el-icon-loading" />
      <i v-else-if="saveStatus === 'saved'" class="el-icon-circle-check" />
      <i v-else-if="saveStatus === 'error'" class="el-icon-circle-close" />
    </div>
    <div class="status-text">
      <template v-if="saveStatus === 'saving'">正在保存...</template>
      <template v-else-if="saveStatus === 'saved'">已保存 {{ savedTimeText }}</template>
      <template v-else-if="saveStatus === 'error'">保存失败</template>
      <template v-else>未保存</template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import type { AutoSaveStatus } from '@/types/autoSave'

interface Props {
  saveStatus: AutoSaveStatus
  lastSavedTime: number | null
}

const props = defineProps<Props>()

const savedTimeText = computed(() => {
  if (!props.lastSavedTime) {
    return ''
  }

  const now = Date.now()
  const diff = now - props.lastSavedTime

  const minutes = Math.floor(diff / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)

  if (minutes > 0) {
    return `${minutes} 分钟前`
  } else if (seconds > 10) {
    return `${seconds} 秒前`
  } else {
    return '刚刚'
  }
})
</script>

<style lang="scss" scoped>
.autosave-status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  transition: all 0.3s;

  &.status-idle {
    color: #909399;
  }

  &.status-saving {
    color: #409eff;
    background-color: rgba(64, 158, 255, 0.1);
  }

  &.status-saved {
    color: #67c23a;
  }

  &.status-error {
    color: #f56c6c;
    background-color: rgba(245, 108, 108, 0.1);
  }
}

.status-icon {
  font-size: 14px;
}

.status-text {
  white-space: nowrap;
}
</style>
