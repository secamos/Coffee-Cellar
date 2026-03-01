import { Clock, Coffee, MoreVertical, PackageCheck, Sun } from 'lucide-react'
import type { CoffeeBean } from '../types'
import {
  formatRestingProgress,
  getAverageCuppingScore,
  getRemainingCups,
  getRemainingRemainderGrams,
  getSingleCupCost,
  isPendingBlend,
} from '../utils/beanLogic'
import { useStore } from '../store/useStore'
import { useState } from 'react'

const statusLabels: Record<string, string> = {
  resting: '养豆中',
  ready: '已养熟',
  drinking: '饮用中',
  finished: '已喝完',
  frozen: '冷冻',
}

const statusColors: Record<string, string> = {
  resting: 'bg-slate-400 text-white',
  ready: 'bg-indigo-600 text-white',
  drinking: 'bg-emerald-600 text-white',
  finished: 'bg-slate-500 text-white',
  frozen: 'bg-sky-500 text-white',
}

const statusIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  resting: Clock,
  ready: Sun,
  drinking: Coffee,
  finished: PackageCheck,
}

export function BeanCard({
  bean,
  onEdit,
  isSelected,
}: {
  bean: CoffeeBean
  onEdit?: (bean: CoffeeBean) => void
  /** 豆库中当前正在编辑/选中态 */
  isSelected?: boolean
}) {
  const [showMenu, setShowMenu] = useState(false)
  const deleteBean = useStore((s) => s.deleteBean)
  const getRestingDaysForRoaster = useStore((s) => s.getRestingDaysForRoaster)

  const cups = getRemainingCups(bean)
  const remainder = getRemainingRemainderGrams(bean)
  const pendingBlend = isPendingBlend(bean)
  const avgScore = getAverageCuppingScore(bean)
  const restingDays = getRestingDaysForRoaster(bean.roaster)
  const restingText = formatRestingProgress(bean.roastDate, new Date(), restingDays)
  const singleCupCost = getSingleCupCost(bean.price, bean.initialWeight)
  const StatusIcon = statusIcons[bean.status]

  return (
    <>
      <div
        className={`h-full flex flex-col min-h-[240px] rounded-xl border bg-white overflow-hidden shadow-sm transition-shadow hover:shadow-md ${
          isSelected
            ? 'border-indigo-500 ring-2 ring-indigo-200'
            : pendingBlend
              ? 'border-orange-300'
              : 'border-slate-200'
        }`}
      >
        <div className="flex gap-4 p-4 flex-1 min-h-0">
          <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[bean.status] ?? 'bg-stone-400 text-white'}`}
          >
            {StatusIcon && <StatusIcon className="w-3.5 h-3.5 shrink-0" />}
            {statusLabels[bean.status] ?? bean.status}
          </span>
          {pendingBlend && (
            <span className="text-xs text-orange-600 font-medium">
              仅剩{bean.weight}g 待拼配
            </span>
          )}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded hover:bg-slate-100 text-slate-500"
              aria-label="更多"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                  aria-hidden
                />
                <div className="absolute right-0 top-full mt-1 py-1 bg-white rounded-lg shadow-lg border border-slate-200 z-20 min-w-[120px]">
                  {onEdit && (
                    <button
                      type="button"
                      className="w-full text-left px-3 py-1.5 text-sm hover:bg-slate-100"
                      onClick={() => {
                        setShowMenu(false)
                        onEdit(bean)
                      }}
                    >
                      编辑
                    </button>
                  )}
                  <button
                    type="button"
                    className="w-full text-left px-3 py-1.5 text-sm hover:bg-red-50 text-red-600"
                    onClick={() => {
                      setShowMenu(false)
                      if (window.confirm(`确定删除「${bean.name}」吗？`))
                        deleteBean(bean.id)
                    }}
                  >
                    删除
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <p className="text-slate-500 text-sm mb-1">烘焙商: {bean.roaster}</p>
        <p className="text-slate-500 text-sm mb-1">庄园: {bean.farm}</p>
        {bean.batch?.trim() && (
          <p className="text-slate-500 text-sm mb-1">批次: {bean.batch.trim()}</p>
        )}
        <p className="text-slate-600 text-sm mb-2">
          {bean.process} · {bean.variety}
        </p>
        {singleCupCost != null && (
          <p className="text-slate-600 text-sm mb-1">单杯 ¥{singleCupCost}</p>
        )}
        {bean.status === 'resting' && (
          <p className="text-sm text-slate-600 mb-1">养豆期: {restingText} ⏳</p>
        )}
        <p className="text-sm text-slate-600 mb-1">
          库存: {bean.weight}g
          {cups >= 0 && (
            <span className="text-slate-500">
              {' '}(约{cups}杯
              {cups > 0 && remainder > 0 ? ` +${remainder}g余量` : ''})
            </span>
          )}
        </p>
        {avgScore != null && (
          <p className="text-sm text-slate-600 mb-2">杯测均分: {avgScore}</p>
        )}
        {bean.flavorTags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2 max-h-[4.5rem] overflow-hidden">
            {bean.flavorTags.map((t) => (
              <span
                key={t}
                className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700"
              >
                {t}
              </span>
            ))}
          </div>
        )}
          </div>
        </div>
      </div>
    </>
  )
}
