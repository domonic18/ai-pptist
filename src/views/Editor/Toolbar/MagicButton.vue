<!-- frontend/src/views/Editor/Toolbar/MagicButton.vue -->
<template>
  <div class="magic-button-wrapper">
    <el-tooltip
      content="智能优化当前幻灯片排版"
      placement="bottom"
      :disabled="loading"
    >
      <el-button
        class="magic-button"
        :class="{ 'is-loading': loading }"
        :disabled="loading || disabled"
        @click="handleOptimize"
      >
        <svg-icon
          name="magic-wand"
          class="magic-icon"
          :class="{ rotating: loading }"
        />
        <span v-if="!loading">优化排版</span>
        <span v-else>优化中...</span>
      </el-button>
    </el-tooltip>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useSlidesStore } from '@/store'
import message from '@/utils/message'
import { optimizeSlideLayout } from '@/services/optimization'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'
import type { SimplifiedElement } from '@/types/optimization'
import type { PPTElement } from '@/types/slides'

const slidesStore = useSlidesStore()
const { currentSlide, viewportSize, viewportRatio } = storeToRefs(slidesStore)
const { addHistorySnapshot } = useHistorySnapshot()

const loading = ref(false)

// 禁用条件：没有元素或正在加载
const disabled = computed(() => {
  return !currentSlide.value || currentSlide.value.elements.length === 0
})

// 将SimplifiedElement转换回PPTElement
function convertToPPTElement(simplified: SimplifiedElement, originalElement: PPTElement): PPTElement {
  // 创建基础元素
  const updatedElement = { ...originalElement }

  // 更新位置
  updatedElement.left = simplified.left
  updatedElement.top = simplified.top

  // 更新尺寸和旋转（如果不是线条元素）
  if (simplified.type !== 'line' && 'width' in updatedElement && 'height' in updatedElement && 'rotate' in updatedElement) {
    updatedElement.width = simplified.width || updatedElement.width
    updatedElement.height = simplified.height || updatedElement.height
    updatedElement.rotate = simplified.rotate || updatedElement.rotate
  }

  // 更新样式（如果是文本元素）
  if (simplified.type === 'text' && 'defaultFontName' in updatedElement && 'defaultColor' in updatedElement && 'lineHeight' in updatedElement) {
    if (simplified.defaultFontName) {
      updatedElement.defaultFontName = simplified.defaultFontName
    }
    if (simplified.defaultColor) {
      updatedElement.defaultColor = simplified.defaultColor
    }
    if (simplified.lineHeight !== undefined) {
      updatedElement.lineHeight = simplified.lineHeight
    }
  }

  // 更新填充色（如果是形状元素）
  if (simplified.type === 'shape' && 'fill' in updatedElement && simplified.fill) {
    updatedElement.fill = simplified.fill
  }

  return updatedElement
}

// 处理优化请求
const handleOptimize = async () => {
  if (!currentSlide.value) {
    message.error('请先选择一个幻灯片')
    return
  }

  if (currentSlide.value.elements.length === 0) {
    message.error('当前幻灯片没有可优化的元素')
    return
  }

  loading.value = true

  try {
    // 调用优化服务
    const response = await optimizeSlideLayout(
      currentSlide.value.id,
      currentSlide.value.elements,
      {
        width: viewportSize.value,
        height: viewportSize.value * viewportRatio.value,
      },
    )

    // 检查StandardResponse的status字段
    if (response.status === 'success' && response.data) {
      // 添加历史快照（支持撤销）
      addHistorySnapshot()

      // 将SimplifiedElement转换回PPTElement并更新幻灯片
      const optimizedElements = response.data.elements.map(simplifiedEl => {
        const originalEl = currentSlide.value!.elements.find(el => el.id === simplifiedEl.id)
        if (!originalEl) {
          throw new Error(`找不到ID为${simplifiedEl.id}的原始元素`)
        }
        return convertToPPTElement(simplifiedEl, originalEl)
      })

      // 更新幻灯片元素
      slidesStore.updateSlide({
        elements: optimizedElements,
      })

      message.success(response.message || '排版优化完成！')
    }
    else {
      throw new Error(response.message || '优化失败')
    }
  }
  catch (error: any) {
    message.error(`排版优化失败：${error.message}`)
  }
  finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.magic-button-wrapper {
  display: inline-block;
}

.magic-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  font-size: 14px;
  border-radius: 4px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &.is-loading {
    cursor: wait;
  }
}

.magic-icon {
  width: 16px;
  height: 16px;

  &.rotating {
    animation: rotate 2s linear infinite;
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>