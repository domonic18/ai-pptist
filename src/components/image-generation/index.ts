/**
 * AI图片生成组件导出
 */

import ImageGenerationMain from './ImageGenerationMain.vue'
import NavigationBar from './NavigationBar.vue'
import ControlPanel from './ControlPanel.vue'
import ImageGallery from './ImageGallery.vue'
import GenerationLog from './GenerationLog.vue'
import ImagePreviewModal from './ImagePreviewModal.vue'

export {
  ImageGenerationMain,
  NavigationBar,
  ControlPanel,
  ImageGallery,
  GenerationLog,
  ImagePreviewModal
}
export * from './types'

// 默认导出主组件
export default ImageGenerationMain