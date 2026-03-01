import { useState, useEffect, useMemo } from 'react'
import { X } from 'lucide-react'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts'
import type { CoffeeBean, CuppingRecord, CuppingScores, PourSegment, PourStyle } from '../types'
import { useStore, computeTotalScore } from '../store/useStore'
import { format } from 'date-fns'

const SCA_DIMENSIONS: { key: keyof CuppingScores; label: string }[] = [
  { key: 'fragrance', label: '干香' },
  { key: 'flavor', label: '风味' },
  { key: 'acidity', label: '酸质' },
  { key: 'body', label: '醇厚度' },
  { key: 'sweetness', label: '甜度' },
  { key: 'balance', label: '平衡' },
  { key: 'aftertaste', label: '余韵' },
  { key: 'overall', label: '整体' },
]

const DEFAULT_SCORES: CuppingScores = {
  fragrance: 5,
  flavor: 5,
  acidity: 5,
  body: 5,
  sweetness: 5,
  balance: 5,
  aftertaste: 5,
  overall: 5,
}

const FLAVOR_TAGS: Record<string, string[]> = {
  花香类: ['茉莉', '玫瑰', '薰衣草', '洋甘菊'],
  果香类: [
    '柑橘', '柠檬', '橙子', '莓果', '草莓', '蓝莓', '热带水果', '芒果', '菠萝',
    '百香果', '核果', '桃子', '杏子', '葡萄', '苹果', '梨',
  ],
  甜感坚果: ['焦糖', '巧克力', '坚果', '杏仁', '榛子', '蜂蜜', '奶油', '香草'],
  其他: ['香料', '肉桂', '丁香', '红酒', '发酵感', '茶感', '草本', '烟熏', '泥土'],
}

const BREW_METHODS = ['手冲', '爱乐压', '美式', '意式', '冷萃']

const POUR_STYLE_OPTIONS: { value: PourStyle; label: string }[] = [
  { value: 'circle', label: '绕圈' },
  { value: 'center', label: '中心' },
]

const DEFAULT_POUR_SEGMENTS: PourSegment[] = [
  { amount: 60, speed: 10, style: 'circle' },
  { amount: 60, speed: 10, style: 'circle' },
  { amount: 60, speed: 5, style: 'circle' },
  { amount: 60, speed: 10, style: 'center' },
]

export function CuppingModal({
  bean,
  initialDate,
  initialDose = 15,
  initialCupping,
  onClose,
}: {
  bean: CoffeeBean
  initialDate?: string
  initialDose?: number
  /** 编辑已有杯测时传入 */
  initialCupping?: CuppingRecord
  onClose: (saved: boolean) => void
}) {
  const addCupping = useStore((s) => s.addCupping)
  const updateCupping = useStore((s) => s.updateCupping)
  const isEditMode = Boolean(initialCupping)

  const [date, setDate] = useState(
    () =>
      initialCupping?.date ??
      initialDate ??
      format(new Date(), 'yyyy-MM-dd')
  )
  const [scores, setScores] = useState<CuppingScores>(() =>
    initialCupping?.scores ? { ...initialCupping.scores } : { ...DEFAULT_SCORES }
  )
  const [flavorTags, setFlavorTags] = useState<string[]>(
    () => initialCupping?.flavorTags ?? []
  )
  const [dose, setDose] = useState(initialCupping?.dose ?? initialDose ?? 15)
  const [water, setWater] = useState(initialCupping?.yield ?? 225)
  const [waterTemp, setWaterTemp] = useState<number | ''>(
    initialCupping?.waterTemp ?? 92
  )
  const [grindSize, setGrindSize] = useState(initialCupping?.grindSize ?? '')
  const [brewMethod, setBrewMethod] = useState(
    initialCupping?.brewMethod ?? '手冲'
  )
  const [pourSegments, setPourSegments] = useState<PourSegment[]>(
    () =>
      initialCupping?.pourSegments?.length
        ? initialCupping.pourSegments
        : [...DEFAULT_POUR_SEGMENTS]
  )
  const [notes, setNotes] = useState(initialCupping?.notes ?? '')

  /* eslint-disable react-hooks/set-state-in-effect -- sync initialCupping into local state */
  useEffect(() => {
    if (initialCupping) {
      setDate(initialCupping.date)
      setScores(initialCupping.scores ? { ...initialCupping.scores } : { ...DEFAULT_SCORES })
      setFlavorTags(initialCupping.flavorTags ?? [])
      setDose(initialCupping.dose ?? 15)
      setWater(initialCupping.yield ?? 225)
      setWaterTemp(initialCupping.waterTemp ?? 92)
      setGrindSize(initialCupping.grindSize ?? '')
      setBrewMethod(initialCupping.brewMethod ?? '手冲')
      setPourSegments(
        initialCupping.pourSegments?.length
          ? initialCupping.pourSegments
          : [...DEFAULT_POUR_SEGMENTS]
      )
      setNotes(initialCupping.notes ?? '')
    } else if (initialDate) setDate(initialDate)
  }, [initialCupping, initialDate])
  useEffect(() => {
    if (initialDose != null && !initialCupping) setDose(initialDose)
  }, [initialDose, initialCupping])
  /* eslint-enable react-hooks/set-state-in-effect */

  const totalScore = useMemo(() => computeTotalScore(scores), [scores])
  const ratioLabel = useMemo(
    () => (water && dose ? `1:${(water / dose).toFixed(1)}` : '—'),
    [water, dose]
  )

  const radarData = useMemo(
    () =>
      SCA_DIMENSIONS.map(({ key, label }) => ({
        subject: label,
        value: scores[key],
        fullMark: 10,
      })),
    [scores]
  )

  const setScore = (key: keyof CuppingScores, value: number) => {
    setScores((prev) => ({ ...prev, [key]: value }))
  }

  const toggleFlavor = (tag: string) => {
    setFlavorTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      date,
      scores,
      flavorTags,
      brewMethod,
      dose,
      yield: water || undefined,
      waterTemp: waterTemp === '' ? undefined : Number(waterTemp),
      grindSize: grindSize || undefined,
      pourSegments: brewMethod === '手冲' && pourSegments.length > 0 ? pourSegments : undefined,
      notes: notes || undefined,
    }
    if (isEditMode && initialCupping) {
      updateCupping(bean.id, initialCupping.id, payload)
    } else {
      addCupping(bean.id, payload)
    }
    onClose(true)
  }

  const handleSkip = () => {
    if (isEditMode) {
      onClose(false)
      return
    }
    if (window.confirm('仅记录消耗，不保存杯测数据？')) {
      onClose(false)
    }
  }

  const today = format(new Date(), 'yyyy-MM-dd')

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xl bg-white/95"
      onClick={(e) => e.target === e.currentTarget && handleSkip()}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶部：标题 + 总分 + 跳过 */}
        <div className="flex items-center justify-between px-8 pt-8 pb-4 border-b border-slate-100">
          <h2 className="text-xl font-semibold text-slate-900">
            {bean.name}
            {isEditMode && (
              <span className="ml-2 text-sm font-normal text-slate-500">
                编辑杯测
              </span>
            )}
          </h2>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs text-slate-500">SCA 总分</p>
              <p className="text-3xl font-mono font-medium text-indigo-600">
                {totalScore}
              </p>
            </div>
            {!isEditMode && (
            <button
              type="button"
              onClick={handleSkip}
              className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              跳过
            </button>
            )}
            <button
              type="button"
              onClick={() => onClose(false)}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
              aria-label="关闭"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8">
          {/* 主体：左侧滑块 + 右侧雷达图 */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_40%] gap-8 mb-8">
            <div className="space-y-3">
              {SCA_DIMENSIONS.map(({ key, label }) => (
                <div key={key} className="flex items-center gap-3">
                  <label className="w-16 text-sm font-medium text-slate-700 shrink-0">
                    {label}
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    step={0.5}
                    value={scores[key]}
                    onChange={(e) => setScore(key, Number(e.target.value))}
                    className="flex-1 h-2 bg-slate-200 rounded-full appearance-none accent-indigo-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:border-0"
                  />
                  <span className="w-8 text-sm font-mono text-indigo-600 text-right">
                    {scores[key]}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center min-h-[240px]">
              <ResponsiveContainer width="100%" height={240}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 10]}
                    tick={{ fontSize: 10 }}
                  />
                  <Radar
                    name="SCA"
                    dataKey="value"
                    stroke="rgb(99 102 241)"
                    fill="rgb(99 102 241)"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 风味标签 */}
          <div className="mb-8">
            <p className="text-sm font-medium text-slate-700 mb-3">杯测风味</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(FLAVOR_TAGS).map(([category, tags]) => (
                <div key={category}>
                  <p className="text-xs text-slate-500 mb-1.5">{category}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleFlavor(tag)}
                        className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                          flavorTags.includes(tag)
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 冲煮参数 */}
          <div className="mb-8">
            <p className="text-sm font-medium text-slate-700 mb-3">冲煮参数</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">粉量 (g)</label>
                <input
                  type="number"
                  min={1}
                  value={dose}
                  onChange={(e) => setDose(Number(e.target.value) || 0)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">水量 (ml)</label>
                <input
                  type="number"
                  min={0}
                  value={water || ''}
                  onChange={(e) => setWater(Number(e.target.value) || 0)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">粉水比</label>
                <p className="py-2 text-sm font-mono text-slate-700">{ratioLabel}</p>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">水温 (°C)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="92"
                  value={waterTemp}
                  onChange={(e) =>
                    setWaterTemp(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">研磨度</label>
                <input
                  type="text"
                  placeholder="Comandante 24格"
                  value={grindSize}
                  onChange={(e) => setGrindSize(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">冲煮方式</label>
                <select
                  value={brewMethod}
                  onChange={(e) => setBrewMethod(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
                >
                  {BREW_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

            {brewMethod === '手冲' && (
              <div className="mt-4">
                <p className="text-sm font-medium text-slate-700 mb-2">分段注水</p>
                <div className="space-y-2">
                  {pourSegments.map((seg, i) => (
                    <div
                      key={i}
                      className="flex flex-wrap items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100"
                    >
                      <span className="text-xs text-slate-500 w-6">#{i + 1}</span>
                      <input
                        type="number"
                        min={0}
                        placeholder="ml"
                        value={seg.amount || ''}
                        onChange={(e) => {
                          const v = Number(e.target.value)
                          setPourSegments((prev) =>
                            prev.map((s, j) =>
                              j === i ? { ...s, amount: Number.isFinite(v) ? v : 0 } : s
                            )
                          )
                        }}
                        className="w-16 border border-slate-200 rounded px-2 py-1 text-sm"
                      />
                      <span className="text-xs text-slate-400">ml</span>
                      <input
                        type="number"
                        min={0}
                        step={0.5}
                        placeholder="ml/s"
                        value={seg.speed || ''}
                        onChange={(e) => {
                          const v = Number(e.target.value)
                          setPourSegments((prev) =>
                            prev.map((s, j) =>
                              j === i ? { ...s, speed: Number.isFinite(v) ? v : 0 } : s
                            )
                          )
                        }}
                        className="w-16 border border-slate-200 rounded px-2 py-1 text-sm"
                      />
                      <span className="text-xs text-slate-400">ml/s</span>
                      <select
                        value={seg.style}
                        onChange={(e) =>
                          setPourSegments((prev) =>
                            prev.map((s, j) =>
                              j === i ? { ...s, style: e.target.value as PourStyle } : s
                            )
                          )
                        }
                        className="border border-slate-200 rounded px-2 py-1 text-sm bg-white"
                      >
                        {POUR_STYLE_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() =>
                          setPourSegments((prev) => prev.filter((_, j) => j !== i))
                        }
                        className="text-slate-400 hover:text-red-600 text-xs"
                      >
                        删除
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setPourSegments((prev) => [...prev, { amount: 60, speed: 10, style: 'circle' }])
                    }
                    className="text-sm text-indigo-600 hover:underline"
                  >
                    + 添加一段
                  </button>
                </div>
              </div>
            )}

          {/* 日期 + 备注 */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              杯测日期
            </label>
            <input
              type="date"
              max={today}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full max-w-xs border border-slate-200 rounded-lg px-3 py-2 mb-4"
            />
            <label className="block text-sm font-medium text-slate-700 mb-1">
              备注（可选）
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="详细描述..."
              rows={3}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 resize-none"
            />
          </div>

          {/* 底部按钮 */}
          <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => onClose(false)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-sm font-medium"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSkip}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium"
            >
              仅记录消耗
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
            >
              保存杯测
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
