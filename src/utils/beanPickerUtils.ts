/**
 * 豆库选择器：按目标日期的养豆/饮用状态排序与展示
 */
import { parseISO, startOfDay } from 'date-fns'
import type { LucideIcon } from 'lucide-react'
import { Coffee, Sun, Clock, XCircle } from 'lucide-react'
import type { CoffeeBean } from '../types'
import { deriveBeanStatus, isRestingComplete } from './beanLogic'

export interface BeanStatusInfo {
  label: string
  colorClass: string
  Icon: LucideIcon
}

/**
 * 获取某豆在目标日期的展示状态（养豆中/可饮/饮用中/已喝完）
 * 用于选择器列表的标签与排序
 */
export function getBeanStatusForDate(
  bean: CoffeeBean,
  targetDate: Date,
  getRestingDaysForRoaster: (roaster: string) => number
): BeanStatusInfo {
  const restingDays = getRestingDaysForRoaster(bean.roaster)
  const hasAnyConsumption = false
  const status = deriveBeanStatus(
    bean,
    hasAnyConsumption,
    targetDate,
    restingDays
  )

  const ready =
    bean.weight > 0 &&
    isRestingComplete(bean.roastDate, targetDate, restingDays)

  if (bean.weight <= 0) {
    return {
      label: '已喝完',
      colorClass: 'bg-slate-100 text-slate-600',
      Icon: XCircle,
    }
  }
  if (status === 'resting' || !ready) {
    return {
      label: '养豆中',
      colorClass: 'bg-amber-50 text-amber-700',
      Icon: Clock,
    }
  }
  if (status === 'ready') {
    return {
      label: '可饮',
      colorClass: 'bg-emerald-50 text-emerald-700',
      Icon: Sun,
    }
  }
  return {
    label: '饮用中',
    colorClass: 'bg-indigo-50 text-indigo-700',
    Icon: Coffee,
  }
}

/**
 * 选择器内排序：可饮 → 饮用中 → 养豆中；同状态按烘焙日期升序
 */
export function sortBeansForPicker(
  beans: CoffeeBean[],
  getStatusInfo: (bean: CoffeeBean) => BeanStatusInfo
): CoffeeBean[] {
  const order = (b: CoffeeBean) => {
    const info = getStatusInfo(b)
    if (info.label === '可饮') return 0
    if (info.label === '饮用中') return 1
    if (info.label === '养豆中') return 2
    return 3
  }
  return [...beans].sort((a, b) => {
    if (order(a) !== order(b)) return order(a) - order(b)
    return (
      startOfDay(parseISO(a.roastDate)).getTime() -
      startOfDay(parseISO(b.roastDate)).getTime()
    )
  })
}
