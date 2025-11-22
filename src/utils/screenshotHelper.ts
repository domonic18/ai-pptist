import { toPng } from 'html-to-image'

/**
 * 遍历容器子元素生成截图
 * @param container 包含所有待截图元素的容器
 * @param count 需要截图的数量（通常是幻灯片数量）
 * @param options 配置选项
 */
export async function generateScreenshotsFromContainer(
  container: HTMLElement,
  count: number,
  options: {
    quality?: number
    width?: number
    ignoreWebfont?: boolean
    saveToDisk?: boolean
    filenamePrefix?: string
  } = {}
): Promise<string[]> {
  const {
    quality = 0.95,
    width = 800,
    ignoreWebfont = true,
    saveToDisk = false,
    filenamePrefix = 'slide-screenshot'
  } = options
  const screenshots: string[] = []

  // 等待内容渲染（图片、字体等）
  // 参考 ExportImage.vue 中的 200ms 延迟，这里稍微给多一点确保安全
  await new Promise(resolve => setTimeout(resolve, 300))

  const elements = container.children

  for (let i = 0; i < count; i++) {
    const el = elements[i] as HTMLElement
    if (el) {
      // 清理 foreignObject 中的 xmlns 属性，避免某些情况下截图失败
      const foreignObjectSpans = el.querySelectorAll('foreignObject [xmlns]')
      foreignObjectSpans.forEach(spanRef => spanRef.removeAttribute('xmlns'))

      try {
        // toPng 会自动处理缩放，我们只需要确保元素本身渲染正确
        // ThumbnailSlide 组件会根据 size prop 设置自身的宽高
        const dataUrl = await toPng(el, {
          quality,
          width, // 显式指定输出宽度
          // height: width * viewportRatio, // 如果需要可以计算
          fontEmbedCSS: ignoreWebfont ? '' : undefined,
          pixelRatio: 1, // 既然 ThumbnailSlide 已经是按照目标尺寸渲染的，这里设为 1

          // 配置图片缓存策略，避免重复加载
          cacheBust: false,
        })
        screenshots.push(dataUrl)

        // 如果开启了保存到磁盘（调试模式）
        if (saveToDisk) {
          const link = document.createElement('a')
          link.download = `${filenamePrefix}-${i + 1}.png`
          link.href = dataUrl
          link.click()
        }
      }
      catch (e) {
        // eslint-disable-next-line no-console
        console.error(`Screenshot failed for slide ${i + 1}`, e)
        screenshots.push('')
      }
    }
    else {
      // eslint-disable-next-line no-console
      console.warn(`Element not found for slide ${i + 1}`)
      screenshots.push('')
    }
  }

  return screenshots
}

