import { useState, useEffect, useMemo } from 'react'
import type { CoffeeBean } from '../types'
import { getHistoryForField, getWeightHistory } from '../utils/inputHistory'

const DEFAULT_WEIGHT = 100

export type BeanFormValues = Omit<
  CoffeeBean,
  'id' | 'cuppings' | 'status' | 'addedDate'
> & { addedDate?: string }

/** 表单字段顺序：烘焙商→地区→庄园→地块→批次→海拔→处理法→豆种→烘焙日期→价格→起始库存→风味标签→备注 */
const defaultValues: BeanFormValues = {
  name: '',
  roaster: '',
  origin: '巴拿马',
  farm: '',
  lot: '',
  batch: '',
  altitude: '',
  process: '水洗',
  variety: '瑰夏',
  roastDate: new Date().toISOString().slice(0, 10),
  addedDate: new Date().toISOString().slice(0, 10),
  weight: DEFAULT_WEIGHT,
  initialWeight: DEFAULT_WEIGHT,
  flavorTags: [],
  tags: [],
  notes: '',
  dailyConsumption: 15,
}

const inputCls =
  'w-full bg-white border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'

export function BeanForm({
  initial,
  beans = [],
  defaultDailyConsumption,
  onSubmit,
  onCancel,
}: {
  initial?: Partial<CoffeeBean>
  /** 豆库列表，用于生成烘焙商/庄园/地块/海拔/处理法/起始库存/库存的历史可选选项 */
  beans?: CoffeeBean[]
  defaultDailyConsumption: number
  onSubmit: (v: BeanFormValues) => void
  onCancel: () => void
}) {
  const isAdd = !initial
  const [form, setForm] = useState<BeanFormValues>(() =>
    initial
      ? {
          name: initial.name ?? '',
          roaster: initial.roaster ?? '',
          origin: initial.origin ?? '巴拿马',
          farm: initial.farm ?? '',
          lot: initial.lot ?? '',
          batch: initial.batch ?? '',
          altitude: initial.altitude ?? '',
          process: initial.process ?? '水洗',
          variety: initial.variety ?? '瑰夏',
          roastDate: initial.roastDate ?? defaultValues.roastDate,
          addedDate: initial.addedDate ?? defaultValues.addedDate,
          weight: initial.weight ?? initial.initialWeight ?? DEFAULT_WEIGHT,
          initialWeight: initial.initialWeight ?? DEFAULT_WEIGHT,
          price: initial.price,
          flavorTags: initial.flavorTags ?? [],
          tags: initial.tags ?? [],
          notes: initial.notes,
          dailyConsumption: initial.dailyConsumption ?? defaultDailyConsumption,
        }
      : {
          ...defaultValues,
          addedDate: new Date().toISOString().slice(0, 10),
          dailyConsumption: defaultDailyConsumption,
          weight: 0,
          initialWeight: 0,
        }
  )

  const history = useMemo(() => {
    const roaster = getHistoryForField(beans, 'roaster')
    const farm = getHistoryForField(beans, 'farm')
    const lot = getHistoryForField(beans, 'lot')
    const altitude = getHistoryForField(beans, 'altitude')
    const process = getHistoryForField(beans, 'process')
    const weightOptions = getWeightHistory(beans)
    return { roaster, farm, lot, altitude, process, weightOptions }
  }, [beans])

  // 风味标签：单行文本，逗号分隔，提交时 split
  const [flavorTagsText, setFlavorTagsText] = useState(
    () => (initial?.flavorTags ?? []).join(', ')
  )

  /* eslint-disable react-hooks/set-state-in-effect -- sync initial flavorTags into local state */
  useEffect(() => {
    if (initial?.flavorTags) setFlavorTagsText(initial.flavorTags.join(', '))
  }, [initial?.flavorTags])
  /* eslint-enable react-hooks/set-state-in-effect */

  /* eslint-disable react-hooks/set-state-in-effect -- sync defaultDailyConsumption when not editing */
  useEffect(() => {
    if (!initial) {
      setForm((f) => ({ ...f, dailyConsumption: defaultDailyConsumption }))
    }
  }, [defaultDailyConsumption, initial])
  /* eslint-enable react-hooks/set-state-in-effect */

  const update = (patch: Partial<BeanFormValues>) =>
    setForm((f) => ({ ...f, ...patch }))

  // 添加豆子时：填写起始库存后，库存自动等于起始库存
  const handleInitialWeightChange = (value: string) => {
    const num = value === '' ? 0 : Number(value)
    if (!Number.isFinite(num) || num < 0) return
    setForm((f) =>
      isAdd ? { ...f, initialWeight: num, weight: num } : { ...f, initialWeight: num }
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (
      !form.roaster?.trim() ||
      !form.origin?.trim() ||
      !form.farm?.trim() ||
      !form.process?.trim() ||
      !form.variety?.trim()
    ) {
      return
    }
    // name: 自动生成 地区+庄园+处理法+豆种
    const name = [form.origin, form.farm, form.process, form.variety]
      .filter(Boolean)
      .join(' ')
    const flavorTags = flavorTagsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    const initialWeight =
      form.initialWeight !== undefined && form.initialWeight !== null && form.initialWeight > 0
        ? form.initialWeight
        : isAdd
          ? 0
          : (initial?.initialWeight ?? DEFAULT_WEIGHT)
    const weight =
      form.weight !== undefined && form.weight !== null && form.weight >= 0
        ? form.weight
        : isAdd
          ? initialWeight
          : (initial?.weight ?? initialWeight)
    onSubmit({
      ...form,
      name,
      flavorTags,
      tags: initial?.tags ?? [],
      weight,
      initialWeight,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">烘焙商 *</label>
          <input
            type="text"
            list="history-roaster"
            value={form.roaster}
            onChange={(e) => update({ roaster: e.target.value })}
            className={inputCls}
          />
          <datalist id="history-roaster">
            {history.roaster.map((v) => (
              <option key={v} value={v} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">地区 *</label>
          <input
            type="text"
            list="history-origin"
            value={form.origin}
            onChange={(e) => update({ origin: e.target.value })}
            className={inputCls}
          />
          <datalist id="history-origin">
            {getHistoryForField(beans, 'origin').map((v) => (
              <option key={v} value={v} />
            ))}
          </datalist>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">庄园 *</label>
          <input
            type="text"
            list="history-farm"
            value={form.farm}
            onChange={(e) => update({ farm: e.target.value })}
            className={inputCls}
          />
          <datalist id="history-farm">
            {history.farm.map((v) => (
              <option key={v} value={v} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">地块</label>
          <input
            type="text"
            list="history-lot"
            value={form.lot ?? ''}
            onChange={(e) => update({ lot: e.target.value || undefined })}
            className={inputCls}
          />
          <datalist id="history-lot">
            {history.lot.map((v) => (
              <option key={v} value={v} />
            ))}
          </datalist>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">批次</label>
          <input
            type="text"
            list="history-batch"
            value={form.batch ?? ''}
            onChange={(e) => update({ batch: e.target.value || undefined })}
            className={inputCls}
          />
          <datalist id="history-batch">
            {getHistoryForField(beans, 'batch').map((v) => (
              <option key={v} value={v} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">海拔</label>
          <input
            type="text"
            list="history-altitude"
            value={form.altitude ?? ''}
            onChange={(e) => update({ altitude: e.target.value || undefined })}
            className={inputCls}
          />
          <datalist id="history-altitude">
            {history.altitude.map((v) => (
              <option key={v} value={v} />
            ))}
          </datalist>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">处理法 *</label>
          <input
            type="text"
            list="history-process"
            value={form.process}
            onChange={(e) => update({ process: e.target.value })}
            className={inputCls}
          />
          <datalist id="history-process">
            {history.process.map((v) => (
              <option key={v} value={v} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">豆种 *</label>
          <input
            type="text"
            list="history-variety"
            value={form.variety}
            onChange={(e) => update({ variety: e.target.value })}
            className={inputCls}
          />
          <datalist id="history-variety">
            {getHistoryForField(beans, 'variety').map((v) => (
              <option key={v} value={v} />
            ))}
          </datalist>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">烘焙日期 *</label>
          <input
            type="date"
            value={form.roastDate}
            onChange={(e) => update({ roastDate: e.target.value })}
            className={inputCls}
          />
        </div>
        <div>
          {/* 单杯价格 = 价格/起始库存*15 */}
          <label className="block text-sm font-medium text-slate-700 mb-1">价格 (元)</label>
          <input
            type="number"
            min={0}
            step={0.01}
            value={form.price ?? ''}
            onChange={(e) =>
              update({
                price: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className={inputCls}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">起始库存</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              list="history-initialWeight"
              value={form.initialWeight === 0 ? '' : form.initialWeight}
              onChange={(e) => handleInitialWeightChange(e.target.value)}
              placeholder={isAdd ? '可留空' : undefined}
              className={`${inputCls} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
            />
            <span className="text-slate-500 shrink-0">g</span>
          </div>
          <datalist id="history-initialWeight">
            {history.weightOptions.map((v) => (
              <option key={v} value={v} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">库存</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              list="history-weight"
              value={form.weight === 0 ? '' : (form.weight ?? '')}
              onChange={(e) =>
                update({
                  weight: e.target.value === '' ? 0 : Number(e.target.value),
                })
              }
              placeholder={isAdd ? '填写起始库存后自动填入' : undefined}
              className={`${inputCls} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
            />
            <span className="text-slate-500 shrink-0">g</span>
          </div>
          <datalist id="history-weight">
            {history.weightOptions.map((v) => (
              <option key={v} value={v} />
            ))}
          </datalist>
          {initial && (
            <p className="text-xs text-slate-500 mt-0.5">当前剩余重量，可修改</p>
          )}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">风味标签</label>
        <input
          type="text"
          value={flavorTagsText}
          onChange={(e) => setFlavorTagsText(e.target.value)}
          className={inputCls}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">备注</label>
        <textarea
          value={form.notes ?? ''}
          onChange={(e) => update({ notes: e.target.value })}
          rows={2}
          className={`${inputCls} resize-none`}
        />
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
        >
          取消
        </button>
        <button
          type="submit"
          className="flex-1 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
        >
          {initial ? '保存' : '添加豆子'}
        </button>
      </div>
    </form>
  )
}
