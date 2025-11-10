import { onMounted, onUnmounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore, useSlidesStore } from '@/store'
import usePasteTextClipboardData from './usePasteTextClipboardData'
import useCreateElement from './useCreateElement'
import { uploadImage, type ImageItem } from '@/services/image'
import useUploadStatus from './useUploadStatus'
import { nanoid } from 'nanoid'
import message from '@/utils/message'

export default () => {
  const { editorAreaFocus, thumbnailsFocus, disableHotkeys } = storeToRefs(useMainStore())
  const slidesStore = useSlidesStore()

  const { pasteTextClipboardData } = usePasteTextClipboardData()
  const { createImageElement } = useCreateElement()
  const {
    createUploadTask,
    updateUploadProgress,
    markUploadSuccess,
    markUploadFailed
  } = useUploadStatus()

  // 粘贴图片缓存，用于滤重处理
  const pasteImageCache = ref(new Map<string, { success: boolean; cos_key: string; image_id: string; image_url: string; message: string }>())

  // 生成字符串的SHA-256哈希值
  const generateSHA256 = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    return hashHex
  }

  // 粘贴图片到幻灯片元素
  const pasteImageFile = async (imageFile: File) => {
    const taskId = createUploadTask(imageFile.name)

    try {
      // 生成图片内容的SHA-256哈希作为唯一标识
      const imageHash = await generateSHA256(imageFile)

      // 检查缓存中是否已存在相同图片
      if (pasteImageCache.value.has(imageHash)) {
        const cachedResult = pasteImageCache.value.get(imageHash)!

        if (cachedResult.success) {
          // 图片已存在，直接创建图片元素
          const imageId = nanoid(10)
          const imageItem: ImageItem = {
            id: imageId,
            original_filename: imageFile.name,
            filename: imageFile.name,
            file_size: imageFile.size,
            mime_type: imageFile.type,
            url: cachedResult.cos_key, // 使用cos_key
            created_at: new Date().toISOString(),
            description: '粘贴图片',
            cos_key: cachedResult.cos_key
          }
          createImageElement(imageItem)
          message.success(`图片已存在，直接使用: ${imageFile.name}`)
          return
        }
        // 缓存中的图片上传失败，重新上传
      }

      // 显示开始上传提示
      message.info(`开始上传图片: ${imageFile.name}`)

      // 首先创建一个临时的图片元素显示上传状态
      const tempImageId = nanoid(10)
      const tempImageItem: ImageItem = {
        id: tempImageId,
        original_filename: imageFile.name,
        filename: imageFile.name,
        file_size: imageFile.size,
        mime_type: imageFile.type,
        url: '', // 暂时为空，上传成功后再更新
        created_at: new Date().toISOString(),
        description: '上传中...'
      }

      // 创建临时图片元素
      createImageElement(tempImageItem)

      // 上传图片到COS
      const uploadResult = await uploadImage(imageFile, (progress) => {
        updateUploadProgress(taskId, progress)
      })

      if (uploadResult.success) {
        markUploadSuccess(taskId)
        // 显示上传成功提示
        message.success(`图片上传成功: ${imageFile.name}`)

        // 使用cos_key作为src，让SmartImage通过代理访问
        // 不再使用预签名URL，避免过期和跨域问题
        slidesStore.updateElement({
          id: tempImageId,
          props: {
            src: uploadResult.cos_key, // 直接使用cos_key
            imageInfo: {
              id: uploadResult.image_id,
              filename: imageFile.name,
              cosKey: uploadResult.cos_key,
              uploadTime: Date.now()
            }
          }
        })

        // 将成功结果存入缓存
        pasteImageCache.value.set(imageHash, uploadResult)
      }
      else {
        markUploadFailed(taskId, uploadResult.message)
        // 显示上传失败提示
        message.error(`图片上传失败: ${uploadResult.message}`)
        // 上传失败，移除临时图片元素
        slidesStore.deleteElement(tempImageId)
        // 将失败结果存入缓存
        const result = uploadResult
        pasteImageCache.value.set(imageHash, result)
        throw new Error(uploadResult.message)
      }

    }
    catch (error) {
      markUploadFailed(taskId, error instanceof Error ? error.message : '上传失败')
      // 上传失败，显示错误提示
      message.error(`粘贴图片失败: ${error instanceof Error ? error.message : '上传失败'}`)
      throw error
    }
  }

  /**
   * 粘贴事件监听
   * @param e ClipboardEvent
   */
  const pasteListener = async (e: ClipboardEvent) => {
    if (!editorAreaFocus.value && !thumbnailsFocus.value) return
    if (disableHotkeys.value) return

    if (!e.clipboardData) return

    const clipboardDataItems = e.clipboardData.items
    const clipboardDataFirstItem = clipboardDataItems[0]

    if (!clipboardDataFirstItem) return

    // 如果剪贴板内有图片，优先尝试读取图片
    let isImage = false
    for (const item of clipboardDataItems) {
      if (item.kind === 'file' && item.type.indexOf('image') !== -1) {
        const imageFile = item.getAsFile()
        if (imageFile) {
          e.preventDefault() // 阻止默认粘贴行为
          try {
            await pasteImageFile(imageFile)
          } 
          catch (error) {
            // 显示错误提示
            message.error('粘贴图片处理失败')
          }
        }
        isImage = true
      }
    }

    if (isImage) return

    // 如果剪贴板内没有图片，但有文字内容，尝试解析文字内容
    if (clipboardDataFirstItem.kind === 'string' && clipboardDataFirstItem.type === 'text/plain') {
      clipboardDataFirstItem.getAsString(text => pasteTextClipboardData(text))
    }
  }

  onMounted(() => {
    document.addEventListener('paste', pasteListener)
  })
  onUnmounted(() => {
    document.removeEventListener('paste', pasteListener)
  })
}