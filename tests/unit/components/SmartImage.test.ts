/**
 * SmartImage组件单元测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { ElMessage, ElNotification } from 'element-plus'
import SmartImage from '@/components/SmartImage.vue'
import { ProxyMode } from '@/composables/useSmartImage'

// Mock Element Plus
vi.mock('element-plus', () => ({
  ElMessage: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn()
  },
  ElNotification: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn()
  }
}))

// Mock composables
vi.mock('@/composables/useSmartImage', () => ({
  useSmartImage: vi.fn(() => ({
    loadingState: {
      value: 'idle' as any
    },
    currentUrl: {
      value: ''
    },
    error: {
      value: null
    },
    retryCount: {
      value: 0
    },
    loadImage: vi.fn().mockResolvedValue({
      success: true,
      src: 'https://example.com/image.jpg',
      fromCache: false
    }),
    retry: vi.fn(),
    refresh: vi.fn(),
    getProxyUrl: vi.fn().mockReturnValue('https://api.example.com/proxy/image.jpg')
  })),
  ProxyMode,
  ImageLoadingState: {
    IDLE: 'idle',
    LOADING: 'loading',
    SUCCESS: 'success',
    ERROR: 'error',
    RETRYING: 'retrying'
  }
}))

describe('SmartImage.vue', () => {
  let wrapper: VueWrapper<any>

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  it('渲染基本结构', () => {
    wrapper = mount(SmartImage, {
      props: {
        imageKey: 'test-image.jpg'
      }
    })

    expect(wrapper.find('.smart-image').exists()).toBe(true)
    expect(wrapper.find('img').attributes('alt')).toBe('')
  })

  it('显示图片', async () => {
    wrapper = mount(SmartImage, {
      props: {
        imageKey: 'test-image.jpg',
        alt: '测试图片'
      }
    })

    // 等待加载完成
    await wrapper.vm.$nextTick()

    expect(wrapper.find('img.smart-image__content').exists()).toBe(true)
    expect(wrapper.find('img').attributes('alt')).toBe('测试图片')
  })

  it('不同尺寸显示正确', () => {
    const sizes = ['small', 'medium', 'large', 'custom'] as const

    sizes.forEach(size => {
      const props = size === 'custom'
        ? { imageKey: 'test.jpg', size, width: 150, height: 200 }
        : { imageKey: 'test.jpg', size }

      wrapper = mount(SmartImage, { props })

      const container = wrapper.find('.smart-image')
      expect(container.exists()).toBe(true)
    })
  })

  it('圆角样式', () => {
    wrapper = mount(SmartImage, {
      props: {
        imageKey: 'test.jpg',
        rounded: true
      }
    })

    expect(wrapper.classes()).toContain('smart-image--rounded')
  })

  it('显示加载状态', async () => {
    const { useSmartImage } = await import('@/composables/useSmartImage')
    const mockState = { value: 'loading' }
    vi.mocked(useSmartImage).mockReturnValue({
      ...mockState,
      currentUrl: { value: '' },
      error: { value: null },
      retryCount: { value: 0 },
      loadImage: vi.fn(),
      retry: vi.fn(),
      refresh: vi.fn(),
      getProxyUrl: vi.fn()
    } as any)

    wrapper = mount(SmartImage, {
      props: {
        imageKey: 'test.jpg'
      }
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.find('.smart-image__loading').exists()).toBe(true)
  })

  it('显示错误状态', async () => {
    const { useSmartImage } = await import('@/composables/useSmartImage')
    const mockState = { value: 'error' }
    const mockError = { value: { type: 'network_error', message: '网络错误' } }
    vi.mocked(useSmartImage).mockReturnValue({
      ...mockState,
      currentUrl: { value: '' },
      error: mockError,
      retryCount: { value: 0 },
      loadImage: vi.fn(),
      retry: vi.fn(),
      refresh: vi.fn(),
      getProxyUrl: vi.fn()
    } as any)

    wrapper = mount(SmartImage, {
      props: {
        imageKey: 'test.jpg',
        showErrorText: true,
        showRetryButton: true
      }
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.find('.smart-image__error').exists()).toBe(true)
    expect(wrapper.find('.error-text').exists()).toBe(true)
    expect(wrapper.find('.el-button').exists()).toBe(true)
  })

  it('显示操作按钮', () => {
    wrapper = mount(SmartImage, {
      props: {
        imageKey: 'test.jpg',
        showActions: true,
        showRefreshButton: true
      }
    })

    expect(wrapper.find('.smart-image__actions').exists()).toBe(true)
    expect(wrapper.find('.el-button[aria-label=""]').exists()).toBe(true)
  })

  it('显示状态指示器', () => {
    wrapper = mount(SmartImage, {
      props: {
        imageKey: 'test.jpg',
        showIndicator: true
      }
    })

    expect(wrapper.find('.smart-image__indicator').exists()).toBe(true)
  })

  it('显示缓存指示器', async () => {
    const { useSmartImage } = await import('@/composables/useSmartImage')
    const mockState = { value: 'success' }
    const mockUrl = { value: 'https://example.com/image.jpg' }
    vi.mocked(useSmartImage).mockReturnValue({
      ...mockState,
      currentUrl: mockUrl,
      error: { value: null },
      retryCount: { value: 0 },
      loadImage: vi.fn().mockResolvedValue({
        success: true,
        src: 'https://example.com/image.jpg',
        fromCache: true
      }),
      retry: vi.fn(),
      refresh: vi.fn(),
      getProxyUrl: vi.fn()
    } as any)

    wrapper = mount(SmartImage, {
      props: {
        imageKey: 'test.jpg',
        showIndicator: true
      }
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.find('.indicator--cache').exists()).toBe(true)
  })

  it('显示重试指示器', async () => {
    const { useSmartImage } = await import('@/composables/useSmartImage')
    const mockState = { value: 'retrying' }
    vi.mocked(useSmartImage).mockReturnValue({
      ...mockState,
      currentUrl: { value: '' },
      error: { value: null },
      retryCount: { value: 1 },
      loadImage: vi.fn(),
      retry: vi.fn(),
      refresh: vi.fn(),
      getProxyUrl: vi.fn()
    } as any)

    wrapper = mount(SmartImage, {
      props: {
        imageKey: 'test.jpg',
        showIndicator: true
      }
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.find('.indicator--retry').exists()).toBe(true)
  })

  it('触发重试事件', async () => {
    const { useSmartImage } = await import('@/composables/useSmartImage')
    const mockRetry = vi.fn().mockResolvedValue({
      success: true,
      src: 'https://example.com/image.jpg',
      fromCache: false
    })
    vi.mocked(useSmartImage).mockReturnValue({
      loadingState: { value: 'error' },
      currentUrl: { value: '' },
      error: { value: { type: 'network_error' } },
      retryCount: { value: 0 },
      loadImage: vi.fn(),
      retry: mockRetry,
      refresh: vi.fn(),
      getProxyUrl: vi.fn()
    } as any)

    wrapper = mount(SmartImage, {
      props: {
        imageKey: 'test.jpg',
        showRetryButton: true
      }
    })

    await wrapper.vm.$nextTick()

    const retryButton = wrapper.find('.el-button')
    await retryButton.trigger('click')

    expect(mockRetry).toHaveBeenCalled()
  })

  it('触发刷新事件', async () => {
    const { useSmartImage } = await import('@/composables/useSmartImage')
    const mockRefresh = vi.fn().mockResolvedValue({
      success: true,
      src: 'https://example.com/image.jpg',
      fromCache: false
    })
    vi.mocked(useSmartImage).mockReturnValue({
      loadingState: { value: 'success' },
      currentUrl: { value: 'https://example.com/image.jpg' },
      error: { value: null },
      retryCount: { value: 0 },
      loadImage: vi.fn(),
      retry: vi.fn(),
      refresh: mockRefresh,
      getProxyUrl: vi.fn()
    } as any)

    wrapper = mount(SmartImage, {
      props: {
        imageKey: 'test.jpg',
        showActions: true,
        showRefreshButton: true
      }
    })

    await wrapper.vm.$nextTick()

    const refreshButton = wrapper.findAll('.el-button')[0]
    await refreshButton.trigger('click')

    expect(mockRefresh).toHaveBeenCalled()
  })

  it('触发加载事件', async () => {
    wrapper = mount(SmartImage, {
      props: {
        imageKey: 'test.jpg'
      }
    })

    const img = wrapper.find('img.smart-image__content')
    await img.trigger('load')

    // 验证事件触发
    expect(wrapper.emitted('load')).toBeTruthy()
  })

  it('触发错误事件', async () => {
    wrapper = mount(SmartImage, {
      props: {
        imageKey: 'test.jpg'
      }
    })

    const img = wrapper.find('img.smart-image__content')
    await img.trigger('error')

    // 验证事件触发
    expect(wrapper.emitted('error')).toBeTruthy()
  })

  it('触发点击事件', async () => {
    wrapper = mount(SmartImage, {
      props: {
        imageKey: 'test.jpg'
      }
    })

    const img = wrapper.find('img.smart-image__content')
    await img.trigger('click')

    // 验证事件触发
    expect(wrapper.emitted('click')).toBeTruthy()
  })

  it('监听imageKey变化', async () => {
    const { useSmartImage } = await import('@/composables/useSmartImage')
    const mockLoadImage = vi.fn().mockResolvedValue({
      success: true,
      src: 'https://example.com/image.jpg',
      fromCache: false
    })
    vi.mocked(useSmartImage).mockReturnValue({
      loadingState: { value: 'idle' },
      currentUrl: { value: '' },
      error: { value: null },
      retryCount: { value: 0 },
      loadImage: mockLoadImage,
      retry: vi.fn(),
      refresh: vi.fn(),
      getProxyUrl: vi.fn()
    } as any)

    wrapper = mount(SmartImage, {
      props: {
        imageKey: 'test1.jpg'
      }
    })

    await wrapper.setProps({ imageKey: 'test2.jpg' })
    await wrapper.vm.$nextTick()

    expect(mockLoadImage).toHaveBeenCalledTimes(2)
  })

  it('使用自定义配置', async () => {
    const { useSmartImage } = await import('@/composables/useSmartImage')
    const mockLoadImage = vi.fn().mockResolvedValue({
      success: true,
      src: 'https://example.com/image.jpg',
      fromCache: false
    })
    vi.mocked(useSmartImage).mockReturnValue({
      loadingState: { value: 'idle' },
      currentUrl: { value: '' },
      error: { value: null },
      retryCount: { value: 0 },
      loadImage: mockLoadImage,
      retry: vi.fn(),
      refresh: vi.fn(),
      getProxyUrl: vi.fn()
    } as any)

    const options = {
      maxRetries: 5,
      retryDelay: 2000,
      useProxy: true,
      proxyMode: ProxyMode.REDIRECT
    }

    wrapper = mount(SmartImage, {
      props: {
        imageKey: 'test.jpg',
        options
      }
    })

    await wrapper.vm.$nextTick()

    expect(mockLoadImage).toHaveBeenCalledWith('test.jpg', options)
  })

  it('imageKey为空时显示警告', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    wrapper = mount(SmartImage, {
      props: {
        imageKey: ''
      }
    })

    // 等待异步操作
    setTimeout(() => {
      expect(consoleSpy).toHaveBeenCalledWith('SmartImage: imageKey is required')
    }, 0)
  })
})
