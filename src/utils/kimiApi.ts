/**
 * 调用 Kimi（Moonshot）Chat Completions API
 */
const API_BASE = 'https://api.moonshot.cn/v1'
const DEFAULT_MODEL = 'moonshot-v1-8k'

export interface KimiDiagnosisOptions {
  apiKey: string
  systemPrompt: string
  userMessage: string
  model?: string
}

export type KimiDiagnosisResponse =
  | { success: true; content: string }
  | { success: false; error: string }

export async function requestKimiDiagnosis(
  options: KimiDiagnosisOptions
): Promise<KimiDiagnosisResponse> {
  const { apiKey, systemPrompt, userMessage, model = DEFAULT_MODEL } = options
  const trimmedKey = typeof apiKey === 'string' ? apiKey.trim() : ''
  if (!trimmedKey) {
    return { success: false, error: '请先在设置中填写 Kimi API Key' }
  }

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: userMessage },
  ]

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: 'Bearer ' + trimmedKey,
  }

  try {
    const res = await fetch(`${API_BASE}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ model, messages, temperature: 0.6 }),
    })

    const text = await res.text()
    if (!res.ok) {
      let errMsg = `请求失败 ${res.status}`
      try {
        const j = JSON.parse(text)
        if (j.error?.message) errMsg = j.error.message
      } catch {
        if (text) errMsg = text.slice(0, 200)
      }
      return { success: false, error: errMsg }
    }

    const data = JSON.parse(text) as {
      choices?: Array<{ message?: { content?: string } }>
    }
    const content = data.choices?.[0]?.message?.content
    if (content == null) return { success: false, error: '接口返回格式异常' }
    return { success: true, content }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return { success: false, error: `网络或请求异常：${message}` }
  }
}
