<template>
  <div class="navigation-bar">
    <div class="nav-left">
      <el-button type="primary" plain @click="$emit('goBack')" class="back-btn">
        <el-icon><ArrowLeft /></el-icon>
        返回主页
      </el-button>
    </div>

    <div class="nav-center">
      <h1 class="page-title">AI 图片生成</h1>
    </div>

    <div class="nav-right">
      <el-tag type="info" size="small">{{ modelCount }} 个可用模型</el-tag>
      <el-button
        v-if="hasImages"
        type="info"
        size="small"
        @click="$emit('clearAll')"
      >
        <el-icon><Delete /></el-icon>
        清空所有
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ArrowLeft, Delete } from '@element-plus/icons-vue'

interface Props {
  modelCount: number
  imageCount: number
}

interface Emits {
  (e: 'goBack'): void
  (e: 'clearAll'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const hasImages = computed(() => props.imageCount > 0)
</script>

<style scoped lang="scss">
.navigation-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background-color: #fff;
  border-bottom: 1px solid #e4e7ed;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  .nav-left {
    .back-btn {
      display: flex;
      align-items: center;
      gap: 6px;
    }
  }

  .nav-center {
    .page-title {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #303133;
    }
  }

  .nav-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }
}
</style>