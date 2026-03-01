/**
 * 咖啡豆资产与杯测数据模型定义
 */

/** 豆子状态：养豆中 / 已养熟可饮 / 饮用中 / 已喝完 / 冷冻 */
export type BeanStatus =
  | 'resting'
  | 'ready'
  | 'drinking'
  | 'finished'
  | 'frozen'

/** SCA 杯测 8 维度分数（每项 0-10，步长 0.5） */
export interface CuppingScores {
  fragrance: number  // 干香
  flavor: number     // 风味
  acidity: number    // 酸质
  body: number      // 醇厚度
  sweetness: number  // 甜度
  balance: number    // 平衡
  aftertaste: number // 余韵
  overall: number    // 整体印象
}

/** 注水手法 */
export type PourStyle = 'circle' | 'center'

/** 分段注水参数 */
export interface PourSegment {
  amount: number
  speed: number
  style: PourStyle
}

/** 杯测记录（SCA 标准）：totalScore = (8 维之和) × 1.25 四舍五入取整 */
export interface CuppingRecord {
  id: string
  beanId: string
  date: string
  scores: CuppingScores
  totalScore: number
  flavorTags: string[]
  brewMethod: string
  grindSize?: string
  waterTemp?: number
  dose: number
  yield?: number
  ratio?: string
  pourSegments?: PourSegment[]
  notes?: string
}

/** 消耗记录：用于追踪和统计 */
export interface ConsumptionRecord {
  id: string
  beanId: string
  date: string
  amount: number
  cuppingId?: string
  satisfaction?: 1 | 2 | 3 | 4 | 5
}

/** 核心豆子数据（无烘焙度；weight/initialWeight 默认 100） */
export interface CoffeeBean {
  id: string
  /** 自动生成：地区+庄园+处理法+豆种 */
  name: string
  roaster: string
  origin: string
  farm: string
  lot?: string
  batch?: string
  altitude?: string
  process: string
  variety: string
  roastDate: string
  addedDate: string
  /** 当前剩余重量 (g)，默认 100 */
  weight: number
  /** 初始重量 (g)，默认 100 */
  initialWeight: number
  /** 整包价格（元）；单杯价格 = price/起始库存*15 */
  price?: number
  status: BeanStatus
  flavorTags: string[]
  tags: string[]
  notes?: string
  cuppings: CuppingRecord[]
  dailyConsumption: number
}
