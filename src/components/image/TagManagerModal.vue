<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    title="标签管理"
    width="500px"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <div class="tag-manager">
      <!-- 现有标签 -->
      <div class="existing-tags">
        <h3 class="section-title">现有标签</h3>
        <div class="tags-list">
          <el-tag
            v-for="tag in tags"
            :key="tag"
            closable
            size="default"
            @close="removeTag(tag)"
            class="tag-item"
          >
            {{ tag }}
          </el-tag>

          <div v-if="!tags.length" class="empty-tags">
            <el-empty description="暂无标签" :image-size="80" />
          </div>
        </div>
      </div>

      <!-- 添加新标签 -->
      <div class="add-tag-section">
        <h3 class="section-title">添加新标签</h3>
        <div class="add-tag-form">
          <el-input
            v-model="newTag"
            placeholder="输入新标签名称"
            size="large"
            @keyup.enter="addTag"
            :maxlength="20"
            show-word-limit
          />
          <el-button
            type="primary"
            size="large"
            @click="addTag"
            :disabled="!newTag.trim()"
          >
            添加标签
          </el-button>
        </div>
      </div>

      <!-- 批量操作 -->
      <div class="batch-actions">
        <el-button
          type="danger"
          :disabled="!tags.length"
          @click="clearAllTags"
        >
          清空所有标签
        </el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const props = defineProps<{
  visible: boolean
  tags: string[]
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'add-tag', tag: string): void
  (e: 'remove-tag', tag: string): void
  (e: 'clear-tags'): void
}>()

const newTag = ref('')

const addTag = async () => {
  const tag = newTag.value.trim()
  if (tag) {
    if (props.tags.includes(tag)) {
      ElMessage.warning('标签已存在')
      return
    }
    try {
      emit('add-tag', tag)
      newTag.value = ''
      ElMessage.success('标签添加成功')
    }
    catch (error) {
      ElMessage.error('标签添加失败')
    }
  }
}

const removeTag = (tag: string) => {
  emit('remove-tag', tag)
}

const clearAllTags = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有标签吗？此操作不可恢复。',
      '确认清空',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    emit('clear-tags')
    ElMessage.success('所有标签已清空')
  }
  catch {
    // 用户取消操作
  }
}
</script>

<style scoped lang="scss">
.tag-manager {
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

.existing-tags {
  .tags-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    min-height: 60px;
  }

  .tag-item {
    border-radius: 16px;
    padding: 6px 12px;
    font-size: 14px;
    transition: all 0.2s;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
    }
  }
}

.empty-tags {
  text-align: center;
  padding: 20px;
  color: #909399;
}

.add-tag-section {
  .add-tag-form {
    display: flex;
    gap: 12px;
    align-items: flex-start;

    .el-input {
      flex: 1;
    }
  }
}

.batch-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
  border-top: 1px solid #e4e7ed;
}

:deep(.el-dialog__body) {
  padding: 20px;
}

@media (max-width: 768px) {
  .add-tag-form {
    flex-direction: column;
  }

  .batch-actions {
    justify-content: center;
  }
}
</style>