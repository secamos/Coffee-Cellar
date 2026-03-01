import { format, addDays, startOfDay } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { isToday } from 'date-fns'
import { useStore } from '../../store/useStore'
import {
  getRecommendationForDate,
  getCuppingForDay,
  getReplaceCandidatesForDate,
} from '../../utils/calendarLogic'
import { getRestingDaysRemaining } from '../../utils/beanLogic'
import { DayBeanCard } from './DayBeanCard'
import { RestDayCard } from './RestDayCard'
import { ExtraCupForm } from './ExtraCupForm'
import { useState } from 'react'
import { Plus, Shuffle } from 'lucide-react'

interface CalendarDayProps {
  day: Date
  dateKey: string
  yesterdayBeanId: string | null
  onComplete: (beanId: string, dateStr: string) => void
  onSkip: (dateKey: string) => void
  onReplaceWithRandom: (
    dateKey: string,
    currentBeanId: string,
    yesterdayBeanId: string | null
  ) => void
  onSelectFromLibrary: (dateKey: string) => void
  onEditCupping?: (beanId: string, dateStr: string, cuppingId: string) => void
  onCancelConsumption?: (beanId: string, dateStr: string) => void
}

export function CalendarDay({
  day,
  dateKey,
  yesterdayBeanId,
  onComplete,
  onSkip,
  onReplaceWithRandom,
  onSelectFromLibrary,
  onEditCupping,
  onCancelConsumption,
}: CalendarDayProps) {
  const beans = useStore((s) => s.beans)
  useStore((s) => s.calendarSchedule) /* subscribe for re-render */
  useStore((s) => s.consumptions) /* subscribe for re-render */
  const getScheduleForDate = useStore((s) => s.getScheduleForDate)
  const addExtraBeanToDay = useStore((s) => s.addExtraBeanToDay)
  const getBeanById = useStore((s) => s.getBeanById)
  const getConsumptionsByBeanId = useStore((s) => s.getConsumptionsByBeanId)
  const getRestingDaysForRoaster = useStore((s) => s.getRestingDaysForRoaster)

  const schedule = getScheduleForDate(dateKey)
  const [showAddExtra, setShowAddExtra] = useState(false)
  const [extraBean, setExtraBean] = useState<ReturnType<typeof getBeanById>>(
    undefined
  )

  const today = isToday(day)
  const todayStart = startOfDay(new Date())
  const isPast = startOfDay(day) < todayStart
  const isYesterday = startOfDay(day).getTime() === addDays(todayStart, -1).getTime()
  /** 昨日、今日支持补录多杯 */
  const canAddExtra = today || isYesterday
  /** 未来日期禁用完成；昨日、今日支持补录 */
  const isFuture = startOfDay(day) > todayStart

  const recommendation =
    schedule.beanId !== undefined && schedule.beanId !== null
      ? getBeanById(schedule.beanId) ?? null
      : isPast
        ? null
        : getRecommendationForDate(
            beans,
            day,
            yesterdayBeanId,
            getRestingDaysForRoaster
          )

  const hasConsumedOnDate = (beanId: string) =>
    getConsumptionsByBeanId(beanId).some((c) => c.date === dateKey)

  const mainBean = schedule.beanId ? getBeanById(schedule.beanId) : recommendation
  const mainConsumed = mainBean ? hasConsumedOnDate(mainBean.id) : false
  const mainCupping = mainBean ? getCuppingForDay(mainBean, dateKey) : undefined

  const isEmpty = !schedule.beanId && !recommendation && schedule.extraBeanIds.length === 0

  const tomorrowRec =
    !isPast &&
    getRecommendationForDate(
      beans,
      addDays(day, 1),
      mainBean?.id ?? null,
      getRestingDaysForRoaster
    )
  const tomorrowHint = tomorrowRec
    ? `养豆中，明日可喝${tomorrowRec.origin}${tomorrowRec.farm}`
    : undefined

  const currentBeanForReplace = mainBean ?? recommendation ?? null
  const canReplaceWithRandom =
    !isPast &&
    currentBeanForReplace &&
    !mainConsumed &&
    getReplaceCandidatesForDate(
      beans,
      day,
      yesterdayBeanId,
      currentBeanForReplace.id,
      getRestingDaysForRoaster
    ).length > 0

  const handleComplete = (bean: NonNullable<typeof mainBean>) => {
    onComplete(bean.id, dateKey)
  }

  const handleAddExtraSelect = (bean: import('../../types').CoffeeBean) => {
    addExtraBeanToDay(dateKey, bean.id)
    setExtraBean(bean)
  }

  const handleExtraComplete = (bean: import('../../types').CoffeeBean) => {
    onComplete(bean.id, dateKey)
    setExtraBean(undefined)
  }

  return (
    <div
      className={`min-w-[200px] p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow ${
        today ? 'border-l-4 border-l-indigo-500' : ''
      }`}
    >
      <p className="text-sm text-slate-400 mb-2">
        {format(day, 'M月d日 EEEE', { locale: zhCN })}
        {today && <span className="ml-1 text-indigo-600">今日</span>}
      </p>

      {schedule.rest && (
        <RestDayCard tomorrowHint={tomorrowHint} />
      )}

      {!schedule.rest && isEmpty && (
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <p className="text-sm text-slate-400 mb-2">
            {isPast && !isYesterday ? '当日无安排' : today ? '今日无安排' : '昨日无安排'}
          </p>
          {(today || isYesterday) && (
            <button
              type="button"
              onClick={() => onSelectFromLibrary(dateKey)}
              className="py-2 px-3 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700"
            >
              从豆库选择
            </button>
          )}
        </div>
      )}

      {!schedule.rest && mainBean && !mainConsumed && (
        <>
          <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            {canReplaceWithRandom && (
              <button
                type="button"
                onClick={() =>
                  onReplaceWithRandom(dateKey, mainBean.id, yesterdayBeanId)
                }
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600"
              >
                <Shuffle className="w-3.5 h-3.5" />
                换一杯
              </button>
            )}
            {!isPast && (
              <button
                type="button"
                onClick={() => onSelectFromLibrary(dateKey)}
                className="text-xs text-slate-500 hover:text-indigo-600"
              >
                更换豆子
              </button>
            )}
          </div>
          <DayBeanCard
            bean={mainBean}
            completeDisabled={isFuture}
            isResting={mainBean.status === 'resting'}
            restingDaysLeft={getRestingDaysRemaining(
              mainBean.roastDate,
              day,
              getRestingDaysForRoaster(mainBean.roaster)
            )}
            onComplete={() => handleComplete(mainBean)}
            onSkip={() => onSkip(dateKey)}
          />
        </>
      )}

      {!schedule.rest && mainBean && mainConsumed && (
        <>
        <DayBeanCard
          bean={mainBean}
          consumed
          cupping={mainCupping}
          isResting={mainBean.status === 'resting'}
          restingDaysLeft={getRestingDaysRemaining(
            mainBean.roastDate,
            day,
            getRestingDaysForRoaster(mainBean.roaster)
          )}
          onComplete={() => {}}
          onEditCupping={
            mainCupping && onEditCupping
              ? () => onEditCupping(mainBean.id, dateKey, mainCupping.id)
              : undefined
          }
          onCancelConsumption={
            onCancelConsumption
              ? () => onCancelConsumption(mainBean.id, dateKey)
              : undefined
          }
        />
        {canAddExtra && (
          <>
            <button
              type="button"
              onClick={() => setShowAddExtra(true)}
              className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 rounded-xl border border-dashed border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 text-sm"
            >
              <Plus className="w-4 h-4" />
              追加一杯
            </button>
            {showAddExtra && (
              <ExtraCupForm
                beans={beans.filter((b) => b.id !== mainBean.id)}
                dateStr={dateKey}
                onSelect={handleAddExtraSelect}
                onComplete={handleExtraComplete}
                selectedBean={extraBean ?? null}
                onClearSelection={() => setExtraBean(undefined)}
              />
            )}
          </>
        )}
        </>
      )}

      {!schedule.rest && !mainBean && recommendation && (
        <>
          <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            {canReplaceWithRandom && (
              <button
                type="button"
                onClick={() =>
                  onReplaceWithRandom(
                    dateKey,
                    recommendation.id,
                    yesterdayBeanId
                  )
                }
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600"
              >
                <Shuffle className="w-3.5 h-3.5" />
                换一杯
              </button>
            )}
            {!isPast && (
              <button
                type="button"
                onClick={() => onSelectFromLibrary(dateKey)}
                className="text-xs text-slate-500 hover:text-indigo-600"
              >
                更换豆子
              </button>
            )}
          </div>
          <DayBeanCard
            bean={recommendation}
            completeDisabled={isFuture}
            isResting={recommendation.status === 'resting'}
            restingDaysLeft={getRestingDaysRemaining(
              recommendation.roastDate,
              day,
              getRestingDaysForRoaster(recommendation.roaster)
            )}
            onComplete={() => handleComplete(recommendation)}
            onSkip={() => onSkip(dateKey)}
          />
        </>
      )}

      </div>
  )
}
