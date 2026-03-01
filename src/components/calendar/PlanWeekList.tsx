/**
 * 饮用计划：以周为单位的列表，展示每日排班与是否已饮用（与豆库联动，无排班时显示推荐豆）
 */
import { format, addDays, startOfDay, startOfWeek } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useStore } from '../../store/useStore'
import { formatDateKey, getRecommendationForDate } from '../../utils/calendarLogic'
import type { CoffeeBean } from '../../types'

const WEEK_STARTS_ON = 1

interface PlanWeekListProps {
  weekAnchor: Date
  onSelectFromLibrary: (dateKey: string) => void
  onEditCupping: (beanId: string, dateStr: string, cuppingId: string) => void
}

interface DayRecommendation {
  dateKey: string
  date: Date
  bean: CoffeeBean | null
  isRest: boolean
  consumed: boolean
  cuppingId?: string
  cuppingTotalScore?: number
}

export function PlanWeekList({
  weekAnchor,
  onSelectFromLibrary,
  onEditCupping,
}: PlanWeekListProps) {
  const beans = useStore((s) => s.beans)
  useStore((s) => s.calendarSchedule) /* subscribe for re-render */
  useStore((s) => s.consumptions) /* subscribe for re-render */
  const getScheduleForDate = useStore((s) => s.getScheduleForDate)
  const getBeanById = useStore((s) => s.getBeanById)
  const getConsumptionsByBeanId = useStore((s) => s.getConsumptionsByBeanId)
  const getRestingDaysForRoaster = useStore((s) => s.getRestingDaysForRoaster)

  const start = startOfWeek(startOfDay(weekAnchor), {
    weekStartsOn: WEEK_STARTS_ON,
  })
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i))

  const hasConsumedOnDate = (beanId: string, dateKey: string) =>
    getConsumptionsByBeanId(beanId).some((c) => c.date === dateKey)

  const today = startOfDay(new Date())
  const list: DayRecommendation[] = days.reduce<DayRecommendation[]>(
    (acc, day) => {
      const dateKey = formatDateKey(day)
      const entry = getScheduleForDate(dateKey)
      const isPast = day < today
      let bean: CoffeeBean | null =
        entry.beanId != null ? getBeanById(entry.beanId) ?? null : null
      if (!bean && beans.length > 0 && !isPast) {
        const prevDayBeanId = acc.length > 0 ? acc[acc.length - 1].bean?.id ?? null : null
        bean =
          getRecommendationForDate(
            beans,
            day,
            prevDayBeanId,
            getRestingDaysForRoaster
          ) ?? null
      }
      const consumed = bean ? hasConsumedOnDate(bean.id, dateKey) : false
      const cupping = bean?.cuppings?.find((c) => c.date === dateKey)
      acc.push({
        dateKey,
        date: day,
        bean,
        isRest: entry.rest ?? false,
        consumed,
        cuppingId: cupping?.id,
        cuppingTotalScore: cupping?.totalScore,
      })
      return acc
    },
    []
  )

  return (
    <ul className="space-y-2">
      {list.map((r) => (
        <li
          key={r.dateKey}
          className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="w-24 shrink-0 text-sm text-slate-600">
            {format(r.date, 'M/d EEE', { locale: zhCN })}
          </div>
          <div className="flex-1 min-w-0">
            {r.bean ? (
              <div className="space-y-0.5">
                <span className="font-medium text-slate-800 truncate block">
                  {r.bean.roaster} · {r.bean.farm}
                </span>
                <span className="text-xs text-slate-500 truncate block">
                  {r.bean.process} · {r.bean.variety}
                </span>
              </div>
            ) : r.isRest ? (
              <span className="text-slate-400 text-sm">休息</span>
            ) : (
              <button
                type="button"
                onClick={() => onSelectFromLibrary(r.dateKey)}
                className="text-indigo-600 hover:underline text-sm"
              >
                安排豆子
              </button>
            )}
          </div>
          <div className="shrink-0 flex items-center gap-2">
            {r.bean && r.consumed && (
              <>
                {r.cuppingTotalScore != null && (
                  <span className="text-xs font-mono text-slate-500">
                    已完成 {r.cuppingTotalScore} 分
                  </span>
                )}
                {r.cuppingId && (
                  <button
                    type="button"
                    onClick={() =>
                      onEditCupping(r.bean!.id, r.dateKey, r.cuppingId!)
                    }
                    className="text-xs text-indigo-600 hover:underline"
                  >
                    编辑杯测
                  </button>
                )}
              </>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
