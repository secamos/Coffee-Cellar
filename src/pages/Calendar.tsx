import { useState } from 'react'
import { useStore } from '../store/useStore'
import { FocusZoneCards } from '../components/calendar/FocusZoneCards'
import { CuppingModal } from '../components/CuppingModal'
import { BeanPickerModal } from '../components/BeanPickerModal'

export function Calendar() {
  const beans = useStore((s) => s.beans)
  const setDaySchedule = useStore((s) => s.setDaySchedule)
  const recordConsumption = useStore((s) => s.recordConsumption)
  const removeConsumptionForBeanAndDate = useStore(
    (s) => s.removeConsumptionForBeanAndDate
  )
  const getBeanById = useStore((s) => s.getBeanById)

  const [cuppingModal, setCuppingModal] = useState<{
    beanId: string
    dateStr: string
    cuppingId?: string
  } | null>(null)
  const [selectBeanForDateKey, setSelectBeanForDateKey] = useState<
    string | null
  >(null)

  const handleComplete = (beanId: string, dateStr: string) => {
    recordConsumption(beanId, 15, dateStr)
    setCuppingModal({ beanId, dateStr })
  }

  const handleSelectFromLibrary = (dateKey: string) => {
    setSelectBeanForDateKey(dateKey)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- signature matches CuppingModal onClose
  const handleCuppingClose = (saved?: boolean) => {
    setCuppingModal(null)
  }

  const handleEditCupping = (
    beanId: string,
    dateStr: string,
    cuppingId: string
  ) => {
    setCuppingModal({ beanId, dateStr, cuppingId })
  }

  const handleCancelConsumption = (beanId: string, dateStr: string) => {
    if (window.confirm('确定取消该日的饮用记录？将恢复豆子重量。')) {
      removeConsumptionForBeanAndDate(beanId, dateStr)
    }
  }

  const cupBean = cuppingModal ? getBeanById(cuppingModal.beanId) : null
  const initialCupping =
    cupBean && cuppingModal
      ? cuppingModal.cuppingId
        ? cupBean.cuppings?.find((c) => c.id === cuppingModal.cuppingId)
        : cupBean.cuppings?.find((c) => c.date === cuppingModal.dateStr)
      : undefined

  return (
    <div>
      {/* 焦点区：昨日 · 今日 · 明日 */}
      <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
        <span>📅</span>
        <span>昨日 · 今天 · 明日</span>
      </div>
      <FocusZoneCards
        onComplete={handleComplete}
        onSelectFromLibrary={handleSelectFromLibrary}
        onEditCupping={handleEditCupping}
        onCancelConsumption={handleCancelConsumption}
      />

      {cupBean && cuppingModal && (
        <CuppingModal
          bean={cupBean}
          initialDate={cuppingModal.dateStr}
          initialDose={15}
          initialCupping={initialCupping}
          onClose={(saved) => handleCuppingClose(saved)}
        />
      )}

      {selectBeanForDateKey && (
        <BeanPickerModal
          dateKey={selectBeanForDateKey}
          beans={beans.filter(
            (b) => b.weight >= 15 && b.status !== 'finished'
          )}
          onSelect={(bean) => {
            setDaySchedule(selectBeanForDateKey, bean.id)
            setSelectBeanForDateKey(null)
          }}
          onClose={() => setSelectBeanForDateKey(null)}
        />
      )}
    </div>
  )
}
