import { useMemo, useState, useCallback, useRef, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Plus, Pencil, Trash2, MapPin, Coffee, Leaf, ChevronDown } from 'lucide-react'
import { useOutingsStore } from '../store/outingsStore'
import { inferDrinkType } from '../utils/drinkType'
import type { OutingRecord } from '../types/outing'

const MONTH_NAMES = ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月']
const EMPTY_OUTINGS: OutingRecord[] = []

type FormData = {
  date: string
  city: string
  shopName: string
  beansOrTea: string
  price: number
  notes: string
}

const emptyForm = (): FormData => ({
  date: format(new Date(), 'yyyy-MM-dd'),
  city: '',
  shopName: '',
  beansOrTea: '',
  price: 0,
  notes: '',
})

export function Outings() {
  const outings = useOutingsStore((s) => s.outings) ?? EMPTY_OUTINGS
  const addOuting = useOutingsStore((s) => s.addOuting)
  const updateOuting = useOutingsStore((s) => s.updateOuting)
  const removeOuting = useOutingsStore((s) => s.removeOuting)
  const getOutingById = useOutingsStore((s) => s.getOutingById)

  const [filterCity, setFilterCity] = useState('')
  const [filterMonth, setFilterMonth] = useState('')
  const [openDropdown, setOpenDropdown] = useState<'city' | 'month' | null>(null)
  const filterRef = useRef<HTMLDivElement>(null)
  const [modalMode, setModalMode] = useState<'form' | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>(() => emptyForm())

  const cities = useMemo(() => {
    const set = new Set(outings.map((o) => o.city).filter(Boolean))
    return Array.from(set).sort()
  }, [outings])

  const months = useMemo(() => {
    const set = new Set(
      outings.map((o) => {
        const d = o?.date
        if (!d || typeof d !== 'string') return ''
        const p = d.split('-')
        return p.length >= 2 ? `${p[0]}-${p[1]}` : ''
      }).filter(Boolean)
    )
    return Array.from(set).sort().reverse()
  }, [outings])

  const filtered = useMemo(() => {
    return outings
      .filter((o) => {
        if (filterCity && o.city !== filterCity) return false
        if (filterMonth) {
          const d = o?.date
          if (!d || typeof d !== 'string') return false
          const p = d.split('-')
          const m = p.length >= 2 ? `${p[0]}-${p[1]}` : ''
          if (m !== filterMonth) return false
        }
        return true
      })
      .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
  }, [outings, filterCity, filterMonth])

  const byMonth = useMemo(() => {
    const map = new Map<string, OutingRecord[]>()
    for (const o of filtered) {
      const d = o?.date
      if (!d || typeof d !== 'string') continue
      const p = d.split('-')
      const monthKey = p.length >= 2 ? `${p[0]}-${p[1]}` : ''
      if (!monthKey) continue
      if (!map.has(monthKey)) map.set(monthKey, [])
      map.get(monthKey)!.push(o)
    }
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a))
  }, [filtered])

  const monthlyStats = useMemo(() => {
    return byMonth.map(([monthKey, list]) => {
      const total = list.reduce((s, o) => s + (o.price ?? 0), 0)
      return { monthKey, count: list.length, total: Math.round(total) }
    })
  }, [byMonth])

  const totalStats = useMemo(() => {
    const total = filtered.reduce((s, o) => s + (o.price ?? 0), 0)
    return { count: filtered.length, total: Math.round(total) }
  }, [filtered])

  const statsLabel = useMemo(() => {
    if (filterMonth) {
      const m = MONTH_NAMES[(parseInt(filterMonth.split('-')[1], 10) || 1) - 1]
      return `${m} · ${totalStats.count}次 · ¥${totalStats.total}`
    }
    return `${totalStats.count}次 · ¥${totalStats.total}`
  }, [filterMonth, totalStats])

  const openAdd = useCallback(() => {
    setSelectedId(null)
    setForm(emptyForm())
    setModalMode('form')
  }, [])

  const openEdit = useCallback((id: string) => {
    const o = getOutingById(id)
    if (!o) return
    setSelectedId(id)
    setForm({
      date: o.date,
      city: o.city,
      shopName: o.shopName,
      beansOrTea: o.beansOrTea ?? '',
      price: o.price,
      notes: o.notes,
    })
    setModalMode('form')
  }, [getOutingById])

  const closeModal = useCallback(() => {
    setModalMode(null)
    setSelectedId(null)
  }, [])

  const handleSave = useCallback(() => {
    if (!form.shopName.trim()) return
    if (selectedId) {
      updateOuting(selectedId, {
        date: form.date,
        city: form.city.trim(),
        shopName: form.shopName.trim(),
        beansOrTea: form.beansOrTea.trim(),
        price: form.price || 0,
        notes: form.notes.trim(),
      })
    } else {
      addOuting({
        date: form.date,
        city: form.city.trim(),
        shopName: form.shopName.trim(),
        beansOrTea: form.beansOrTea.trim(),
        price: form.price || 0,
        notes: form.notes.trim(),
      })
    }
    closeModal()
  }, [form, selectedId, addOuting, updateOuting, closeModal])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleDelete = useCallback((id: string) => {
    if (!window.confirm('确定删除这条外出记录？')) return
    removeOuting(id)
    closeModal()
  }, [removeOuting, closeModal])

  return (
    <div className="min-h-full bg-slate-50">
      <div className="max-w-2xl mx-auto">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">外出记录</h2>
            <p className="text-sm text-gray-500 mt-1">记录外出喝咖啡的足迹与消费</p>
          </div>
          <div className="flex items-center gap-3">
            {filtered.length > 0 && (
              <span className="text-xs text-gray-400">{statsLabel}</span>
            )}
            <button
              type="button"
              onClick={openAdd}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4" />
              记录外出
            </button>
          </div>
        </div>

        <div ref={filterRef} className="relative flex gap-2 mb-4">
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenDropdown((v) => (v === 'city' ? null : 'city'))}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                openDropdown === 'city'
                  ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                  : filterCity
                    ? 'border-gray-200 bg-white text-gray-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              {filterCity || '全部城市'}
              <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown === 'city' ? 'rotate-180' : ''}`} />
            </button>
            {openDropdown === 'city' && (
              <ul className="absolute left-0 top-full mt-1 min-w-[120px] max-h-32 overflow-y-auto border border-slate-200 rounded-lg bg-white shadow z-20">
                <li>
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-indigo-50"
                    onClick={() => {
                      setFilterCity('')
                      setOpenDropdown(null)
                    }}
                  >
                    全部
                  </button>
                </li>
                {cities.map((c) => (
                  <li key={c}>
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-indigo-50"
                      onClick={() => {
                        setFilterCity(c)
                        setOpenDropdown(null)
                      }}
                    >
                      {c}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenDropdown((v) => (v === 'month' ? null : 'month'))}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                openDropdown === 'month'
                  ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                  : filterMonth
                    ? 'border-gray-200 bg-white text-gray-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              {filterMonth ? format(parseISO(filterMonth + '-01'), 'M月', { locale: zhCN }) : '全部月份'}
              <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown === 'month' ? 'rotate-180' : ''}`} />
            </button>
            {openDropdown === 'month' && (
              <ul className="absolute left-0 top-full mt-1 min-w-[100px] max-h-32 overflow-y-auto border border-slate-200 rounded-lg bg-white shadow z-20">
                <li>
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-indigo-50"
                    onClick={() => {
                      setFilterMonth('')
                      setOpenDropdown(null)
                    }}
                  >
                    全部月份
                  </button>
                </li>
                {months.map((m) => (
                  <li key={m}>
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-indigo-50"
                      onClick={() => {
                        setFilterMonth(m)
                        setOpenDropdown(null)
                      }}
                    >
                      {format(parseISO(m + '-01'), 'M月', { locale: zhCN })}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {byMonth.map(([monthKey, list]) => {
            const stats = monthlyStats.find((m) => m.monthKey === monthKey)
            return (
              <div key={monthKey}>
                <div className="sticky top-14 z-10 py-2 -mx-4 px-4 mb-3 bg-gray-50/80 backdrop-blur border-t border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      {MONTH_NAMES[(parseInt(monthKey.split('-')[1], 10) || 1) - 1] ?? monthKey}
                    </span>
                    {stats && (
                      <span className="text-xs text-gray-500">{stats.count}次 ¥{stats.total}</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-4">
                  {list.map((o) => (
                    <OutingCard
                      key={o.id}
                      outing={o}
                      onEdit={() => openEdit(o.id)}
                      onDelete={() => handleDelete(o.id)}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 mb-4">
              <MapPin className="w-8 h-8 text-slate-400" strokeWidth={1.5} />
            </div>
            <p className="text-slate-500 text-sm">暂无外出记录</p>
            <p className="text-slate-400 text-xs mt-1">添加第一条记录，记录你的咖啡之旅</p>
          </div>
        )}
      </div>

      {modalMode === 'form' && (
        <OutingFormModal
          form={form}
          setForm={setForm}
          selectedId={selectedId}
          onSave={handleSave}
          onClose={closeModal}
        />
      )}
    </div>
  )
}

function OutingCard({
  outing,
  onEdit,
  onDelete,
}: {
  outing: OutingRecord
  onEdit: () => void
  onDelete: () => void
}) {
  const drinkType = inferDrinkType(outing.beansOrTea)
  const dateStr = outing.date
    ? format(parseISO(outing.date), 'yyyy年M月d日 EEEE', { locale: zhCN })
    : ''

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 mb-0 hover:shadow-md transition-shadow flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <p className="font-bold text-lg text-gray-900">{outing.shopName || '未命名'}</p>
        <p className="text-sm text-gray-500 mt-0.5">
          {dateStr}
          {outing.city && <span className="text-gray-400"> · {outing.city}</span>}
        </p>
        {(outing.beansOrTea?.trim() || outing.price > 0) && (
          <div className="flex items-center justify-between gap-2 mt-2">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              {outing.beansOrTea?.trim() && (
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium shrink-0 ${
                    drinkType === 'tea'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {drinkType === 'tea' ? (
                    <Leaf className="w-[1.15em] h-[1.15em] shrink-0" strokeWidth={2} />
                  ) : (
                    <Coffee className="w-[1.15em] h-[1.15em] shrink-0" strokeWidth={2} />
                  )}
                  {outing.beansOrTea.trim()}
                </span>
              )}
            </div>
            {outing.price > 0 && (
              <span className="rounded-full px-3 py-1 text-sm font-semibold bg-indigo-50 text-indigo-700 shrink-0">
                ¥{Math.round(outing.price)}
              </span>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="p-2 rounded-full text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
          aria-label="编辑"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-2 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          aria-label="删除"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

function OutingFormModal({
  form,
  setForm,
  selectedId,
  onSave,
  onClose,
}: {
  form: FormData
  setForm: React.Dispatch<React.SetStateAction<FormData>>
  selectedId: string | null
  onSave: () => void
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 space-y-4">
          <p className="text-sm font-medium text-slate-700">
            {selectedId ? '编辑' : '添加'}外出记录
          </p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">日期</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">城市</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                placeholder="如：上海"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">店名</label>
              <input
                type="text"
                value={form.shopName}
                onChange={(e) => setForm((f) => ({ ...f, shopName: e.target.value }))}
                placeholder="必填"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">咖啡豆/茶</label>
            <input
              type="text"
              value={form.beansOrTea}
              onChange={(e) => setForm((f) => ({ ...f, beansOrTea: e.target.value }))}
              placeholder="如：耶加雪菲、正山小种"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">单杯价格（元）</label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={form.price || ''}
              onChange={(e) => setForm((f) => ({ ...f, price: parseFloat(e.target.value) || 0 }))}
              placeholder="0"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">记录</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="记录体验..."
              rows={3}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-y"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onSave}
              disabled={!form.shopName.trim()}
              className="flex-1 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700"
            >
              保存
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-xl border border-dashed border-slate-200 text-slate-500 text-sm font-medium hover:border-indigo-300 hover:text-indigo-600"
            >
              取消
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
