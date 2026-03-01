import { addDays, startOfWeek } from 'date-fns'
import { formatDateKey } from '../../utils/calendarLogic'
import { CalendarDay } from './CalendarDay'

interface CalendarGridProps {
  weekAnchor: Date
  /** 每日实际展示的 beanId（用于连续去重：昨日展示的豆子） */
  dayDisplayBeanIds: Record<string, string | null>
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

/* eslint-disable react-refresh/only-export-components -- getWeekDays shared with Calendar */
export function getWeekDays(anchor: Date): Date[] {
  const start = startOfWeek(anchor, { weekStartsOn: 1 })
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export function CalendarGrid({
  weekAnchor,
  dayDisplayBeanIds,
  onComplete,
  onSkip,
  onReplaceWithRandom,
  onSelectFromLibrary,
  onEditCupping,
  onCancelConsumption,
}: CalendarGridProps) {
  const days = getWeekDays(weekAnchor)

  return (
    <div className="overflow-x-auto">
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: 'repeat(7, minmax(200px, 1fr))' }}
      >
        {days.map((day) => {
        const dateKey = formatDateKey(day)
        const yesterday = addDays(day, -1)
        const yesterdayKey = formatDateKey(yesterday)
        const yesterdayBeanId = dayDisplayBeanIds[yesterdayKey] ?? null
        return (
          <CalendarDay
            key={dateKey}
            day={day}
            dateKey={dateKey}
            yesterdayBeanId={yesterdayBeanId}
            onComplete={onComplete}
            onSkip={onSkip}
            onReplaceWithRandom={onReplaceWithRandom}
            onSelectFromLibrary={onSelectFromLibrary}
            onEditCupping={onEditCupping}
            onCancelConsumption={onCancelConsumption}
          />
        )
      })}
      </div>
    </div>
  )
}
