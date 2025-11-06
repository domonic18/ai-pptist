/**
 * 幻灯片元素处理工具函数
 * 用于处理AI优化返回的元素数据，确保数据安全和格式正确
 */

/**
 * 安全地更新元素属性
 * 只在新值存在且非null时更新
 */
function safeUpdateProperty<T>(
  target: Record<string, any>,
  source: Record<string, any>,
  key: string,
  defaultValue?: T
): void {
  if (source[key] !== undefined && source[key] !== null) {
    target[key] = source[key]
  }
  else if (defaultValue !== undefined) {
    target[key] = defaultValue
  }
}


/**
 * 安全地更新字符串属性
 * 确保字符串非空，否则使用默认值
 */
function safeUpdateStringProperty(
  target: Record<string, any>,
  source: Record<string, any>,
  key: string,
  defaultValue: string
): void {
  if (source[key] && typeof source[key] === 'string' && source[key].trim()) {
    target[key] = source[key]
  }
  else {
    target[key] = defaultValue
  }
}


/**
 * 安全地更新对象属性
 * 确保属性是对象类型，否则使用默认值
 */
function safeUpdateObjectProperty(
  target: Record<string, any>,
  source: Record<string, any>,
  key: string,
  defaultValue: Record<string, any>
): void {
  if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
    target[key] = source[key]
  }
  else {
    target[key] = defaultValue
  }
}


/**
 * 更新原有元素的属性
 * @param originalElement 原始元素
 * @param optimizedElement 优化后的元素
 * @returns 更新后的元素
 */
export function updateExistingElement(
  originalElement: any,
  optimizedElement: any
): any {
  try {
    const updatedElement = { ...originalElement }

    // 更新基础位置属性
    safeUpdateProperty(updatedElement, optimizedElement, 'left')
    safeUpdateProperty(updatedElement, optimizedElement, 'top')

    // 更新尺寸和旋转（线条元素没有这些属性）
    if (originalElement.type !== 'line') {
      if ('width' in updatedElement) {
        safeUpdateProperty(updatedElement, optimizedElement, 'width')
      }
      if ('height' in updatedElement) {
        safeUpdateProperty(updatedElement, optimizedElement, 'height')
      }
      if ('rotate' in updatedElement) {
        safeUpdateProperty(updatedElement, optimizedElement, 'rotate')
      }
    }

    // 更新其他优化后的属性
    safeUpdateProperty(updatedElement, optimizedElement, 'fill')
    safeUpdateProperty(updatedElement, optimizedElement, 'content')
    safeUpdateProperty(updatedElement, optimizedElement, 'lineHeight')

    // 更新defaultColor（确保非空字符串）
    if (optimizedElement.defaultColor !== undefined && optimizedElement.defaultColor !== null) {
      safeUpdateStringProperty(
        updatedElement,
        optimizedElement,
        'defaultColor',
        originalElement.defaultColor || '#333333'
      )
    }

    // 更新outline和text对象（确保是对象格式）
    if (optimizedElement.outline) {
      safeUpdateObjectProperty(
        updatedElement,
        optimizedElement,
        'outline',
        updatedElement.outline || { width: 0, color: '#000000', style: 'solid' }
      )
    }
    if (optimizedElement.text) {
      safeUpdateObjectProperty(
        updatedElement,
        optimizedElement,
        'text',
        updatedElement.text || { content: '' }
      )
    }

    return updatedElement
  }
  catch (err) {
    // 出错时返回原始元素
    return originalElement
  }
}


/**
 * 创建基础元素对象
 * @param newElement 新元素数据
 * @returns 基础元素对象
 */
function createBaseElement(newElement: any): any {
  const element: any = {
    id: newElement.id,
    type: newElement.type,
    left: newElement.left ?? 0,
    top: newElement.top ?? 0,
  }

  // 添加width、height、rotate（除了line类型）
  if (newElement.type !== 'line') {
    element.width = newElement.width ?? 100
    element.height = newElement.height ?? 100
    element.rotate = newElement.rotate ?? 0
  }

  return element
}

/**
 * 创建形状元素
 * @param element 基础元素对象
 * @param newElement 新元素数据
 * @returns 完整的形状元素
 */
function createShapeElement(element: any, newElement: any): any {
  element.fill = newElement.fill || '#5b9bd5'
  
  // 确保outline是对象格式
  element.outline = (newElement.outline && typeof newElement.outline === 'object') 
    ? newElement.outline 
    : { width: 0, color: '#000000', style: 'solid' }
  
  // 确保text是对象格式
  element.text = (newElement.text && typeof newElement.text === 'object')
    ? newElement.text
    : { content: '' }
  
  element.radius = newElement.radius ?? undefined
  element.shadow = newElement.shadow ?? undefined
  element.opacity = newElement.opacity ?? undefined
  element.flipH = newElement.flipH ?? undefined
  element.flipV = newElement.flipV ?? undefined
  
  return element
}

/**
 * 创建文本元素
 * @param element 基础元素对象
 * @param newElement 新元素数据
 * @returns 完整的文本元素
 */
function createTextElement(element: any, newElement: any): any {
  element.content = newElement.content ?? ''
  element.defaultFontName = (newElement.defaultFontName && newElement.defaultFontName.trim()) 
    ? newElement.defaultFontName 
    : 'Microsoft Yahei'
  element.defaultColor = (newElement.defaultColor && newElement.defaultColor.trim())
    ? newElement.defaultColor
    : '#333333'
  element.lineHeight = newElement.lineHeight ?? 1.5
  
  return element
}

/**
 * 创建图片元素
 * @param element 基础元素对象
 * @param newElement 新元素数据
 * @returns 完整的图片元素
 */
function createImageElement(element: any, newElement: any): any {
  element.src = newElement.src ?? ''
  element.fixedRatio = newElement.fixedRatio !== undefined ? newElement.fixedRatio : true
  
  return element
}

/**
 * 创建新元素
 * @param newElement 新元素数据
 * @returns 完整的元素对象
 */
export function createNewElement(newElement: any): any {
  try {
    // 创建基础元素
    let element = createBaseElement(newElement)

    // 根据类型添加特定属性
    switch (newElement.type) {
      case 'shape':
        element = createShapeElement(element, newElement)
        break
      
      case 'text':
        element = createTextElement(element, newElement)
        break
      
      case 'image':
        element = createImageElement(element, newElement)
        break
      
      default:
        // 其他类型元素保持基础属性
        break
    }

    return element
  }
  catch (err) {
    // 返回一个最小化的安全元素
    return {
      id: newElement.id,
      type: newElement.type,
      left: newElement.left ?? 0,
      top: newElement.top ?? 0,
      width: newElement.width ?? 100,
      height: newElement.height ?? 100,
    }
  }
}


/**
 * 处理优化后的元素列表
 * @param originalElements 原始元素列表
 * @param optimizedElements 优化后的元素列表
 * @returns 处理后的元素列表（包含更新的原有元素和新增元素）
 */
export function processOptimizedElements(
  originalElements: any[],
  optimizedElements: any[]
): any[] {
  // 收集原有元素的ID
  const originalElementIds = new Set(originalElements.map((el: any) => el.id))
  
  // 更新原有元素的属性
  const updatedElements = originalElements.map((originalEl: any) => {
    const optimizedEl = optimizedElements.find(
      (opt: any) => opt.id === originalEl.id
    )
    if (optimizedEl) {
      return updateExistingElement(originalEl, optimizedEl)
    }
    return originalEl
  })

  // 添加新生成的装饰元素
  const newElements = optimizedElements
    .filter((opt: any) => !originalElementIds.has(opt.id))
    .map((newEl: any) => createNewElement(newEl))

  return [...updatedElements, ...newElements]
}

