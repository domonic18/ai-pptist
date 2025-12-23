<template>
  <div class="aippt-dialog">
    <div class="header">
      <span class="title">AIPPT</span>
      <span class="subtite" v-if="step === 'template'">从下方挑选合适的模板生成PPT，或<span class="local" v-tooltip="'上传.pptist格式模板文件'" @click="uploadLocalTemplate()">使用本地模板生成</span></span>
      <span class="subtite" v-else-if="step === 'outline'">确认下方内容大纲（点击编辑内容，右键添加/删除大纲项），开始选择模板</span>
      <span class="subtite" v-else>在下方输入您的PPT主题，并适当补充信息，如行业、岗位、学科、用途等</span>
    </div>
    
    <template v-if="step === 'setup'">
      <Input class="input" 
        ref="inputRef"
        v-model:value="keyword" 
        :maxlength="50" 
        placeholder="请输入PPT主题，如：大学生职业生涯规划" 
        @enter="createOutline()"
      >
        <template #suffix>
          <span class="count">{{ keyword.length }} / 50</span>
          <div class="submit" type="primary" @click="createOutline()"><IconSend class="icon" /> AI 生成</div>
        </template>
      </Input>
      <div class="recommends">
        <div class="recommend" v-for="(item, index) in recommends" :key="index" @click="setKeyword(item)">{{ item }}</div>
      </div>
      <div class="configs">
        <div class="config-item">
          <div class="label">语言：</div>
          <Select
            class="config-content"
            style="width: 80px;"
            v-model:value="language"
            :options="[
              { label: '中文', value: '中文' },
              { label: '英文', value: 'English' },
              { label: '日文', value: '日本語' },
            ]"
          />
        </div>
        <div class="config-item">
          <div class="label">风格：</div>
          <Select
            class="config-content"
            style="width: 80px;"
            v-model:value="style"
            :options="[
              { label: '通用', value: '通用' },
              { label: '学术风', value: '学术风' },
              { label: '职场风', value: '职场风' },
              { label: '教育风', value: '教育风' },
              { label: '营销风', value: '营销风' },
            ]"
          />
        </div>
        <div class="config-item">
          <div class="label">页数：</div>
          <Select
            class="config-content"
            style="width: 80px;"
            v-model:value="slideCount"
            :options="[
              { label: '5页', value: 5 },
              { label: '8页', value: 8 },
              { label: '10页', value: 10 },
              { label: '15页', value: 15 },
              { label: '20页', value: 20 },
              { label: '25页', value: 25 },
            ]"
          />
        </div>
        <div class="config-item">
          <div class="label">模型：</div>
          <Select
            class="config-content"
            style="width: 190px;"
            v-model:value="model"
            :options="modelOptions"
            :loading="modelsLoading"
            placeholder="选择AI模型"
          />
        </div>
        <div class="config-item">
          <div class="label">配图：</div>
          <Select
            class="config-content"
            style="width: 100px;"
            v-model:value="img"
            :options="[
              { label: '无', value: '' },
              { label: '模拟测试', value: 'test' },
              { label: 'AI搜图', value: 'ai-search', disabled: true },
              { label: 'AI生图', value: 'ai-create', disabled: true },
            ]"
          />
        </div>
      </div>
    </template>
    <div class="preview" v-if="step === 'outline'">
      <pre ref="outlineRef" v-if="outlineCreating">{{ outline }}</pre>
       <div class="outline-view" v-else>
         <OutlineEditor v-model:value="outline" />
       </div>
      <div class="btns" v-if="!outlineCreating">
        <Button class="btn banana-btn" @click="openBananaTemplateSelector">
          <span class="banana-icon">🍌</span>
          香蕉生成
        </Button>
        <Button class="btn" type="primary" @click="step = 'template'">选择模板</Button>
        <Button class="btn" @click="outline = ''; step = 'setup'">返回重新生成</Button>
      </div>
    </div>
    <div class="select-template" v-if="step === 'template'">
      <div class="templates">
        <div class="template" 
          :class="{ 'selected': selectedTemplate === template.id }" 
          v-for="template in templates" 
          :key="template.id" 
          @click="selectedTemplate = template.id"
        >
          <img :src="template.cover" :alt="template.name">
        </div>
      </div>
      <div class="btns">
        <Button class="btn" type="primary" @click="createPPT()">生成</Button>
        <Button class="btn" @click="step = 'outline'">返回大纲</Button>
      </div>
    </div>

    <FullscreenSpin :loading="loading" tip="AI生成中，请耐心等待 ..." />

    <!-- 香蕉模板选择对话框 -->
    <BananaTemplateSelector
      :visible="showBananaTemplateSelector"
      @update:visible="showBananaTemplateSelector = $event"
      @close="showBananaTemplateSelector = false"
      @confirm="handleBananaTemplateConfirm"
    />

    <!-- 生成进度对话框 -->
    <BananaProgressDialog
      v-if="showProgressDialog"
      :visible="showProgressDialog"
      :status-data="generationStatus"
      @close="handleProgressDialogClose"
      @stop="handleStopGeneration"
      @retry="handleRegenerateSlide"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, useTemplateRef } from 'vue'
import { storeToRefs } from 'pinia'
import useOutlineGeneration from '@/hooks/useOutlineGeneration'
import usePPTCreation from '@/hooks/usePPTCreation'
import type { Slide, SlideTheme } from '@/types/slides'
import message from '@/utils/message'
import { decrypt } from '@/utils/crypto'
import { useMainStore, useSlidesStore } from '@/store'
import Input from '@/components/Input.vue'
import Button from '@/components/Button.vue'
import Select from '@/components/Select.vue'
import FullscreenSpin from '@/components/FullscreenSpin.vue'
import OutlineEditor from '@/components/OutlineEditor.vue'
import BananaTemplateSelector from '@/components/BananaTemplateSelector.vue'
import BananaProgressDialog from '@/components/BananaProgressDialog.vue'
import apiService from '@/services'
import useBananaGeneration from '@/hooks/useBananaGeneration'
import { parseOutlineFromMarkdown, validateOutlineData } from '@/utils/outlineParser'
import type { OutlineData } from '@/types/banana-generation'

const mainStore = useMainStore()
const slideStore = useSlidesStore()
const { templates } = storeToRefs(slideStore)

const language = ref('中文')
const style = ref('通用')
const img = ref('')
const keyword = ref('')
const selectedTemplate = ref('template_1')
const step = ref<'setup' | 'outline' | 'template'>('setup')
const model = ref('')
const slideCount = ref(8)
const outlineRef = useTemplateRef<HTMLElement>('outlineRef')
const inputRef = useTemplateRef<InstanceType<typeof Input>>('inputRef')
const modelOptions = ref<Array<{ label: string; value: string }>>([])
const modelsLoading = ref(false)

const {
  outline,
  outlineCreating,
  createOutline: generateOutline
} = useOutlineGeneration()

const {
  createPPT: generatePPT
} = usePPTCreation()

const {
  startGeneration,
  stopGeneration,
  regenerateSlide,
  getCurrentStatus,
  isGenerating,
} = useBananaGeneration()

const loading = ref(false)
const showBananaTemplateSelector = ref(false)
const showProgressDialog = ref(false)
const generationStatus = ref<any>(null)
const imageGenerationModel = ref('')
const imageModelOptions = ref<Array<{ label: string; value: string }>>([])

// 获取AI模型列表
const fetchAIModels = async () => {
  modelsLoading.value = true
  try {
    const models = await apiService.getAIModels('chat')

    // 过滤启用的对话模型并转换为选项格式
    modelOptions.value = models
      .filter(m => m.is_enabled)
      .map(m => ({
        label: m.name,
        value: m.id
      }))

    // 设置默认模型 - 优先选择标记为默认的对话模型，否则选择第一个对话模型
    const defaultModel = models.find((m: any) => m.is_default && m.is_enabled)
    if (defaultModel) {
      model.value = defaultModel.id
    }
    else if (modelOptions.value.length > 0) {
      model.value = modelOptions.value[0].value
    }
  }
  catch (error) {
    console.error('Failed to fetch AI models:', error)
    message.error('获取AI模型列表失败，使用默认模型')

    // 使用回退的默认模型
    modelOptions.value = [
      { label: 'GLM-4.5-Air', value: 'GLM-4.5-Air' },
      { label: 'GLM-4.5-Flash', value: 'GLM-4.5-Flash' }
    ]
    model.value = 'GLM-4.5-Air'
  }
  finally {
    modelsLoading.value = false
  }
}

// 获取图片生成模型列表
const fetchImageGenerationModels = async () => {
  try {
    const models = await apiService.getImageGenerationModels()

    // 过滤启用的图片生成模型并转换为选项格式
    imageModelOptions.value = models
      .filter(m => m.is_enabled)
      .map(m => ({
        label: m.name,
        value: m.id
      }))

    // 设置默认模型
    const defaultModel = models.find((m: any) => m.is_default && m.is_enabled)
    if (defaultModel) {
      imageGenerationModel.value = defaultModel.id
    }
    else if (imageModelOptions.value.length > 0) {
      imageGenerationModel.value = imageModelOptions.value[0].value
    }
  }
  catch (error) {
    console.error('Failed to fetch image generation models:', error)
    message.error('获取图片生成模型列表失败')
  }
}

// 组件挂载时获取模型列表
onMounted(() => {
  fetchAIModels()
  fetchImageGenerationModels()
})

const recommends = ref([
  '2025科技前沿动态',
  '大数据如何改变世界',
  '餐饮市场调查与研究',
  'AIGC在教育领域的应用',
  '社交媒体与品牌营销',
  '5G技术如何改变我们的生活',
  '年度工作总结与展望',
  '区块链技术及其应用',
  '大学生职业生涯规划',
  '公司年会策划方案',
]) 

onMounted(() => {
  setTimeout(() => {
    inputRef.value!.focus()
  }, 500)
})

const setKeyword = (value: string) => {
  keyword.value = value
  inputRef.value!.focus()
}

const createOutline = async () => {
  if (!keyword.value) return message.error('请先输入PPT主题')

  loading.value = true

  const success = await generateOutline({
    title: keyword.value,
    input_content: keyword.value,
    language: language.value,
    slide_count: slideCount.value,
    ai_model_id: model.value
  })

  loading.value = false

  if (success) {
    step.value = 'outline'
  }
}

const createPPT = async (template?: { slides: Slide[], theme: SlideTheme, width?: number, height?: number }) => {
  loading.value = true

  const success = await generatePPT({
    content: outline.value,
    language: language.value,
    style: style.value,
    model: model.value,
  }, selectedTemplate.value, img.value, template)

  loading.value = false

  if (success) {
    mainStore.setAIPPTDialogState(false)
  }
}

const uploadLocalTemplate = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.pptist'
  input.click()
  input.addEventListener('change', e => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.addEventListener('load', () => {
        try {
          const { slides, theme, width, height } = JSON.parse(decrypt(reader.result as string))
          createPPT({ slides, theme, width, height })
        }
        catch {
          message.error('上传的模板文件数据异常，请重新上传或使用预置模板')
        }
      })
      reader.readAsText(file)
    }
  })
}

// 打开香蕉模板选择对话框
const openBananaTemplateSelector = () => {
  if (!outline.value) {
    message.warning('请先生成大纲')
    return
  }

  // 解析大纲
  const outlineData = parseOutlineFromMarkdown(outline.value)
  if (!outlineData || !validateOutlineData(outlineData)) {
    message.error('大纲格式不正确，无法使用香蕉生成')
    return
  }

  if (!imageGenerationModel.value) {
    message.warning('请先配置图片生成模型')
    return
  }

  showBananaTemplateSelector.value = true
}

// 处理香蕉模板确认
const handleBananaTemplateConfirm = async (templateId: string, modelId: string) => {
  showBananaTemplateSelector.value = false

  // 解析大纲
  const outlineData = parseOutlineFromMarkdown(outline.value)
  if (!outlineData || !validateOutlineData(outlineData)) {
    message.error('大纲格式不正确')
    return
  }

  // 开始生成
  const success = await startGeneration({
    outline: outlineData,
    templateId,
    generationModel: modelId,
    canvasSize: {
      width: Math.round(slideStore.viewportSize),
      height: Math.round(slideStore.viewportSize * slideStore.viewportRatio),
    },
  })

  if (success) {
    // 显示进度对话框
    showProgressDialog.value = true
    // 开始轮询状态（用于进度对话框）
    pollGenerationStatusForDialog()
  }
}

// 轮询生成状态（用于进度对话框）
const pollGenerationStatusForDialog = async () => {
  if (!showProgressDialog.value) {
    return
  }

  try {
    const status = await getCurrentStatus()
    if (status) {
      generationStatus.value = status

      // 如果还在生成中，继续轮询
      if (status.status === 'processing' || status.status === 'pending') {
        setTimeout(() => {
          pollGenerationStatusForDialog()
        }, 2000)
      }
    }
  } catch (error) {
    console.error('轮询生成状态失败:', error)
    // 继续重试
    setTimeout(() => {
      pollGenerationStatusForDialog()
    }, 2000)
  }
}

// 处理进度对话框关闭
const handleProgressDialogClose = () => {
  showProgressDialog.value = false
  generationStatus.value = null
}

// 处理停止生成
const handleStopGeneration = async () => {
  await stopGeneration()
  showProgressDialog.value = false
  generationStatus.value = null
}

// 处理重新生成单页
const handleRegenerateSlide = async (slideIndex: number) => {
  await regenerateSlide(slideIndex)
  // 重新开始轮询
  pollGenerationStatusForDialog()
}
</script>

<style lang="scss" scoped>
.aippt-dialog {
  margin: -20px;
  padding: 30px;
}
.header {
  margin-bottom: 12px;

  .title {
    font-weight: 700;
    font-size: 20px;
    margin-right: 8px;
    background: linear-gradient(270deg, #d897fd, #33bcfc);
    background-clip: text;
    color: transparent;
    vertical-align: text-bottom;
    line-height: 1.1;
  }
  .subtite {
    color: #888;
    font-size: 12px;

    .local {
      color: $themeColor;
      text-decoration: underline;
      cursor: pointer;
    }
  }
}
.preview {
  pre {
    max-height: 450px;
    padding: 10px;
    margin-bottom: 15px;
    background-color: #f1f1f1;
    overflow: auto;
  }
  .outline-view {
    max-height: 450px;
    padding: 10px;
    margin-bottom: 15px;
    background-color: #f1f1f1;
    overflow: auto;
  }
  .btns {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;

    .btn {
      width: 120px;
      margin: 0 5px;

      &.banana-btn {
        background: linear-gradient(135deg, #ffd700, #ffa500);
        color: #333;
        border: none;
        font-weight: 500;

        &:hover {
          background: linear-gradient(135deg, #ffed4e, #ffb347);
        }

        .banana-icon {
          font-size: 16px;
          margin-right: 4px;
        }
      }
    }
  }
}
.select-template {
  .templates {
    display: flex;
    margin-bottom: 10px;
    @include flex-grid-layout();
  
    .template {
      border: 2px solid $borderColor;
      border-radius: $borderRadius;
      width: 324px;
      height: 184px;
      margin-bottom: 12px;

      &:not(:nth-child(2n)) {
        margin-right: 12px;
      }

      &.selected {
        border-color: $themeColor;
      }
  
      img {
        width: 100%;
      }
    }
  }
  .btns {
    display: flex;
    justify-content: center;
    align-items: center;

    .btn {
      width: 120px;
      margin: 0 5px;
    }
  }
}
.recommends {
  display: flex;
  flex-wrap: wrap;
  margin-top: 10px;

  .recommend {
    font-size: 12px;
    background-color: #f1f1f1;
    border-radius: $borderRadius;
    padding: 3px 5px;
    margin-right: 5px;
    margin-top: 5px;
    cursor: pointer;

    &:hover {
      color: $themeColor;
    }
  }
}
.configs {
  margin-top: 15px;
  display: flex;
  justify-content: space-between;
  gap: 15px;

  .config-item {
    font-size: 13px;
    display: flex;
    align-items: center;
    flex: 1;
    min-width: 0;

    .label {
      flex-shrink: 0;
      margin-right: 8px;
      white-space: nowrap;
    }

    .config-content {
      flex: 1;
      min-width: 0;
    }
  }
}
.count {
  font-size: 12px;
  color: #999;
  margin-right: 10px;
}
.submit {
  height: 20px;
  font-size: 12px;
  background-color: $themeColor;
  color: #fff;
  display: flex;
  align-items: center;
  padding: 0 8px 0 6px;
  border-radius: $borderRadius;
  cursor: pointer;

  &:hover {
    background-color: $themeHoverColor;
  }

  .icon {
    font-size: 15px;
    margin-right: 3px;
  }
}

@media screen and (width <= 800px) {
  .configs {
    margin-top: 15px;
    display: flex;
    flex-direction: column;
    gap: 8px;

    .config-item {
      margin-top: 0;

      .label {
        flex-shrink: 0;
        margin-right: 8px;
      }

      .config-content {
        width: 100% !important;
      }
    }
  }
  .select-template {
    .templates {
      max-height: 450px;
      display: block;
      overflow: auto;
    
      .template {
        width: 100%;
        height: unset;
        margin-bottom: 0 !important;
        margin-right: 0 !important;

        & + .template {
          margin-top: 20px;
        }
      }
    }
  }
}
</style>