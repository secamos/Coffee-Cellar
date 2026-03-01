/**
 * 从豆库中抽取各字段的历史唯一值，供表单下拉补全（LocalStorage 数据通过 store.beans 获取）
 */
import type { CoffeeBean } from '../types'

export type HistoryField =
  | 'roaster'
  | 'origin'
  | 'farm'
  | 'lot'
  | 'batch'
  | 'altitude'
  | 'process'
  | 'variety'

function getUniqueNonEmpty(beans: CoffeeBean[], field: HistoryField): string[] {
  const set = new Set<string>()
  for (const b of beans) {
    const v = b[field]
    if (typeof v === 'string' && v.trim()) set.add(v.trim())
  }
  return Array.from(set).sort()
}

/**
 * 获取指定字段的历史唯一值列表（用于输入框下拉补全）
 */
export function getHistoryForField(beans: CoffeeBean[], field: HistoryField): string[] {
  return getUniqueNonEmpty(beans, field)
}

/**
 * 获取库存/起始库存历史：豆子中出现过的重量值，去重排序（供快速选填）
 */
export function getWeightHistory(beans: CoffeeBean[]): number[] {
  const set = new Set<number>()
  for (const b of beans) {
    if (typeof b.initialWeight === 'number' && b.initialWeight >= 0)
      set.add(b.initialWeight)
    if (typeof b.weight === 'number' && b.weight >= 0) set.add(b.weight)
  }
  return Array.from(set).sort((a, b) => a - b)
}

/**
 * 获取所有风味标签历史：豆子的 flavorTags + 所有杯测记录的 flavorTags，去重排序
 */
export function getFlavorTagHistory(beans: CoffeeBean[]): string[] {
  const set = new Set<string>()
  for (const b of beans) {
    for (const t of b.flavorTags ?? []) {
      if (typeof t === 'string' && t.trim()) set.add(t.trim())
    }
    for (const c of b.cuppings ?? []) {
      for (const t of c.flavorTags ?? []) {
        if (typeof t === 'string' && t.trim()) set.add(t.trim())
      }
    }
  }
  return Array.from(set).sort()
}
