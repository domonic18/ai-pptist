/**
 * 优化幻灯片快捷提示词配置
 */

import { View, Edit, Check, MagicStick, Expand, Picture } from '@element-plus/icons-vue'
import type { Component } from 'vue'

export interface QuickPrompt {
  label: string
  text: string
  icon: Component
}

/**
 * 文字优化相关快捷提示词
 */
export const TEXT_QUICK_PROMPTS: QuickPrompt[] = [
  { 
    label: '尝试新的布局', 
    text: '重新设计幻灯片布局，使其更具视觉吸引力。文字内容不要修改。', 
    icon: View 
  },
  { 
    label: '改进写作', 
    text: '优化幻灯片内容的表达方式，使其更清晰易懂', 
    icon: Edit 
  },
  { 
    label: '修正拼写和语法', 
    text: '检查并修正幻灯片中的拼写和语法错误', 
    icon: Check 
  },
  { 
    label: '翻译', 
    text: '将幻灯片内容翻译成英文', 
    icon: MagicStick 
  },
  { 
    label: '使其更直观', 
    text: '使内容表达更直观易懂，便于观众理解', 
    icon: Expand 
  }
]

/**
 * 图片生成相关快捷提示词
 */
export const IMAGE_QUICK_PROMPTS: QuickPrompt[] = [
  { 
    label: '根据内容生成图片', 
    text: '为幻灯片添加相关图像以增强视觉效果', 
    icon: Picture 
  }
]

/**
 * Temperature配置标记
 */
export const TEMPERATURE_MARKS = {
  0.0: '确定',
  0.7: '平衡',
  1.5: '创意',
  2.0: '随机'
}

/**
 * Temperature默认值
 */
export const DEFAULT_TEMPERATURE = 0.7

/**
 * 优化超时时间（毫秒）
 */
export const OPTIMIZE_TIMEOUT_MS = 120000 // 120秒

/**
 * 成功后关闭对话框的延迟时间（毫秒）
 */
export const SUCCESS_CLOSE_DELAY_MS = 500

