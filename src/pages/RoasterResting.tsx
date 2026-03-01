import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useStore } from '../store/useStore'
import { DEFAULT_RESTING_DAYS } from '../utils/beanLogic'

export function RoasterResting() {
  const [newRoaster, setNewRoaster] = useState('')
  const [newRoasterDays, setNewRoasterDays] = useState(String(DEFAULT_RESTING_DAYS))
  const beans = useStore((s) => s.beans)
  const roasterRestingDays = useStore((s) => s.roasterRestingDays)
  const setRoasterRestingDays = useStore((s) => s.setRoasterRestingDays)
  const getRestingDaysForRoaster = useStore((s) => s.getRestingDaysForRoaster)

  const roastersToShow = useMemo(() => {
    const fromBeans = new Set(beans.map((b) => b.roaster.trim()).filter(Boolean))
    const fromConfig = new Set(Object.keys(roasterRestingDays ?? {}))
    return Array.from(new Set([...fromBeans, ...fromConfig])).sort()
  }, [beans, roasterRestingDays])

  return (
    <div>
      <div className="mb-6">
        <Link
          to="/settings"
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-indigo-600"
        >
          <ChevronLeft className="w-4 h-4" />
          返回设置
        </Link>
      </div>
      <h2 className="text-xl font-semibold text-slate-800 mb-2">
        烘焙商养豆时间
      </h2>
      <p className="text-sm text-slate-500 mb-6">
        按烘焙商配置养豆天数，未配置的烘焙商使用默认 {DEFAULT_RESTING_DAYS}{' '}
        天。养豆状态与日历推荐会据此计算。
      </p>

      <div className="max-w-md space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <ul className="divide-y divide-slate-100">
            {roastersToShow.map((roaster) => {
              const days = getRestingDaysForRoaster(roaster)
              return (
                <li
                  key={roaster}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/50"
                >
                  <span className="flex-1 text-sm font-medium text-slate-800 truncate">
                    {roaster}
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={days}
                    onChange={(e) => {
                      const v = Number(e.target.value)
                      if (Number.isFinite(v) && v >= 0) {
                        setRoasterRestingDays(roaster, v)
                      }
                    }}
                    className="w-20 border border-slate-200 rounded-lg px-3 py-2 text-sm text-right focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <span className="text-sm text-slate-500 w-6">天</span>
                </li>
              )
            })}
          </ul>
        </div>

        {roastersToShow.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-8">
            暂无烘焙商，可下方添加或先在豆库添加咖啡豆
          </p>
        )}

        <div className="flex gap-2 flex-wrap items-center pt-2">
          <input
            type="text"
            value={newRoaster}
            onChange={(e) => setNewRoaster(e.target.value)}
            placeholder="烘焙商名称"
            className="flex-1 min-w-[100px] border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <input
            type="number"
            min={0}
            value={newRoasterDays}
            onChange={(e) => setNewRoasterDays(e.target.value)}
            className="w-20 border border-slate-200 rounded-lg px-3 py-2 text-sm text-right focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <span className="text-sm text-slate-500">天</span>
          <button
            type="button"
            onClick={() => {
              const r = newRoaster.trim()
              const d = Number(newRoasterDays)
              if (r && Number.isFinite(d) && d >= 0) {
                setRoasterRestingDays(r, d)
                setNewRoaster('')
                setNewRoasterDays(String(DEFAULT_RESTING_DAYS))
              }
            }}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
          >
            添加
          </button>
        </div>
      </div>
    </div>
  )
}
