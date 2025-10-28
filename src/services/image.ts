/**
 * 图片管理服务
 * 提供图片上传、管理、搜索等功能
 */

import axios from './config'
import { API_CONFIG } from '@/configs/api'

export interface ImageItem {
  id: string
  filename?: string
  original_filename: string
  file_size: number
  mime_type: string
  width?: number
  height?: number
  description?: string
  tags?: string[] | null
  url: string
  thumbnail_url?: string
  created_at: string
  updated_at?: string
  source_type?: string // 图片来源类型：'generated' | 'uploaded'
  model_name?: string // 如果是AI生成，使用的模型名称
  cos_key?: string // COS存储键
  cos_bucket?: string // COS存储桶
  cos_region?: string // COS地域
  source?: string // 兼容性字段，用于显示图片来源
}

export interface ImageUploadResult {
  success: boolean
  image_id: string
  image_url: string
  cos_key: string
  message: string
}

export interface ImageListParams {
  page?: number
  limit?: number
  search?: string
  tags?: string[]
  sort_by?: 'created_at' | 'filename' | 'file_size'
  sort_order?: 'asc' | 'desc'
}

export interface ImageListResponse {
  images: ImageItem[]
  total: number
  page: number
  limit: number
  total_pages: number
}

export interface ImageSearchParams {
  query: string
  threshold?: number
  limit?: number
  tags?: string[]
}

export interface TagItem {
  id: string
  name: string
  description?: string
  usage_count: number
  created_at: string
  updated_at?: string
}

export interface TagListResponse {
  tags: TagItem[]
  total: number
  page: number
  limit: number
  total_pages: number
}

export interface PopularTagResponse {
  tags: TagItem[]
  total: number
  limit: number
}

export interface TagSearchParams {
  query: string
  limit?: number
}

export interface ImageTagResponse {
  image_id: string
  tags: string[]
  total: number
}

export interface ImageTagUpdateData {
  tags: string[]
}

export interface ImageTagAddData {
  tags: string[]
}

/**
 * 图片更新数据接口
 */
export interface ImageUpdateData {
  filename?: string
  description?: string
  tags?: string[]
}

/**
 * 获取图片列表
 */
export const getImageList = async (params?: ImageListParams): Promise<ImageListResponse> => {
  const response = await axios.get(API_CONFIG.IMAGES.LIST, { params })
  // axios拦截器返回response.data，response的结构是 {status, message, data}
  const apiResponse = response as unknown as {status: string, message: string, data: {items: ImageItem[], total: number}}
  
  // 调试信息（生产环境可移除）
  // eslint-disable-next-line no-console
  console.log('getImageList API response:', apiResponse)
  
  // 处理后端返回的数据结构
  if (apiResponse.data && apiResponse.data.items) {
    return {
      images: apiResponse.data.items,
      total: apiResponse.data.total,
      page: params?.page || 1,
      limit: params?.limit || 24,
      total_pages: Math.ceil(apiResponse.data.total / (params?.limit || 24))
    }
  }
  
  // 如果数据结构不符合预期，返回空结果
  return {
    images: [],
    total: 0,
    page: 1,
    limit: 24,
    total_pages: 0
  }
}

/**
 * 获取图片详情
 */
export const getImageDetail = async (id: string): Promise<ImageItem> => {
  try {
    const response = await axios.get(API_CONFIG.IMAGES.DETAIL(id))
    // axios拦截器返回response.data，response的结构是 {status, message, data}
    const apiResponse = response as unknown as {status: string, message: string, data: ImageItem}
    
    // 调试信息（生产环境可移除）
    // eslint-disable-next-line no-console
    console.log('getImageDetail API response:', apiResponse)
    // eslint-disable-next-line no-console
    console.log('Image detail data:', apiResponse.data)
    
    if (!apiResponse.data) {
      throw new Error('API返回的数据为空')
    }
    
    return apiResponse.data
    
  }
  catch (error) {
    console.error('获取图片详情失败:', error)
    throw error
  }
}

/**
 * 上传图片
 */
export const uploadImage = async (file: File, onProgress?: (progress: number) => void): Promise<ImageUploadResult> => {
  const formData = new FormData()
  formData.append('file', file)

  try {
    // axios拦截器会返回response.data，而不是完整的response对象
    const result = await axios.post(API_CONFIG.IMAGE_UPLOAD.UPLOAD, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      }
    })

    // 调试：打印响应数据以检查问题
    // eslint-disable-next-line no-console
    console.log('Upload API response:', result)

    // 上传API现在使用统一的StandardResponse格式：{status, message, data}
    const apiResponse = result as unknown as {
      status: string,
      message: string,
      data: {
        success: boolean,
        image_id: string,
        image_url: string,
        cos_key: string
      }
    }

    // 检查响应状态
    if (apiResponse.status === 'success' && apiResponse.data?.success) {
      return {
        success: apiResponse.data.success,
        image_id: apiResponse.data.image_id,
        image_url: apiResponse.data.image_url,
        cos_key: apiResponse.data.cos_key,
        message: apiResponse.message
      } as ImageUploadResult
    }
    
    throw new Error(`Upload failed: ${apiResponse.message || 'Invalid response format'}`)
    
  }
  catch (error: any) {
    // eslint-disable-next-line no-console
    console.error('Upload error:', error)
    
    // 如果是axios错误，提供更详细的错误信息
    if (error.response) {
      throw new Error(`Upload failed with status ${error.response.status}: ${error.response.data?.message || error.message}`)
    }
    else if (error.request) {
      throw new Error('Upload failed: No response from server')
    }
    else {
      throw new Error(`Upload failed: ${error.message}`)
    }
  }
}

/**
 * 批量上传图片
 */
export const uploadImages = async (files: File[]): Promise<ImageUploadResult[]> => {
  const formData = new FormData()
  files.forEach((file) => {
    formData.append('files', file)
  })

  const response = await axios.post(API_CONFIG.IMAGE_UPLOAD.BATCH, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  // 批量上传返回的是数组
  const result = response.data
  if (Array.isArray(result)) {
    return result as ImageUploadResult[]
  }

  // 如果数据结构不符合预期，抛出错误
  throw new Error('Invalid response format from batch upload API')
}

/**
 * 更新图片信息
 */
export const updateImage = async (
  id: string,
  data: ImageUpdateData
): Promise<ImageItem> => {
  const response = await axios.patch(API_CONFIG.IMAGES.UPDATE(id), data)
  return response as unknown as ImageItem
}

/**
 * 删除图片
 */
export const deleteImage = async (id: string): Promise<void> => {
  await axios.delete(API_CONFIG.IMAGES.DELETE(id))
}

/**
 * 批量删除图片
 */
export const deleteImages = async (ids: string[]): Promise<void> => {
  await axios.delete(API_CONFIG.IMAGES.BATCH_DELETE, {
    data: ids
  })
}

/**
 * 搜索图片
 */
export const searchImages = async (
  params: ImageSearchParams
): Promise<ImageListResponse> => {
  try {
    // 转换参数格式以匹配后端API
    const requestBody = {
      prompt: params.query,
      limit: params.limit || 20,
      match_threshold: params.threshold || 70
    }

    const response = await axios.post(API_CONFIG.IMAGES.SEARCH, requestBody)
    
    // 搜索API现在使用统一的StandardResponse格式：{status, message, data}
    const apiResponse = response as unknown as {
      status: string,
      message: string,
      data: {
        results: any[],
        total: number,
        query: string,
        match_threshold: number,
        limit: number
      }
    }

    // 调试信息（生产环境可移除）
    // eslint-disable-next-line no-console
    console.log('searchImages API response:', apiResponse)

    if (apiResponse.status !== 'success') {
      throw new Error(apiResponse.message || '搜索失败')
    }

    // 处理搜索结果，为每个图片生成预签名URL
    // 使用并发处理提高性能，但限制并发数量以避免过多API调用
    const processedImages: ImageItem[] = []
    
    // 分批处理以避免过多并发请求
    const batchSize = 10
    const results = apiResponse.data.results || []
    
    for (let i = 0; i < results.length; i += batchSize) {
      const batch = results.slice(i, i + batchSize)
      
      const batchPromises = batch.map(async (item) => {
        try {
          // 为每个搜索结果生成预签名URL
          const urlResponse = await getImageAccessUrl(item.id)
          
          // 转换为标准ImageItem格式
          return {
            id: item.id,
            original_filename: item.prompt || `image_${item.id}`,
            filename: item.prompt || `image_${item.id}`,
            file_size: item.file_size || 0,
            mime_type: item.mime_type || 'image/png',
            width: item.width,
            height: item.height,
            description: item.prompt,
            tags: item.tags || [],
            url: urlResponse.url, // 使用预签名URL
            thumbnail_url: urlResponse.url, // 缩略图也使用预签名URL
            created_at: item.created_at,
            updated_at: item.updated_at
          } as ImageItem
        } 
        catch (urlError) {
          // eslint-disable-next-line no-console
          console.warn(`获取图片 ${item.id} 预签名URL失败，使用原始URL:`, urlError)
          
          // 回退到原始URL (如果可用)
          return {
            id: item.id,
            original_filename: item.prompt || `image_${item.id}`,
            filename: item.prompt || `image_${item.id}`,
            file_size: item.file_size || 0,
            mime_type: item.mime_type || 'image/png',
            width: item.width,
            height: item.height,
            description: item.prompt,
            tags: item.tags || [],
            url: item.url || '', // 使用原始URL作为回退，如果没有则为空字符串
            thumbnail_url: item.url || '',
            created_at: item.created_at,
            updated_at: item.updated_at
          } as ImageItem
        }
      })
      
      const batchResults = await Promise.all(batchPromises)
      processedImages.push(...batchResults)
    }

    // 调试信息（生产环境可移除）
    // eslint-disable-next-line no-console
    console.log('Processed search results:', processedImages.length, 'images processed')

    return {
      images: processedImages,
      total: apiResponse.data.total || processedImages.length,
      page: 1,
      limit: params.limit || 20,
      total_pages: Math.ceil((apiResponse.data.total || processedImages.length) / (params.limit || 20))
    }
    
  }
  catch (error) {
    // eslint-disable-next-line no-console
    console.error('搜索图片失败:', error)
    throw error
  }
}

/**
 * 获取图片访问URL（预签名URL）
 */
export const getImageAccessUrl = async (id: string): Promise<{url: string}> => {
  try {
    const response = await axios.get(`/api/v1/images/${id}/url`)
    // axios拦截器返回response.data，response的结构是 {status, message, data}
    // 我们需要的URL在 response.data.url 中
    const apiResponse = response as unknown as {status: string, message: string, data: {url: string, image_id: string, storage_type: string}}
    
    // 调试信息（生产环境可移除）
    // eslint-disable-next-line no-console
    console.log('getImageAccessUrl API response:', apiResponse)
    // eslint-disable-next-line no-console
    console.log('Extracted URL:', apiResponse.data.url)
    
    if (!apiResponse.data?.url) {
      throw new Error('API返回的数据中没有URL字段')
    }
    
    return {
      url: apiResponse.data.url
    }
    
  }
  catch (error) {
    console.error('获取图片访问URL失败:', error)
    throw error
  }
}

/**
 * 获取图片标签
 */
export const getImageTags = async (imageId: string): Promise<ImageTagResponse> => {
  const response = await axios.get(API_CONFIG.IMAGE_TAGS.GET(imageId))
  const apiResponse = response as unknown as {status: string, message: string, data: ImageTagResponse}
  return apiResponse.data
}

/**
 * 添加图片标签
 */
export const addImageTags = async (imageId: string, tags: string[]): Promise<ImageTagResponse> => {
  const response = await axios.post(API_CONFIG.IMAGE_TAGS.ADD(imageId), { tags })
  const apiResponse = response as unknown as {status: string, message: string, data: ImageTagResponse}
  return apiResponse.data
}

/**
 * 更新图片标签
 */
export const updateImageTags = async (imageId: string, tags: string[]): Promise<ImageTagResponse> => {
  const response = await axios.put(API_CONFIG.IMAGE_TAGS.UPDATE(imageId), { tags })
  const apiResponse = response as unknown as {status: string, message: string, data: ImageTagResponse}
  return apiResponse.data
}

/**
 * 删除图片标签
 */
export const deleteImageTags = async (imageId: string, tags?: string[]): Promise<ImageTagResponse> => {
  const response = await axios.delete(API_CONFIG.IMAGE_TAGS.DELETE(imageId), {
    data: tags ? { tags } : undefined
  })
  const apiResponse = response as unknown as {status: string, message: string, data: ImageTagResponse}
  return apiResponse.data
}

/**
 * 删除特定图片标签
 */
export const deleteSpecificImageTag = async (imageId: string, tag: string): Promise<ImageTagResponse> => {
  const response = await axios.delete(API_CONFIG.IMAGE_TAGS.DELETE_SPECIFIC(imageId, tag))
  const apiResponse = response as unknown as {status: string, message: string, data: ImageTagResponse}
  return apiResponse.data
}

/**
 * 删除标签
 */
export const deleteTag = async (tagName: string): Promise<void> => {
  await axios.delete(API_CONFIG.TAGS.DELETE(tagName))
}

/**
 * 根据标签搜索图片
 */
export const searchImagesByTags = async (
  tags: string[],
  page: number = 1,
  limit: number = 20
): Promise<ImageListResponse> => {
  const response = await axios.post(API_CONFIG.IMAGE_TAGS.SEARCH_BY_TAGS, {
    tags,
    page,
    limit
  })
  const apiResponse = response as unknown as {status: string, message: string, data: {items: ImageItem[], total: number}}

  return {
    images: apiResponse.data.items,
    total: apiResponse.data.total,
    page: page,
    limit: limit,
    total_pages: Math.ceil(apiResponse.data.total / limit)
  }
}

/**
 * 获取所有标签
 */
export const getAllTags = async (
  query?: string,
  page: number = 1,
  limit: number = 20,
  sortBy: string = 'usage_count',
  sortOrder: string = 'desc'
): Promise<TagListResponse> => {
  const params = {
    query,
    page,
    limit,
    sort_by: sortBy,
    sort_order: sortOrder
  }

  const response = await axios.get(API_CONFIG.TAGS.LIST, { params })
  const apiResponse = response as unknown as {status: string, message: string, data: {items: TagItem[], total: number, page: number, limit: number, total_pages: number}}

  return {
    tags: apiResponse.data.items,
    total: apiResponse.data.total,
    page: apiResponse.data.page,
    limit: apiResponse.data.limit,
    total_pages: apiResponse.data.total_pages
  }
}

/**
 * 获取热门标签
 */
export const getPopularTags = async (limit: number = 10): Promise<PopularTagResponse> => {
  const response = await axios.get(API_CONFIG.TAGS.POPULAR, { params: { limit } })
  const apiResponse = response as unknown as {status: string, message: string, data: {tags: TagItem[], total: number, limit: number}}

  return {
    tags: apiResponse.data.tags,
    total: apiResponse.data.total,
    limit: apiResponse.data.limit
  }
}

/**
 * 搜索标签
 */
export const searchTags = async (query: string, limit: number = 10): Promise<{tags: TagItem[], total: number, query: string, limit: number}> => {
  const response = await axios.get(API_CONFIG.TAGS.SEARCH, { params: { query, limit } })
  const apiResponse = response as unknown as {status: string, message: string, data: {tags: TagItem[], total: number, query: string, limit: number}}

  return apiResponse.data
}

/**
 * 创建标签
 */
export const createTag = async (name: string, description?: string): Promise<TagItem> => {
  const response = await axios.post(API_CONFIG.TAGS.CREATE, { name, description })
  const apiResponse = response as unknown as {status: string, message: string, data: {tag: TagItem}}
  return apiResponse.data.tag
}

/**
 * 获取标签列表（简化版本，返回标签名称数组）
 */
export const getTags = async (): Promise<string[]> => {
  try {
    const response = await getAllTags()
    return response.tags.map(tag => tag.name)
  }
  catch (error) {
    console.error('获取标签列表失败:', error)
    return []
  }
}

/**
 * 批量操作图片标签
 */
export interface BatchImageTagOperation {
  image_ids: string[]
  tags: string[]
  operation: 'add' | 'remove' | 'replace'
}

export interface BatchImageTagResult {
  success_count: number
  failed_count: number
  results: Array<{
    image_id: string
    operation: string
    result: any
  }>
  errors: Array<{
    image_id: string
    error: string
  }>
}

export const batchOperateImageTags = async (batchData: BatchImageTagOperation): Promise<BatchImageTagResult> => {
  const response = await axios.post(API_CONFIG.IMAGE_TAGS.BATCH_OPERATE, batchData)
  const apiResponse = response as unknown as {status: string, message: string, data: BatchImageTagResult}
  return apiResponse.data
}
