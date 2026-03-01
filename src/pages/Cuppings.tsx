import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Pencil, Trash2, Coffee, Stethoscope } from 'lucide-react'
import { useStore } from '../store/useStore'
import { CuppingModal } from '../components/CuppingModal'
import { DiagnosisModal } from '../components/DiagnosisModal'
import { FlavorTagPills } from '../components/FlavorTagPills'
import type { CoffeeBean, CuppingRecord } from '../types'

type CuppingWithBean = { bean: CoffeeBean; cupping: CuppingRecord }

export function Cuppings() {
  const beans = useStore((s) => s.beans)
  const getBeanById = useStore((s) => s.getBeanById)
  const deleteCupping = useStore((s) => s.deleteCupping)

  const [editing, setEditing] = useState<{
    beanId: string
    cuppingId: string
  } | null>(null)
  const [diagnosing, setDiagnosing] = useState<{
    bean: CoffeeBean
    cupping: CuppingRecord
  } | null>(null)

  const list = useMemo(() => {
    const items: CuppingWithBean[] = []
    for (const bean of beans) {
      for (const cupping of bean.cuppings) {
        items.push({ bean, cupping })
      }
    }
    items.sort(
      (a, b) =>
        new Date(b.cupping.date).getTime() -
        new Date(a.cupping.date).getTime()
    )
    return items
  }, [beans])

  const editingBean = editing ? getBeanById(editing.beanId) : null
  const editingCupping =
    editingBean?.cuppings?.find((c) => c.id === editing?.cuppingId) ?? undefined

  const handleDelete = (beanId: string, cuppingId: string) => {
    if (!window.confirm('确定删除这条杯测记录？饮用记录将保留。'))
      return
    deleteCupping(beanId, cuppingId)
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-800 mb-2">
        历史杯测记录
      </h2>
      <p className="text-sm text-slate-500 mb-6">
        与日历、豆库共用数据，编辑或删除会同步更新
      </p>

      {list.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-2xl bg-white border border-slate-100 text-center">
          <Coffee className="w-12 h-12 text-slate-300 mb-3" />
          <p className="text-slate-500">暂无杯测记录</p>
          <p className="text-sm text-slate-400 mt-1">
            在日历中完成饮用并保存杯测后会出现在这里
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {list.map(({ bean, cupping }) => (
            <li
              key={cupping.id}
              className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900">
                  {bean.roaster} · {bean.farm}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {format(new Date(cupping.date + 'T12:00:00'), 'yyyy年M月d日 EEEE', {
                    locale: zhCN,
                  })}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
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
                  {cupping.brewMethod && (
                    <span className="text-xs text-slate-500">
                      {cupping.brewMethod}
                    </span>
                  )}
                  {cupping.flavorTags?.length > 0 && (
                    <FlavorTagPills
                      tags={cupping.flavorTags}
                      className="mt-1 basis-full"
                    />
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setDiagnosing({ bean, cupping })}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-amber-700 hover:bg-amber-50"
                >
                  <Stethoscope className="w-4 h-4" />
                  诊断
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setEditing({ beanId: bean.id, cuppingId: cupping.id })
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-indigo-600 hover:bg-indigo-50"
                >
                  <Pencil className="w-4 h-4" />
                  编辑
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(bean.id, cupping.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                  删除
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editingBean && editingCupping && editing && (
        <CuppingModal
          bean={editingBean}
          initialDate={editingCupping.date}
          initialCupping={editingCupping}
          onClose={() => setEditing(null)}
        />
      )}

      {diagnosing && (
        <DiagnosisModal
          bean={diagnosing.bean}
          cupping={diagnosing.cupping}
          onClose={() => setDiagnosing(null)}
        />
      )}
    </div>
  )
}
