import type { App } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'

export default {
  install(app: App) {
    // 注册Element Plus
    app.use(ElementPlus, {
      locale: zhCn,
      // 配置全局z-index确保下拉菜单正常显示
      zIndex: 3000
    })

    // 注册所有图标
    for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
      app.component(key, component)
    }
  }
}