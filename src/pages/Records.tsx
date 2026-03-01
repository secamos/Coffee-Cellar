import { useMemo, useState } from 'react'
import { format, parseISO, endOfMonth, eachDayOfInterval } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Plus, Trash2 } from 'lucide-react'
import { useStore } from '../store/useStore'
import type { CoffeeBean } from '../types'
import { BeanPickerModal } from '../components/BeanPickerModal'

export function Records() {
  const beans = useStore((s) => s.beans)
  const consumptions = useStore((s) => s.consumptions)
  const getBeanById = useStore((s) => s.getBeanById)
  const recordConsumption = useStore((s) => s.recordConsumption)
  const removeConsumption = useStore((s) => s.removeConsumption)

  const [month, setMonth] = useState(() => format(new Date(), 'yyyy-MM'))
  const [showBeanPicker, setShowBeanPicker] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [addDate, setAddDate] = useState('')
  const [addBean, setAddBean] = useState<CoffeeBean | null>(null)

  const monthStart = useMemo(
    () => parseISO(month + '-01'),
    [month]
  )
  const monthEnd = endOfMonth(monthStart)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const consumptionsByDate = useMemo(() => {
    const map: Record<string, typeof consumptions> = {}
    const parts = month.split('-')
    const targetYear = parseInt(parts[0], 10)
    const targetMonth = parseInt(parts[1], 10)
    for (const c of consumptions) {
      const p = c.date.split('-').map((x) => parseInt(x, 10))
      if (p.length < 2 || isNaN(p[0]) || isNaN(p[1])) continue
      const year = p[0]
      const mon = p[1]
      if (year !== targetYear || mon !== targetMonth) continue
      const dateKey =
        p.length >= 3 && !isNaN(p[2])
          ? `${year}-${String(mon).padStart(2, '0')}-${String(p[2]).padStart(2, '0')}`
          : c.date
      if (!map[dateKey]) map[dateKey] = []
      map[dateKey].push(c)
    }
    for (const d of Object.keys(map)) {
      map[d].sort((a, b) => a.id.localeCompare(b.id))
    }
    return map
  }, [consumptions, month])

  const availableBeans = useMemo(
    () => beans.filter((b) => b.weight >= 15 && b.status !== 'finished'),
    [beans]
  )

  const handleAddSubmit = () => {
    if (!addBean || !addDate) return
    recordConsumption(addBean.id, 15, addDate)
    setAddBean(null)
    setAddDate('')
    setShowAdd(false)
  }

  const months = useMemo(() => {
    const list: string[] = []
    const now = new Date()
    for (let i = 0; i < 24; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      list.push(format(d, 'yyyy-MM'))
    }
    return list
  }, [])

  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-800 mb-4">饮用记录</h2>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500"
        >
          {months.map((m) => (
            <option key={m} value={m}>
              {format(parseISO(m + '-01'), 'yyyy年M月', { locale: zhCN })}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => {
            setAddDate(format(new Date(), 'yyyy-MM-dd'))
            setAddBean(null)
            setShowAdd(true)
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4" />
          补录
        </button>
      </div>

      {showAdd && (
        <div className="mb-6 p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
          <p className="text-sm font-medium text-slate-700 mb-2">补录饮用</p>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">日期</label>
              <input
                type="date"
                value={addDate}
                onChange={(e) => setAddDate(e.target.value)}
                max={format(new Date(), 'yyyy-MM-dd')}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">豆子</label>
              <button
                type="button"
                onClick={() => setShowBeanPicker(true)}
                className="w-full flex items-center justify-center min-w-[200px] py-2 rounded-xl border border-dashed border-slate-200 text-slate-500 text-sm font-medium hover:border-indigo-300 hover:text-indigo-600"
              >
                {addBean ? `${addBean.roaster} · ${addBean.farm}` : '选择豆子'}
              </button>
            </div>
            <button
              type="button"
              onClick={handleAddSubmit}
              disabled={!addBean || !addDate}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700"
            >
              确定
            </button>
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="px-4 py-2 rounded-xl border border-dashed border-slate-200 text-slate-500 text-sm font-medium hover:border-indigo-300 hover:text-indigo-600"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {showBeanPicker && (
        <BeanPickerModal
          dateKey={addDate || format(new Date(), 'yyyy-MM-dd')}
          beans={availableBeans}
          onSelect={(bean) => {
            setAddBean(bean)
            setShowBeanPicker(false)
          }}
          onClose={() => setShowBeanPicker(false)}
        />
      )}

      <div className="space-y-2">
        {daysInMonth.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd')
          const list = consumptionsByDate[dateKey] ?? []
          if (list.length === 0) return null
          return (
            <div
              key={dateKey}
              className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-white border border-slate-100 shadow-sm"
            >
              <span className="text-sm font-medium text-slate-700 shrink-0">
                {format(day, 'M月d日 EEEE', { locale: zhCN })}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {list.map((c) => {
                  const bean = getBeanById(c.beanId)
                  return (
                    <div
                      key={c.id}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50"
                    >
                      <span className="text-sm text-slate-800">
                        {bean ? `${bean.roaster} · ${bean.farm}` : c.beanId}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('确定删除该条饮用记录？将恢复豆子重量。')) {
                            removeConsumption(c.id)
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-red-600 rounded"
                        aria-label="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {Object.keys(consumptionsByDate).length === 0 && (
        <div className="text-center py-12 text-slate-500 text-sm">
          该月暂无饮用记录
        </div>
      )}
    </div>
  )
}
