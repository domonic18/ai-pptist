import type { DimensionEvaluator } from '@/modules/templateMatching/types'

/**
 * 维度注册表
 * 管理所有可用的维度评估器
 */
export interface DimensionRegistryConfig {
  id: string;
  evaluatorClass: () => Promise<{ [key: string]: new () => DimensionEvaluator }>;
  enabled: boolean;
  order: number; // 执行顺序
}

export const DimensionRegistry: DimensionRegistryConfig[] = [
  // 核心维度
  {
    id: 'layoutType',
    evaluatorClass: () =>
      import('@/modules/templateMatching/dimensions/layoutTypeDimension'),
    enabled: true,
    order: 1,
  },
  {
    id: 'contentType',
    evaluatorClass: () =>
      import('@/modules/templateMatching/dimensions/contentTypeDimension'),
    enabled: true,
    order: 2,
  },
  {
    id: 'capacity',
    evaluatorClass: () =>
      import('@/modules/templateMatching/dimensions/capacityDimension'),
    enabled: true,
    order: 3,
  },
  {
    id: 'titleStructure',
    evaluatorClass: () =>
      import('@/modules/templateMatching/dimensions/titleStructureDimension'),
    enabled: true,
    order: 4,
  },
  {
    id: 'textStructure',
    evaluatorClass: () =>
      import('@/modules/templateMatching/dimensions/textStructureDimension'),
    enabled: true,
    order: 5,
  },
  {
    id: 'textAmount',
    evaluatorClass: () =>
      import('@/modules/templateMatching/dimensions/textAmountDimension'),
    enabled: true,
    order: 6,
  },

  // 可选维度 (模板有相应字段时参与计算)
]
