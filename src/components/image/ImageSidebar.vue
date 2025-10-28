<template>
  <div class="image-sidebar">
    <div class="sidebar-content">
      <!-- 智能搜索区 -->
      <div class="sidebar-section">
      <div class="section-title">智能搜索</div>
      <div class="search-input-wrapper">
        <el-input
          v-model="searchQuery"
          placeholder="输入关键词进行搜索..."
          size="large"
          @keyup.enter="handleSearch"
        >
          <template #suffix>
            <el-icon @click="handleSearch">
              <Search />
            </el-icon>
          </template>
        </el-input>
      </div>

      <!-- 高级搜索参数 -->
      <div class="advanced-search">
        <div class="search-param">
          <div class="param-header">
            <span class="param-label">匹配度</span>
            <el-tooltip
              content="匹配度越高，搜索结果越精确但数量可能越少；匹配度越低，搜索结果越多但相关性可能降低"
              placement="top"
              :z-index="10000"
              popper-class="high-z-tooltip"
            >
              <el-icon class="help-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
          <div class="slider-container">
            <el-slider
              v-model="matchDegree"
              :min="50"
              :max="100"
              :step="5"
              :format-tooltip="formatTooltip"
              :show-tooltip="true"
            />
            <div class="slider-marks">
              <span class="mark">50%</span>
              <span class="mark">75%</span>
              <span class="mark">100%</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 文件名筛选 -->
    <div class="sidebar-section">
      <div class="section-title">文件名筛选</div>
      <el-input
        v-model="filenameFilter"
        placeholder="输入文件名关键词..."
        size="large"
        clearable
      />
    </div>

    <!-- 标签筛选 -->
    <div class="sidebar-section">
      <div class="section-header">
        <span class="section-title">标签筛选</span>
        <el-button
          type="primary"
          size="small"
          @click="$emit('manage-tags')"
        >
          管理标签
        </el-button>
      </div>

      <div class="tags-container">
        <el-check-tag
          v-for="tag in availableTags"
          :key="tag"
          :checked="selectedTags.includes(tag)"
          @change="toggleTag(tag)"
          class="tag-item"
        >
          {{ tag }}
        </el-check-tag>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Search, QuestionFilled } from '@element-plus/icons-vue'

const searchQuery = defineModel<string>('searchQuery', { default: '' })
const matchDegree = defineModel<number>('matchDegree', { default: 70 })
const filenameFilter = defineModel<string>('filenameFilter', { default: '' })
const selectedTags = defineModel<string[]>('selectedTags', { default: [] })

defineProps<{
  availableTags: string[]
}>()

const emit = defineEmits<{
  (e: 'search'): void
  (e: 'manage-tags'): void
}>()

const formatTooltip = (val: number) => {
  return `${val}%`
}

const handleSearch = () => {
  emit('search')
}

const toggleTag = (tag: string) => {
  const index = selectedTags.value.indexOf(tag)
  if (index === -1) {
    selectedTags.value.push(tag)
  } 
  else {
    selectedTags.value.splice(index, 1)
  }
}
</script>

<style scoped lang="scss">
.image-sidebar {
  width: 320px;
  flex-shrink: 0;
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  min-height: 0; /* 防止flex容器溢出 */
  max-height: 800px; /* 固定最大高度，与右侧保持一致 */
  overflow: hidden; /* 防止整体溢出 */
}

/* 添加滚动区域 */
.sidebar-content {
  flex: 1;
  overflow-y: auto;
  min-height: 0; /* 允许flex子元素收缩 */
}

.sidebar-section {
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}

.search-input-wrapper {
  margin-bottom: 16px;

  :deep(.el-input__suffix) {
    cursor: pointer;

    .el-icon {
      color: #909399;
      transition: color 0.2s;

      &:hover {
        color: #409eff;
      }
    }
  }
}

.advanced-search {
  background: #f8fafc;
  border-radius: 6px;
  padding: 16px;
  margin-top: 12px;
}

.search-param {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;

  &:last-child {
    margin-bottom: 0;
  }
}

.param-header {
  display: flex;
  align-items: center;
  gap: 6px;
}

.param-label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.help-icon {
  color: #909399;
  cursor: help;
  font-size: 14px;

  &:hover {
    color: #409eff;
  }
}

.slider-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.slider-marks {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
}

.mark {
  font-size: 12px;
  color: #909399;
  font-weight: 400;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.tag-item {
  border-radius: 16px;
  padding: 4px 12px;
  font-size: 13px;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-1px);
  }
}

@media (max-width: 1024px) {
  .image-sidebar {
    width: 280px;
  }
}

@media (max-width: 768px) {
  .image-sidebar {
    width: 100%;
    margin-bottom: 16px;
  }

  .section-header {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .tags-container {
    justify-content: center;
  }
}

/* 全局tooltip样式，确保显示在模态框之上 */
:global(.high-z-tooltip) {
  z-index: 10000 !important;
}
</style>