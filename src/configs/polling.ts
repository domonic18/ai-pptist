/**
 * 轮询配置
 * 统一管理所有异步任务的轮询行为
 */

/**
 * 轮询配置接口
 */
export interface PollingConfig {
  /** 轮询间隔（毫秒） */
  interval: number;
  /** 是否启用渐进式间隔 */
  enableProgressive: boolean;
  /** 最大超时时间（毫秒），0 表示无限制 */
  maxTimeout: number;
  /** 渐进式间隔的最大值 */
  maxInterval?: number;
  /** 渐进式间隔的增长因子 */
  intervalMultiplier?: number;
}

/**
 * 轮询配置常量
 */
export const POLLING_CONFIG = {
  /** 图片编辑轮询配置 */
  IMAGE_EDITING: {
    interval: 2000, // 固定间隔 2 秒
    enableProgressive: false, // 不启用渐进式
    maxTimeout: 0, // 0 表示无限制，直到任务完成
  },

  /** 图片解析轮询配置（当前未使用，保留） */
  IMAGE_PARSING: {
    interval: 1000,
    enableProgressive: false,
    maxTimeout: 60000, // 60 秒
  },

  /** 香蕉生成轮询配置 */
  BANANA_GENERATION: {
    interval: 2000,
    enableProgressive: false,
    maxTimeout: 0, // 无限制
  },
} as const
