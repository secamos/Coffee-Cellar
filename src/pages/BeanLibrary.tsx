import { useState, useMemo } from 'react'
import { addDays, parseISO } from 'date-fns'
import { Plus, Search } from 'lucide-react'
import { useStore } from '../store/useStore'
import { BeanCard } from '../components/BeanCard'
import { BeanForm, type BeanFormValues } from '../components/BeanForm'
import { StatsBanner } from '../components/StatsBanner'
import type { BeanStatus, CoffeeBean } from '../types'

const statusFilterOptions: { value: '' | BeanStatus; label: string }[] = [
  { value: '', label: '全部' },
  { value: 'resting', label: '养豆中' },
  { value: 'ready', label: '已养熟' },
  { value: 'drinking', label: '饮用中' },
  { value: 'finished', label: '已喝完' },
]

const STATUS_ORDER: Record<string, number> = {
  drinking: 0,
  ready: 1,
  resting: 2,
  finished: 3,
  frozen: 4,
}

export function BeanLibrary() {
  const beans = useStore((s) => s.beans)
  const defaultDailyConsumption = useStore((s) => s.defaultDailyConsumption)
  const addBean = useStore((s) => s.addBean)
  const updateBean = useStore((s) => s.updateBean)
  const getRestingDaysForRoaster = useStore((s) => s.getRestingDaysForRoaster)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'' | BeanStatus>('')
  const [showFinished, setShowFinished] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = useMemo(
    () =>
      (beans ?? []).filter((b) => {
        if (statusFilter && b.status !== statusFilter) return false
        if (!showFinished && b.status === 'finished') return false
        if (search.trim()) {
          const q = search.trim().toLowerCase()
          return (
            b.name.toLowerCase().includes(q) ||
            b.roaster.toLowerCase().includes(q) ||
            b.farm.toLowerCase().includes(q) ||
            b.process.toLowerCase().includes(q)
          )
        }
        return true
      }),
    [beans, statusFilter, showFinished, search]
  )

  const sortedBeans = useMemo(() => {
    const list = [...filtered]
    const getReadyDate = (b: CoffeeBean) =>
      addDays(parseISO(b.roastDate), (getRestingDaysForRoaster(b.roaster) ?? 30) + 1)
    return list.sort((a, b) => {
      const orderA = STATUS_ORDER[a.status] ?? 9
      const orderB = STATUS_ORDER[b.status] ?? 9
      if (orderA !== orderB) return orderA - orderB
      const readyDateA = getReadyDate(a).getTime()
      const readyDateB = getReadyDate(b).getTime()
      if (a.status === 'resting') return readyDateA - readyDateB
      if (a.status === 'ready') return readyDateB - readyDateA
      return 0
    })
  }, [filtered, getRestingDaysForRoaster])

  const handleAdd = (v: BeanFormValues) => {
    addBean({
      ...v,
      addedDate: v.addedDate ?? new Date().toISOString().slice(0, 10),
    })
    setShowForm(false)
  }

  const handleUpdate = (id: string, v: BeanFormValues) => {
    updateBean(id, {
      ...v,
      addedDate: v.addedDate ?? new Date().toISOString().slice(0, 10),
    })
    setEditingId(null)
  }

  return (
    <div>
      <StatsBanner />
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索名称、烘焙商、庄园、处理法..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as '' | BeanStatus)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500"
          >
            {statusFilterOptions.map((o) => (
              <option key={o.value || 'all'} value={o.value}>{o.label}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={showFinished}
              onChange={(e) => setShowFinished(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            显示已喝完
          </label>
          <button
            type="button"
            onClick={() => { setShowForm(true); setEditingId(null) }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-transform hover:scale-[1.01]"
          >
            <Plus className="w-4 h-4" />
            添加豆子
          </button>
        </div>
      </div>

      {showForm && !editingId && (
        <div className="mb-6 p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">新增豆子</h2>
          <BeanForm
            beans={beans}
            defaultDailyConsumption={defaultDailyConsumption}
            onSubmit={handleAdd}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {sortedBeans.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          {beans.length === 0
            ? '暂无豆子，点击「添加豆子」开始记录'
            : '没有符合条件的豆子'}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
          {sortedBeans.map((bean) => (
            <div
              key={bean.id}
              className={
                editingId === bean.id
                  ? 'sm:col-span-2 lg:col-span-3 flex flex-col gap-4'
                  : 'h-full min-h-0'
              }
            >
              <div className={editingId === bean.id ? 'flex-shrink-0' : 'h-full min-h-0'}>
                <BeanCard
                  bean={bean}
                  onEdit={(b) => { setEditingId(b.id); setShowForm(false) }}
                  isSelected={editingId === bean.id}
                />
              </div>
              {editingId === bean.id && (
                <div className="flex-shrink-0 p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-800 mb-4">编辑豆子</h2>
                  <BeanForm
                    initial={bean}
                    beans={beans}
                    defaultDailyConsumption={defaultDailyConsumption}
                    onSubmit={(v) => handleUpdate(editingId, v)}
                    onCancel={() => setEditingId(null)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
