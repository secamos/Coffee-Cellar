import { useState, useRef, useEffect } from 'react'
import type { CoffeeBean, CuppingRecord } from '../../types'
import { getCupPrice } from '../../utils/calendarLogic'
import { getRemainingCups } from '../../utils/beanLogic'
import { FlavorTagPills } from '../FlavorTagPills'
import { Plus, MoreHorizontal, Coffee } from 'lucide-react'

interface DayBeanCardProps {
  bean: CoffeeBean
  consumed?: boolean
  cupping?: CuppingRecord
  showAddExtra?: boolean
  completeDisabled?: boolean
  isResting?: boolean
  restingDaysLeft?: number
  onComplete: () => void
  onAddExtra?: () => void
  onSkip?: () => void
  /** 饮用后：编辑杯测记录 */
  onEditCupping?: () => void
  /** 饮用后：取消饮用态 */
  onCancelConsumption?: () => void
}

export function DayBeanCard({
  bean,
  consumed = false,
  cupping,
  showAddExtra = false,
  completeDisabled = false,
  isResting = false,
  restingDaysLeft = 0,
  onComplete,
  onAddExtra,
  onSkip,
  onEditCupping,
  onCancelConsumption,
}: DayBeanCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const cupPrice = getCupPrice(bean)
  const cups = getRemainingCups(bean)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="space-y-1 mb-4">
      <h3 className="text-lg font-semibold text-slate-900 leading-tight">
        {bean.farm}
      </h3>
      <p className="text-sm font-medium text-indigo-600">{bean.roaster}</p>
      <p className="text-sm text-slate-500">
        {bean.process} · {bean.variety}
      </p>
      <div className="flex items-center gap-2 text-sm font-mono text-slate-600 pt-1">
        {cupPrice != null && <span>¥{cupPrice}</span>}
        {cupPrice != null && cups >= 0 && (
          <>
            <span className="text-slate-300">·</span>
            <span>剩 {cups} 杯</span>
          </>
        )}
      </div>
      {isResting && restingDaysLeft > 0 && (
        <p className="text-xs text-amber-400">还有{restingDaysLeft}天养熟</p>
      )}

      {consumed && cupping && (
        <div className="mt-2 space-y-2">
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
            {onEditCupping && (
              <button
                type="button"
                onClick={onEditCupping}
                className="text-xs text-slate-500 hover:text-indigo-600 hover:underline"
              >
                编辑杯测
              </button>
            )}
          </div>
          {cupping.flavorTags.length > 0 && (
            <FlavorTagPills tags={cupping.flavorTags} className="mt-1" />
          )}
        </div>
      )}

      <div className="flex items-center gap-2 mt-4">
        {consumed ? (
          <div className="flex flex-1 items-center gap-2">
            <span
              className="flex flex-1 items-center justify-center py-2 rounded-xl bg-slate-100 text-slate-400"
              aria-label="已饮用"
            >
              <Coffee className="w-5 h-5" />
            </span>
            {onCancelConsumption && (
              <button
                type="button"
                onClick={onCancelConsumption}
                className="px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                取消饮用
              </button>
            )}
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={onComplete}
              disabled={completeDisabled}
              className={`flex-1 py-2 rounded-xl text-sm font-medium ${
                completeDisabled
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              ✓ 完成
            </button>
            {showAddExtra && onAddExtra && (
              <button
                type="button"
                onClick={onAddExtra}
                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                aria-label="追加一杯"
              >
                <Plus className="w-5 h-5" />
              </button>
            )}
            {onSkip && (
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((o) => !o)}
                  className="p-2 text-slate-300 hover:text-slate-500 rounded-xl transition-colors"
                  aria-label="更多"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-1 py-1 bg-white rounded-lg shadow-lg border border-slate-200 z-20 min-w-[100px]">
                    <button
                      type="button"
                      className="w-full text-left px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
                      onClick={() => {
                        onSkip()
                        setMenuOpen(false)
                      }}
                    >
                      跳过今日
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
