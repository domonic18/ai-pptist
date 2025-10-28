import { ref } from 'vue'
import api from '@/services'
import message from '@/utils/message'
import useAIPPT from './useAIPPT'

export interface OutlineGenerationOptions {
  title?: string
  input_content: string
  language?: string
  slide_count?: number
  model_settings?: { model: string }
}

export interface SSEEvent {
  event: string
  data: any
}

export default function useOutlineGeneration() {
  const { getMdContent } = useAIPPT()
  const outline = ref('')
  const loading = ref(false)
  const outlineCreating = ref(false)

  const parseSSEEvent = (line: string): SSEEvent | null => {
    if (!line.startsWith('data: ')) return null
    try {
      return JSON.parse(line.substring(6))
    }
    catch (e) {
      console.warn('Failed to parse SSE event:', line, e)
      return null
    }
  }

  const processSSEEvent = (eventData: SSEEvent) => {
    switch (eventData.event) {
      case 'content_chunk':
        outline.value += eventData.data.chunk
        break
      case 'complete':
        outline.value = eventData.data.raw_markdown
        break
      case 'error':
        console.error('Outline generation error:', eventData.data.error)
        message.error(`生成大纲失败: ${eventData.data.error}`)
        break
      default:
        break
    }
  }

  const createOutline = async (options: OutlineGenerationOptions) => {
    if (!options.title) {
      message.error('请先输入PPT主题')
      return false
    }

    loading.value = true
    outlineCreating.value = true
    outline.value = ''

    try {
      const stream = await api.GenerateOutline(options)

      const reader: ReadableStreamDefaultReader = stream.body.getReader()
      const decoder = new TextDecoder('utf-8')

      const readStream = () => {
        reader.read().then(({ done, value }) => {
          if (done) {
            outline.value = getMdContent(outline.value)
            outline.value = outline.value.replace(/<!--[\s\S]*?-->/g, '').replace(/<think>[\s\S]*?<\/think>/g, '')
            outlineCreating.value = false
            loading.value = false
            return
          }

          const chunk = decoder.decode(value, { stream: true })

          const lines = chunk.split('\n')
          for (const line of lines) {
            if (line.trim()) {
              const eventData = parseSSEEvent(line)
              if (eventData) {
                processSSEEvent(eventData)
              }
            }
          }

          readStream()
        })
      }

      readStream()
      return true
    }
    catch (error) {
      console.error('生成大纲错误:', error)
      message.error('生成大纲失败，请检查网络连接')
      loading.value = false
      outlineCreating.value = false
      return false
    }
  }

  const resetOutline = () => {
    outline.value = ''
    outlineCreating.value = false
  }

  return {
    outline,
    loading,
    outlineCreating,
    createOutline,
    resetOutline
  }
}