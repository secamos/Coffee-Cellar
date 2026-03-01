/**
 * 咖啡豆核心计算逻辑（养豆期、剩余杯数、状态推导）
 * 所有关键计算均在此处集中实现，并配有中文注释。
 */
import {
  differenceInDays,
  format,
  isBefore,
  isToday,
  parseISO,
  startOfDay,
} from 'date-fns'
import { zhCN } from 'date-fns/locale'
import type { BeanStatus, CoffeeBean } from '../types'

/** 默认养豆天数：未配置烘焙商时使用 */
export const DEFAULT_RESTING_DAYS = 30

/**
 * 根据烘焙日期与当前日期，计算「已养豆天数」
 * 规则：从 roastDate 当天算 Day 0，次日为 Day 1，…，第 N 天结束后视为养熟
 * @param roastDateISO 烘焙日期的 ISO 字符串
 * @param referenceDate 参考日期，默认为今天
 * @returns 已养豆天数（0-based，0 表示烘焙当天）
 */
export function getRestingDaysElapsed(
  roastDateISO: string,
  referenceDate: Date = new Date()
): number {
  const roast = startOfDay(parseISO(roastDateISO))
  const ref = startOfDay(referenceDate)
  if (isBefore(ref, roast)) return 0
  return differenceInDays(ref, roast)
}

/**
 * 判断是否已养熟（第 restingDays+1 天及以后）
 * @param restingDays 养豆天数，未传入时默认 30
 */
export function isRestingComplete(
  roastDateISO: string,
  referenceDate: Date = new Date(),
  restingDays: number = DEFAULT_RESTING_DAYS
): boolean {
  return getRestingDaysElapsed(roastDateISO, referenceDate) > restingDays
}

/**
 * 计算距离养熟还剩多少天（仅当仍在养豆中时有意义）
 * @param restingDays 养豆天数，未传入时默认 30
 * @returns 剩余养豆天数；若已养熟或日期异常则返回 0
 */
export function getRestingDaysRemaining(
  roastDateISO: string,
  referenceDate: Date = new Date(),
  restingDays: number = DEFAULT_RESTING_DAYS
): number {
  const elapsed = getRestingDaysElapsed(roastDateISO, referenceDate)
  if (elapsed > restingDays) return 0
  return restingDays - elapsed
}

/**
 * 根据豆子当前数据与「是否有过消耗记录」推导状态
 * 规则：
 * - weight <= 0 → finished
 * - 否则若已养熟且从未消耗 → ready
 * - 否则若已养熟且有过消耗 → drinking
 * - 否则（养豆中）→ resting
 * 注意：frozen 由用户手动设置，此处不自动改写
 * @param restingDays 该豆子烘焙商的养豆天数，未传入时默认 30
 */
export function deriveBeanStatus(
  bean: CoffeeBean,
  hasAnyConsumption: boolean,
  referenceDate: Date = new Date(),
  restingDays: number = DEFAULT_RESTING_DAYS
): BeanStatus {
  if (bean.status === 'frozen') return 'frozen'
  if (bean.weight <= 0) return 'finished'
  const complete = isRestingComplete(bean.roastDate, referenceDate, restingDays)
  if (!complete) return 'resting'
  if (hasAnyConsumption) return 'drinking'
  return 'ready'
}

/**
 * 计算剩余可饮用杯数（按每日消耗量整除）
 * 公式：饮用次数 = Math.floor(weight / dailyConsumption)
 */
export function getRemainingCups(bean: CoffeeBean): number {
  if (bean.weight <= 0) return 0
  const perCup = bean.dailyConsumption || 15
  return Math.floor(bean.weight / perCup)
}

/**
 * 计算剩余零散克数（不足以凑满一杯的部分）
 * 公式：剩余零散 = weight % dailyConsumption
 */
export function getRemainingRemainderGrams(bean: CoffeeBean): number {
  if (bean.weight <= 0) return 0
  const perCup = bean.dailyConsumption || 15
  return bean.weight % perCup
}

/**
 * 判断是否为「待拼配」：当前库存不足一杯用量（< dailyConsumption）
 */
export function isPendingBlend(bean: CoffeeBean): boolean {
  return bean.weight > 0 && bean.weight < (bean.dailyConsumption || 15)
}

/**
 * 获取豆子的杯测均分（简化版：对 totalScore 求平均，四舍五入一位小数）
 * 若无杯测记录返回 undefined
 */
export function getAverageCuppingScore(bean: CoffeeBean): number | undefined {
  if (!bean.cuppings?.length) return undefined
  const sum = bean.cuppings.reduce((s, c) => s + c.totalScore, 0)
  return Math.round((sum / bean.cuppings.length) * 10) / 10
}

/**
 * 单杯成本（元）：价格/起始库存*15，保留一位小数
 */
export function getSingleCupCost(
  price?: number,
  initialWeight: number = 100
): number | undefined {
  if (price == null || price <= 0 || initialWeight <= 0) return undefined
  return Math.round((price / initialWeight) * 15 * 10) / 10
}

/** 格式化「养豆期 x/N 天」展示 */
export function formatRestingProgress(
  roastDateISO: string,
  referenceDate: Date = new Date(),
  restingDays: number = DEFAULT_RESTING_DAYS
): string {
  const elapsed = getRestingDaysElapsed(roastDateISO, referenceDate)
  if (elapsed > restingDays) return '已养熟'
  return `${elapsed}/${restingDays}天`
}

/** 格式化日期为中文简短（如 2月7日） */
export function formatDateShort(iso: string): string {
  return format(parseISO(iso), 'M月d日', { locale: zhCN })
}

export function isDateToday(iso: string): boolean {
  return isToday(parseISO(iso))
}
