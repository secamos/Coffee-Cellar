import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { useStore } from '../store/useStore'
import { useOutingsStore } from '../store/outingsStore'
import { getAverageCuppingScore, getRemainingCups } from '../utils/beanLogic'
import {
  getConsumptionStats,
  getBeanCostPerCup,
  getStatsByFarm,
  getMonthlySpendingMerged,
} from '../utils/statsLogic'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import type { OutingRecord } from '../types/outing'

const EMPTY_OUTINGS: OutingRecord[] = []

export function Stats() {
  const beans = useStore((s) => s.beans)
  const consumptions = useStore((s) => s.consumptions)
  const outings = useOutingsStore((s) => s.outings) ?? EMPTY_OUTINGS
  const getBeanById = useStore((s) => s.getBeanById)
  const removeConsumption = useStore((s) => s.removeConsumption)
  const [showConsumptionDetail, setShowConsumptionDetail] = useState(false)

  const stats = useMemo(() => {
    const s = getConsumptionStats(beans ?? [], consumptions ?? [])
    return {
      totalGrams: Number.isFinite(s.totalGrams) ? s.totalGrams : 0,
      totalCups: Number.isFinite(s.totalCups) ? s.totalCups : 0,
      totalSpentOnBeans: Number.isFinite(s.totalSpentOnBeans) ? s.totalSpentOnBeans : 0,
      costPerCup: s.costPerCup,
    }
  }, [beans, consumptions])

  const consumptionList = useMemo(
    () =>
      [...(consumptions ?? [])].sort(
        (a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0)
      ),
    [consumptions]
  )

  const withScore = useMemo(
    () => beans.filter((b) => getAverageCuppingScore(b) != null),
    [beans]
  )
  const topByScore = useMemo(
    () =>
      [...withScore]
        .sort(
          (a, b) =>
            (getAverageCuppingScore(b) ?? 0) - (getAverageCuppingScore(a) ?? 0)
        )
        .slice(0, 10),
    [withScore]
  )

  const statsByFarm = useMemo(
    () => getStatsByFarm(beans ?? [], consumptions ?? [], getRemainingCups),
    [beans, consumptions]
  )

  const monthlySpending = useMemo(
    () => getMonthlySpendingMerged(beans ?? [], consumptions ?? [], outings),
    [beans, consumptions, outings]
  )

  return (
    <div>
      <h2 className="text-xl font-semibold text-stone-800 mb-6">统计</h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="p-4 rounded-xl border border-stone-200 bg-white">
          <h3 className="text-sm font-medium text-stone-500 mb-1">总消耗</h3>
          <p className="text-2xl font-semibold text-stone-800">
            {stats.totalGrams}g
          </p>
          <p className="text-sm text-stone-500">约 {stats.totalCups} 杯</p>
          {consumptionList.length > 0 && (
            <button
              type="button"
              onClick={() => setShowConsumptionDetail((v) => !v)}
              className="mt-2 flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
            >
              {showConsumptionDetail ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  收起明细
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  查看每杯明细
                </>
              )}
            </button>
          )}
          {showConsumptionDetail && consumptionList.length > 0 && (
            <div className="mt-3 pt-3 border-t border-stone-100">
              <p className="text-xs font-medium text-stone-500 mb-2">消耗明细</p>
              <ul className="space-y-1.5 max-h-64 overflow-y-auto">
                {consumptionList.map((c) => {
                  const bean = getBeanById(c.beanId)
                  return (
                    <li
                      key={c.id}
                      className="flex items-center justify-between gap-2 text-sm py-1"
                    >
                      <span className="text-stone-700 truncate min-w-0">
                        {format(new Date(c.date + 'T12:00:00'), 'M月d日', {
                          locale: zhCN,
                        })}{' '}
                        {bean?.name ?? '未知豆子'}
                      </span>
                      <span className="text-stone-500 shrink-0">{c.amount}g</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('确定删除这条消耗记录？对应豆子库存将加回。'))
                            removeConsumption(c.id)
                        }}
                        className="p-1 rounded text-stone-400 hover:text-red-600 hover:bg-red-50 shrink-0"
                        aria-label="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>
        <div className="p-4 rounded-xl border border-stone-200 bg-white">
          <h3 className="text-sm font-medium text-stone-500 mb-1">
            豆子总花费
          </h3>
          <p className="text-2xl font-semibold text-stone-800">
            ¥{(stats.totalSpentOnBeans ?? 0).toFixed(0)}
          </p>
        </div>
        <div className="p-4 rounded-xl border border-stone-200 bg-white">
          <h3 className="text-sm font-medium text-stone-500 mb-1">
            单杯价格
          </h3>
          <p className="text-2xl font-semibold text-stone-800">
            {stats.costPerCup != null
              ? `¥${stats.costPerCup.toFixed(1)}`
              : '—'}
          </p>
          <p className="text-xs text-stone-500 mt-0.5">
            总价÷总克数×15
          </p>
        </div>
      </div>

      <div className="p-4 rounded-xl border border-stone-200 bg-white mb-6">
        <h3 className="text-sm font-medium text-stone-700 mb-3">
          杯测高分豆子（均分 Top10）
        </h3>
        {topByScore.length === 0 ? (
          <p className="text-stone-500 text-sm">暂无杯测记录</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-stone-500 border-b border-stone-200">
                  <th className="pb-2 pr-4 font-medium">豆子名称</th>
                  <th className="pb-2 pr-4 font-medium text-right">评分</th>
                  <th className="pb-2 font-medium text-right">单价</th>
                </tr>
              </thead>
              <tbody>
                {topByScore.map((b) => (
                  <tr
                    key={b.id}
                    className="border-b border-stone-100 last:border-0"
                  >
                    <td className="py-2 pr-4 text-stone-800 truncate max-w-[200px]">
                      {b.name}
                    </td>
                    <td className="py-2 pr-4 text-right font-medium text-amber-700">
                      {getAverageCuppingScore(b)?.toFixed(1)} 分
                    </td>
                    <td className="py-2 text-right font-medium text-stone-800">
                      {getBeanCostPerCup(b) != null
                        ? `¥${getBeanCostPerCup(b)!.toFixed(1)}/杯`
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="p-4 rounded-xl border border-stone-200 bg-white mb-6">
        <h3 className="text-sm font-medium text-stone-700 mb-3">
          每月开支（最多12个月）
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-stone-500 border-b border-stone-200">
                <th className="pb-2 pr-4 font-medium">月份</th>
                <th className="pb-2 pr-4 font-medium text-right">豆子开支</th>
                <th className="pb-2 pr-4 font-medium text-right">外出开支</th>
                <th className="pb-2 font-medium text-right">合计</th>
              </tr>
            </thead>
            <tbody>
              {monthlySpending.map((row) => {
                const [y, m] = row.monthKey.split('-')
                const monthLabel = `${y}年${parseInt(m, 10)}月`
                return (
                  <tr
                    key={row.monthKey}
                    className="border-b border-stone-100 last:border-0"
                  >
                    <td className="py-2 pr-4 text-stone-800">{monthLabel}</td>
                    <td className="py-2 pr-4 text-right text-stone-600">
                      ¥{row.beanSpending}
                    </td>
                    <td className="py-2 pr-4 text-right text-stone-600">
                      ¥{row.outingSpending}
                    </td>
                    <td className="py-2 text-right font-medium text-stone-800">
                      ¥{row.total}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-4 rounded-xl border border-stone-200 bg-white mb-6">
        <h3 className="text-sm font-medium text-stone-700 mb-3">
          按庄园统计
        </h3>
        {statsByFarm.length === 0 ? (
          <p className="text-stone-500 text-sm">暂无豆子</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-stone-500 border-b border-stone-200">
                  <th className="pb-2 pr-4 font-medium">庄园</th>
                  <th className="pb-2 pr-4 font-medium text-right">豆种类数</th>
                  <th className="pb-2 pr-4 font-medium text-right">已饮用杯数</th>
                  <th className="pb-2 pr-4 font-medium text-right">待饮用杯数</th>
                  <th className="pb-2 font-medium text-right">总价格</th>
                </tr>
              </thead>
              <tbody>
                {statsByFarm.map((row) => (
                  <tr
                    key={row.farm}
                    className="border-b border-stone-100 last:border-0"
                  >
                    <td className="py-2 pr-4 text-stone-800">{row.farm}</td>
                    <td className="py-2 pr-4 text-right text-stone-600">
                      {row.beanCount}
                    </td>
                    <td className="py-2 pr-4 text-right text-stone-600">
                      {row.cupsConsumed}
                    </td>
                    <td className="py-2 pr-4 text-right text-stone-600">
                      {row.cupsRemaining}
                    </td>
                    <td className="py-2 text-right font-medium text-stone-800">
                      ¥{row.totalPrice.toFixed(0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-sm text-stone-400">
        后续可增加：风味分布、近 30 天消耗趋势图等
      </p>
    </div>
  )
}
