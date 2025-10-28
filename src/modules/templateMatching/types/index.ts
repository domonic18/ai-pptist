/**
 * 模板匹配相关类型定义
 * 用于多维度智能匹配机制
 */

import type { Slide } from '@/types/slides'


// 内容类型枚举（基于教育场景12种类别的精简分类）
export enum ContentType {
  // 教学目标类
  LEARNING_OBJECTIVE = 'learning_objective', // 学习目标（合并原3种）

  // 课堂引入类
  LESSON_INTRODUCTION = 'lesson_introduction', // 课堂引入（故事、视频、提问、复习旧知）

  // 问题引导类
  PROBLEM_GUIDANCE = 'problem_guidance', // 问题引导

  // 概念讲解类
  CONCEPT_EXPLANATION = 'concept_explanation', // 概念讲解（合并原5种）

  // 案例分析类
  CASE_ANALYSIS = 'case_analysis', // 案例分析（合并典例分析）

  // 对比分析类
  COMPARISON_ANALYSIS = 'comparison_analysis', // 对比分析

  // 探究实践类
  INQUIRY_PRACTICE = 'inquiry_practice', // 探究实践

  // 问题讨论类
  PROBLEM_DISCUSSION = 'problem_discussion', // 问题讨论（保留原1种）

  // 随堂练习类
  CLASS_EXERCISE = 'class_exercise', // 随堂练习（合并原2种）

  // 内容总结类
  CONTENT_SUMMARY = 'content_summary', // 内容总结（合并原4种）

  // 拓展延伸类
  EXTENSION_ENRICHMENT = 'extension_enrichment', // 拓展延伸

  // 课后作业类
  HOMEWORK_ASSIGNMENT = 'homework_assignment', // 课后作业（合并原4种）
}

// 布局类型枚举（精简版 - 基于SmartArt但只保留常用布局）
export enum LayoutType {
  // 列表布局类（保留最常用的列表类型）
  VERTICAL_LIST = 'vertical_list', // 垂直列表（包含基本列表和项目符号列表）
  HORIZONTAL_LIST = 'horizontal_list', // 水平列表
  MULTI_COLUMN_LIST = 'multi_column_list', // 多列列表

  // 流程布局类（精简后只保留核心流程）
  HORIZONTAL_PROCESS = 'horizontal_process', // 水平流程（基本流程）
  VERTICAL_PROCESS = 'vertical_process', // 垂直流程
  STEP_PROCESS = 'step_process', // 步进流程（包含上升和下降）
  ALTERNATING_PROCESS = 'alternating_process', // 交替流程

  // 循环布局类（精简后只保留基本循环）
  BASIC_CYCLE = 'basic_cycle', // 基本循环（圆形循环）

  // 层次结构布局类（简化的层次布局）
  GENERAL_SPECIFIC = 'general_specific', // 总分布局（总分结构）
  GENERAL_SPECIFIC_GENERAL = 'general_specific_general', // 总分总布局
  TREE_STRUCTURE = 'tree_structure', // 树形结构

  // 关系布局类（精简合并的关系布局）
  BALANCE = 'balance', // 平衡布局（合并平衡关系和平衡）
  FUNNEL = 'funnel', // 漏斗图
  INTERSECTING = 'intersecting', // 相交布局（合并维恩图和相交圆）

  // 矩阵布局类（精简后只保留基本矩阵）
  BASIC_MATRIX = 'basic_matrix', // 基本矩阵（2x2网格）

  // 棱锥图布局类（简化为常用三角）
  PYRAMID = 'pyramid', // 正三角（基本棱锥）
  INVERTED_PYRAMID = 'inverted_pyramid', // 倒三角

  // 图片布局类（简化为最常用的1-2种）
  PICTURE_GRID = 'picture_grid', // 图片网格（最常用）
  PICTURE_COLLAGE = 'picture_collage', // 图片拼贴

  // 时间线布局类（简化为最常用的1-2种）
  HORIZONTAL_TIMELINE = 'horizontal_timeline', // 水平时间线
  VERTICAL_TIMELINE = 'vertical_timeline', // 垂直时间线

  // 其他常见布局
  COMPARISON = 'comparison', // 对比布局（左右对比）
  PRO_CON = 'pro_con', // 优缺点布局
  BEFORE_AFTER = 'before_after', // 前后对比布局
  SWOT_ANALYSIS = 'swot_analysis', // SWOT分析布局
  CAUSE_EFFECT = 'cause_effect', // 因果关系图
  MIND_MAP = 'mind_map', // 思维导图
}

// 后端JSON数据接口
export interface AIPPTSlideData {
  type: string;
  data: {
    title: string;
    semanticFeatures?: {
      contentType?: ContentType;
      layoutType?: LayoutType; // 新增：后端直接推荐布局类型
    };
    items: Array<{
      title: string;
      text: string;
      metadata: Record<string, any>;
    }>;
  };
}

// 维度评估器接口
export interface DimensionEvaluator {
  /**
   * 维度标识符
   */
  readonly id: string;

  /**
   * 维度名称
   */
  readonly name: string;

  /**
   * 是否必需维度
   */
  readonly required: boolean;

  /**
   * 计算该维度的评分
   * @param slideData - 幻灯片数据
   * @param template - 模板
   * @returns 评分 (0-1)，如果维度不可用返回null
   */
  evaluate(slideData: AIPPTSlideData, template: Slide): number | null;

  /**
   * 检查该维度是否可用
   * @param slideData - 幻灯片数据
   * @param template - 模板
   * @returns 是否可用
   */
  isAvailable(slideData: AIPPTSlideData, template: Slide): boolean;
}

// 维度评分结果
export interface DimensionScore {
  dimensionId: string;
  score: number | null; // null表示维度不可用
  weight: number;
  available: boolean;
}

// 维度配置接口
export interface DimensionConfig {
  id: string;
  name: string;
  weight: number;
  required: boolean;
  enabled: boolean;
  description: string;
}

// 模板匹配结果
export interface TemplateMatchResult {
  template: Slide;
  totalScore: number;
  dimensionScores: DimensionScore[];
  matchedDimensions: string[]; // 参与计算的维度ID列表
}

// 为了兼容性，导出枚举值为联合类型
export type ContentTypeUnion = `${ContentType}`;
export type LayoutTypeUnion = `${LayoutType}`;

// 重新导出现有的Slide类型，并添加前向声明类型的兼容性
export type { Slide } from '@/types/slides'

// 导出统一的类型定义，便于其他模块使用
export type {
  ContentType as BaseContentType,
  LayoutType as BaseLayoutType
} from '@/types/slides'
