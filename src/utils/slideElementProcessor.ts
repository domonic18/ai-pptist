/**
 * 幻灯片元素处理工具函数
 * 
 * 说明：后端已经完成了所有数据清洗和验证工作，前端只需简单处理即可
 */

/**
 * 更新原有元素的属性
 * 
 * 后端保证：
 * - 所有必需字段都有有效值
 * - 没有null/undefined的关键字段
 * - shape元素的viewBox、path等必需字段已设置
 * 
 * @param originalElement 原始元素
 * @param optimizedElement 优化后的元素（来自后端）
 * @returns 更新后的元素
 */
export function updateExistingElement(
  originalElement: any,
  optimizedElement: any
): any {
  // 后端已验证数据，直接合并属性
  return {
    ...originalElement,
    ...optimizedElement
  }
}

/**
 * 创建新元素
 * 
 * 后端保证：新元素已包含所有必需字段和默认值
 * 
 * @param newElement 新元素数据（来自后端）
 * @returns 完整的元素对象
 */
export function createNewElement(newElement: any): any {
  // 后端已设置所有必需字段，直接返回
  return { ...newElement }
}


/**
 * 处理优化后的元素列表
 * 
 * 简化逻辑：后端已保证数据质量，前端只需合并元素
 * 
 * @param originalElements 原始元素列表
 * @param optimizedElements 优化后的元素列表（来自后端，已清洗）
 * @returns 处理后的元素列表（包含更新的原有元素和新增元素）
 */
export function processOptimizedElements(
  originalElements: any[],
  optimizedElements: any[]
): any[] {
  // 构建原始元素ID集合
  const originalElementIds = new Set(originalElements.map((el: any) => el.id))
  
  // 更新原有元素的属性
  const updatedElements = originalElements.map((originalEl: any) => {
    const optimizedEl = optimizedElements.find((opt: any) => opt.id === originalEl.id)
    return optimizedEl ? updateExistingElement(originalEl, optimizedEl) : originalEl
  })

  // 添加新生成的装饰元素（后端已验证，直接使用）
  const newElements = optimizedElements
    .filter((opt: any) => !originalElementIds.has(opt.id))
    .map((newEl: any) => createNewElement(newEl))

  return [...updatedElements, ...newElements]
}

