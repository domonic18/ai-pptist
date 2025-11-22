/**
 * API端点配置
 * 统一管理所有后端API接口地址
 */

export const API_CONFIG = {
  // 图片管理相关API
  IMAGES: {
    // 获取图片列表
    LIST: '/api/v1/images',
    // 获取图片详情
    DETAIL: (id: string) => `/api/v1/images/${id}`,
    // 更新图片信息
    UPDATE: (id: string) => `/api/v1/images/${id}`,
    // 删除图片
    DELETE: (id: string) => `/api/v1/images/${id}`,
    // 批量操作
    BATCH: '/api/v1/images/batch',
    // 批量删除
    BATCH_DELETE: '/api/v1/images/batch/delete',
    // 图片搜索
    SEARCH: '/api/v1/images/search',
  },

  // 图片代理相关API
  IMAGE_PROXY: {
    // 代理访问图片（使用独立前缀避免路由冲突）
    PROXY: (imageKey: string) => `/api/v1/img-access/${imageKey}`,
    // 获取图片状态
    STATUS: (imageKey: string) => `/api/v1/img-access/status/${imageKey}`,
    // 刷新图片URL
    REFRESH: (imageKey: string) => `/api/v1/img-access/refresh/${imageKey}`,
    // 批量获取URL
    BATCH_URLS: '/api/v1/img-access/batch/urls',
    // 获取性能统计
    STATS: '/api/v1/img-access/stats',
    // 清理过期缓存
    CLEANUP: '/api/v1/img-access/cleanup',
    // 预加载URL
    PRELOAD: '/api/v1/img-access/preload',
  },

  // 图片上传相关API
  IMAGE_UPLOAD: {
    // 上传图片
    UPLOAD: '/api/v1/images/upload',
    // 获取预签名URL
    PRESIGNED: '/api/v1/images/upload/presigned',
    // 批量上传
    BATCH: '/api/v1/images/upload/batch',
  },

  // 标签管理相关API
  TAGS: {
    // 获取所有标签
    LIST: '/api/v1/tags',
    // 获取热门标签
    POPULAR: '/api/v1/tags/popular',
    // 搜索标签
    SEARCH: '/api/v1/tags/search',
    // 创建标签
    CREATE: '/api/v1/tags',
    // 删除标签
    DELETE: (tagName: string) => `/api/v1/tags/${tagName}`,
  },

  // 图片标签管理相关API
  IMAGE_TAGS: {
    // 获取图片标签
    GET: (imageId: string) => `/api/v1/images/${imageId}/tags`,
    // 添加图片标签
    ADD: (imageId: string) => `/api/v1/images/${imageId}/tags`,
    // 更新图片标签
    UPDATE: (imageId: string) => `/api/v1/images/${imageId}/tags`,
    // 删除图片标签
    DELETE: (imageId: string) => `/api/v1/images/${imageId}/tags`,
    // 删除特定图片标签
    DELETE_SPECIFIC: (imageId: string, tag: string) =>
      `/api/v1/images/${imageId}/tags/${tag}`,
    // 根据标签搜索图片
    SEARCH_BY_TAGS: '/api/v1/images/search/by-tags',
    // 批量操作图片标签
    BATCH_OPERATE: '/api/v1/images/batch-tags',
  },

  // AI生成相关API
  GENERATION: {
    // 生成演示文稿大纲
    OUTLINE: '/api/v1/generate/outline',
    // 生成演示文稿幻灯片
    SLIDES: '/api/v1/generate/slides',
  },

  // 图片生成相关API
  IMAGE_GENERATION: {
    // 生成图片
    GENERATE: '/api/v1/generate/image',
    // 生成图片并存储到数据库
    GENERATE_AND_STORE: '/api/v1/generate/image/store',
    // 获取生成历史
    HISTORY: '/api/v1/images/generation-history',
    // 获取支持的模型列表
    MODELS: '/api/v1/ai-models/image-generation-models',
  },

  // AI模型管理相关API
  AI_MODELS: {
    // 获取AI模型列表
    LIST: '/api/v1/ai-models',
    // 获取AI模型详情（包含敏感信息如API密钥）
    DETAIL: (id: string) => `/api/v1/ai-models/${id}`,
    // 创建AI模型
    CREATE: '/api/v1/ai-models/models',
    // 更新AI模型
    UPDATE: (id: string) => `/api/v1/ai-models/models/${id}`,
    // 删除AI模型
    DELETE: (id: string) => `/api/v1/ai-models/models/${id}`,
  },

  // 布局优化相关API
  LAYOUT: {
    // 优化幻灯片布局
    OPTIMIZE: '/api/v1/layout/optimize',
  },

  // 自动标注相关API
  ANNOTATION: {
    // 单张幻灯片同步标注
    SINGLE: '/api/v1/annotation/single',
    // 批量幻灯片异步标注
    BATCH: '/api/v1/annotation/batch',
  },

  // 其他API端点可以根据需要继续添加
} as const

export default API_CONFIG
