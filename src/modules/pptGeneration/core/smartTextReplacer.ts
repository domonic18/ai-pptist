/**
 * 智能文本内容替换器
 * 保留完整模板样式，只替换文本内容
 */

export class SmartTextReplacer {
  /**
   * 智能替换文本内容，保留所有样式
   *
   * @param originalHtml - 原始模板HTML
   * @param newText - 新的文本内容（可能包含换行符）
   * @returns 替换后的HTML，保留所有原始样式
   */
  static replaceTextWithStyles(originalHtml: string, newText: string): string {
    // 如果新文本不包含换行符，直接进行简单替换
    if (!newText.includes('\n')) {
      return this.replaceSingleLineText(originalHtml, newText)
    }

    // 如果包含换行符，进行智能多行替换
    return this.replaceMultiLineText(originalHtml, newText)
  }

  /**
   * 替换单行文本
   */
  private static replaceSingleLineText(originalHtml: string, newText: string): string {
    // 创建临时DOM元素来解析HTML
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = originalHtml

    // 找到最内层的文本节点并替换内容
    const textNodes = this.findLeafTextNodes(tempDiv)
    if (textNodes.length > 0) {
      // 直接设置文本内容，浏览器会自动处理HTML转义
      textNodes[0].textContent = newText
    }

    return tempDiv.innerHTML
  }

  /**
   * 替换多行文本
   */
  private static replaceMultiLineText(originalHtml: string, newText: string): string {
    const lines = newText.split('\n').filter(line => line.trim() !== '')

    // 如果只有一行，使用单行替换
    if (lines.length <= 1) {
      return this.replaceSingleLineText(originalHtml, newText)
    }

    // 创建临时DOM元素
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = originalHtml

    // 找到最内层的文本节点
    const textNodes = this.findLeafTextNodes(tempDiv)
    if (textNodes.length === 0) {
      return originalHtml
    }

    // 获取第一个文本节点的父元素结构
    const firstTextNode = textNodes[0]
    const parentStructure = this.getParentStructure(firstTextNode)

    // 构建多行HTML
    const multiLineHtml = lines.map(line => {
      // 直接使用文本内容，浏览器会自动处理HTML转义
      return this.buildLineWithStructure(parentStructure, line)
    }).join('')

    // 替换原始内容
    firstTextNode.parentElement!.innerHTML = multiLineHtml

    return tempDiv.innerHTML
  }

  /**
   * 查找叶子文本节点
   */
  private static findLeafTextNodes(element: Element | DocumentFragment): Text[] {
    const textNodes: Text[] = []

    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT
    )

    let node: Text | null
    while ((node = walker.nextNode() as Text)) {
      // 只考虑非空的文本节点
      if (node.textContent && node.textContent.trim() !== '') {
        textNodes.push(node)
      }
    }

    return textNodes
  }

  /**
   * 获取父元素结构
   */
  private static getParentStructure(textNode: Text): {
    tagName: string
    attributes: { [key: string]: string }
    innerHtml: string
  }[] {
    const structure: {
      tagName: string
      attributes: { [key: string]: string }
      innerHtml: string
    }[] = []

    let currentElement = textNode.parentElement
    while (currentElement && currentElement.tagName !== 'BODY') {
      const attributes: { [key: string]: string } = {}
      for (const attr of Array.from(currentElement.attributes)) {
        attributes[attr.name] = attr.value
      }

      structure.push({
        tagName: currentElement.tagName.toLowerCase(),
        attributes,
        innerHtml: currentElement.innerHTML
      })

      currentElement = currentElement.parentElement
    }

    return structure.reverse()
  }

  /**
   * 使用父元素结构构建一行文本
   */
  private static buildLineWithStructure(
    structure: {
      tagName: string
      attributes: { [key: string]: string }
      innerHtml: string
    }[],
    text: string
  ): string {
    let result = text

    // 从内到外应用结构
    for (let i = structure.length - 1; i >= 0; i--) {
      const { tagName, attributes } = structure[i]
      const attrs = Object.entries(attributes)
        .map(([key, value]) => `${key}="${value}"`)
        .join(' ')

      result = `<${tagName}${attrs ? ' ' + attrs : ''}>${result}</${tagName}>`
    }

    return result
  }
}