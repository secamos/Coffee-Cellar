import { useState } from 'react'
import { parseISO } from 'date-fns'
import { Coffee } from 'lucide-react'
import { useStore } from '../../store/useStore'
import type { CoffeeBean } from '../../types'
import { getCupPrice } from '../../utils/calendarLogic'
import type { BeanStatusInfo } from '../../utils/beanPickerUtils'
import {
  getBeanStatusForDate,
  sortBeansForPicker,
} from '../../utils/beanPickerUtils'

interface ExtraCupFormProps {
  beans: CoffeeBean[]
  dateStr?: string
  onSelect: (bean: CoffeeBean) => void
  onComplete: (bean: CoffeeBean) => void
  selectedBean: CoffeeBean | null
  onClearSelection?: () => void
}

export function ExtraCupForm({
  beans,
  dateStr,
  onSelect,
  onComplete,
  selectedBean,
  onClearSelection,
}: ExtraCupFormProps) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const getRestingDaysForRoaster = useStore((s) => s.getRestingDaysForRoaster)
  const targetDate = dateStr ? parseISO(dateStr) : new Date()
  const getRestingSafe = (roaster: string) => {
    try {
      return typeof getRestingDaysForRoaster === 'function'
        ? getRestingDaysForRoaster(roaster)
        : 30
    } catch {
      return 30
    }
  }
  const getStatusInfo = (bean: CoffeeBean) =>
    getBeanStatusForDate(bean, targetDate, getRestingSafe)

  const filtered = search.trim()
    ? beans.filter(
        (b) =>
          b.weight >= 15 &&
          b.status !== 'finished' &&
          (b.name.toLowerCase().includes(search.toLowerCase()) ||
            b.roaster.toLowerCase().includes(search.toLowerCase()) ||
            b.farm.toLowerCase().includes(search.toLowerCase()))
      )
    : beans.filter((b) => b.weight >= 15 && b.status !== 'finished')
  const sortedFiltered = sortBeansForPicker(filtered, getStatusInfo)

  return (
    <div className="border-t border-slate-200 pt-3 mt-3">
      <p className="text-xs text-slate-400 mb-2">───── 追加 ─────</p>
      {!selectedBean ? (
        <>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setOpen(true)}
            placeholder="搜索豆库..."
            className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:ring-2 focus:ring-indigo-500"
          />
          {open && (
            <ul className="mt-1 max-h-32 overflow-y-auto border border-slate-200 rounded-lg bg-white shadow">
              {sortedFiltered.slice(0, 8).map((b) => {
                let status: BeanStatusInfo
                try {
                  status = getStatusInfo(b)
                } catch {
                  status = {
                    label: '—',
                    colorClass: 'bg-slate-100 text-slate-600',
                    Icon: Coffee,
                  }
                }
                const StatusIcon = status?.Icon
                return (
                  <li key={b.id}>
                    <button
                      type="button"
                      className="w-full text-left px-2 py-1.5 text-sm hover:bg-indigo-50 flex items-center justify-between gap-2"
                      onClick={() => {
                        onSelect(b)
                        setOpen(false)
                        setSearch('')
                      }}
                    >
                      <span className="truncate">
                        {b.roaster} · {b.farm}
                      </span>
                      <span
                        className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.colorClass}`}
                      >
                        {StatusIcon && typeof StatusIcon === 'function' ? (
                          <StatusIcon className="w-3 h-3" />
                        ) : null}
                        {status.label}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </>
      ) : (
        <div className="space-y-1">
          <p className="text-sm text-indigo-600">{selectedBean.roaster}</p>
          <p className="text-base font-bold text-slate-900">{selectedBean.farm}</p>
          <p className="text-sm text-slate-500">
            {selectedBean.process} · {selectedBean.variety}
          </p>
          {getCupPrice(selectedBean) != null && (
            <p className="text-sm text-slate-700 font-mono">
              单杯 ¥{getCupPrice(selectedBean)}
            </p>
          )}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => onComplete(selectedBean)}
              className="w-full py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
            >
              ✓ 完成饮用
            </button>
            {onClearSelection && (
              <button
                type="button"
                onClick={onClearSelection}
                className="w-full py-1 text-xs text-slate-400 hover:underline mt-1"
              >
                重选
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
