/** 根据 beansOrTea 文本推断饮品类型 */
export function inferDrinkType(beansOrTea?: string): 'coffee' | 'tea' {
  if (!beansOrTea?.trim()) return 'coffee'
  const t = beansOrTea.toLowerCase()
  if (/茶|乌龙|绿茶|红茶|普洱|龙井|茉莉|正山|铁观音|白茶|黑茶|黄茶|抹茶/.test(t)) return 'tea'
  return 'coffee'
}
