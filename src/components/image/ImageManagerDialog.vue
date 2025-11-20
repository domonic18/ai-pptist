<template>
  <Modal
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    :width="1200"
    :contentStyle="{ height: '700px' }"
    :closeButton="true"
    :closeOnClickMask="false"
  >
    <ImageManager @insert="handleInsert" />
  </Modal>
</template>

<script setup lang="ts">
import Modal from '@/components/Modal.vue'
import ImageManager from './ImageManager.vue'

// Props
const props = defineProps<{
  visible: boolean
}>()

// Emits
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'insert', image: any): void
}>()

// 处理图片插入事件
const handleInsert = (image: any) => {
  emit('insert', image)
}
</script>

<style scoped lang="scss">
/* 可以在这里添加对话框级别的样式 */
</style>