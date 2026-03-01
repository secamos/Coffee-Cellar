/**
 * 全局状态：咖啡豆列表、消耗记录、设置
 * 使用 Zustand persist 中间件持久化到 LocalStorage，key: coffee-calendar-storage
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { addDays, format, startOfDay } from 'date-fns'
import type {
  CoffeeBean,
  ConsumptionRecord,
  CuppingRecord,
  CuppingScores,
} from '../types'
import {
  deriveBeanStatus,
  getRemainingCups,
  getRemainingRemainderGrams,
} from '../utils/beanLogic'
import { calculateDrinkingSchedule } from '../utils/scheduleLogic'
import { DEFAULT_KIMI_DIAGNOSIS_PROMPT } from '../constants/kimiDiagnosisPrompt'

const STORAGE_KEY = 'coffee-calendar-storage'
const DEFAULT_DAILY_G = 15
const DEFAULT_WEIGHT = 100

/** totalScore = (8 维之和) × 1.25 四舍五入取整 */
export function computeTotalScore(scores: CuppingScores): number {
  const sum =
    scores.fragrance +
    scores.flavor +
    scores.acidity +
    scores.body +
    scores.sweetness +
    scores.balance +
    scores.aftertaste +
    scores.overall
  return Math.round(sum * 1.25)
}

/** 由目标总分反推均分 8 维（用于示例数据或简化杯测） */
export function scoresFromTotal(total: number): CuppingScores {
  const v = total / 10
  return {
    fragrance: v,
    flavor: v,
    acidity: v,
    body: v,
    sweetness: v,
    balance: v,
    aftertaste: v,
    overall: v,
  }
}

/** 单日排班：主推荐豆 + 追加杯 beanId 列表；rest 为 true 表示用户主动跳过（休息日） */
export interface ScheduleEntry {
  beanId: string | null
  extraBeanIds: string[]
  rest?: boolean
}

/** 烘焙商 → 养豆天数 */
export type RoasterRestingDays = Record<string, number>

const DEFAULT_RESTING_DAYS = 30

/** 持久化结构：包含版本号，便于未来数据迁移 */
export interface PersistedState {
  version: number
  beans: CoffeeBean[]
  consumptions: ConsumptionRecord[]
  defaultDailyConsumption: number
  /** 烘焙商与养豆天数对应关系 */
  roasterRestingDays: RoasterRestingDays
  /** 日历排班 key=yyyy-MM-dd */
  calendarSchedule: Record<string, ScheduleEntry>
  /** Kimi 杯测诊断 API Key */
  kimiApiKey: string
  /** Kimi 杯测诊断系统 Prompt */
  kimiDiagnosisPrompt: string
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/** 创建示例豆子（3 支）：无 roastLevel，weight/initialWeight 默认 100，含 flavorTags */
function createSampleBeans(): CoffeeBean[] {
  const today = new Date().toISOString().slice(0, 10)
  const addDays = (d: string, n: number) => {
    const date = new Date(d)
    date.setDate(date.getDate() + n)
    return date.toISOString().slice(0, 10)
  }
  return [
    {
      id: generateId(),
      name: '巴拿马 翡翠庄园 绿标瑰夏',
      roaster: '某人咖啡',
      origin: '巴拿马',
      farm: '翡翠庄园',
      lot: '绿标',
      batch: '2024-01',
      altitude: '1600m',
      process: '水洗',
      variety: '瑰夏',
      roastDate: addDays(today, -45),
      addedDate: addDays(today, -44),
      weight: 120,
      initialWeight: 100,
      price: 198,
      status: 'drinking',
      flavorTags: ['茉莉', '柑橘', '蜂蜜'],
      tags: ['春节杯测'],
      notes: '',
      cuppings: [
        {
          id: generateId(),
          beanId: '',
          date: addDays(today, -5),
          scores: scoresFromTotal(92),
          totalScore: 92,
          flavorTags: ['茉莉', '柑橘', '蜂蜜'],
          brewMethod: '手冲',
          dose: 15,
          notes: '花香明显，酸质明亮',
        },
      ],
      dailyConsumption: DEFAULT_DAILY_G,
    },
    {
      id: generateId(),
      name: '埃塞俄比亚 花魁7.0',
      roaster: '治光师',
      origin: '埃塞俄比亚',
      farm: '罕贝拉',
      process: '日晒',
      variety: '花魁',
      roastDate: addDays(today, -25),
      addedDate: addDays(today, -24),
      weight: DEFAULT_WEIGHT,
      initialWeight: DEFAULT_WEIGHT,
      price: 88,
      status: 'resting',
      flavorTags: [],
      tags: [],
      notes: '',
      cuppings: [],
      dailyConsumption: DEFAULT_DAILY_G,
    },
    {
      id: generateId(),
      name: '肯尼亚 AA',
      roaster: '本地烘焙商',
      origin: '肯尼亚',
      farm: '涅里',
      process: '水洗',
      variety: 'SL28/SL34',
      roastDate: addDays(today, -60),
      addedDate: addDays(today, -59),
      weight: 0,
      initialWeight: DEFAULT_WEIGHT,
      price: 68,
      status: 'finished',
      flavorTags: [],
      tags: [],
      notes: '',
      cuppings: [
        {
          id: generateId(),
          beanId: '',
          date: addDays(today, -20),
          scores: scoresFromTotal(88),
          totalScore: 88,
          flavorTags: ['莓果', '番茄'],
          brewMethod: '手冲',
          dose: 15,
          notes: '莓果、番茄感',
        },
      ],
      dailyConsumption: DEFAULT_DAILY_G,
    },
  ]
}

/** 为示例豆子补全 cuppings[].beanId */
function fixSampleBeanIds(beans: CoffeeBean[]): CoffeeBean[] {
  return beans.map((b) => ({
    ...b,
    cuppings: b.cuppings.map((c) => ({
      ...c,
      id: c.id || generateId(),
      beanId: b.id,
    })),
  }))
}

const defaultBeans = fixSampleBeanIds(createSampleBeans())

/** 新增杯测时的入参（SCA 完整） */
export interface AddCuppingPayload {
  date?: string
  scores: CuppingScores
  flavorTags: string[]
  brewMethod: string
  dose: number
  yield?: number
  waterTemp?: number
  grindSize?: string
  pourSegments?: import('../types').PourSegment[]
  notes?: string
}

interface CoffeeState extends PersistedState {
  /** 豆库/消耗变更后为 true，重新规划后置为 false（不持久化） */
  isScheduleDirty: boolean
  recalculateSchedule: (force?: boolean) => void
  addBean: (bean: Omit<CoffeeBean, 'id' | 'cuppings' | 'status'>) => void
  updateBean: (id: string, patch: Partial<CoffeeBean>) => void
  deleteBean: (id: string) => void
  recordConsumption: (
    beanId: string,
    amount: number,
    date?: string,
    cuppingId?: string
  ) => void
  removeConsumptionsForDate: (date: string) => void
  removeConsumption: (consumptionId: string) => void
  removeConsumptionForBeanAndDate: (beanId: string, dateStr: string) => void
  addCupping: (beanId: string, payload: AddCuppingPayload) => void
  updateCupping: (beanId: string, cuppingId: string, patch: Partial<CuppingRecord>) => void
  deleteCupping: (beanId: string, cuppingId: string) => void
  setDefaultDailyConsumption: (grams: number) => void
  getRestingDaysForRoaster: (roaster: string) => number
  setRoasterRestingDays: (roaster: string, days: number) => void
  getBeanById: (id: string) => CoffeeBean | undefined
  getConsumptionsByBeanId: (beanId: string) => ConsumptionRecord[]
  syncBeanStatuses: () => void
  initSampleDataIfEmpty: () => void
  getScheduleForDate: (dateKey: string) => ScheduleEntry
  setDaySchedule: (
    dateKey: string,
    beanId: string | null,
    extraBeanIds?: string[],
    rest?: boolean
  ) => void
  addExtraBeanToDay: (dateKey: string, beanId: string) => void
  setKimiApiKey: (key: string) => void
  setKimiDiagnosisPrompt: (prompt: string) => void
}

export const useStore = create<CoffeeState>()(
  persist(
    (set, get) => ({
      version: 3,
      beans: defaultBeans,
      consumptions: [],
      defaultDailyConsumption: DEFAULT_DAILY_G,
      roasterRestingDays: {},
      calendarSchedule: {},
      kimiApiKey: '',
      kimiDiagnosisPrompt: DEFAULT_KIMI_DIAGNOSIS_PROMPT,
      isScheduleDirty: false,

      recalculateSchedule: () => {
        const { beans, consumptions, calendarSchedule, getRestingDaysForRoaster } =
          get()
        const today = startOfDay(new Date())
        const todayKey = format(today, 'yyyy-MM-dd')
        const preserved: Record<string, string> = {}
        if (calendarSchedule[todayKey]?.beanId) {
          preserved[todayKey] = calendarSchedule[todayKey].beanId!
        }
        consumptions.forEach((c) => {
          const d = c.date
          if (calendarSchedule[d]?.beanId) preserved[d] = calendarSchedule[d].beanId!
        })
        Object.entries(calendarSchedule).forEach(([dateKey, entry]) => {
          if (entry.beanId) preserved[dateKey] = entry.beanId
        })
        const startDate = addDays(today, 1)
        const newSchedule = calculateDrinkingSchedule(
          beans,
          startDate,
          30,
          preserved,
          getRestingDaysForRoaster
        )
        set((s) => {
          const merged = { ...s.calendarSchedule }
          Object.entries(newSchedule).forEach(([dateKey, beanId]) => {
            const prev = merged[dateKey]
            merged[dateKey] = {
              beanId: beanId || null,
              extraBeanIds: prev?.extraBeanIds ?? [],
              rest: prev?.rest ?? false,
            }
          })
          return { calendarSchedule: merged, isScheduleDirty: false }
        })
      },

      addBean: (bean) => {
        const id = generateId()
        const initialWeight = bean.initialWeight ?? 0
        const weight = bean.weight ?? initialWeight
        const newBean: CoffeeBean = {
          ...bean,
          id,
          weight,
          initialWeight,
          cuppings: [],
          status: 'resting',
          flavorTags: bean.flavorTags ?? [],
          dailyConsumption: bean.dailyConsumption ?? get().defaultDailyConsumption,
        }
        set((s) => ({ beans: [...s.beans, newBean] }))
        get().syncBeanStatuses()
      },

      updateBean: (id, patch) => {
        set((s) => ({
          beans: s.beans.map((b) => {
            if (b.id !== id) return b
            const merged = { ...b, ...patch }
            if (patch.weight === 0) merged.status = 'finished'
            return merged
          }),
          isScheduleDirty: true,
        }))
        get().syncBeanStatuses()
      },

      deleteBean: (id) => {
        set((s) => ({
          beans: s.beans.filter((b) => b.id !== id),
          consumptions: s.consumptions.filter((c) => c.beanId !== id),
          isScheduleDirty: true,
        }))
      },

      recordConsumption: (beanId, amount, date, cuppingId) => {
        const d = date || format(new Date(), 'yyyy-MM-dd')
        const rec: ConsumptionRecord = {
          id: generateId(),
          beanId,
          date: d,
          amount,
          cuppingId,
        }
        set((s) => {
          const bean = s.beans.find((b) => b.id === beanId)
          if (!bean) return s
          const newWeight = Math.max(0, bean.weight - amount)
          const isFirstConsumptionForDate = !s.consumptions.some((c) => c.date === d)
          const scheduleUpdate =
            isFirstConsumptionForDate
              ? {
                  calendarSchedule: {
                    ...s.calendarSchedule,
                    [d]: {
                      beanId,
                      extraBeanIds: s.calendarSchedule[d]?.extraBeanIds ?? [],
                      rest: false,
                    },
                  },
                }
              : {}
          return {
            consumptions: [...s.consumptions, rec],
            beans: s.beans.map((b) =>
              b.id === beanId ? { ...b, weight: newWeight } : b
            ),
            isScheduleDirty: true,
            ...scheduleUpdate,
          }
        })
        get().syncBeanStatuses()
      },

      removeConsumptionsForDate: (date) => {
        set((s) => {
          const toRemove = s.consumptions.filter((c) => c.date === date)
          if (toRemove.length === 0) return s
          const beanIdsToRestore = [...new Set(toRemove.map((c) => c.beanId))]
          const consumptions = s.consumptions.filter((c) => c.date !== date)
          const beans = s.beans.map((b) => {
            if (!beanIdsToRestore.includes(b.id)) return b
            const restored = toRemove
              .filter((c) => c.beanId === b.id)
              .reduce((sum, c) => sum + c.amount, 0)
            return { ...b, weight: b.weight + restored }
          })
          return { consumptions, beans, isScheduleDirty: true }
        })
        get().syncBeanStatuses()
      },

      removeConsumption: (consumptionId) => {
        set((s) => {
          const rec = s.consumptions.find((c) => c.id === consumptionId)
          if (!rec) return s
          const consumptions = s.consumptions.filter((c) => c.id !== consumptionId)
          const beans = s.beans.map((b) =>
            b.id === rec.beanId ? { ...b, weight: b.weight + rec.amount } : b
          )
          return { consumptions, beans, isScheduleDirty: true }
        })
        get().syncBeanStatuses()
      },

      removeConsumptionForBeanAndDate: (beanId, dateStr) => {
        set((s) => {
          const toRemove = s.consumptions.filter(
            (c) => c.beanId === beanId && c.date === dateStr
          )
          if (toRemove.length === 0) return s
          const totalRestore = toRemove.reduce((sum, c) => sum + c.amount, 0)
          const consumptions = s.consumptions.filter(
            (c) => !(c.beanId === beanId && c.date === dateStr)
          )
          const beans = s.beans.map((b) =>
            b.id === beanId ? { ...b, weight: b.weight + totalRestore } : b
          )
          return { consumptions, beans, isScheduleDirty: true }
        })
        get().syncBeanStatuses()
      },

      addCupping: (beanId, payload) => {
        const d = payload.date || format(new Date(), 'yyyy-MM-dd')
        const totalScore = computeTotalScore(payload.scores)
        const ratio =
          payload.yield != null && payload.dose
            ? `1:${(payload.yield / payload.dose).toFixed(1)}`
            : undefined
        const c: CuppingRecord = {
          id: generateId(),
          beanId,
          date: d,
          scores: payload.scores,
          totalScore,
          flavorTags: payload.flavorTags ?? [],
          brewMethod: payload.brewMethod,
          dose: payload.dose,
          yield: payload.yield,
          waterTemp: payload.waterTemp,
          grindSize: payload.grindSize,
          ratio,
          pourSegments: payload.pourSegments,
          notes: payload.notes,
        }
        const amount = payload.dose ?? 15
        set((s) => {
          const beans = s.beans.map((b) =>
            b.id === beanId ? { ...b, cuppings: [...b.cuppings, c] } : b
          )
          const consIdx = s.consumptions.findIndex(
            (cons) =>
              cons.beanId === beanId && cons.date === d && !cons.cuppingId
          )
          let consumptions: ConsumptionRecord[]
          if (consIdx >= 0) {
            consumptions = s.consumptions.map((cons, i) =>
              i === consIdx ? { ...cons, cuppingId: c.id } : cons
            )
          } else {
            const bean = s.beans.find((b) => b.id === beanId)
            if (bean) {
              const newCons: ConsumptionRecord = {
                id: generateId(),
                beanId,
                date: d,
                amount,
                cuppingId: c.id,
              }
              consumptions = [...s.consumptions, newCons]
              const newWeight = Math.max(0, bean.weight - amount)
              return {
                beans: beans.map((b) =>
                  b.id === beanId ? { ...b, weight: newWeight } : b
                ),
                consumptions,
                isScheduleDirty: true,
              }
            }
            consumptions = s.consumptions
          }
          return { beans, consumptions }
        })
        get().syncBeanStatuses()
      },

      updateCupping: (beanId, cuppingId, patch) => {
        set((s) => ({
          beans: s.beans.map((b) => {
            if (b.id !== beanId) return b
            const cuppings = b.cuppings.map((c) => {
              if (c.id !== cuppingId) return c
              const merged = { ...c, ...patch }
              if (patch.scores) {
                merged.totalScore = computeTotalScore(patch.scores)
              }
              if (patch.yield != null && merged.dose) {
                merged.ratio = `1:${(patch.yield / merged.dose).toFixed(0)}`
              }
              return merged
            })
            return { ...b, cuppings }
          }),
        }))
      },

      deleteCupping: (beanId, cuppingId) => {
        set((s) => ({
          beans: s.beans.map((b) =>
            b.id === beanId
              ? { ...b, cuppings: b.cuppings.filter((c) => c.id !== cuppingId) }
              : b
          ),
        }))
        get().syncBeanStatuses()
      },

      setDefaultDailyConsumption: (grams) => {
        set({ defaultDailyConsumption: Math.max(1, grams) })
      },

      getRestingDaysForRoaster: (roaster) => {
        const map = get().roasterRestingDays ?? {}
        const n = map[roaster]
        return typeof n === 'number' && n >= 0 ? n : DEFAULT_RESTING_DAYS
      },

      setRoasterRestingDays: (roaster, days) => {
        const trimmed = roaster.trim()
        if (!trimmed) return
        set((s) => ({
          roasterRestingDays: {
            ...(s.roasterRestingDays ?? {}),
            [trimmed]: Math.max(0, Math.round(days)),
          },
        }))
        get().syncBeanStatuses()
      },

      getBeanById: (id) => get().beans.find((b) => b.id === id),

      getConsumptionsByBeanId: (beanId) =>
        get().consumptions.filter((c) => c.beanId === beanId),

      syncBeanStatuses: () => {
        const getResting = get().getRestingDaysForRoaster
        set((s) => {
          const consumptions = s.consumptions
          return {
            beans: s.beans.map((b) => {
              const hasAny = consumptions.some((c) => c.beanId === b.id)
              const restingDays = getResting(b.roaster)
              const status = deriveBeanStatus(
                b,
                hasAny,
                new Date(),
                restingDays
              )
              return { ...b, status }
            }),
          }
        })
      },

      initSampleDataIfEmpty: () => {
        const { beans, consumptions } = get()
        if (beans.length > 0) return
        set({
          beans: fixSampleBeanIds(createSampleBeans()),
          consumptions: consumptions ?? [],
        })
      },

      getScheduleForDate: (dateKey) => {
        const entry = get().calendarSchedule[dateKey]
        if (entry) return entry
        return { beanId: null, extraBeanIds: [], rest: false }
      },

      setDaySchedule: (dateKey, beanId, extraBeanIds, rest) => {
        set((s) => ({
          calendarSchedule: {
            ...s.calendarSchedule,
            [dateKey]: {
              beanId: beanId ?? null,
              extraBeanIds: extraBeanIds ?? s.calendarSchedule[dateKey]?.extraBeanIds ?? [],
              rest: rest ?? false,
            },
          },
        }))
      },

      addExtraBeanToDay: (dateKey, beanId) => {
        set((s) => {
          const prev = s.calendarSchedule[dateKey]
          const list = prev ? [...prev.extraBeanIds, beanId] : [beanId]
          return {
            calendarSchedule: {
              ...s.calendarSchedule,
              [dateKey]: {
                beanId: prev?.beanId ?? null,
                extraBeanIds: list,
                rest: prev?.rest ?? false,
              },
            },
          }
        })
      },

      setKimiApiKey: (key) => set({ kimiApiKey: key ?? '' }),
      setKimiDiagnosisPrompt: (prompt) =>
        set({ kimiDiagnosisPrompt: prompt ?? DEFAULT_KIMI_DIAGNOSIS_PROMPT }),
    }),
    {
      name: STORAGE_KEY,
      version: 3,
      partialize: (state) => ({
        version: state.version,
        beans: state.beans,
        consumptions: state.consumptions,
        defaultDailyConsumption: state.defaultDailyConsumption,
        roasterRestingDays: state.roasterRestingDays ?? {},
        calendarSchedule: state.calendarSchedule,
        kimiApiKey: state.kimiApiKey ?? '',
        kimiDiagnosisPrompt: state.kimiDiagnosisPrompt ?? DEFAULT_KIMI_DIAGNOSIS_PROMPT,
      }),
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- migrate signature
      migrate: (persisted: unknown, version: number) => {
        const s = persisted as Record<string, unknown>
        if (s) {
          if (s.roasterRestingDays === undefined) s.roasterRestingDays = {}
          if (s.kimiApiKey === undefined) s.kimiApiKey = ''
          if (s.kimiDiagnosisPrompt === undefined)
            s.kimiDiagnosisPrompt = DEFAULT_KIMI_DIAGNOSIS_PROMPT
        }
        return s as PersistedState
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          useStore.getState().syncBeanStatuses()
          const beans = state.beans ?? []
          const consumptions = state.consumptions ?? []
          let calendarSchedule = { ...(state.calendarSchedule ?? {}) }
          // 存量数据：将记录中的消费同步到日历排班
          const byDate: Record<string, { beanId: string; id: string }[]> = {}
          for (const c of consumptions) {
            if (!byDate[c.date]) byDate[c.date] = []
            byDate[c.date].push({ beanId: c.beanId, id: c.id })
          }
          let scheduleChanged = false
          for (const [date, list] of Object.entries(byDate)) {
            list.sort((a, b) => a.id.localeCompare(b.id))
            const mainBeanId = list[0].beanId
            const extraBeanIds = list.slice(1).map((x) => x.beanId)
            const entry = calendarSchedule[date]
            const needsSync =
              !entry?.beanId ||
              entry.beanId !== mainBeanId ||
              JSON.stringify([...(entry.extraBeanIds ?? [])].sort()) !==
                JSON.stringify([...extraBeanIds].sort())
            if (needsSync) {
              calendarSchedule = {
                ...calendarSchedule,
                [date]: {
                  beanId: mainBeanId,
                  extraBeanIds,
                  rest: false,
                },
              }
              scheduleChanged = true
            }
          }
          if (scheduleChanged) {
            useStore.setState({ calendarSchedule })
          }
          // 数据恢复：日历排班有但记录缺失时，从排班补回消费记录（仅补记录，不扣重量）
          const consumptionKey = (c: { date: string; beanId: string }) =>
            `${c.date}:${c.beanId}`
          const haveKeys = new Set(consumptions.map(consumptionKey))
          const toAdd: ConsumptionRecord[] = []
          for (const [date, entry] of Object.entries(calendarSchedule)) {
            if (!entry?.beanId) continue
            const ids = [entry.beanId, ...(entry.extraBeanIds ?? [])]
            for (const beanId of ids) {
              if (!haveKeys.has(`${date}:${beanId}`)) {
                const bean = beans.find((b) => b.id === beanId)
                if (bean) {
                  toAdd.push({
                    id: generateId(),
                    beanId,
                    date,
                    amount: 15,
                  })
                  haveKeys.add(`${date}:${beanId}`)
                }
              }
            }
          }
          if (toAdd.length > 0) {
            useStore.setState((s) => ({
              consumptions: [...s.consumptions, ...toAdd],
              isScheduleDirty: true,
            }))
            useStore.getState().syncBeanStatuses()
          }
          if (beans.length > 0 && Object.keys(calendarSchedule).length === 0) {
            useStore.getState().recalculateSchedule()
          }
        }
      },
    }
  )
)

export function useRemainingCups(bean: CoffeeBean | null) {
  if (!bean) return { cups: 0, remainder: 0 }
  return {
    cups: getRemainingCups(bean),
    remainder: getRemainingRemainderGrams(bean),
  }
}
