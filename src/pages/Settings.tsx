import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { ChevronRight } from 'lucide-react'
import { DEFAULT_KIMI_DIAGNOSIS_PROMPT } from '../constants/kimiDiagnosisPrompt'

const STORAGE_KEY = 'coffee-calendar-storage'
const OUTINGS_STORAGE_KEY = 'coffee-calendar-outings'

export function Settings() {
  const defaultDailyConsumption = useStore((s) => s.defaultDailyConsumption)
  const setDefaultDailyConsumption = useStore((s) => s.setDefaultDailyConsumption)
  const kimiApiKey = useStore((s) => s.kimiApiKey)
  const kimiDiagnosisPrompt = useStore((s) => s.kimiDiagnosisPrompt)
  const setKimiApiKey = useStore((s) => s.setKimiApiKey)
  const setKimiDiagnosisPrompt = useStore((s) => s.setKimiDiagnosisPrompt)
  const [dailyInput, setDailyInput] = useState(String(defaultDailyConsumption))
  const [exportMessage, setExportMessage] = useState('')
  const [importMessage, setImportMessage] = useState('')
  const [kimiKeyInput, setKimiKeyInput] = useState(kimiApiKey)
  const [kimiPromptInput, setKimiPromptInput] = useState(kimiDiagnosisPrompt)
  const [kimiSaveMsg, setKimiSaveMsg] = useState('')
  /* eslint-disable react-hooks/set-state-in-effect -- sync store kimi settings into local inputs */
  useEffect(() => {
    setKimiKeyInput(kimiApiKey ?? '')
    setKimiPromptInput(kimiDiagnosisPrompt ?? '')
  }, [kimiApiKey, kimiDiagnosisPrompt])
  /* eslint-enable react-hooks/set-state-in-effect */

  const saveDaily = () => {
    const n = Number(dailyInput)
    if (Number.isFinite(n) && n >= 1) {
      setDefaultDailyConsumption(n)
      setExportMessage('已保存默认每日消耗量')
      setTimeout(() => setExportMessage(''), 2000)
    }
  }

  const handleExport = () => {
    try {
      const mainRaw = localStorage.getItem(STORAGE_KEY)
      const outingsRaw = localStorage.getItem(OUTINGS_STORAGE_KEY)
      if (!mainRaw && !outingsRaw) {
        setExportMessage('暂无本地数据')
        return
      }
      const data = {
        main: mainRaw ? JSON.parse(mainRaw) : null,
        outings: outingsRaw ? JSON.parse(outingsRaw) : null,
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `coffee-calendar-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      setExportMessage('已导出备份')
    } catch {
      setExportMessage('导出失败')
    }
    setTimeout(() => setExportMessage(''), 3000)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const text = reader.result as string
        const data = JSON.parse(text) as Record<string, unknown>
        const version = 3
        // 支持新格式 { main, outings } 或旧格式 { state, version } / 纯 state
        const mainData = data.main != null ? data.main : data
        const state =
          mainData.state != null && typeof mainData.state === 'object'
            ? (mainData.state as Record<string, unknown>)
            : mainData
        if (!Array.isArray(state.beans)) {
          setImportMessage('文件格式无效，需包含 beans 数组')
          setTimeout(() => setImportMessage(''), 3000)
          return
        }
        const toStore: { state: Record<string, unknown>; version: number } = {
          state: {
            version: state.version ?? version,
            beans: state.beans,
            consumptions: Array.isArray(state.consumptions) ? state.consumptions : [],
            defaultDailyConsumption:
              typeof state.defaultDailyConsumption === 'number' && state.defaultDailyConsumption >= 1
                ? state.defaultDailyConsumption
                : 15,
            roasterRestingDays:
              state.roasterRestingDays != null && typeof state.roasterRestingDays === 'object'
                ? state.roasterRestingDays
                : {},
            calendarSchedule:
              state.calendarSchedule != null && typeof state.calendarSchedule === 'object'
                ? state.calendarSchedule
                : {},
            kimiApiKey: typeof state.kimiApiKey === 'string' ? state.kimiApiKey : '',
            kimiDiagnosisPrompt:
              typeof state.kimiDiagnosisPrompt === 'string'
                ? state.kimiDiagnosisPrompt
                : DEFAULT_KIMI_DIAGNOSIS_PROMPT,
          },
          version,
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore))
        // 新格式 { main, outings } 时恢复外出数据；旧格式不覆盖
        if (data.main != null) {
          const outingsData = data.outings as { state?: { outings?: unknown[] }; version?: number } | null | undefined
          const list = outingsData != null && typeof outingsData === 'object' && Array.isArray(outingsData.state?.outings)
            ? outingsData.state!.outings
            : []
          const outingsToStore = { state: { outings: list }, version: 1 }
          localStorage.setItem(OUTINGS_STORAGE_KEY, JSON.stringify(outingsToStore))
        }
        window.location.reload()
        setImportMessage('导入成功，页面已刷新')
      } catch {
        setImportMessage('解析失败')
      }
      setTimeout(() => setImportMessage(''), 3000)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-stone-800 mb-6">设置</h2>

      <div className="space-y-6 max-w-md">
        <div className="p-4 rounded-xl border border-stone-200 bg-white">
          <h3 className="text-sm font-medium text-stone-700 mb-2">默认每日消耗量 (g)</h3>
          <p className="text-xs text-stone-500 mb-2">
            用于计算「约 N 杯」和记录消耗时的默认克数
          </p>
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              value={dailyInput}
              onChange={(e) => setDailyInput(e.target.value)}
              onBlur={saveDaily}
              className="w-24 border border-stone-300 rounded-lg px-3 py-2"
            />
            <button
              type="button"
              onClick={saveDaily}
              className="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700"
            >
              保存
            </button>
          </div>
          {exportMessage && (
            <p className="text-sm text-amber-600 mt-2">{exportMessage}</p>
          )}
        </div>

        <Link
          to="/settings/roaster-resting"
          className="p-4 rounded-xl border border-stone-200 bg-white flex items-center justify-between hover:bg-stone-50/50 transition-colors"
        >
          <div>
            <h3 className="text-sm font-medium text-stone-700 mb-1">
              烘焙商养豆时间
            </h3>
            <p className="text-xs text-stone-500">
              按烘焙商配置养豆天数，未配置使用默认 30 天
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-stone-400 shrink-0" />
        </Link>

        <div className="p-4 rounded-xl border border-stone-200 bg-white max-w-2xl">
          <h3 className="text-sm font-medium text-stone-700 mb-1">
            杯测诊断（Kimi API）
          </h3>
          <p className="text-xs text-stone-500 mb-3">
            在「杯测记录」页点击「诊断」时调用 Kimi 模型。API Key 仅存于本地。
          </p>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">
                API Key
              </label>
              <input
                type="password"
                value={kimiKeyInput}
                onChange={(e) => setKimiKeyInput(e.target.value)}
                onBlur={() => setKimiApiKey(kimiKeyInput)}
                placeholder="从 Moonshot 开放平台获取"
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">
                系统 Prompt（可编辑）
              </label>
              <textarea
                value={kimiPromptInput}
                onChange={(e) => setKimiPromptInput(e.target.value)}
                onBlur={() => setKimiDiagnosisPrompt(kimiPromptInput)}
                rows={10}
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm font-mono resize-y min-h-[160px]"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setKimiApiKey(kimiKeyInput)
                setKimiDiagnosisPrompt(kimiPromptInput)
                setKimiSaveMsg('已保存')
                setTimeout(() => setKimiSaveMsg(''), 2000)
              }}
              className="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700"
            >
              保存诊断设置
            </button>
            {kimiSaveMsg && (
              <p className="text-sm text-amber-600">{kimiSaveMsg}</p>
            )}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-stone-200 bg-white">
          <h3 className="text-sm font-medium text-stone-700 mb-2">数据导出 / 导入</h3>
          <p className="text-xs text-stone-500 mb-3">
            导出为 JSON 备份到本地；导入将覆盖当前数据并刷新页面
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleExport}
              className="px-4 py-2 rounded-lg border border-stone-300 text-stone-700 text-sm font-medium hover:bg-stone-50"
            >
              导出备份
            </button>
            <label className="px-4 py-2 rounded-lg border border-stone-300 text-stone-700 text-sm font-medium hover:bg-stone-50 cursor-pointer">
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
              导入备份
            </label>
          </div>
          {exportMessage && (
            <p className="text-sm text-amber-600 mt-2">{exportMessage}</p>
          )}
          {importMessage && (
            <p className="text-sm text-amber-600 mt-2">{importMessage}</p>
          )}
        </div>

        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50">
          <h3 className="text-sm font-medium text-stone-700 mb-2">清空所有数据</h3>
          <p className="text-xs text-stone-500 mb-2">
            删除本地所有豆子与消耗记录，不可恢复
          </p>
          <button
            type="button"
            onClick={() => {
                if (window.confirm('确定清空所有数据？此操作不可恢复。')) {
                localStorage.removeItem(STORAGE_KEY)
                localStorage.removeItem(OUTINGS_STORAGE_KEY)
                window.location.reload()
              }
            }}
            className="px-4 py-2 rounded-lg border border-red-300 text-red-700 text-sm font-medium hover:bg-red-50"
          >
            清空数据
          </button>
        </div>
      </div>
    </div>
  )
}
