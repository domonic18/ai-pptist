/**
 * PPT布局分析和元素配对配置
 * 集中管理布局识别和匹配的阈值参数
 */

/**
 * 布局分析配置
 */
export const LAYOUT_ANALYSIS_CONFIG = {
  /**
   * 垂直位置分组阈值（像素）
   * 两个元素的top值差小于此值时，认为在同一水平线上
   */
  VERTICAL_GROUPING_THRESHOLD: 50,

  /**
   * 水平列表布局识别配置
   */
  HORIZONTAL_LIST: {
    /**
     * 最小标题数量
     * 至少需要这么多个标题才能识别为水平列表布局
     */
    MIN_TITLE_COUNT: 3,

    /**
     * 标题与正文的水平匹配阈值（像素）
     * 标题和正文的left值差小于此值时，认为在同一列
     */
    HORIZONTAL_MATCH_THRESHOLD: 150,

    /**
     * 顶部宽幅元素的最小宽度（像素）
     * 宽度大于此值的元素可能是顶部说明文字
     */
    TOP_TEXT_MIN_WIDTH: 800,
  },

  /**
   * 左右对比布局识别配置
   */
  COMPARISON: {
    /**
     * 对比布局的标题数量
     * 固定为2个标题（左右对比）
     */
    TITLE_COUNT: 2,

    /**
     * 左右匹配阈值（像素）
     * 标题和正文的left值差小于此值时，认为在同一列
     */
    HORIZONTAL_MATCH_THRESHOLD: 100,

    /**
     * 顶部/底部宽幅元素的最小宽度（像素）
     */
    WIDE_TEXT_MIN_WIDTH: 800,
  },
}

/**
 * 元素配对匹配度计算配置
 */
export const MATCH_SCORE_CONFIG = {
  /**
   * 距离阈值配置
   */
  THRESHOLDS: {
    /**
     * 水平距离阈值（像素）
     * 超过此值认为不在同一列
     */
    HORIZONTAL_DISTANCE: 150,

    /**
     * 垂直距离最大值（像素）
     * 超过此值认为距离过远
     */
    VERTICAL_DISTANCE_MAX: 200,

    /**
     * 中心点距离阈值（像素）
     * 超过此值认为不对齐
     */
    CENTER_DISTANCE: 100,
  },

  /**
   * 理想距离配置
   */
  IDEAL: {
    /**
     * 理想的垂直间距（像素）
     * 标题和正文之间的理想距离
     */
    VERTICAL_DISTANCE: 70,
  },

  /**
   * 评分权重配置
   */
  WEIGHTS: {
    /**
     * 水平位置匹配权重
     */
    HORIZONTAL: 1.0,

    /**
     * 垂直位置匹配权重
     */
    VERTICAL: 1.2,

    /**
     * 宽度相似度权重
     */
    WIDTH: 0.5,

    /**
     * 中心点对齐权重
     */
    CENTER_ALIGN: 0.8,
  },

  /**
   * 衰减系数配置
   */
  DECAY: {
    /**
     * 距离衰减系数
     * 用于指数衰减计算
     */
    DISTANCE_FACTOR: 50,
  },
}

/**
 * 获取布局分析配置
 */
export function getLayoutAnalysisConfig() {
  return LAYOUT_ANALYSIS_CONFIG
}

/**
 * 获取匹配度计算配置
 */
export function getMatchScoreConfig() {
  return MATCH_SCORE_CONFIG
}

