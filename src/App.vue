<template>
  <!-- 使用 RouterView 实现路由 -->
  <RouterView v-slot="{ Component }">
    <template v-if="slides.length || $route.name === 'Login'">
      <component :is="Component" />
    </template>
    <FullscreenSpin v-else tip="数据初始化中，请稍等 ..." loading :mask="false" />
  </RouterView>

  <!-- 上传状态面板（全局组件） -->
  <UploadStatusPanel />
</template>


<script lang="ts" setup>
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useScreenStore, useMainStore, useSnapshotStore, useSlidesStore } from '@/store'
import { LOCALSTORAGE_KEY_DISCARDED_DB } from '@/configs/storage'
import { deleteDiscardedDB } from '@/utils/database'
import api from '@/services'

import FullscreenSpin from '@/components/FullscreenSpin.vue'
import UploadStatusPanel from '@/components/upload/UploadStatusPanel.vue'

const mainStore = useMainStore()
const slidesStore = useSlidesStore()
const snapshotStore = useSnapshotStore()
const { databaseId } = storeToRefs(mainStore)
const { slides } = storeToRefs(slidesStore)

if (import.meta.env.MODE !== 'development') {
  window.onbeforeunload = () => false
}

onMounted(async () => {
  // 初始化演示文稿数据
  const mockSlides = await api.getMockData('slides')
  slidesStore.setSlides(mockSlides)

  // 初始化 IndexedDB
  await deleteDiscardedDB()
  snapshotStore.initSnapshotDatabase()
})

// 应用注销时向 localStorage 中记录下本次 indexedDB 的数据库ID，用于之后清除数据库
window.addEventListener('beforeunload', () => {
  const discardedDB = localStorage.getItem(LOCALSTORAGE_KEY_DISCARDED_DB)
  const discardedDBList: string[] = discardedDB ? JSON.parse(discardedDB) : []

  discardedDBList.push(databaseId.value)

  const newDiscardedDB = JSON.stringify(discardedDBList)
  localStorage.setItem(LOCALSTORAGE_KEY_DISCARDED_DB, newDiscardedDB)
})
</script>

<style lang="scss">
#app {
  height: 100%;
}
</style>