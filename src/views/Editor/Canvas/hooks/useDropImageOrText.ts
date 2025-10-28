import { onMounted, onUnmounted, type ShallowRef } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore, useSlidesStore } from '@/store'
import { parseText2Paragraphs } from '@/utils/textParser'
import useCreateElement from '@/hooks/useCreateElement'
import { uploadImage, getImageAccessUrl, type ImageItem } from '@/services/image'
import useUploadStatus from '@/hooks/useUploadStatus'
import { nanoid } from 'nanoid'
import message from '@/utils/message'

export default (elementRef: ShallowRef<HTMLElement | null>) => {
  const { disableHotkeys } = storeToRefs(useMainStore())
  const slidesStore = useSlidesStore()

  const { createImageElement, createTextElement } = useCreateElement()
  const {
    createUploadTask,
    updateUploadProgress,
    markUploadSuccess,
    markUploadFailed
  } = useUploadStatus()

  // 拖拽元素到画布中
  const handleDrop = (e: DragEvent) => {
    if (!e.dataTransfer || e.dataTransfer.items.length === 0) return

    const dataItems = e.dataTransfer.items
    const dataTransferFirstItem = dataItems[0]

    // 检查事件对象中是否存在图片，存在则插入图片，否则继续检查是否存在文字，存在则插入文字
    let isImage = false
    for (const item of dataItems) {
      if (item.kind === 'file' && item.type.indexOf('image') !== -1) {
        const imageFile = item.getAsFile()
        if (imageFile) {
          const taskId = createUploadTask(imageFile.name)

          // 显示开始上传提示
          message.info(`开始上传图片: ${imageFile.name}`)

          // 创建临时图片元素
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
          createImageElement(tempImageItem)

          // 上传图片到COS
          uploadImage(imageFile, (progress) => {
            console.log(`拖拽图片上传进度: ${progress}%`)
            updateUploadProgress(taskId, progress)
          }).then(async uploadResult => {
            if (uploadResult.success) {
              console.log('拖拽图片上传成功:', uploadResult.image_url)
              markUploadSuccess(taskId)
              // 显示上传成功提示
              message.success(`图片上传成功: ${imageFile.name}`)

              // 获取预签名URL
              try {
                const presignedUrlResult = await getImageAccessUrl(uploadResult.image_id)
                console.log('获取预签名URL成功:', presignedUrlResult.url)

                // 更新现有的占位图元素，使用预签名URL
                slidesStore.updateElement({
                  id: tempImageId,
                  props: {
                    src: presignedUrlResult.url,
                    imageInfo: {
                      id: tempImageId,
                      filename: imageFile.name,
                      cosKey: uploadResult.cos_key
                    }
                  }
                })
              } 
              catch (urlError) {
                console.error('获取预签名URL失败:', urlError)
                // 如果获取预签名URL失败，回退到原始URL
                slidesStore.updateElement({
                  id: tempImageId,
                  props: {
                    src: uploadResult.image_url,
                    imageInfo: {
                      id: tempImageId,
                      filename: imageFile.name,
                      cosKey: uploadResult.cos_key
                    }
                  }
                })
              }
            } 
            else {
              console.error('拖拽图片上传失败:', uploadResult.message)
              markUploadFailed(taskId, uploadResult.message)
              // 显示上传失败提示
              message.error(`图片上传失败: ${uploadResult.message}`)
              // 上传失败，移除临时图片元素
              slidesStore.deleteElement(tempImageId)
            }
          }).catch(error => {
            console.error('拖拽图片上传失败:', error)
            markUploadFailed(taskId, error instanceof Error ? error.message : '上传失败')
            // 显示上传失败提示
            message.error(`拖拽图片失败: ${error instanceof Error ? error.message : '上传失败'}`)
            // 移除临时图片元素
            slidesStore.deleteElement(tempImageId)
          })
        }
        isImage = true
      }
    }

    if (isImage) return

    if (dataTransferFirstItem.kind === 'string' && dataTransferFirstItem.type === 'text/plain') {
      dataTransferFirstItem.getAsString(text => {
        if (disableHotkeys.value) return
        const string = parseText2Paragraphs(text)
        createTextElement({
          left: 0,
          top: 0,
          width: 600,
          height: 50,
        }, { content: string })
      })
    }
  }

  onMounted(() => {
    elementRef.value && elementRef.value.addEventListener('drop', handleDrop)

    document.ondragleave = e => e.preventDefault()
    document.ondrop = e => e.preventDefault()
    document.ondragenter = e => e.preventDefault()
    document.ondragover = e => e.preventDefault()
  })
  onUnmounted(() => {
    elementRef.value && elementRef.value.removeEventListener('drop', handleDrop)

    document.ondragleave = null
    document.ondrop = null
    document.ondragenter = null
    document.ondragover = null
  })
}