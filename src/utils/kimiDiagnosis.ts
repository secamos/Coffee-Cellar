/**
 * 杯测诊断：根据豆子与杯测记录构建发给 Kimi 的用户输入
 */
import { differenceInDays, parseISO, startOfDay } from 'date-fns'
import type { CoffeeBean, CuppingRecord } from '../types'

function restingDaysAtCupping(roastDate: string, cuppingDate: string): number {
  const roast = startOfDay(parseISO(roastDate))
  const cup = startOfDay(parseISO(cuppingDate))
  return Math.max(0, differenceInDays(cup, roast))
}

export function buildDiagnosisUserMessage(
  bean: CoffeeBean,
  cupping: CuppingRecord
): string {
  const restingDays = restingDaysAtCupping(bean.roastDate, cupping.date)
  const grind = cupping.grindSize ?? '—'
  const ratio =
    cupping.ratio ??
    (cupping.yield && cupping.dose
      ? `1:${(cupping.yield / cupping.dose).toFixed(1)}`
      : '—')
  const waterTemp =
    cupping.waterTemp != null ? `${cupping.waterTemp}°C` : '—'
  const pourDesc =
    cupping.pourSegments?.length
      ? cupping.pourSegments
          .map(
            (s) =>
              `${s.amount}ml ${s.speed}ml/s ${s.style === 'circle' ? '绕圈' : '中心'}`
          )
          .join('；')
      : '—'

  const lines: string[] = [
    '## 豆子档案',
    `- 烘焙商：${bean.roaster}`,
    `- 庄园：${bean.farm}`,
    `- 处理法：${bean.process}`,
    `- 烘焙日期：${bean.roastDate}`,
    `- 养豆天数：${restingDays} 天`,
    '',
    '## 当前冲煮参数',
    `- 研磨：${grind}`,
    `- 粉量：${cupping.dose}g，水量：${cupping.yield ?? '—'}ml，粉水比：${ratio}`,
    `- 水温：${waterTemp}`,
    `- 冲煮方式：${cupping.brewMethod}`,
    ...(cupping.pourSegments?.length ? [`- 分段注水：${pourDesc}`] : []),
    '',
    '## 杯测自评与备注',
    `- 总分：${cupping.totalScore} 分`,
    ...(cupping.flavorTags?.length
      ? [`- 风味标签：${cupping.flavorTags.join('、')}`]
      : []),
    ...(cupping.notes ? [`- 备注：${cupping.notes}`] : []),
  ]
  return lines.join('\n').trim()
}
