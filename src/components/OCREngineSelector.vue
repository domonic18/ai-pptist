<template>
  <Modal
    :visible="visible"
    @update:visible="emit('update:visible', $event)"
    :width="500"
    title="选择识别引擎"
    @close="handleClose"
  >
    <div class="ocr-engine-selector">
      <div class="description">
        选择不同的OCR识别引擎，以适应不同的使用场景：
      </div>

      <div class="engine-list">
        <div
          class="engine-item"
          :class="{ active: selectedEngine === 'mineru' }"
          @click="selectedEngine = 'mineru'"
        >
          <div class="engine-header">
            <div class="engine-name">
              <IconMagic class="icon" />
              MinerU
              <span class="badge">推荐</span>
            </div>
            <div
              class="radio"
              :class="{ checked: selectedEngine === 'mineru' }"
            >
              <div class="radio-dot" v-if="selectedEngine === 'mineru'"></div>
            </div>
          </div>
          <div class="engine-desc">
            高精度文档识别引擎，提供精确的文字坐标和装饰元素识别。
            适合处理复杂布局的文档和图片。
          </div>
          <div class="engine-features">
            <span class="feature">✓ 精确坐标</span>
            <span class="feature">✓ 装饰元素识别</span>
            <span class="feature">✓ 多模态样式</span>
          </div>
        </div>

        <div
          class="engine-item"
          :class="{ active: selectedEngine === 'hybrid_ocr' }"
          @click="selectedEngine = 'hybrid_ocr'"
        >
          <div class="engine-header">
            <div class="engine-name">
              <IconFontSize class="icon" />
              混合OCR
            </div>
            <div
              class="radio"
              :class="{ checked: selectedEngine === 'hybrid_ocr' }"
            >
              <div
                class="radio-dot"
                v-if="selectedEngine === 'hybrid_ocr'"
              ></div>
            </div>
          </div>
          <div class="engine-desc">
            结合传统OCR和多模态大模型的混合识别方案。 适合处理一般文档和图片。
          </div>
          <div class="engine-features">
            <span class="feature">✓ 传统OCR精确度</span>
            <span class="feature">✓ 多模态样式</span>
          </div>
        </div>
      </div>

      <!-- MinerU高级选项 -->
      <div class="advanced-options" v-if="selectedEngine === 'mineru'">
        <div class="options-title">MinerU 高级选项</div>
        <div class="option-item">
          <Checkbox v-model:value="options.enable_formula">识别公式</Checkbox>
        </div>
        <div class="option-item">
          <Checkbox v-model:value="options.enable_table">识别表格</Checkbox>
        </div>
        <div class="option-item">
          <Checkbox v-model:value="options.enable_style"
            >启用样式识别（多模态）</Checkbox
          >
        </div>
      </div>

      <!-- 通用选项 -->
      <div class="advanced-options">
        <div class="options-title">通用选项</div>
        <div class="option-item">
          <Checkbox v-model:value="options.remove_text"
            >去除文字后创建新图片</Checkbox
          >
        </div>
      </div>

      <div class="footer">
        <Button type="primary" @click="handleConfirm" :loading="loading">
          开始识别
        </Button>
        <Button @click="handleClose">取消</Button>
      </div>
    </div>
  </Modal>
</template>

<script lang="ts" setup>
import { ref, watch } from "vue";
import Modal from "./Modal.vue";
import Button from "./Button.vue";
import Checkbox from "./Checkbox.vue";

interface OCROptions {
  enable_formula: boolean;
  enable_table: boolean;
  enable_style: boolean;
  remove_text: boolean;
}

interface Props {
  visible: boolean;
  loading?: boolean;
  defaultEngine?: "mineru" | "hybrid_ocr";
}

interface Emits {
  (e: "update:visible", value: boolean): void;
  (e: "confirm", engine: "mineru" | "hybrid_ocr", options: OCROptions): void;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  defaultEngine: "mineru",
});

const emit = defineEmits<Emits>();

const selectedEngine = ref<"mineru" | "hybrid_ocr">(props.defaultEngine);
const options = ref<OCROptions>({
  enable_formula: true,
  enable_table: true,
  enable_style: true,
  remove_text: false,
});

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      selectedEngine.value = props.defaultEngine;
    }
  },
);

const handleClose = () => {
  emit("update:visible", false);
};

const handleConfirm = () => {
  emit("confirm", selectedEngine.value, options.value);
};
</script>

<style lang="scss" scoped>
.ocr-engine-selector {
  padding: 20px;

  .description {
    color: #666;
    font-size: 14px;
    margin-bottom: 16px;
  }

  .engine-list {
    .engine-item {
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 12px;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        border-color: #1890ff;
        background-color: #f0f7ff;
      }

      &.active {
        border-color: #1890ff;
        background-color: #e6f7ff;
      }

      .engine-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;

        .engine-name {
          display: flex;
          align-items: center;
          font-weight: 600;
          font-size: 16px;
          color: #333;

          .icon {
            margin-right: 8px;
            font-size: 18px;
          }

          .badge {
            margin-left: 8px;
            padding: 2px 8px;
            background-color: #ff4d4f;
            color: white;
            font-size: 12px;
            border-radius: 10px;
          }
        }

        .radio {
          width: 18px;
          height: 18px;
          border: 2px solid #d0d0d0;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;

          &.checked {
            border-color: #1890ff;

            .radio-dot {
              width: 8px;
              height: 8px;
              background-color: #1890ff;
              border-radius: 50%;
            }
          }
        }
      }

      .engine-desc {
        color: #666;
        font-size: 14px;
        line-height: 1.5;
        margin-bottom: 8px;
      }

      .engine-features {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;

        .feature {
          padding: 4px 8px;
          background-color: #f0f0f0;
          border-radius: 4px;
          font-size: 12px;
          color: #666;
        }
      }
    }
  }

  .advanced-options {
    margin-top: 16px;
    padding: 12px;
    background-color: #f5f5f5;
    border-radius: 6px;

    .options-title {
      font-weight: 600;
      font-size: 14px;
      color: #333;
      margin-bottom: 8px;
    }

    .option-item {
      padding: 6px 0;
    }
  }

  .footer {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
}
</style>
