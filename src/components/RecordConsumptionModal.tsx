import { useState } from 'react'
import { X } from 'lucide-react'
import type { CoffeeBean } from '../types'
import { useStore } from '../store/useStore'

export function RecordConsumptionModal({
  bean,
  defaultAmount,
  onClose,
}: {
  bean: CoffeeBean
  defaultAmount: number
  onClose: () => void
}) {
  const [amount, setAmount] = useState(defaultAmount)
  const recordConsumption = useStore((s) => s.recordConsumption)

  const maxAmount = bean.weight
  const validAmount = Math.min(Math.max(1, amount), maxAmount)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validAmount <= 0 || validAmount > bean.weight) return
    recordConsumption(bean.id, validAmount)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-lg max-w-sm w-full p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-slate-800">记录消耗</h3>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-slate-600 mb-2">
          {bean.name} · 当前库存 {bean.weight}g
        </p>
        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-slate-700 mb-1">消耗克数 (g)</label>
          <input
            type="number"
            min={1}
            max={maxAmount}
            step={1}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value) || 0)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 mb-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          {amount > maxAmount && (
            <p className="text-indigo-600 text-sm mb-2">库存不足，已自动限制为 {maxAmount}g</p>
          )}
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={validAmount <= 0}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              确认扣减 {validAmount}g
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
