<template>
  <div class="smart-image-example">
    <h2>SmartImage 组件示例</h2>

    <!-- 基本用法 -->
    <section class="example-section">
      <h3>基本用法</h3>
      <div class="image-grid">
        <SmartImage
          image-key="images/demo/image1.jpg"
          alt="示例图片1"
          size="medium"
          :show-loading-text="true"
          @load="handleLoad"
          @error="handleError"
        />

        <SmartImage
          image-key="images/demo/image2.jpg"
          alt="示例图片2"
          size="large"
          :rounded="true"
          @click="handleClick"
        />
      </div>
    </section>

    <!-- 不同尺寸 -->
    <section class="example-section">
      <h3>不同尺寸</h3>
      <div class="image-grid">
        <SmartImage
          image-key="images/demo/image3.jpg"
          alt="小尺寸"
          size="small"
          :show-indicator="true"
        />
        <SmartImage
          image-key="images/demo/image4.jpg"
          alt="中尺寸"
          size="medium"
          :show-indicator="true"
        />
        <SmartImage
          image-key="images/demo/image5.jpg"
          alt="大尺寸"
          size="large"
          :show-indicator="true"
        />
        <SmartImage
          image-key="images/demo/image6.jpg"
          alt="自定义尺寸"
          size="custom"
          :width="150"
          :height="200"
          :show-indicator="true"
        />
      </div>
    </section>

    <!-- 圆角样式 -->
    <section class="example-section">
      <h3>圆角样式</h3>
      <div class="image-grid">
        <SmartImage
          image-key="images/demo/image7.jpg"
          alt="圆形头像"
          size="medium"
          :rounded="true"
          :show-actions="true"
          :show-refresh-button="true"
        />
        <SmartImage
          image-key="images/demo/image8.jpg"
          alt="圆角图片"
          size="medium"
          :rounded="true"
          :preview="true"
        />
      </div>
    </section>

    <!-- 错误处理 -->
    <section class="example-section">
      <h3>错误处理</h3>
      <div class="image-grid">
        <SmartImage
          image-key="images/nonexistent.jpg"
          alt="不存在的图片"
          size="medium"
          :show-error-text="true"
          :show-retry-button="true"
          @error="handleError"
          @retry="handleRetry"
        />
        <SmartImage
          image-key="images/error.jpg"
          alt="错误的图片"
          size="medium"
          :options="{
            maxRetries: 5,
            retryDelay: 2000,
            useProxy: true,
            proxyMode: ProxyMode.REDIRECT
          }"
          @error="handleError"
        />
      </div>
    </section>

    <!-- 使用代理模式 -->
    <section class="example-section">
      <h3>代理模式</h3>
      <div class="image-grid">
        <SmartImage
          image-key="images/demo/proxy1.jpg"
          alt="重定向模式"
          size="medium"
          :options="{
            useProxy: true,
            proxyMode: ProxyMode.REDIRECT,
            maxRetries: 3
          }"
          @refresh="handleRefresh"
        />
        <SmartImage
          image-key="images/demo/proxy2.jpg"
          alt="代理模式"
          size="medium"
          :options="{
            useProxy: true,
            proxyMode: ProxyMode.PROXY,
            maxRetries: 3
          }"
          @refresh="handleRefresh"
        />
      </div>
    </section>

    <!-- 性能监控 -->
    <section class="example-section">
      <h3>性能监控</h3>
      <div class="stats-panel">
        <el-card>
          <template #header>
            <span>缓存统计</span>
          </template>
          <div class="stats-content">
            <div class="stat-item">
              <label>缓存命中:</label>
              <span>{{ cacheStats.hitCount }}</span>
            </div>
            <div class="stat-item">
              <label>缓存未命中:</label>
              <span>{{ cacheStats.missCount }}</span>
            </div>
            <div class="stat-item">
              <label>命中率:</label>
              <span>{{ cacheStats.hitRate }}%</span>
            </div>
            <div class="stat-item">
              <label>总缓存项:</label>
              <span>{{ cacheStats.totalItems }}</span>
            </div>
            <div class="stat-item">
              <label>缓存大小:</label>
              <span>{{ formatSize(cacheStats.totalSize) }}</span>
            </div>
            <el-button
              size="small"
              @click="refreshStats"
            >
              刷新统计
            </el-button>
          </div>
        </el-card>
      </div>
    </section>

    <!-- 操作按钮 -->
    <section class="example-section">
      <h3>批量操作</h3>
      <div class="actions">
        <el-button @click="preloadAll">
          预加载所有图片
        </el-button>
        <el-button @click="cleanupCache">
          清理缓存
        </el-button>
        <el-button @click="clearStats">
          清除统计
        </el-button>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import SmartImage from '@/components/SmartImage.vue'
import { imageCache } from '@/utils/imageCache'
import { ProxyMode } from '@/composables/useSmartImage'
import type { CacheStats } from '@/utils/imageCache'

// 响应式数据
const cacheStats = ref<CacheStats>({
  totalItems: 0,
  totalSize: 0,
  hitCount: 0,
  missCount: 0,
  hitRate: 0,
  expiredItems: 0
})

// 模拟图片键列表
const imageKeys = [
  'images/demo/image1.jpg',
  'images/demo/image2.jpg',
  'images/demo/image3.jpg',
  'images/demo/image4.jpg',
  'images/demo/image5.jpg'
]

// 事件处理
function handleLoad(event: Event) {
  console.log('图片加载成功:', event)
}

function handleError(error: any) {
  console.error('图片加载错误:', error)
  ElMessage.error('图片加载失败')
}

function handleClick(event: Event) {
  console.log('图片被点击:', event)
  ElNotification({
    title: '提示',
    message: '图片被点击',
    type: 'info'
  })
}

function handleRetry(imageKey?: string) {
  console.log('重试加载:', imageKey)
  ElMessage.info('正在重试...')
}

function handleRefresh(imageKey?: string) {
  console.log('刷新图片:', imageKey)
  ElMessage.success('图片刷新成功')
}

// 工具函数
function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

// 批量操作
async function preloadAll() {
  ElMessage.info('开始预加载...')
  try {
    const result = await imageCache.batchPreload(
      imageKeys,
      3600000, // 1小时
      (completed, total) => {
        console.log(`预加载进度: ${completed}/${total}`)
      }
    )
    ElMessage.success(`预加载完成: 成功 ${result.success} 个，失败 ${result.failed} 个`)
    await refreshStats()
  } catch (error) {
    console.error('预加载失败:', error)
    ElMessage.error('预加载失败')
  }
}

async function cleanupCache() {
  try {
    const cleaned = await imageCache.cleanup()
    ElMessage.success(`清理了 ${cleaned} 个过期缓存项`)
    await refreshStats()
  } catch (error) {
    console.error('清理缓存失败:', error)
    ElMessage.error('清理缓存失败')
  }
}

async function clearStats() {
  try {
    await imageCache.clear()
    ElMessage.success('缓存已清空')
    await refreshStats()
  } catch (error) {
    console.error('清除统计失败:', error)
    ElMessage.error('清除统计失败')
  }
}

async function refreshStats() {
  try {
    cacheStats.value = await imageCache.getStats()
  } catch (error) {
    console.error('获取统计失败:', error)
  }
}

// 生命周期
onMounted(async () => {
  await refreshStats()

  // 定期刷新统计
  setInterval(refreshStats, 5000)
})
</script>

<style scoped>
.smart-image-example {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.example-section {
  margin-bottom: 40px;
}

.example-section h3 {
  margin-bottom: 16px;
  color: #333;
  font-size: 18px;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stats-panel {
  max-width: 600px;
}

.stats-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  align-items: center;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-item label {
  font-weight: 500;
  color: #666;
}

.stat-item span {
  color: #333;
}

.actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
</style>
