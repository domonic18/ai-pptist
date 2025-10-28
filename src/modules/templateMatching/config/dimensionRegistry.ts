/**
 * 维度注册表配置
 * 管理所有维度评估器的注册、权重和启用状态
 */

import type { DimensionConfig } from '../types'

/**
 * 维度配置注册表
 * 定义所有可用维度的配置信息
 */
export const DIMENSION_REGISTRY: Record<string, DimensionConfig> = {
  // 容量维度 - 硬性过滤维度，权重设为0
  capacity: {
    id: 'capacity',
    name: '容量维度',
    weight: 0,
    required: true,
    enabled: true,
    description: '评估内容项数量与模板容量的匹配度，超出容量时直接过滤',
  },

  // 标题结构维度 - 核心匹配维度
  titleStructure: {
    id: 'titleStructure',
    name: '标题结构维度',
    weight: 0.3,
    required: true,
    enabled: true,
    description: '评估内容项标题数量与模板标题元素数量的匹配度',
  },

  // 正文结构维度 - 核心匹配维度
  textStructure: {
    id: 'textStructure',
    name: '正文结构维度',
    weight: 0.3,
    required: true,
    enabled: true,
    description: '评估内容项正文数量与模板正文元素的匹配度',
  },

  // 内容类型维度 - 语义匹配维度
  contentType: {
    id: 'contentType',
    name: '内容类型维度',
    weight: 0.3,
    required: false,
    enabled: true,
    description: '评估内容类型与模板内容类型标注的匹配度',
  },

  // 布局类型维度 - 简化的匹配维度
  layoutType: {
    id: 'layoutType',
    name: '布局类型维度',
    weight: 0.1,
    required: false,
    enabled: true,
    description: '评估后端推荐的布局类型与模板布局类型的匹配度',
  },
}

/**
 * 获取所有启用的维度配置
 */
export function getEnabledDimensions(): DimensionConfig[] {
  return Object.values(DIMENSION_REGISTRY).filter((config) => config.enabled)
}

/**
 * 获取所有必需的维度配置
 */
export function getRequiredDimensions(): DimensionConfig[] {
  return Object.values(DIMENSION_REGISTRY).filter((config) => config.required)
}

/**
 * 获取可选的维度配置
 */
export function getOptionalDimensions(): DimensionConfig[] {
  return Object.values(DIMENSION_REGISTRY).filter((config) => !config.required)
}

/**
 * 获取启用的维度ID列表
 */
export function getEnabledDimensionIds(): string[] {
  return getEnabledDimensions().map((config) => config.id)
}

/**
 * 获取必需的维度ID列表
 */
export function getRequiredDimensionIds(): string[] {
  return getRequiredDimensions().map((config) => config.id)
}

/**
 * 获取维度权重
 *
 * @param dimensionId 维度ID
 * @returns 权重值
 */
export function getDimensionWeight(dimensionId: string): number {
  return DIMENSION_REGISTRY[dimensionId]?.weight || 0
}

/**
 * 获取维度配置
 *
 * @param dimensionId 维度ID
 * @returns 维度配置
 */
export function getDimensionConfig(
  dimensionId: string,
): DimensionConfig | undefined {
  return DIMENSION_REGISTRY[dimensionId]
}

/**
 * 检查维度是否启用
 *
 * @param dimensionId 维度ID
 * @returns 是否启用
 */
export function isDimensionEnabled(dimensionId: string): boolean {
  return DIMENSION_REGISTRY[dimensionId]?.enabled || false
}

/**
 * 检查维度是否必需
 *
 * @param dimensionId 维度ID
 * @returns 是否必需
 */
export function isDimensionRequired(dimensionId: string): boolean {
  return DIMENSION_REGISTRY[dimensionId]?.required || false
}

/**
 * 计算启用维度的总权重
 */
export function getTotalWeight(): number {
  return getEnabledDimensions()
    .filter((config) => config.id !== 'capacity') // 排除容量维度（权重为0）
    .reduce((total, config) => total + config.weight, 0)
}

/**
 * 验证维度权重配置
 * 确保非容量维度的权重之和为1.0
 */
export function validateWeightConfiguration(): {
  isValid: boolean;
  totalWeight: number;
  error?: string;
  } {
  const enabledNonCapacityDimensions = getEnabledDimensions().filter(
    (config) => config.id !== 'capacity',
  )

  const totalWeight = enabledNonCapacityDimensions.reduce(
    (total, config) => total + config.weight,
    0,
  )

  if (enabledNonCapacityDimensions.length === 0) {
    return {
      isValid: true,
      totalWeight: 0,
      error: 'No enabled non-capacity dimensions found',
    }
  }

  const isValid = Math.abs(totalWeight - 1.0) < 0.001 // 允许浮点数误差

  return {
    isValid,
    totalWeight,
    error: isValid
      ? undefined
      : `Total weight (${totalWeight}) should equal 1.0`,
  }
}

/**
 * 更新维度权重
 *
 * @param dimensionId 维度ID
 * @param newWeight 新权重值
 */
export function updateDimensionWeight(
  dimensionId: string,
  newWeight: number,
): void {
  const config = DIMENSION_REGISTRY[dimensionId]
  if (config) {
    config.weight = newWeight
  }
}

/**
 * 启用/禁用维度
 *
 * @param dimensionId 维度ID
 * @param enabled 是否启用
 */
export function setDimensionEnabled(
  dimensionId: string,
  enabled: boolean,
): void {
  const config = DIMENSION_REGISTRY[dimensionId]
  if (config) {
    config.enabled = enabled
  }
}

/**
 * 获取维度注册表统计信息
 */
export function getRegistryStats(): {
  total: number;
  enabled: number;
  required: number;
  optional: number;
  totalWeight: number;
  } {
  const allDimensions = Object.values(DIMENSION_REGISTRY)
  const enabledDimensions = getEnabledDimensions()
  const requiredDimensions = getRequiredDimensions()
  const optionalDimensions = getOptionalDimensions()
  const totalWeight = getTotalWeight()

  return {
    total: allDimensions.length,
    enabled: enabledDimensions.length,
    required: requiredDimensions.length,
    optional: optionalDimensions.length,
    totalWeight,
  }
}
