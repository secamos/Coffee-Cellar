/**
 * 统计页：消耗与豆子总花费
 */
import type { CoffeeBean, ConsumptionRecord } from '../types'
import type { OutingRecord } from '../types/outing'
import { getSingleCupCost } from './beanLogic'

export interface ConsumptionStats {
  totalGrams: number
  totalCups: number
  totalSpentOnBeans: number
  /** 豆库总重量（克），各豆 initialWeight 之和 */
  totalBeanWeight: number
  /** 单杯价格（元）：豆子总价/豆子总重量*15，仅当 totalBeanWeight > 0 时有值 */
  costPerCup: number | undefined
}

/**
 * 汇总消耗与花费
 * totalGrams / totalCups：来自 consumptions 实际记录
 * totalSpentOnBeans：当前豆库中所有豆子的 price 之和（已购总花费）
 * totalBeanWeight：各豆 initialWeight 之和
 * costPerCup：豆子总价/豆子总重量*15（每杯按 15g 估算）
 */
export function getConsumptionStats(
  beans: CoffeeBean[],
  consumptions: ConsumptionRecord[]
): ConsumptionStats {
  const list = Array.isArray(consumptions) ? consumptions : []
  const totalGrams = list.reduce((s, c) => s + (c.amount ?? 0), 0)
  const totalCups = list.length
  const beanList = Array.isArray(beans) ? beans : []
  const totalSpentOnBeans = beanList.reduce((s, b) => s + (b.price ?? 0), 0)
  const totalBeanWeight = beanList.reduce(
    (s, b) => s + (b.initialWeight ?? 0),
    0
  )
  const costPerCup =
    totalBeanWeight > 0 && Number.isFinite(totalSpentOnBeans)
      ? Math.round((totalSpentOnBeans / totalBeanWeight) * 15 * 10) / 10
      : undefined
  return {
    totalGrams,
    totalCups,
    totalSpentOnBeans,
    totalBeanWeight,
    costPerCup,
  }
}

/**
 * 某豆的单杯成本（元），用于统计展示
 */
export function getBeanCostPerCup(bean: CoffeeBean): number | undefined {
  return getSingleCupCost(bean.price, bean.initialWeight)
}

export interface MonthlySpendingRow {
  /** 月份，格式 yyyy-MM */
  monthKey: string
  /** 豆子开支（元） */
  beanSpending: number
  /** 外出开支（元） */
  outingSpending: number
  /** 合计（元） */
  total: number
}

/**
 * 合并饮用与外出，按饮用/外出日期计算每月开支
 * 豆子：单次成本 = (豆子 price / 豆子 initialWeight) × 本次 amount
 * 外出：直接使用 price
 * 从有数据的月份开始展示，最多 12 个月
 */
export function getMonthlySpendingMerged(
  beans: CoffeeBean[],
  consumptions: ConsumptionRecord[],
  outings: OutingRecord[],
  maxMonths = 12
): MonthlySpendingRow[] {
  const beanMap = new Map(beans.map((b) => [b.id, b]))
  const byMonth = new Map<string, { bean: number; outing: number }>()

  for (const c of consumptions ?? []) {
    const monthKey = c.date?.slice(0, 7) ?? ''
    if (!monthKey) continue

    const bean = beanMap.get(c.beanId)
    const price = bean?.price
    const initW = bean?.initialWeight ?? 0
    const cost =
      price != null && initW > 0 && c.amount != null
        ? (price / initW) * c.amount
        : 0

    const cur = byMonth.get(monthKey) ?? { bean: 0, outing: 0 }
    cur.bean += cost
    byMonth.set(monthKey, cur)
  }

  for (const o of outings ?? []) {
    const monthKey = o.date?.slice(0, 7) ?? ''
    if (!monthKey) continue
    const cur = byMonth.get(monthKey) ?? { bean: 0, outing: 0 }
    cur.outing += o.price ?? 0
    byMonth.set(monthKey, cur)
  }

  const monthKeys = Array.from(byMonth.keys())
    .sort((a, b) => b.localeCompare(a))
    .slice(0, maxMonths)

  return monthKeys.map((monthKey) => {
    const { bean, outing } = byMonth.get(monthKey) ?? { bean: 0, outing: 0 }
    return {
      monthKey,
      beanSpending: Math.round(bean),
      outingSpending: Math.round(outing),
      total: Math.round(bean + outing),
    }
  })
}

export interface FarmStats {
  farm: string
  /** 豆种类数（该庄园的豆子支数） */
  beanCount: number
  /** 已饮用杯数（消耗记录条数） */
  cupsConsumed: number
  /** 待饮用杯数（当前库存可冲杯数之和） */
  cupsRemaining: number
  /** 总价格（元） */
  totalPrice: number
}

/**
 * 按庄园汇总：豆种类数、已饮用杯数、待饮用杯数、总价格
 */
export function getStatsByFarm(
  beans: CoffeeBean[],
  consumptions: ConsumptionRecord[],
  getRemainingCups: (bean: CoffeeBean) => number
): FarmStats[] {
  const list = Array.isArray(beans) ? beans : []
  const cons = Array.isArray(consumptions) ? consumptions : []
  const byFarm = new Map<
    string,
    { beans: CoffeeBean[]; consumedCount: number }
  >()
  const consumptionByBeanId = new Map<string, number>()
  for (const c of cons) {
    consumptionByBeanId.set(
      c.beanId,
      (consumptionByBeanId.get(c.beanId) ?? 0) + 1
    )
  }
  for (const b of list) {
    const farm = (b.farm ?? '').trim() || '未填'
    if (!byFarm.has(farm)) byFarm.set(farm, { beans: [], consumedCount: 0 })
    const entry = byFarm.get(farm)!
    entry.beans.push(b)
    entry.consumedCount += consumptionByBeanId.get(b.id) ?? 0
  }
  return Array.from(byFarm.entries())
    .map(([farm, { beans: farmBeans, consumedCount }]) => ({
      farm,
      beanCount: farmBeans.length,
      cupsConsumed: consumedCount,
      cupsRemaining: farmBeans.reduce(
        (s, b) => s + getRemainingCups(b),
        0
      ),
      totalPrice: farmBeans.reduce((s, b) => s + (b.price ?? 0), 0),
    }))
    .sort((a, b) => b.totalPrice - a.totalPrice)
}
