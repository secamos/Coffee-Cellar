/**
 * 首页焦点区：昨日 · 今日 · 明日 三区卡片
 */
import { format, addDays, startOfDay } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useStore } from '../../store/useStore'
import {
  getRecommendationForDate,
  getCuppingForDay,
  getCupPrice,
  formatDateKey,
} from '../../utils/calendarLogic'
import { getRemainingCups } from '../../utils/beanLogic'
import { ExtraCupForm } from './ExtraCupForm'
import { BeanPickerModal } from '../BeanPickerModal'
import { useState } from 'react'
import { Plus } from 'lucide-react'
import type { CoffeeBean } from '../../types'

type FocusCardType = 'yesterday' | 'today' | 'tomorrow'

interface FocusZoneCardsProps {
  onComplete: (beanId: string, dateStr: string) => void
  onSelectFromLibrary: (dateKey: string) => void
  onEditCupping?: (beanId: string, dateStr: string, cuppingId: string) => void
  onCancelConsumption?: (beanId: string, dateStr: string) => void
}

export function FocusZoneCards({
  onComplete,
  onSelectFromLibrary,
  onEditCupping,
  onCancelConsumption,
}: FocusZoneCardsProps) {
  const beans = useStore((s) => s.beans)
  useStore((s) => s.calendarSchedule) /* subscribe for re-render */
  useStore((s) => s.consumptions) /* subscribe for re-render */
  const getScheduleForDate = useStore((s) => s.getScheduleForDate)
  const getBeanById = useStore((s) => s.getBeanById)
  const getConsumptionsByBeanId = useStore((s) => s.getConsumptionsByBeanId)
  const getRestingDaysForRoaster = useStore((s) => s.getRestingDaysForRoaster)
  const addExtraBeanToDay = useStore((s) => s.addExtraBeanToDay)

  const today = startOfDay(new Date())
  const yesterday = addDays(today, -1)
  const tomorrow = addDays(today, 1)
  const yesterdayKey = formatDateKey(yesterday)
  const todayKey = formatDateKey(today)
  const tomorrowKey = formatDateKey(tomorrow)

  const [todayShowAddExtra, setTodayShowAddExtra] = useState(false)
  const [todayExtraBean, setTodayExtraBean] = useState<CoffeeBean | null>(null)
  const [yesterdayShowAddExtra, setYesterdayShowAddExtra] = useState(false)
  const [yesterdayExtraBean, setYesterdayExtraBean] = useState<CoffeeBean | null>(null)
  const [yesterdayAddRecordBean, setYesterdayAddRecordBean] = useState<CoffeeBean | null>(null)
  const [yesterdayShowBeanPicker, setYesterdayShowBeanPicker] = useState(false)

  const hasConsumedOnDate = (beanId: string, dateKey: string) =>
    getConsumptionsByBeanId(beanId).some((c) => c.date === dateKey)

  // 昨日：只展示排班的豆子（过去日不推荐）
  const yesterdaySchedule = getScheduleForDate(yesterdayKey)
  const yesterdayBean =
    yesterdaySchedule.beanId != null
      ? getBeanById(yesterdaySchedule.beanId) ?? null
      : null
  const yesterdayConsumed = yesterdayBean
    ? hasConsumedOnDate(yesterdayBean.id, yesterdayKey)
    : false
  const yesterdayCupping =
    yesterdayBean ? getCuppingForDay(yesterdayBean, yesterdayKey) : undefined

  // 今日：排班或推荐
  const todaySchedule = getScheduleForDate(todayKey)
  const yesterdayBeanId = yesterdayBean?.id ?? null
  const todayRecommendation = getRecommendationForDate(
    beans,
    today,
    yesterdayBeanId,
    getRestingDaysForRoaster
  )
  const todayBean =
    todaySchedule.beanId != null
      ? getBeanById(todaySchedule.beanId) ?? null
      : todayRecommendation
  const todayConsumed = todayBean
    ? hasConsumedOnDate(todayBean.id, todayKey)
    : false
  const todayCupping = todayBean
    ? getCuppingForDay(todayBean, todayKey)
    : undefined

  // 明日：排班或推荐
  const tomorrowSchedule = getScheduleForDate(tomorrowKey)
  const tomorrowRecommendation = getRecommendationForDate(
    beans,
    tomorrow,
    todayBean?.id ?? null,
    getRestingDaysForRoaster
  )
  const tomorrowBean =
    tomorrowSchedule.beanId != null
      ? getBeanById(tomorrowSchedule.beanId) ?? null
      : tomorrowRecommendation
  const tomorrowConsumed = tomorrowBean
    ? hasConsumedOnDate(tomorrowBean.id, tomorrowKey)
    : false

  const handleTodayAddExtraSelect = (bean: CoffeeBean) => {
    addExtraBeanToDay(todayKey, bean.id)
    setTodayExtraBean(bean)
  }
  const handleTodayExtraComplete = (bean: CoffeeBean) => {
    onComplete(bean.id, todayKey)
    setTodayExtraBean(null)
  }
  const handleYesterdayAddExtraSelect = (bean: CoffeeBean) => {
    addExtraBeanToDay(yesterdayKey, bean.id)
    setYesterdayExtraBean(bean)
  }
  const handleYesterdayExtraComplete = (bean: CoffeeBean) => {
    onComplete(bean.id, yesterdayKey)
    setYesterdayExtraBean(null)
  }

  const cards: { type: FocusCardType; day: Date; dateKey: string }[] = [
    { type: 'yesterday', day: yesterday, dateKey: yesterdayKey },
    { type: 'today', day: today, dateKey: todayKey },
    { type: 'tomorrow', day: tomorrow, dateKey: tomorrowKey },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      {cards.map(({ type, day, dateKey }) => {
        const isTodayCard = type === 'today'
        const isYesterday = type === 'yesterday'
        const isTomorrow = type === 'tomorrow'

        const bean =
          type === 'yesterday'
            ? yesterdayBean
            : type === 'today'
              ? todayBean
              : tomorrowBean
        const consumed =
          type === 'yesterday'
            ? yesterdayConsumed
            : type === 'today'
              ? todayConsumed
              : tomorrowConsumed
        const cupping =
          type === 'yesterday'
            ? yesterdayCupping
            : type === 'today'
              ? todayCupping
              : undefined

        return (
          <div
            key={dateKey}
            className={`rounded-2xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md flex flex-col ${
              isTodayCard
                ? 'border-indigo-300 ring-1 ring-indigo-100 sm:ring-2'
                : 'border-slate-200'
            }`}
          >
            <p className="text-sm text-slate-500 mb-0.5">
              {format(day, 'M月d日 EEEE', { locale: zhCN })}
            </p>
            {isTodayCard && (
              <span className="inline-flex text-xs font-medium text-indigo-600 mb-3">
                [今日]
              </span>
            )}

            {!bean && (
              <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
                {isYesterday ? (
                  <div className="space-y-2 w-full">
                    <p className="text-xs text-amber-600">未饮用</p>
                    <button
                      type="button"
                      onClick={() => setYesterdayShowBeanPicker(true)}
                      className="w-full flex items-center justify-center py-2 rounded-xl border border-dashed border-slate-200 text-slate-500 text-sm font-medium hover:border-indigo-300 hover:text-indigo-600"
                    >
                      {yesterdayAddRecordBean ? `${yesterdayAddRecordBean.roaster} · ${yesterdayAddRecordBean.farm}` : '选择豆子'}
                    </button>
                    {yesterdayAddRecordBean && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            onComplete(yesterdayAddRecordBean.id, yesterdayKey)
                            setYesterdayAddRecordBean(null)
                          }}
                          className="flex-1 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
                        >
                          确认
                        </button>
                        <button
                          type="button"
                          onClick={() => setYesterdayAddRecordBean(null)}
                          className="flex-1 py-2 rounded-xl border border-dashed border-slate-200 text-slate-500 text-sm font-medium hover:border-indigo-300 hover:text-indigo-600"
                        >
                          取消
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-slate-400 mb-4">当日无安排</p>
                    <button
                      type="button"
                      onClick={() => onSelectFromLibrary(dateKey)}
                      className="py-2 px-4 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
                    >
                      {beans.length === 0 ? '去豆库添加' : '安排豆子'}
                    </button>
                  </>
                )}
              </div>
            )}

            {bean && (
              <>
                <p className="text-sm font-medium text-indigo-600">{bean.roaster}</p>
                <p className="text-lg font-semibold text-slate-900 leading-tight">
                  {bean.farm}
                </p>
                <p className="text-sm text-slate-500 mb-2">
                  {bean.process} · {bean.variety}
                </p>
                <div className="flex items-center gap-2 text-sm font-mono text-slate-600 mb-4">
                  {getCupPrice(bean) != null && (
                    <span>¥{getCupPrice(bean)}</span>
                  )}
                  {getCupPrice(bean) != null && (
                    <span className="text-slate-300">·</span>
                  )}
                  <span>剩 {getRemainingCups(bean)} 杯</span>
                </div>

                {isYesterday && (
                  <>
                    {consumed ? (
                      <div className="space-y-2">
                        {cupping && (
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-medium ${
                                cupping.totalScore >= 90
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : cupping.totalScore >= 85
                                    ? 'bg-indigo-100 text-indigo-700'
                                    : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {cupping.totalScore} 分
                            </span>
                            {cupping.flavorTags?.slice(0, 3).length > 0 && (
                              <span className="text-xs text-slate-500">
                                {cupping.flavorTags.slice(0, 3).join(' · ')}
                              </span>
                            )}
                            {onEditCupping && (
                              <button
                                type="button"
                                onClick={() =>
                                  onEditCupping(bean.id, dateKey, cupping.id)
                                }
                                className="text-xs text-slate-500 hover:text-indigo-600 hover:underline"
                              >
                                编辑杯测
                              </button>
                            )}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => setYesterdayShowAddExtra(true)}
                          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-slate-200 text-slate-500 text-sm font-medium hover:border-indigo-300 hover:text-indigo-600"
                        >
                          <Plus className="w-4 h-4" />
                          追加一杯
                        </button>
                        {onCancelConsumption && (
                          <button
                            type="button"
                            onClick={() =>
                              onCancelConsumption(bean.id, dateKey)
                            }
                            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-slate-200 text-slate-500 text-sm font-medium hover:border-indigo-300 hover:text-indigo-600"
                          >
                            取消饮用
                          </button>
                        )}
                        {yesterdayShowAddExtra && (
                          <ExtraCupForm
                            beans={beans.filter((b) => b.id !== bean.id)}
                            dateStr={yesterdayKey}
                            onSelect={handleYesterdayAddExtraSelect}
                            onComplete={handleYesterdayExtraComplete}
                            selectedBean={yesterdayExtraBean}
                            onClearSelection={() => setYesterdayExtraBean(null)}
                          />
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs text-amber-600">未饮用</p>
                        <button
                          type="button"
                          onClick={() => setYesterdayShowBeanPicker(true)}
                          className="w-full flex items-center justify-center py-2 rounded-xl border border-dashed border-slate-200 text-slate-500 text-sm font-medium hover:border-indigo-300 hover:text-indigo-600"
                        >
                          {yesterdayAddRecordBean ? `${yesterdayAddRecordBean.roaster} · ${yesterdayAddRecordBean.farm}` : '选择豆子'}
                        </button>
                        {yesterdayAddRecordBean && (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                onComplete(yesterdayAddRecordBean.id, yesterdayKey)
                                setYesterdayAddRecordBean(null)
                              }}
                              className="flex-1 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
                            >
                              确认
                            </button>
                            <button
                              type="button"
                              onClick={() => setYesterdayAddRecordBean(null)}
                              className="flex-1 py-2 rounded-xl border border-dashed border-slate-200 text-slate-500 text-sm font-medium hover:border-indigo-300 hover:text-indigo-600"
                            >
                              取消
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                {isTodayCard && !consumed && (
                  <div className="mt-auto space-y-2">
                    <button
                      type="button"
                      onClick={() => onComplete(bean.id, dateKey)}
                      className="w-full py-3 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
                    >
                      完成饮用
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectFromLibrary(dateKey)}
                      className="w-full flex items-center justify-center py-2 rounded-xl border border-dashed border-slate-200 text-slate-500 text-sm font-medium hover:border-indigo-300 hover:text-indigo-600"
                    >
                      更换豆子
                    </button>
                  </div>
                )}

                {isTodayCard && consumed && (
                  <div className="mt-auto space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-400 text-sm text-center">
                        已饮用
                      </span>
                      {cupping && onEditCupping && (
                        <button
                          type="button"
                          onClick={() =>
                            onEditCupping(bean.id, dateKey, cupping.id)
                          }
                          className="text-xs text-indigo-600 hover:underline"
                        >
                          编辑杯测
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setTodayShowAddExtra(true)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-slate-200 text-slate-500 text-sm font-medium hover:border-indigo-300 hover:text-indigo-600"
                    >
                      <Plus className="w-4 h-4" />
                      追加一杯
                    </button>
                    {todayShowAddExtra && (
                      <ExtraCupForm
                        beans={beans.filter((b) => b.id !== bean.id)}
                        dateStr={todayKey}
                        onSelect={handleTodayAddExtraSelect}
                        onComplete={handleTodayExtraComplete}
                        selectedBean={todayExtraBean}
                        onClearSelection={() => setTodayExtraBean(null)}
                      />
                    )}
                  </div>
                )}

                {isTomorrow && (
                  <div className="mt-auto">
                    <button
                      type="button"
                      onClick={() => onSelectFromLibrary(dateKey)}
                      className="w-full flex items-center justify-center py-2 rounded-xl border border-dashed border-slate-200 text-slate-500 text-sm font-medium hover:border-indigo-300 hover:text-indigo-600"
                    >
                      {tomorrowBean ? '更换豆子' : '安排豆子'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )
      })}
      {yesterdayShowBeanPicker && (
        <BeanPickerModal
          dateKey={yesterdayKey}
          beans={beans.filter((b) => b.weight >= 15 && b.status !== 'finished')}
          onSelect={(bean) => {
            setYesterdayAddRecordBean(bean)
            setYesterdayShowBeanPicker(false)
          }}
          onClose={() => setYesterdayShowBeanPicker(false)}
        />
      )}
    </div>
  )
}
