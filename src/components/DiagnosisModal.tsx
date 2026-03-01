import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import type { CoffeeBean, CuppingRecord } from '../types'
import { useStore } from '../store/useStore'
import { buildDiagnosisUserMessage } from '../utils/kimiDiagnosis'
import { requestKimiDiagnosis } from '../utils/kimiApi'

export function DiagnosisModal({
  bean,
  cupping,
  onClose,
}: {
  bean: CoffeeBean
  cupping: CuppingRecord
  onClose: () => void
}) {
  const kimiApiKey = useStore((s) => s.kimiApiKey)
  const kimiDiagnosisPrompt = useStore((s) => s.kimiDiagnosisPrompt)

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [content, setContent] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const userMessage = buildDiagnosisUserMessage(bean, cupping)
    requestKimiDiagnosis({
      apiKey: kimiApiKey ?? '',
      systemPrompt: kimiDiagnosisPrompt ?? '',
      userMessage,
    }).then((res) => {
      if (res.success) {
        setContent(res.content)
        setStatus('success')
      } else {
        setError(res.error)
        setStatus('error')
      }
    })
  }, [bean, cupping, kimiApiKey, kimiDiagnosisPrompt])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xl bg-white/95"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">
            手冲诊断 · {bean.roaster} {bean.farm}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
            aria-label="关闭"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {status === 'loading' && (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <Loader2 className="w-10 h-10 animate-spin mb-3" />
              <p>正在请求 Kimi 诊断…</p>
            </div>
          )}
          {status === 'error' && (
            <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-red-800 text-sm">
              {error}
            </div>
          )}
          {status === 'success' && (
            <div className="text-slate-700 text-sm whitespace-pre-wrap leading-relaxed">
              {content}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
