import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

import '@icon-park/vue-next/styles/index.css'
import 'prosemirror-view/style/prosemirror.css'
import 'animate.css'
import 'element-plus/dist/index.css'
import '@/assets/styles/prosemirror.scss'
import '@/assets/styles/global.scss'
import '@/assets/styles/font.scss'

import Icon from '@/plugins/icon'
import Directive from '@/plugins/directive'
import ElementPlus from '@/plugins/element-plus'

const app = createApp(App)
app.use(Icon)
app.use(Directive)
app.use(ElementPlus)
app.use(createPinia())
app.mount('#app')
