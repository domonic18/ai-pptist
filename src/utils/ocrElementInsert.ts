/**
 * OCR元素插入工具
 * 用于将识别到的文字和装饰元素插入到PPT中
 */

import { storeToRefs } from "pinia";
import { useMainStore, useSlidesStore } from "@/store";
import type {
  PPTElement,
  PPTImageElement,
  PPTTextElement,
} from "@/types/slides";
import type { BoundingBox, ImageRegion } from "@/types/imageEditing";
import {
  convertMinerUBBoxToElementRect,
  type CoordTransformConfig,
} from "@/utils/coordinateConverter";

/**
 * 文字区域格式
 */
export interface TextRegion {
  id: string;
  text: string;
  bbox: BoundingBox;
  confidence: number;
  font: {
    size: number;
    family: string;
    weight: "normal" | "bold";
    color: string;
    align?: "left" | "center" | "right";
  };
}

/**
 * 图片信息来源
 */
export interface ImageSourceInfo {
  cosKey: string;
  source: "selected" | "background";
  objectFit?: "cover" | "contain";
  metadata?: {
    image_width?: number;
    image_height?: number;
  };
}

/**
 * 获取当前幻灯片ID
 */
export function getSlideId(): string {
  const slidesStore = useSlidesStore();
  return slidesStore.currentSlide?.id || "";
}

/**
 * 获取当前选中的图片元素的COS Key
 * 如果没有选中图片，则获取背景图片的COS Key
 */
export function getImageCOSKeyForOCR(): {
  cosKey: string;
  source: "selected" | "background";
} | null {
  const mainStore = useMainStore();
  const slidesStore = useSlidesStore();
  const { handleElementId } = storeToRefs(mainStore);
  const currentSlide = slidesStore.currentSlide;

  if (!currentSlide) {
    return null;
  }

  // 优先检查选中的元素是否是图片
  if (handleElementId.value) {
    const selectedElement = currentSlide.elements.find(
      (el) => el.id === handleElementId.value,
    );
    if (selectedElement?.type === "image") {
      const cosKey = (selectedElement as PPTImageElement).imageInfo?.cosKey;
      if (cosKey) {
        return { cosKey, source: "selected" };
      }
    }
  }

  // 检查幻灯片背景是否是图片
  if (currentSlide.background?.type === "image") {
    const cosKey = currentSlide.background.image?.imageInfo?.cosKey;
    if (cosKey) {
      return { cosKey, source: "background" };
    }
  }

  return null;
}

/**
 * 检查是否有可用于OCR的图片
 */
export function hasImageForOCR(): boolean {
  return getImageCOSKeyForOCR() !== null;
}

/**
 * 创建文字元素
 */
function createTextElement(
  region: TextRegion,
  position: { left: number; top: number; width: number; height: number },
): PPTTextElement {
  // 构建带样式的HTML内容
  const fontWeight = region.font.weight === "bold" ? "bold" : "normal";
  const fontSize = Math.round(region.font.size);
  const textAlign = region.font.align || "left";

  const content = `<p style="margin: 0; font-family: ${region.font.family}; font-size: ${fontSize}px; color: ${region.font.color}; font-weight: ${fontWeight}; text-align: ${textAlign};">${region.text}</p>`;

  return {
    type: "text",
    id: region.id,
    left: position.left,
    top: position.top,
    width: position.width,
    height: position.height,
    rotate: 0,
    lock: false,
    defaultFontName: region.font.family,
    defaultColor: region.font.color,
    // 不设置 fill 属性，让背景保持透明
    // fill: region.font.color,  // ❌ fill 是背景色，不是文字颜色
    vertical: false,
    content: content,
    lineHeight: 1.5,
    outline: {
      width: 0,
      color: region.font.color,
    },
    // 不设置 shadow，避免文字阴影效果
    // shadow: undefined,
  };
}

/**
 * 创建装饰元素（图片）
 */
function createImageElement(
  region: {
    id: string;
    bbox: BoundingBox;
    cos_key?: string;
    img_path?: string;
  },
  position: { left: number; top: number; width: number; height: number },
  sourceInfo: ImageSourceInfo,
): PPTImageElement {
  const cosKey = region.cos_key || sourceInfo.cosKey;

  return {
    type: "image",
    id: region.id,
    left: position.left,
    top: position.top,
    width: position.width,
    height: position.height,
    rotate: 0,
    lock: false,
    src: cosKey,
    fixedRatio: false,
    flipH: false,
    flipV: false,
    // 装饰图片不需要阴影和边框
    // shadow: undefined,
    // outline: undefined,
    imageInfo: {
      id: cosKey,
      cosKey: cosKey,
    },
  };
}

/**
 * 获取坐标转换配置
 */
function getCoordTransformConfig(
  sourceInfo: ImageSourceInfo,
): CoordTransformConfig {
  const slidesStore = useSlidesStore();
  const currentSlide = slidesStore.currentSlide;

  if (!currentSlide) {
    return {
      imageSize: { width: 1920, height: 1080 },
      viewportSize: 1000,
      viewportRatio: 0.5625,
    };
  }

  let imageWidth = 1920;
  let imageHeight = 1080;

  // 优先使用metadata中的图片尺寸（这是OCR识别时的真实图片尺寸）
  if (sourceInfo.metadata?.image_width && sourceInfo.metadata?.image_height) {
    imageWidth = sourceInfo.metadata.image_width;
    imageHeight = sourceInfo.metadata.image_height;
    console.log('[图片尺寸] 使用metadata中的真实尺寸:', { imageWidth, imageHeight });
  } else if (sourceInfo.source === "selected") {
    // 如果没有metadata，尝试从选中的图片元素获取（注意：这可能不是原始尺寸）
    const mainStore = useMainStore();
    const { handleElementId } = storeToRefs(mainStore);

    if (handleElementId.value) {
      const selectedElement = currentSlide.elements.find(
        (el) => el.id === handleElementId.value,
      );
      if (selectedElement?.type === "image") {
        // 注意：这里获取的是元素在画布上的尺寸，可能不是原始图片尺寸
        // 但作为fallback仍然有用
        imageWidth = selectedElement.width || 1920;
        imageHeight = selectedElement.height || 1080;
        console.warn('[图片尺寸] 使用元素尺寸（可能不准确）:', { imageWidth, imageHeight });
      }
    }
  } else if (
    sourceInfo.source === "background" &&
    currentSlide.background?.type === "image"
  ) {
    // 背景图片尺寸使用默认值
    imageWidth = 1920;
    imageHeight = 1080;
    console.warn('[图片尺寸] 使用默认值:', { imageWidth, imageHeight });
  }

  // 从 slides store 获取 viewportSize
  const viewportSize = (slidesStore as any).viewportSize || 1000;
  const viewportRatio = (slidesStore as any).viewportRatio || 0.5625;

  console.log('[坐标转换配置]', {
    imageSize: { width: imageWidth, height: imageHeight },
    viewportSize,
    viewportRatio,
    objectFit: sourceInfo.objectFit || 'cover'
  });

  return {
    imageSize: { width: imageWidth, height: imageHeight },
    viewportSize: viewportSize,
    viewportRatio: viewportRatio,
  };
}

/**
 * 将OCR识别到的文字区域插入到幻灯片作为可编辑文本
 */
export function insertOCRElementsAsEditable(
  regions: TextRegion[],
  taskId: string,
  sourceInfo: ImageSourceInfo,
): void {
  const slidesStore = useSlidesStore();
  const currentSlide = slidesStore.currentSlide;

  if (!currentSlide) {
    console.error("No current slide found");
    return;
  }

  const config = getCoordTransformConfig(sourceInfo);

  const newElements: PPTElement[] = regions.map((region) => {
    // 关键修复：不应用文本盒模型补偿（applyTextBoxModel = false）
    // 因为OCR识别的bbox已经是文字区域的精确边界，不需要补偿
    const position = convertMinerUBBoxToElementRect(
      [
        region.bbox.x,
        region.bbox.y,
        region.bbox.x + region.bbox.width,
        region.bbox.y + region.bbox.height,
      ],
      config,
      false, // 禁用文本盒模型补偿
    );

    // 调试日志：记录坐标转换过程
    console.log('[OCR坐标转换]', {
      originalBBox: region.bbox,
      imageSize: config.imageSize,
      viewportSize: config.viewportSize,
      viewportRatio: config.viewportRatio,
      objectFit: sourceInfo.objectFit || 'cover',
      convertedPosition: position,
      text: region.text.substring(0, 20) // 只记录前20个字符
    });

    return createTextElement(region, position);
  });

  slidesStore.addElement(newElements);
}

/**
 * 插入装饰元素（图片）
 */
export function insertImageElements(
  regions: ImageRegion[],
  sourceInfo: ImageSourceInfo,
): void {
  console.log('[insertImageElements] 开始处理装饰元素', {
    regionsCount: regions.length,
    sourceInfo
  });

  const slidesStore = useSlidesStore();
  const currentSlide = slidesStore.currentSlide;

  if (!currentSlide) {
    console.error("No current slide found");
    return;
  }

  const config = getCoordTransformConfig(sourceInfo);

  const newElements: PPTElement[] = regions.map((region, index) => {
    // 装饰元素也不需要文本盒模型补偿
    const position = convertMinerUBBoxToElementRect(
      [
        region.bbox.x,
        region.bbox.y,
        region.bbox.x + region.bbox.width,
        region.bbox.y + region.bbox.height,
      ],
      config,
      false, // 禁用文本盒模型补偿
    );

    const imageElement = createImageElement(region, position, sourceInfo);

    console.log(`[装饰元素 ${index + 1}/${regions.length}]`, {
      id: region.id,
      type: region.type,
      bbox: region.bbox,
      cos_key: region.cos_key,
      img_path: region.img_path,
      position,
      elementSrc: imageElement.src
    });

    return imageElement;
  });

  console.log('[insertImageElements] 准备添加', newElements.length, '个装饰元素到幻灯片');
  slidesStore.addElement(newElements);
  console.log('[insertImageElements] 装饰元素添加完成');
}

/**
 * 批量插入OCR识别结果（文字 + 装饰元素）
 */
export function insertOCRResults(
  textRegions: TextRegion[],
  imageRegions: ImageRegion[],
  taskId: string,
  sourceInfo: ImageSourceInfo,
): void {
  if (textRegions.length > 0) {
    insertOCRElementsAsEditable(textRegions, taskId, sourceInfo);
  }

  if (imageRegions.length > 0) {
    insertImageElements(imageRegions, sourceInfo);
  }
}

export default {
  getSlideId,
  getImageCOSKeyForOCR,
  hasImageForOCR,
  insertOCRElementsAsEditable,
  insertImageElements,
  insertOCRResults,
};
