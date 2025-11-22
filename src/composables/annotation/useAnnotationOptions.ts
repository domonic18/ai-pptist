/**
 * 标注选项配置组合式函数
 *
 * 提供页面类型、文本类型、图片类型、内容类型和布局类型的选项配置
 */

import { ref } from 'vue'
import type {
  SlideType,
  TextType,
  ImageType,
  ContentType,
  LayoutType
} from '@/types/slides'

/**
 * 标注选项配置组合式函数
 */
export function useAnnotationOptions() {
  /**
   * 页面类型选项
   */
  const slideTypeOptions = ref<{ label: string; value: SlideType | '' }[]>([
    { label: '未标记类型', value: '' },
    { label: '封面页', value: 'cover' },
    { label: '目录页', value: 'contents' },
    { label: '过渡页', value: 'transition' },
    { label: '内容页', value: 'content' },
    { label: '结束页', value: 'end' },
  ])

  /**
   * 文本类型选项
   */
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

  /**
   * 图片类型选项
   */
  const imageTypeOptions = ref<{ label: string; value: ImageType | '' }[]>([
    { label: '未标记类型', value: '' },
    { label: '页面插图', value: 'pageFigure' },
    { label: '项目插图', value: 'itemFigure' },
    { label: '背景图', value: 'background' },
  ])

  /**
   * 内容类型选项
   */
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

  /**
   * 布局类型选项
   */
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

  return {
    slideTypeOptions,
    textTypeOptions,
    imageTypeOptions,
    contentTypeOptions,
    layoutTypeOptions
  }
}