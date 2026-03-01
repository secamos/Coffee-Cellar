/**
 * 豆库顶部数据看板：库存余量、可饮用储备、即将过期预警
 * 与日历、豆库共用 Zustand store，数据实时联动
 */
import { useMemo, useState } from 'react'
import { addDays, differenceInDays, format, parseISO } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Package, Coffee, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import { useStore } from '../store/useStore'
import type { CoffeeBean } from '../types'

/** 养豆天数：烘焙后第 31 天起为最佳赏味期起点 */
const RESTING_DAYS = 31
/** 最佳赏味期：养熟后 45 天内 */
const PEAK_PERIOD_DAYS = 45
/** 提前多少天预警即将过期 */
const WARNING_DAYS = 7

type ExpiringBean = { bean: CoffeeBean; daysUntilExpire: number }

function getExpireDate(roastDateISO: string): Date {
  // 养熟日期 = 烘焙日期 + 31 天（分步计算，便于维护）
  const roastDate = parseISO(roastDateISO)
  const readyDate = addDays(roastDate, RESTING_DAYS)
  // 过期日期 = 养熟日期 + 45 天（最佳赏味期结束）
  return addDays(readyDate, PEAK_PERIOD_DAYS)
}

export function StatsBanner() {
  const beans = useStore((s) => s.beans)
  const defaultDailyConsumption = useStore((s) => s.defaultDailyConsumption)
  const dailyG = defaultDailyConsumption || 15

  const [expiryExpanded, setExpiryExpanded] = useState(false)

  const stats = useMemo(() => {
    const now = new Date()

    // 1. 库存余量：总剩余天数（排除已喝完）
    const totalWeight = beans
      .filter((b) => b.status !== 'finished')
      .reduce((sum, b) => sum + b.weight, 0)
    const totalDays = Math.floor(totalWeight / dailyG)
    const remainder = Math.round(totalWeight % dailyG)
    const lastDay = totalDays > 0 ? addDays(now, totalDays) : null

    // 2. 可饮用储备：ready + drinking 状态
    const readyBeans = beans.filter(
      (b) => b.status === 'ready' || b.status === 'drinking'
    )
    const readyWeight = readyBeans.reduce((sum, b) => sum + b.weight, 0)
    const readyCups = Math.floor(readyWeight / dailyG)
    const readyLastDay =
      readyCups > 0 ? addDays(now, readyCups) : null

    // 3. 即将过期预警
    const expiringSoon: ExpiringBean[] = []
    for (const bean of beans) {
      if (bean.status === 'finished') continue
      const expireDate = getExpireDate(bean.roastDate)
      const daysUntilExpire = differenceInDays(expireDate, now)
      if (daysUntilExpire <= WARNING_DAYS && daysUntilExpire > 0) {
        expiringSoon.push({ bean, daysUntilExpire })
      }
    }
    expiringSoon.sort((a, b) => a.daysUntilExpire - b.daysUntilExpire)

    return {
      totalWeight,
      totalDays,
      remainder,
      lastDay,
      readyCups,
      readyLastDay,
      expiringSoon,
    }
  }, [beans, dailyG])

  const hasExpiring = stats.expiringSoon.length > 0
  const mostUrgentDays =
    hasExpiring ? Math.min(...stats.expiringSoon.map((e) => e.daysUntilExpire)) : null
  const warningVariant =
    mostUrgentDays != null && mostUrgentDays < 3 ? 'danger' : 'warning'

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      {/* 1. 库存余量 */}
      <div className="stat-card rounded-2xl border border-slate-200 bg-white p-5 flex flex-col gap-1 shadow-sm">
        <div className="flex items-center gap-2 text-slate-500">
          <Package className="w-4 h-4 text-indigo-500" />
          <span className="text-sm font-medium">库存余量</span>
        </div>
        {stats.totalWeight > 0 ? (
          <>
            <p className="stat-number text-3xl font-semibold text-slate-900 leading-none">
              {stats.totalDays}
              <span className="text-lg font-medium text-slate-600 ml-0.5">天</span>
            </p>
            {stats.remainder > 0 && (
              <p className="text-xs text-slate-400 mt-1">余 {stats.remainder}g</p>
            )}
            {stats.lastDay && (
              <p className="text-xs text-slate-400 mt-0.5">
                喝到 {format(stats.lastDay, 'M月d日', { locale: zhCN })}
              </p>
            )}
          </>
        ) : (
          <p className="stat-number text-2xl font-medium text-slate-400">—</p>
        )}
      </div>

      {/* 2. 可饮用储备 */}
      <div className="stat-card rounded-2xl border border-slate-200 bg-white p-5 flex flex-col gap-1 shadow-sm">
        <div className="flex items-center gap-2 text-slate-500">
          <Coffee className="w-4 h-4 text-emerald-500" />
          <span className="text-sm font-medium">可饮用储备</span>
        </div>
        {stats.readyCups > 0 ? (
          <>
            <p className="stat-number text-3xl font-semibold text-slate-900 leading-none">
              {stats.readyCups}
              <span className="text-lg font-medium text-slate-600 ml-0.5">杯</span>
            </p>
            {stats.readyLastDay && (
              <p className="text-xs text-slate-400 mt-1">
                喝到 {format(stats.readyLastDay, 'M月d日', { locale: zhCN })}
              </p>
            )}
          </>
        ) : beans.length > 0 ? (
          <>
            <p className="stat-number text-2xl font-medium text-slate-400">0 杯</p>
            <p className="text-xs text-slate-400 mt-1">养豆中</p>
          </>
        ) : (
          <p className="stat-number text-2xl font-medium text-slate-400">—</p>
        )}
      </div>

      {/* 3. 即将过期预警 */}
      <div
        className={`stat-card rounded-2xl border p-5 flex flex-col gap-1 shadow-sm ${
          hasExpiring
            ? warningVariant === 'danger'
              ? 'border-rose-200 bg-rose-50/50'
              : 'border-amber-200 bg-amber-50/50'
            : 'border-slate-200 bg-white'
        }`}
      >
        <div className="flex items-center gap-2 text-slate-500">
          <AlertTriangle
            className={`w-4 h-4 ${hasExpiring ? (warningVariant === 'danger' ? 'text-rose-500' : 'text-amber-500') : 'text-slate-400'}`}
          />
          <span className="text-sm font-medium">状态预警</span>
        </div>
        {hasExpiring ? (
          <>
            <p
              className={`stat-number text-2xl font-semibold leading-none ${
                warningVariant === 'danger'
                  ? 'text-rose-700'
                  : 'text-amber-700'
              }`}
            >
              {stats.expiringSoon.length} 支即将过期
            </p>
            <button
              type="button"
              onClick={() => setExpiryExpanded((e) => !e)}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-600 mt-1 -ml-0.5"
            >
              {expiryExpanded ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  收起
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  查看详情
                </>
              )}
            </button>
            {expiryExpanded && (
              <ul className="mt-2 space-y-1.5 text-xs">
                {stats.expiringSoon.map(({ bean, daysUntilExpire }) => (
                  <li
                    key={bean.id}
                    className={`flex justify-between items-center py-1.5 px-2 rounded-lg ${
                      daysUntilExpire < 3
                        ? 'bg-rose-100/80 text-rose-800'
                        : 'bg-amber-100/80 text-amber-800'
                    }`}
                  >
                    <span className="truncate flex-1">
                      {bean.origin} {bean.farm}
                    </span>
                    <span className="shrink-0 font-mono ml-2">
                      剩{daysUntilExpire}天
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <p className="stat-number text-2xl font-medium text-slate-400 leading-none">
            无预警
          </p>
        )}
      </div>
    </div>
  )
}
