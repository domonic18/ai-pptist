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
import type { BoundingBox } from "@/types/imageEditing";
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
    shadow: {
      h: 0,
      v: 0,
      blur: 10,
      color: "#000",
    },
    outline: {
      width: 0,
      color: "#fff",
    },
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

  if (sourceInfo.source === "selected") {
    const mainStore = useMainStore();
    const { handleElementId } = storeToRefs(mainStore);

    if (handleElementId.value) {
      const selectedElement = currentSlide.elements.find(
        (el) => el.id === handleElementId.value,
      );
      if (selectedElement?.type === "image") {
        imageWidth = selectedElement.width || 1920;
        imageHeight = selectedElement.height || 1080;
      }
    }
  } else if (
    sourceInfo.source === "background" &&
    currentSlide.background?.type === "image"
  ) {
    // 背景图片尺寸可能需要从图片本身获取，这里使用默认值
    imageWidth = 1920;
    imageHeight = 1080;
  }

  // 从 slides store 获取 viewportSize
  const viewportSize = (slidesStore as any).viewportSize || 1000;
  const viewportRatio = (slidesStore as any).viewportRatio || 0.5625;

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
    const position = convertMinerUBBoxToElementRect(
      [
        region.bbox.x,
        region.bbox.y,
        region.bbox.x + region.bbox.width,
        region.bbox.y + region.bbox.height,
      ],
      config,
    );

    return createTextElement(region, position);
  });

  slidesStore.addElement(newElements);
}

/**
 * 插入装饰元素（图片）
 */
export function insertImageElements(
  regions: Array<{
    id: string;
    bbox: BoundingBox;
    cos_key?: string;
    img_path?: string;
  }>,
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
    const position = convertMinerUBBoxToElementRect(
      [
        region.bbox.x,
        region.bbox.y,
        region.bbox.x + region.bbox.width,
        region.bbox.y + region.bbox.height,
      ],
      config,
    );

    return createImageElement(region, position, sourceInfo);
  });

  slidesStore.addElement(newElements);
}

/**
 * 批量插入OCR识别结果（文字 + 装饰元素）
 */
export function insertOCRResults(
  textRegions: TextRegion[],
  imageRegions: Array<{
    id: string;
    bbox: BoundingBox;
    cos_key?: string;
    img_path?: string;
  }>,
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
