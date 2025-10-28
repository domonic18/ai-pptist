/**
 * 维度权重配置
 * 权重总和必须为1.0
 *
 * 注意: 所有维度平铺,无嵌套加权
 */
export const DimensionWeights = {
  // 核心维度 (90%)
  layoutType: 0.10, // 布局类型维度
  contentType: 0.25, // 内容类型维度
  capacity: 0.25, // 容量维度
  titleStructure: 0.20, // 标题结构维度
  textStructure: 0.10, // 正文结构维度

  // 扩展维度 (10%)
  textAmount: 0.10, // 文字量维度
}

/**
 * 可选维度列表
 * 这些维度在模板缺失相应字段时会自动跳过
 */
export const OptionalDimensions = ['layoutType']

/**
 * 验证权重配置
 */
export function validateWeights(weights: typeof DimensionWeights): boolean {
  const sum = Object.values(weights).reduce((a, b) => a + b, 0)
  const isValid = Math.abs(sum - 1.0) < 0.0001

  // if (!isValid) {
  //   console.warn(`权重总和不为1.0: ${sum}`)
  // }

  return isValid
}

// 运行时验证权重配置
// validateWeights(DimensionWeights) // 暂时注释掉以避免console警告
