import { ref } from 'vue'
import api from '@/services'
import { useSlidesStore } from '@/store'
import useAIPPT from './useAIPPT'
import type { Slide, SlideTheme } from '@/types/slides'

export interface PPTCreationOptions {
  content: string
  language: string
  style: string
  model: string
}

export interface TemplateData {
  slides: Slide[]
  theme: SlideTheme
  width?: number
  height?: number
}

export default function usePPTCreation() {
  const slideStore = useSlidesStore()
  const { AIPPT, presetImgPool } = useAIPPT()

  const loading = ref(false)

  const createPPT = async (
    options: PPTCreationOptions,
    templateId: string,
    imgOption: string,
    templateData?: TemplateData
  ) => {
    loading.value = true

    try {
      console.log('开始PPT生成', { options, templateId, imgOption })
      
      const stream = await api.AIPPT(options)

      if (imgOption === 'test') {
        const imgs = await api.getMockData('imgs')
        presetImgPool(imgs)
      }

      let finalTemplateData = templateData
      if (!finalTemplateData) {
        finalTemplateData = await api.getMockData(templateId)
      }

      const templateSlides: Slide[] = finalTemplateData!.slides
      const templateTheme: SlideTheme = finalTemplateData!.theme

      console.log('模板数据准备完成', { templateSlides: templateSlides.length, theme: templateTheme })

      // 应用模板的画布大小
      if (finalTemplateData!.width && finalTemplateData!.height) {
        slideStore.setViewportSize(finalTemplateData!.width)
        slideStore.setViewportRatio(finalTemplateData!.height / finalTemplateData!.width)
        console.log('应用模板画布大小', {
          width: finalTemplateData!.width,
          height: finalTemplateData!.height,
          ratio: finalTemplateData!.height / finalTemplateData!.width
        })
      }

      // 处理SSE流式数据
      const slideDataList: any[] = []
      const reader = stream.body?.getReader()
      const decoder = new TextDecoder()
      
      if (!reader) {
        throw new Error('无法获取流式数据读取器')
      }

      let buffer = ''
      let slideCount = 0
      
      console.log('开始读取流式数据')

      try {
        while (true) {
          const { done, value } = await reader.read()
          
          if (done) {
            console.log('流式数据读取完成', { totalSlides: slideCount })
            break
          }

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n\n')
          
          // 保留最后一个可能不完整的数据块
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.trim().startsWith('data: ')) {
              try {
                const dataStr = line.replace('data: ', '').trim()
                if (!dataStr || dataStr === '') continue
                
                const data = JSON.parse(dataStr)
                console.log('接收到流式数据:', data)
                
                // 跳过系统事件，只处理幻灯片数据
                if (data.event) {
                  console.log('系统事件:', data.event)
                  continue
                }
                
                // 处理幻灯片对象
                if (data.type && data.data) {
                  console.log('处理幻灯片:', data.type, data.data)
                  slideDataList.push(data)
                  slideCount++
                  
                  // 实时处理每个幻灯片
                  await AIPPT(templateSlides, [data])
                }
              }
              catch (parseError) {
                console.warn('解析流式数据失败:', parseError, line)
              }
            }
          }
        }
      }
      finally {
        reader.releaseLock()
      }

      console.log('PPT生成完成', { 
        totalSlides: slideDataList.length, 
        slideTypes: slideDataList.map(s => s.type) 
      })

      slideStore.setTheme(templateTheme)
      return true
    }
    catch (error) {
      console.error('生成PPT错误:', error)
      return false
    }
    finally {
      loading.value = false
    }
  }

  return {
    loading,
    createPPT
  }
}