import type { Icons } from '@/plugins/icon'

declare module 'vue' {
  export type GlobalComponents = Icons
}

// 声明图片生成组件模块
declare module '@/components/image-generation/ImageGenerationMain.vue' {
  const ImageGenerationMain: any
  export default ImageGenerationMain
}

declare module '@/components/image-generation/NavigationBar.vue' {
  const NavigationBar: any
  export default NavigationBar
}

declare module '@/components/image-generation/ControlPanel.vue' {
  const ControlPanel: any
  export default ControlPanel
}

declare module '@/components/image-generation/ImageGallery.vue' {
  const ImageGallery: any
  export default ImageGallery
}

declare module '@/components/image-generation/GenerationLog.vue' {
  const GenerationLog: any
  export default GenerationLog
}

declare module '@/components/image-generation/ImagePreviewModal.vue' {
  const ImagePreviewModal: any
  export default ImagePreviewModal
}

export {}