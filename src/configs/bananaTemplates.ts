/**
 * Banana生成模板配置
 * 使用本地图片文件，不需要后端API
 */

export interface BananaTemplateConfig {
  id: string
  name: string
  coverUrl: string // 缩略图URL（用于选择器显示）
  fullImageUrl: string // 完整图片URL（用于生成参考）
  type: 'system' | 'user'
  aspectRatio: '16:9' | '4:3'
}

/**
 * Banana模板列表
 * 使用本地图片，路径相对于 public 目录
 */
export const BANANA_TEMPLATE_CONFIGS: BananaTemplateConfig[] = [
  {
    id: 'template_academic',
    name: '学术风格',
    coverUrl: './templates/template_academic.jpg',
    fullImageUrl: './templates/template_academic.jpg',
    type: 'system',
    aspectRatio: '16:9',
  },
  {
    id: 'template_b',
    name: '商务风格',
    coverUrl: './templates/template_b.png',
    fullImageUrl: './templates/template_b.png',
    type: 'system',
    aspectRatio: '16:9',
  },
  {
    id: 'template_glass',
    name: '玻璃质感',
    coverUrl: './templates/template_glass.png',
    fullImageUrl: './templates/template_glass.png',
    type: 'system',
    aspectRatio: '16:9',
  },
  {
    id: 'template_s',
    name: '简约风格',
    coverUrl: './templates/template_s.png',
    fullImageUrl: './templates/template_s.png',
    type: 'system',
    aspectRatio: '16:9',
  },
  {
    id: 'template_vector_illustration',
    name: '矢量插画',
    coverUrl: './templates/template_vector_illustration.png',
    fullImageUrl: './templates/template_vector_illustration.png',
    type: 'system',
    aspectRatio: '16:9',
  },
  {
    id: 'template_y',
    name: '优雅风格',
    coverUrl: './templates/template_y.png',
    fullImageUrl: './templates/template_y.png',
    type: 'system',
    aspectRatio: '16:9',
  },
]

