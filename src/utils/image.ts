interface ImageSize {
  width: number
  height: number
}

/**
 * 获取图片的原始宽高
 * @param src 图片地址
 */
export const getImageSize = (src: string): Promise<ImageSize> => {
  return new Promise(resolve => {
    const img = document.createElement('img')
    img.src = src
    img.style.opacity = '0'
    document.body.appendChild(img)

    img.onload = () => {
      const imgWidth = img.clientWidth
      const imgHeight = img.clientHeight
    
      img.onload = null
      img.onerror = null

      document.body.removeChild(img)

      resolve({ width: imgWidth, height: imgHeight })
    }

    img.onerror = () => {
      img.onload = null
      img.onerror = null
    }
  })
}

/**
 * 读取图片文件的dataURL
 * @param file 图片文件
 */
export const getImageDataURL = (file: File): Promise<string> => {
  return new Promise(resolve => {
    const reader = new FileReader()
    reader.addEventListener('load', () => {
      resolve(reader.result as string)
    })
    reader.readAsDataURL(file)
  })
}

/**
 * 判断是否为SVG代码字符串
 * @param text 待验证文本
 */
export const isSVGString = (text: string): boolean => {
  const svgRegex = /<svg[\s\S]*?>[\s\S]*?<\/svg>/i
  if (!svgRegex.test(text)) return false

  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(text, 'image/svg+xml')
    return doc.documentElement.nodeName === 'svg'
  } 
  catch {
    return false
  }
}

/**
 * SVG代码转文件
 * @param svg SVG代码
 */
export const svg2File = (svg: string): File => {
  const blob = new Blob([svg], { type: 'image/svg+xml' })
  return new File([blob], `${Date.now()}.svg`, { type: 'image/svg+xml' })
}

/**
 * 从HTMLImageElement直接转换为Base64编码
 * 这是最可靠的方式，因为图片已经在DOM中加载完成
 * @param imgElement 已加载完成的HTMLImageElement
 * @returns Base64编码的图片数据（带 data:image/png;base64, 前缀）
 */
export const imageElementToBase64 = (imgElement: HTMLImageElement): string => {
  try {
    // 创建canvas
    const canvas = document.createElement('canvas')
    canvas.width = imgElement.naturalWidth || imgElement.width
    canvas.height = imgElement.naturalHeight || imgElement.height
    
    // 绘制图片到canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('无法创建canvas上下文')
    }
    
    ctx.drawImage(imgElement, 0, 0)
    
    // 转换为base64
    return canvas.toDataURL('image/png')
  }
  catch (error) {
    const errorMsg = error instanceof Error ? error.message : '未知错误'
    console.error('图片元素转Base64失败:', error)
    throw new Error(`图片处理失败: ${errorMsg}`)
  }
}

/**
 * 将图片URL转换为Base64编码（备用方案）
 * 优先使用 imageElementToBase64，只在没有DOM元素时使用此方法
 * @param src 图片地址
 */
export const imageUrlToBase64 = (src: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'Anonymous' // 尝试允许跨域
    
    img.onload = () => {
      try {
        const base64 = imageElementToBase64(img)
        resolve(base64)
      }
      catch (error) {
        reject(error)
      }
    }
    
    img.onerror = () => {
      reject(new Error('图片加载失败'))
    }
    
    img.src = src
  })
}
