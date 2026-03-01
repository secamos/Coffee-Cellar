import type { CoffeeBean, CuppingRecord } from '../../types'
import { FlavorTagPills } from '../FlavorTagPills'

interface CuppingResultProps {
  bean: CoffeeBean
  cupping: CuppingRecord
  onViewDetail?: () => void
}

function scoreBarColor(score: number): string {
  if (score >= 90) return 'border-l-emerald-500 bg-emerald-50'
  if (score >= 85) return 'border-l-indigo-500 bg-indigo-50'
  return 'border-l-slate-400 bg-slate-50'
}

export function CuppingResult({
  bean,
  cupping,
  onViewDetail,
}: CuppingResultProps) {
  const tags = cupping.flavorTags ?? []

  return (
    <div
      className={`relative pl-3 -ml-3 pr-1 py-3 -mx-1 rounded-xl border-l-4 ${scoreBarColor(cupping.totalScore)}`}
    >
      <h3 className="text-lg font-semibold text-slate-900 leading-tight">
        {bean.farm}
      </h3>
      <p className="text-sm font-medium text-indigo-600">{bean.roaster}</p>
      <p className="text-sm text-slate-500">
        {bean.process} · {bean.variety}
      </p>

      <p className="text-2xl font-light text-slate-800 text-center py-3 tracking-wide">
        ━━━━━ {cupping.totalScore} ━━━━━
      </p>
      {tags.length > 0 && (
        <div className="flex justify-center mt-2">
          <FlavorTagPills tags={tags} className="justify-center mt-0" />
        </div>
      )}
      {cupping.brewMethod && (
        <p className="text-xs text-slate-500 mt-1">☕ {cupping.brewMethod}</p>
      )}
      {onViewDetail && (
        <button
          type="button"
          onClick={onViewDetail}
          className="mt-2 text-xs text-slate-500 hover:text-indigo-600 hover:underline"
        >
          查看详情
        </button>
      )}
    </div>
  )
}
