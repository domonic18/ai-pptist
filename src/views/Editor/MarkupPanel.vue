<template>
  <MoveablePanel
    class="notes-panel"
    :width="320"
    :height="240"
    title="幻灯片类型标注"
    :left="-270"
    :top="90"
    @close="close()"
  >
    <div class="container">
      <!-- 自动标注按钮 -->
      <div class="auto-annotate-row">
        <Button type="primary" size="small" @click="openAutoAnnotation" class="auto-annotate-btn">
          <IconMagic class="icon" />
          自动标注
        </Button>
        <div class="auto-annotate-tip">AI 自动分析并标注幻灯片</div>
      </div>
      <!-- 原有功能：页面类型标注 -->
      <div class="row">
        <div style="width: 40%">当前页面类型：</div>
        <Select
          style="width: 60%"
          :value="slideType"
          @update:value="(value) => updateSlide(value as SlideType | '')"
          :options="slideTypeOptions"
        />
      </div>

      <!-- 新增：内容类型和布局类型标注 - 仅在内容页时显示 -->
      <template v-if="slideType === 'content'">
        <!-- 布局类型标注 -->
        <div class="row">
          <div style="width: 40%">布局类型：</div>
          <Select
            style="width: 60%"
            :value="layoutType"
            @update:value="
              (value) => updateLayoutType(value as LayoutType | '')
            "
            :options="layoutTypeOptions"
            placeholder="选择布局类型（可选）"
          />
          <div class="optional-label">可选</div>
        </div>

        <!-- 内容类型标注 -->
        <div class="row">
          <div style="width: 40%">内容类型：</div>
          <Select
            style="width: 60%"
            :value="contentType"
            @update:value="
              (value) => updateContentType(value as ContentType | '')
            "
            :options="contentTypeOptions"
            placeholder="选择内容类型（可选）"
          />
          <div class="optional-label">可选</div>
        </div>
      </template>

      <!-- 原有功能：元素类型标注 -->
      <div
        class="row"
        v-if="
          handleElement &&
          (handleElement.type === 'text' ||
            (handleElement.type === 'shape' && handleElement.text))
        "
      >
        <div style="width: 40%">当前文本类型：</div>
        <Select
          style="width: 60%"
          :value="textType"
          @update:value="(value) => updateElement(value as TextType | '')"
          :options="textTypeOptions"
        />
      </div>
      <div
        class="row"
        v-else-if="handleElement && handleElement.type === 'image'"
      >
        <div style="width: 40%">当前图片类型：</div>
        <Select
          style="width: 60%"
          :value="imageType"
          @update:value="(value) => updateElement(value as ImageType | '')"
          :options="imageTypeOptions"
        />
      </div>
      <div class="placeholder" v-else>
        选中图片、文字、带文字的形状，标记类型
      </div>
    </div>
  </MoveablePanel>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore, useSlidesStore } from '@/store'
import type {
  ImageType,
  SlideType,
  TextType,
  ContentType,
  LayoutType,
} from '@/types/slides'

import MoveablePanel from '@/components/MoveablePanel.vue'
import Select from '@/components/Select.vue'
import Button from '@/components/Button.vue'
import { IconMagic } from '@/components/Icon'

const slidesStore = useSlidesStore()
const mainStore = useMainStore()
const { currentSlide } = storeToRefs(slidesStore)
const { handleElement, handleElementId } = storeToRefs(mainStore)

const slideTypeOptions = ref<{ label: string; value: SlideType | '' }[]>([
  { label: '未标记类型', value: '' },
  { label: '封面页', value: 'cover' },
  { label: '目录页', value: 'contents' },
  { label: '过渡页', value: 'transition' },
  { label: '内容页', value: 'content' },
  { label: '结束页', value: 'end' },
])

const textTypeOptions = ref<{ label: string; value: TextType | '' }[]>([
  { label: '未标记类型', value: '' },
  { label: '标题', value: 'title' },
  { label: '副标题', value: 'subtitle' },
  { label: '正文', value: 'content' },
  { label: '列表项目', value: 'item' },
  { label: '列表项标题', value: 'itemTitle' },
  { label: '注释', value: 'notes' },
  { label: '页眉', value: 'header' },
  { label: '页脚', value: 'footer' },
  { label: '节编号', value: 'partNumber' },
  { label: '项目编号', value: 'itemNumber' },
])

const imageTypeOptions = ref<{ label: string; value: ImageType | '' }[]>([
  { label: '未标记类型', value: '' },
  { label: '页面插图', value: 'pageFigure' },
  { label: '项目插图', value: 'itemFigure' },
  { label: '背景图', value: 'background' },
])

// 内容类型标注选项
const contentTypeOptions = ref<{ label: string; value: ContentType | '' }[]>([
  { label: '未选择', value: '' },
  { label: '学习目标', value: 'learning_objective' },
  { label: '课堂引入', value: 'lesson_introduction' },
  { label: '问题引导', value: 'problem_guidance' },
  { label: '概念讲解', value: 'concept_explanation' },
  { label: '案例分析', value: 'case_analysis' },
  { label: '对比分析', value: 'comparison_analysis' },
  { label: '探究实践', value: 'inquiry_practice' },
  { label: '问题讨论', value: 'problem_discussion' },
  { label: '随堂练习', value: 'class_exercise' },
  { label: '内容总结', value: 'content_summary' },
  { label: '拓展延伸', value: 'extension_enrichment' },
  { label: '课后作业', value: 'homework_assignment' },
])

// 布局类型标注选项
const layoutTypeOptions = ref<{ label: string; value: LayoutType | '' }[]>([
  { label: '未选择', value: '' },
  // 列表布局类
  { label: '垂直列表', value: 'vertical_list' },
  { label: '水平列表', value: 'horizontal_list' },
  { label: '多列列表', value: 'multi_column_list' },
  // 流程布局类
  { label: '水平流程', value: 'horizontal_process' },
  { label: '垂直流程', value: 'vertical_process' },
  { label: '步进流程', value: 'step_process' },
  { label: '交替流程', value: 'alternating_process' },
  // 循环布局类
  { label: '基本循环', value: 'basic_cycle' },
  // 层次结构布局类
  { label: '总分布局', value: 'general_specific' },
  { label: '总分总布局', value: 'general_specific_general' },
  { label: '树形结构', value: 'tree_structure' },
  // 关系布局类
  { label: '平衡布局', value: 'balance' },
  { label: '漏斗图', value: 'funnel' },
  { label: '相交布局', value: 'intersecting' },
  // 矩阵布局类
  { label: '基本矩阵', value: 'basic_matrix' },
  // 棱锥图布局类
  { label: '正三角', value: 'pyramid' },
  { label: '倒三角', value: 'inverted_pyramid' },
  // 图片布局类
  { label: '图片网格', value: 'picture_grid' },
  { label: '图片拼贴', value: 'picture_collage' },
  // 时间线布局类
  { label: '水平时间线', value: 'horizontal_timeline' },
  { label: '垂直时间线', value: 'vertical_timeline' },
  // 其他常见布局
  { label: '对比布局', value: 'comparison' },
  { label: '优缺点布局', value: 'pro_con' },
  { label: '前后对比布局', value: 'before_after' },
  { label: 'SWOT分析布局', value: 'swot_analysis' },
  { label: '因果关系图', value: 'cause_effect' },
  { label: '思维导图', value: 'mind_map' },
])

const slideType = computed(() => currentSlide.value?.type || '')
const textType = computed(() => {
  if (!handleElement.value) return ''
  if (handleElement.value.type === 'text') {
    return handleElement.value.textType || ''
  }
  if (handleElement.value.type === 'shape' && handleElement.value.text) {
    return handleElement.value.text.type || ''
  }
  return ''
})
const imageType = computed(() => {
  if (!handleElement.value) return ''
  if (handleElement.value.type === 'image') {
    return handleElement.value.imageType || ''
  }
  return ''
})

// 内容类型和布局类型的计算属性
const contentType = computed(() => {
  return currentSlide.value?.slideAnnotation?.contentType || ''
})

const layoutType = computed(() => {
  return currentSlide.value?.slideAnnotation?.layoutType || ''
})

const updateSlide = (type: SlideType | '') => {
  if (type) slidesStore.updateSlide({ type })
  else {
    slidesStore.removeSlideProps({
      id: currentSlide.value.id,
      propName: 'type',
    })
  }
}

const updateElement = (type: TextType | ImageType | '') => {
  if (!handleElement.value) return
  if (handleElement.value.type === 'image') {
    if (type) {
      slidesStore.updateElement({
        id: handleElementId.value,
        props: { imageType: type as ImageType },
      })
    }
    else {
      slidesStore.removeElementProps({
        id: handleElementId.value,
        propName: 'imageType',
      })
    }
  }
  if (handleElement.value.type === 'text') {
    if (type) {
      slidesStore.updateElement({
        id: handleElementId.value,
        props: { textType: type as TextType },
      })
    }
    else {
      slidesStore.removeElementProps({
        id: handleElementId.value,
        propName: 'textType',
      })
    }
  }
  if (handleElement.value.type === 'shape') {
    const text = handleElement.value.text
    if (!text) return

    if (type) {
      slidesStore.updateElement({
        id: handleElementId.value,
        props: { text: { ...text, type: type as TextType } },
      })
    }
    else {
      delete text.type
      slidesStore.updateElement({
        id: handleElementId.value,
        props: { text },
      })
    }
  }
}

// 更新内容类型标注
const updateContentType = (type: ContentType | '') => {
  const currentAnnotation = currentSlide.value?.slideAnnotation || {}

  if (type) {
    slidesStore.updateSlide({
      slideAnnotation: {
        ...currentAnnotation,
        contentType: type,
      },
    })
  }
  else {
    // 如果内容类型为空，则移除该属性
    const restAnnotation = { ...currentAnnotation }
    delete restAnnotation.contentType
    if (Object.keys(restAnnotation).length > 0) {
      slidesStore.updateSlide({
        slideAnnotation: restAnnotation,
      })
    }
    else {
      // 如果没有任何标注信息，则移除整个slideAnnotation字段
      slidesStore.removeSlideProps({
        id: currentSlide.value.id,
        propName: 'slideAnnotation',
      })
    }
  }
}

// 更新布局类型标注
const updateLayoutType = (type: LayoutType | '') => {
  const currentAnnotation = currentSlide.value?.slideAnnotation || {}

  if (type) {
    slidesStore.updateSlide({
      slideAnnotation: {
        ...currentAnnotation,
        layoutType: type,
      },
    })
  }
  else {
    // 如果布局类型为空，则移除该属性
    const restAnnotation = { ...currentAnnotation }
    delete restAnnotation.layoutType
    if (Object.keys(restAnnotation).length > 0) {
      slidesStore.updateSlide({
        slideAnnotation: restAnnotation,
      })
    }
    else {
      // 如果没有任何标注信息，则移除整个slideAnnotation字段
      slidesStore.removeSlideProps({
        id: currentSlide.value.id,
        propName: 'slideAnnotation',
      })
    }
  }
}

// 打开自动标注对话框
const openAutoAnnotation = () => {
  mainStore.setAutoAnnotationState(true)
}

const close = () => {
  mainStore.setMarkupPanelState(false)
}
</script>

<style lang="scss" scoped>
.notes-panel {
  height: 100%;
  font-size: 12px;
  user-select: none;
}
.container {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.row {
  width: 100%;
  display: flex;
  align-items: center;
  position: relative;

  & + .row {
    margin-top: 5px;
  }
}
.optional-label {
  position: absolute;
  right: 5px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 10px;
  color: #999;
  background: rgba(255, 255, 255, 0.9);
  padding: 1px 4px;
  border-radius: 2px;
  pointer-events: none;
}
.placeholder {
  height: 30px;
  line-height: 30px;
  text-align: center;
  color: #999;
  font-style: italic;
  border: 1px dashed #ccc;
  border-radius: $borderRadius;
  margin-top: 5px;
}

.auto-annotate-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 12px;

  .auto-annotate-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 500;

    .icon {
      font-size: 14px;
    }

    &:hover {
      .icon {
        animation: pulse 0.5s ease-in-out;
      }
    }
  }

  .auto-annotate-tip {
    font-size: 11px;
    color: #909399;
    font-style: italic;
  }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}
</style>
