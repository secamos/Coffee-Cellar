import { createPortal } from 'react-dom'
import { parseISO } from 'date-fns'
import { Coffee } from 'lucide-react'
import { useStore } from '../store/useStore'
import type { CoffeeBean } from '../types'
import type { BeanStatusInfo } from '../utils/beanPickerUtils'
import {
  getBeanStatusForDate,
  sortBeansForPicker,
} from '../utils/beanPickerUtils'

interface BeanPickerModalProps {
  /** 用于养豆状态计算的日期，yyyy-MM-dd */
  dateKey: string
  beans: CoffeeBean[]
  onSelect: (bean: CoffeeBean) => void
  onClose: () => void
}

export function BeanPickerModal({
  dateKey,
  beans,
  onSelect,
  onClose,
}: BeanPickerModalProps) {
  const getRestingDaysForRoaster = useStore((s) => s.getRestingDaysForRoaster)
  const targetDate = parseISO(dateKey)
  const getRestingSafe = (r: string) => {
    try {
      return typeof getRestingDaysForRoaster === 'function'
        ? getRestingDaysForRoaster(r)
        : 30
    } catch {
      return 30
    }
  }
  const getStatusInfo = (bean: CoffeeBean) =>
    getBeanStatusForDate(bean, targetDate, getRestingSafe)
  const sortedBeans = sortBeansForPicker(beans, getStatusInfo)

  const modal = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-lg max-w-sm w-full p-4 max-h-[70vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm font-medium text-slate-700 mb-2">从豆库选择</p>
        <ul className="space-y-1">
          {sortedBeans.map((b) => {
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
            const StatusIcon = status.Icon
            return (
              <li key={b.id}>
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-indigo-50 text-slate-800 flex items-center justify-between gap-2"
                  onClick={() => onSelect(b)}
                >
                  <span className="truncate">
                    {b.roaster} · {b.farm}
                  </span>
                  {status.label && (
                    <span
                      className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.colorClass}`}
                    >
                      {StatusIcon && typeof StatusIcon === 'function' ? (
                        <StatusIcon className="w-3 h-3" />
                      ) : null}
                      {status.label}
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full py-2 rounded-xl border border-dashed border-slate-200 text-slate-500 text-sm font-medium hover:border-indigo-300 hover:text-indigo-600"
        >
          取消
        </button>
      </div>
    </div>
  )
  return createPortal(modal, document.body)
}
