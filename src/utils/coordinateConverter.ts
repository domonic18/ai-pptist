/**
 * 坐标转换工具
 * 用于将OCR返回的坐标转换为前端画布坐标
 *
 * 改进点：
 * 1. 支持object-fit模式（cover/contain）
 * 2. 文本盒模型补偿（补偿文本组件的padding）
 */

/**
 * OCR返回的bbox格式
 * [x1, y1, x2, y2] - 左上角和右下角坐标
 */
export interface OCRBBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/**
 * PPT元素坐标格式
 */
export interface ElementRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * 图片尺寸
 */
export interface ImageSize {
  width: number;
  height: number;
}

/**
 * 文本盒模型配置
 */
export interface TextBoxModel {
  // 默认padding（PPT文本组件的默认padding）
  padding: number;
  // 段落间距
  paragraphSpace: number;
  // 行高倍数
  lineHeight: number;
}

/**
 * 坐标转换配置
 */
export interface CoordTransformConfig {
  // 原始图片尺寸（像素）
  imageSize: ImageSize;
  // 画布尺寸
  viewportSize: number;
  viewportRatio: number;
  // 目标矩形（默认全画布）
  targetRect?: ElementRect;
  // object-fit模式
  objectFit?: "cover" | "contain";
  // 文本盒模型配置
  textBoxModel?: TextBoxModel;
}

/**
 * 将OCR的bbox格式转换为PPT元素坐标
 * @param bbox OCR bbox [x1, y1, x2, y2]
 * @param config 转换配置
 * @param applyTextBoxModel 是否应用文本盒模型补偿
 * @returns PPT元素坐标
 */
export function convertOCRBBoxToElementRect(
  bbox: number[] | OCRBBox,
  config: CoordTransformConfig,
  applyTextBoxModel: boolean = true,
): ElementRect {
  // 解析bbox
  const ocrBox = Array.isArray(bbox)
    ? { x1: bbox[0], y1: bbox[1], x2: bbox[2], y2: bbox[3] }
    : bbox;

  // 计算原始尺寸
  const originalWidth = ocrBox.x2 - ocrBox.x1;
  const originalHeight = ocrBox.y2 - ocrBox.y1;

  // 获取目标矩形
  const targetRect = config.targetRect || {
    left: 0,
    top: 0,
    width: config.viewportSize,
    height: config.viewportSize * config.viewportRatio,
  };

  // 执行坐标转换（考虑object-fit）
  const transformed = mapBBoxToTargetRect(
    {
      x: ocrBox.x1,
      y: ocrBox.y1,
      width: originalWidth,
      height: originalHeight,
    },
    targetRect,
    config.imageSize,
    config.objectFit || "cover",
  );

  // 应用文本盒模型补偿
  if (applyTextBoxModel && config.textBoxModel) {
    return compensateTextBoxModel(transformed, config.textBoxModel);
  }

  return {
    left: transformed.left,
    top: transformed.top,
    width: transformed.width,
    height: transformed.height,
  };
}

/**
 * 文本盒模型补偿
 *
 * PPT文本组件有默认padding（通常是10px），会导致文字视觉上偏移。
 * 需要反向补偿：left -= padding, top -= padding, width += 2*padding, height += 2*padding
 *
 * @param rect 原始元素矩形
 * @param textBoxModel 文本盒模型配置
 * @returns 补偿后的元素矩形
 */
function compensateTextBoxModel(
  rect: ElementRect,
  textBoxModel: TextBoxModel,
): ElementRect {
  const padding = textBoxModel.padding || 10;

  return {
    left: rect.left - padding,
    top: rect.top - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
  };
}

// 向后兼容的别名
export const convertMinerUBBoxToElementRect = convertOCRBBoxToElementRect;

/**
 * 将bbox映射到目标矩形
 * 支持object-fit: cover和contain模式
 *
 * 坐标转换原理：
 * - object-fit: cover时，图片会缩放到完全覆盖容器，超出部分被裁剪
 * - object-fit: contain时，图片会缩放到完全显示在容器内，可能有留白
 * - 图片始终居中对齐（object-position: center）
 */
function mapBBoxToTargetRect(
  bbox: { x: number; y: number; width: number; height: number },
  target: ElementRect,
  srcImage: ImageSize,
  objectFit: "cover" | "contain",
): ElementRect {
  const srcW = srcImage.width;
  const srcH = srcImage.height;
  const dstW = target.width;
  const dstH = target.height;

  if (srcW <= 0 || srcH <= 0 || dstW <= 0 || dstH <= 0) {
    // fallback: 不做映射
    return {
      left: target.left + bbox.x,
      top: target.top + bbox.y,
      width: bbox.width,
      height: bbox.height,
    };
  }

  // 计算缩放比例（object-position: center）
  const scale =
    objectFit === "cover"
      ? Math.max(dstW / srcW, dstH / srcH)
      : Math.min(dstW / srcW, dstH / srcH);

  const renderedW = srcW * scale;
  const renderedH = srcH * scale;

  // 关键修复：offset是图片相对于容器的偏移（裁剪或留白）
  // 当renderedW > dstW时，图片被裁剪，offsetX是裁剪量（正值）
  // 当renderedW < dstW时，有留白，offsetX是留白量（正值）
  // 原图坐标(0,0)在容器中的位置是(-offsetX, -offsetY)
  const offsetX = (renderedW - dstW) / 2;
  const offsetY = (renderedH - dstH) / 2;

  return {
    left: target.left + bbox.x * scale - offsetX,
    top: target.top + bbox.y * scale - offsetY,
    width: bbox.width * scale,
    height: bbox.height * scale,
  };
}

/**
 * 批量转换OCR bbox
 */
export function batchConvertOCRBBoxes(
  bboxes: (number[] | OCRBBox)[],
  config: CoordTransformConfig,
  applyTextBoxModel: boolean = true,
): ElementRect[] {
  return bboxes.map((bbox) =>
    convertOCRBBoxToElementRect(bbox, config, applyTextBoxModel),
  );
}

// 向后兼容的别名
export const batchConvertMinerUBBoxes = batchConvertOCRBBoxes;

/**
 * 获取默认文本盒模型配置
 */
export function getDefaultTextBoxModel(): TextBoxModel {
  return {
    padding: 10,
    paragraphSpace: 5,
    lineHeight: 1.2,
  };
}

/**
 * 创建紧贴模式的文本盒模型配置（用于OCR文本）
 *
 * 紧贴模式使用更小的padding和间距，使OCR识别的文本更准确地贴合原始位置
 */
export function getTightTextBoxModel(): TextBoxModel {
  return {
    padding: 0,
    paragraphSpace: 0,
    lineHeight: 1.0,
  };
}

/**
 * 验证坐标转换是否正确
 */
export function validateCoordinateTransform(
  mineruBBox: number[],
  elementRect: ElementRect,
  config: CoordTransformConfig,
): { isValid: boolean; error?: string } {
  // 1. 检查bbox格式
  if (mineruBBox.length !== 4) {
    return {
      isValid: false,
      error: "MinerU bbox格式错误，应为[x1, y1, x2, y2]",
    };
  }

  const [x1, y1, x2, y2] = mineruBBox;

  // 2. 检查坐标顺序
  if (x1 >= x2 || y1 >= y2) {
    return { isValid: false, error: "MinerU bbox坐标顺序错误" };
  }

  // 3. 检查是否超出原图范围
  const { width, height } = config.imageSize;
  if (x1 < 0 || y1 < 0 || x2 > width || y2 > height) {
    return { isValid: false, error: "MinerU bbox超出原图范围" };
  }

  // 4. 检查元素坐标是否在画布范围内
  const canvasWidth = config.viewportSize;
  const canvasHeight = config.viewportSize * config.viewportRatio;

  if (
    elementRect.left < 0 ||
    elementRect.top < 0 ||
    elementRect.left + elementRect.width > canvasWidth ||
    elementRect.top + elementRect.height > canvasHeight
  ) {
    return { isValid: false, error: "转换后的元素坐标超出画布范围" };
  }

  // 5. 比例一致性检查
  const scaleX = elementRect.width / (x2 - x1);
  const scaleY = elementRect.height / (y2 - y1);

  if (Math.abs(scaleX - scaleY) > 0.01) {
    return { isValid: false, error: "X和Y缩放比例不一致" };
  }

  return { isValid: true };
}

/**
 * 坐标调试工具类
 */
export class CoordinateDebugger {
  private logs: Array<{
    timestamp: number;
    mineruBBox: number[];
    elementRect: ElementRect;
    config: CoordTransformConfig;
    validation: ReturnType<typeof validateCoordinateTransform>;
  }> = [];

  /**
   * 记录坐标转换过程
   */
  logTransform(
    mineruBBox: number[],
    elementRect: ElementRect,
    config: CoordTransformConfig,
  ) {
    const validation = validateCoordinateTransform(
      mineruBBox,
      elementRect,
      config,
    );

    this.logs.push({
      timestamp: Date.now(),
      mineruBBox,
      elementRect,
      config,
      validation,
    });

    if (!validation.isValid) {
      console.error("坐标转换错误:", validation.error);
      console.table({
        mineruBBox,
        elementRect,
        imageSize: config.imageSize,
        viewportSize: config.viewportSize,
        viewportRatio: config.viewportRatio,
      });
    }
  }

  /**
   * 导出调试日志
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * 清空日志
   */
  clearLogs() {
    this.logs = [];
  }
}

export default {
  // 主要转换函数
  convertOCRBBoxToElementRect,
  convertMinerUBBoxToElementRect, // 别名
  batchConvertOCRBBoxes,
  batchConvertMinerUBBoxes, // 别名

  // 辅助函数
  mapBBoxToTargetRect,
  validateCoordinateTransform,
  compensateTextBoxModel,

  // 配置函数
  getDefaultTextBoxModel,
  getTightTextBoxModel,

  // 类型
  CoordinateDebugger,

  // 常量
  DEFAULT_TEXT_BOX_MODEL: getDefaultTextBoxModel(),
  TIGHT_TEXT_BOX_MODEL: getTightTextBoxModel(),
};
