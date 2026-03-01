/**
 * 日历排班与展示用计算
 */
import { addDays, differenceInDays, format, parseISO, startOfDay } from 'date-fns'
import type { CoffeeBean, CuppingRecord } from '../types'
import { isPendingBlend, isRestingComplete } from './beanLogic'

/** 单杯价格（元）：价格/起始库存*15，保留 1 位小数 */
export function getCupPrice(bean: CoffeeBean): number | undefined {
  if (bean.price == null || bean.price <= 0 || !bean.initialWeight) return undefined
  return Math.round((bean.price / bean.initialWeight) * 15 * 10) / 10
}

/** 某豆在某日的杯测记录（用于回显） */
export function getCuppingForDay(
  bean: CoffeeBean,
  dateStr: string
): CuppingRecord | undefined {
  return bean.cuppings?.find((c) => c.date === dateStr)
}

const MIN_WEIGHT_FOR_ONE_CUP = 15

const DEFAULT_RESTING = 30

/** 某日可推荐豆子列表（同 getRecommendationForDate 筛选与排序），用于换一杯随机 */
function getRecommendationCandidatesForDate(
  beans: CoffeeBean[],
  date: Date,
  lastDayBeanId: string | null,
  getRestingDays?: (roaster: string) => number
): CoffeeBean[] {
  const restingFor = (b: CoffeeBean) => getRestingDays?.(b.roaster) ?? DEFAULT_RESTING

  const candidates = beans.filter((b) => {
    if (b.weight <= 0 || b.weight < MIN_WEIGHT_FOR_ONE_CUP || b.status === 'finished' || b.status === 'frozen')
      return false
    if (b.initialWeight === 15) {
      const resting = restingFor(b)
      const roast = startOfDay(parseISO(b.roastDate))
      const target = startOfDay(addDays(roast, resting + 1))
      if (differenceInDays(date, target) !== 0) return false
    }
    return true
  })

  const pending = candidates.filter((b) => isPendingBlend(b))
  const readyOrDrinking = candidates.filter(
    (b) =>
      !isPendingBlend(b) &&
      isRestingComplete(b.roastDate, date, restingFor(b))
  )
  const resting = candidates.filter(
    (b) =>
      !isPendingBlend(b) &&
      !isRestingComplete(b.roastDate, date, restingFor(b))
  )

  const sorted = [
    ...readyOrDrinking.sort((a, b) => {
      const order = (x: CoffeeBean) =>
        x.status === 'drinking' ? 0 : x.status === 'ready' ? 1 : 2
      if (order(a) !== order(b)) return order(a) - order(b)
      return new Date(a.roastDate).getTime() - new Date(b.roastDate).getTime()
    }),
    ...resting.sort(
      (a, b) =>
        new Date(a.roastDate).getTime() - new Date(b.roastDate).getTime()
    ),
    ...pending,
  ].filter((b) => b.id !== lastDayBeanId)

  return sorted
}

/**
 * 获取某日推荐豆子（每日 1 支）
 * 优先级：1. drinking 2. ready(roastDate 升序) 3. resting；连续去重；库存至少 15g；15g 装仅养熟日；待拼配排最后
 * @param getRestingDays 按烘焙商获取养豆天数，未配置时默认 30
 */
export function getRecommendationForDate(
  beans: CoffeeBean[],
  date: Date,
  lastDayBeanId: string | null,
  getRestingDays?: (roaster: string) => number
): CoffeeBean | null {
  const sorted = getRecommendationCandidatesForDate(
    beans,
    date,
    lastDayBeanId,
    getRestingDays
  )
  return sorted[0] ?? null
}

/** 获取某日可换的候选豆子（排除当前豆），用于「换一杯」随机 */
export function getReplaceCandidatesForDate(
  beans: CoffeeBean[],
  date: Date,
  lastDayBeanId: string | null,
  currentBeanId: string,
  getRestingDays?: (roaster: string) => number
): CoffeeBean[] {
  return getRecommendationCandidatesForDate(
    beans,
    date,
    lastDayBeanId,
    getRestingDays
  ).filter((b) => b.id !== currentBeanId)
}

export function formatDateKey(d: Date): string {
  return format(d, 'yyyy-MM-dd')
}
