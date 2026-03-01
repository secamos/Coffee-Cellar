/**
 * 饮用计划排序算法 2.0
 * 优先级：单杯装养熟日 > 饮用中/已养熟 > 养豆中但到日养熟；动态重量；连续去重
 */
import {
  addDays,
  format,
  isAfter,
  isBefore,
  isSameDay,
  parseISO,
  startOfDay,
} from 'date-fns'
import type { CoffeeBean } from '../types'
import { isPendingBlend } from './beanLogic'

const MIN_WEIGHT_PER_CUP = 15

function isSingleServe(bean: CoffeeBean): boolean {
  return bean.initialWeight === 15
}

/** 单杯装排序：价格高的优先，同价随机 */
function sortSingleServes(beans: CoffeeBean[]): CoffeeBean[] {
  return [...beans].sort((a, b) => {
    const priceA = a.price ?? 0
    const priceB = b.price ?? 0
    if (priceB !== priceA) return priceB - priceA
    return (a.id.localeCompare(b.id) % 2) - 0.5
  })
}

/**
 * 计算到 targetDate 时，该豆子的预计剩余重量（考虑已排班的消耗）
 */
function getProjectedWeight(
  bean: CoffeeBean,
  targetDate: Date,
  existingSchedule: Record<string, string>
): number {
  let remaining = bean.weight
  const targetStart = startOfDay(targetDate)

  for (const [dateKey, beanId] of Object.entries(existingSchedule)) {
    if (beanId !== bean.id) continue
    const scheduledDate = startOfDay(parseISO(dateKey))
    if (
      isBefore(scheduledDate, targetStart) ||
      isSameDay(scheduledDate, targetStart)
    ) {
      remaining -= MIN_WEIGHT_PER_CUP
    }
  }
  return remaining
}

/**
 * 获取豆子在某日的优先级
 * 0: 单杯装在养熟当天
 * 1: 饮用中 / 已养熟且到日
 * 2: 养豆中但在目标日会养熟
 * null: 不参与（未养熟）
 */
function getBeanPriority(
  bean: CoffeeBean,
  targetDate: Date,
  restingDays: number
): number | null {
  const roastDate = startOfDay(parseISO(bean.roastDate))
  const readyDate = addDays(roastDate, restingDays + 1)
  const target = startOfDay(targetDate)

  if (bean.initialWeight === 15 && isSameDay(target, readyDate)) {
    return 0
  }

  const isReadyOnDate = isAfter(target, readyDate) || isSameDay(target, readyDate)

  if (bean.status === 'drinking' || (bean.status === 'ready' && isReadyOnDate)) {
    return 1
  }
  if (bean.status === 'resting' && isReadyOnDate) {
    return 2
  }
  return null
}

/**
 * 计算饮用计划（未来 N 天豆子分配）
 * @param beans 豆库
 * @param startDate 起始日期（通常为今天）
 * @param days 计算天数
 * @param existingSchedule 已有排班（保留已完成日期）
 * @param getRestingDays 按烘焙商获取养豆天数
 */
export function calculateDrinkingSchedule(
  beans: CoffeeBean[],
  startDate: Date,
  days: number = 30,
  existingSchedule: Record<string, string> = {},
  getRestingDays: (roaster: string) => number = () => 30
): Record<string, string> {
  const schedule: Record<string, string> = { ...existingSchedule }
  let lastBeanId: string | null = null

  const singleServes = beans.filter(isSingleServe)
  const regularBeans = beans.filter((b) => !isSingleServe(b))
  const sortedSingleServes = sortSingleServes(singleServes)

  const singleServeReadyDates = new Map<string, Date>()
  sortedSingleServes.forEach((bean) => {
    const resting = getRestingDays(bean.roaster)
    const readyDate = addDays(startOfDay(parseISO(bean.roastDate)), resting + 1)
    singleServeReadyDates.set(bean.id, readyDate)
  })

  for (let i = 0; i < days; i++) {
    const currentDate = addDays(startDate, i)
    const dateKey = format(currentDate, 'yyyy-MM-dd')

    if (schedule[dateKey]) {
      lastBeanId = schedule[dateKey]
      continue
    }

    const readySingleServe = sortedSingleServes.find((bean) => {
      const readyDate = singleServeReadyDates.get(bean.id)
      const isReady =
        readyDate &&
        (isSameDay(currentDate, readyDate) || isAfter(currentDate, readyDate))
      const notScheduled = !Object.values(schedule).includes(bean.id)
      return isReady && notScheduled
    })

    if (readySingleServe) {
      const readyDate = singleServeReadyDates.get(readySingleServe.id)
      const projected = getProjectedWeight(
        readySingleServe,
        currentDate,
        schedule
      )
      if (
        readyDate &&
        (isSameDay(currentDate, readyDate) || isAfter(currentDate, readyDate)) &&
        projected >= MIN_WEIGHT_PER_CUP
      ) {
        schedule[dateKey] = readySingleServe.id
        lastBeanId = readySingleServe.id
        continue
      }
    }

    const candidates = regularBeans
      .map((bean) => {
        const resting = getRestingDays(bean.roaster)
        const priority = getBeanPriority(bean, currentDate, resting)
        const projectedWeight = getProjectedWeight(
          bean,
          currentDate,
          schedule
        )
        return {
          bean,
          priority,
          projectedWeight,
          isAvailable:
            priority !== null &&
            projectedWeight >= MIN_WEIGHT_PER_CUP &&
            bean.weight >= MIN_WEIGHT_PER_CUP &&
            bean.status !== 'finished' &&
            bean.status !== 'frozen' &&
            !isPendingBlend(bean),
        }
      })
      .filter((c) => c.isAvailable)
      .sort((a, b) => {
        const pa = a.priority as number
        const pb = b.priority as number
        if (pa !== pb) return pa - pb
        return (
          new Date(a.bean.roastDate).getTime() -
          new Date(b.bean.roastDate).getTime()
        )
      })

    let selected = candidates.find((c) => c.bean.id !== lastBeanId)
    if (!selected && candidates.length > 0) {
      selected = candidates[0]
    }

    if (selected) {
      schedule[dateKey] = selected.bean.id
      lastBeanId = selected.bean.id
    } else {
      lastBeanId = null
    }
  }

  return schedule
}
