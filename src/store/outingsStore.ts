import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { OutingRecord } from '../types/outing'

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

interface OutingsState {
  outings: OutingRecord[]
  addOuting: (o: Omit<OutingRecord, 'id'>) => string
  updateOuting: (id: string, patch: Partial<Omit<OutingRecord, 'id'>>) => void
  removeOuting: (id: string) => void
  getOutingById: (id: string) => OutingRecord | undefined
}

export const useOutingsStore = create<OutingsState>()(
  persist(
    (set, get) => ({
      outings: [],

      addOuting: (o) => {
        const id = generateId()
        const record: OutingRecord = { ...o, id }
        set((s) => ({ outings: [record, ...(s.outings ?? [])] }))
        return id
      },

      updateOuting: (id, patch) => {
        set((s) => ({
          outings: (s.outings ?? []).map((x) =>
            x.id === id ? { ...x, ...patch } : x
          ),
        }))
      },

      removeOuting: (id) => {
        set((s) => ({ outings: (s.outings ?? []).filter((x) => x.id !== id) }))
      },

      getOutingById: (id) => (get().outings ?? []).find((x) => x.id === id),
    }),
    {
      name: 'coffee-calendar-outings',
      partialize: (s) => ({ outings: s.outings }),
      migrate: (persisted: unknown) => {
        const p = persisted as { outings?: Array<Record<string, unknown>> } | null | undefined
        const raw = Array.isArray(p?.outings) ? p.outings : []
        const outings: OutingRecord[] = raw.map((x) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars -- strip legacy imageKeys
          const { imageKeys, ...rest } = x as OutingRecord & { imageKeys?: string[] }
          return rest as OutingRecord
        })
        return { outings }
      },
      version: 1,
    }
  )
)
