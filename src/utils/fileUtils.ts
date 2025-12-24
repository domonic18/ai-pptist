/**
 * 文件处理工具函数
 * 用于文件大小格式化、内容预览等功能
 */

/**
 * 格式化文件大小显示
 *
 * @param bytes - 文件大小（字节）
 * @returns 格式化后的文件大小字符串
 *
 * @example
 * formatFileSize(1024) // "1 KB"
 * formatFileSize(1048576) // "1 MB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

/**
 * 获取大纲预览文本（前几行）
 *
 * @param markdown - markdown格式的大纲内容
 * @param maxLines - 最大显示行数，默认5行
 * @returns 预览文本
 *
 * @example
 * getOutlinePreview("# 标题\\n## 第一章\\n- 要点1", 3)
 * // 返回前3行内容
 */
export function getOutlinePreview(markdown: string, maxLines: number = 5): string {
  if (!markdown) return ''
  const lines = markdown.split('\n').filter(line => line.trim())
  const preview = lines.slice(0, maxLines).join('\n')
  return lines.length > maxLines ? preview + '\n...' : preview
}

/**
 * 验证文件类型是否为markdown
 *
 * @param file - 文件对象
 * @returns 是否为markdown文件
 */
export function isMarkdownFile(file: File): boolean {
  const fileName = file.name.toLowerCase()
  return fileName.endsWith('.md') || fileName.endsWith('.markdown')
}

/**
 * 读取文件内容为文本
 *
 * @param file - 文件对象
 * @returns Promise<string> 文件内容
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      resolve(content)
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsText(file)
  })
}

/**
 * 计算markdown文件中的幻灯片数量
 * 通过统计 ## 和 ### 开头的行数
 *
 * @param markdown - markdown格式的大纲内容
 * @returns 幻灯片数量
 */
export function countSlides(markdown: string): number {
  if (!markdown) return 0
  const lines = markdown.split('\n')
  return lines.filter(line => {
    const trimmed = line.trim()
    return trimmed.startsWith('##') || trimmed.startsWith('###')
  }).length
}

/**
 * 获取文件扩展名
 *
 * @param fileName - 文件名
 * @returns 文件扩展名（包含点号）
 */
export function getFileExtension(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf('.')
  return lastDotIndex !== -1 ? fileName.slice(lastDotIndex).toLowerCase() : ''
}
