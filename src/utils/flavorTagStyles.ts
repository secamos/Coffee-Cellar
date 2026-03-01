/**
 * 风味标签视觉：胶囊样式、按类别分色、小图标
 * 用于 BeanCard、DayBeanCard、CuppingResult、Cuppings 等
 */

/** 根据风味词返回 Tailwind 胶囊样式（背景+文字+描边） */
export function getFlavorColor(tag: string): string {
  // 花香类
  if (
    ['洋甘菊', '橙花', '茉莉', '玫瑰', '薰衣草'].includes(tag)
  ) {
    return 'bg-violet-50 text-violet-700 border border-violet-200'
  }
  // 果香类 - 柑橘
  if (['柳橙', '柑橘', '柠檬', '橙子'].includes(tag)) {
    return 'bg-orange-50 text-orange-700 border border-orange-200'
  }
  // 果香类 - 浆果
  if (['莓果', '草莓', '蓝莓', '荔枝', '葡萄'].includes(tag)) {
    return 'bg-rose-50 text-rose-700 border border-rose-200'
  }
  // 果香类 - 热带水果
  if (['芒果', '菠萝', '百香果', '热带水果'].includes(tag)) {
    return 'bg-amber-50 text-amber-700 border border-amber-200'
  }
  // 果香类 - 核果/其他
  if (['核果', '桃子', '杏子', '苹果', '梨'].includes(tag)) {
    return 'bg-orange-50/80 text-orange-800 border border-orange-200'
  }
  // 甜感类
  if (
    ['百花蜜', '蜂蜜', '焦糖', '巧克力', '坚果', '杏仁', '榛子', '奶油', '香草'].includes(
      tag
    )
  ) {
    return 'bg-amber-50/80 text-amber-800 border border-amber-200'
  }
  // 口感/其他
  if (['果汁感', '茶感'].includes(tag)) {
    return 'bg-sky-50 text-sky-700 border border-sky-200'
  }
  // 香料/发酵等
  if (['香料', '肉桂', '丁香', '红酒', '发酵感', '草本', '烟熏', '泥土'].includes(tag)) {
    return 'bg-slate-100 text-slate-700 border border-slate-200'
  }
  // 默认
  return 'bg-slate-100 text-slate-700 border border-slate-200'
}

/** 选中态样式（用于 CuppingModal 选择器） */
export function getFlavorColorSelected(tag: string): string {
  if (['洋甘菊', '橙花', '茉莉', '玫瑰', '薰衣草'].includes(tag)) {
    return 'bg-violet-600 text-white border-violet-600'
  }
  if (['柳橙', '柑橘', '柠檬', '橙子'].includes(tag)) {
    return 'bg-orange-600 text-white border-orange-600'
  }
  if (['莓果', '草莓', '蓝莓', '荔枝', '葡萄'].includes(tag)) {
    return 'bg-rose-600 text-white border-rose-600'
  }
  if (['芒果', '菠萝', '百香果', '热带水果'].includes(tag)) {
    return 'bg-amber-600 text-white border-amber-600'
  }
  if (['核果', '桃子', '杏子', '苹果', '梨'].includes(tag)) {
    return 'bg-orange-600 text-white border-orange-600'
  }
  if (
    ['百花蜜', '蜂蜜', '焦糖', '巧克力', '坚果', '杏仁', '榛子', '奶油', '香草'].includes(
      tag
    )
  ) {
    return 'bg-amber-600 text-white border-amber-600'
  }
  if (['果汁感', '茶感'].includes(tag)) {
    return 'bg-sky-600 text-white border-sky-600'
  }
  if (['香料', '肉桂', '丁香', '红酒', '发酵感', '草本', '烟熏', '泥土'].includes(tag)) {
    return 'bg-slate-600 text-white border-slate-600'
  }
  return 'bg-indigo-600 text-white border-indigo-600'
}

/** 根据风味词返回 emoji 图标 */
export function getFlavorIcon(tag: string): string {
  if (['洋甘菊', '茉莉', '玫瑰'].includes(tag)) return '🌸'
  if (['橙花'].includes(tag)) return '🌼'
  if (['蜂蜜', '百花蜜'].includes(tag)) return '🍯'
  if (['柑橘', '柳橙', '橙子', '柠檬'].includes(tag)) return '🍊'
  if (['芒果'].includes(tag)) return '🥭'
  if (['荔枝', '莓果', '草莓', '蓝莓'].includes(tag)) return '🍒'
  if (['菠萝'].includes(tag)) return '🍍'
  if (['果汁感'].includes(tag)) return '💧'
  if (['茶感'].includes(tag)) return '🍵'
  if (['巧克力', '焦糖', '奶油'].includes(tag)) return '🍫'
  return '•'
}
