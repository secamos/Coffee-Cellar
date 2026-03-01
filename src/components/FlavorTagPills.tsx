/**
 * 风味标签胶囊展示：按类别分色、小图标、flex-wrap 自动换行
 */
import {
  getFlavorColor,
  getFlavorIcon,
} from '../utils/flavorTagStyles'

interface FlavorTagPillsProps {
  tags: string[]
  /** 显示数量限制，默认不限制 */
  max?: number
  /** 最多显示几行，超出时最末尾显示省略号（非每个标签都省略） */
  maxLines?: number
  className?: string
}

export function FlavorTagPills({
  tags,
  max,
  maxLines,
  className = '',
}: FlavorTagPillsProps) {
  const displayTags = max != null ? tags.slice(0, max) : tags
  if (displayTags.length === 0) return null

  const lineClampClass =
    maxLines === 2
      ? 'line-clamp-2'
      : maxLines === 3
        ? 'line-clamp-3'
        : ''
  const containerClass =
    maxLines != null
      ? `${lineClampClass} [&>span]:mr-2 [&>span]:mb-1.5`
      : 'flex flex-wrap gap-2'

  return (
    <div className={`${maxLines != null ? '' : 'flex flex-wrap gap-2'} ${containerClass} mt-2 ${className}`}>
      {displayTags.map((tag, index) => (
        <span
          key={`${tag}-${index}`}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border shrink-0 ${getFlavorColor(tag)}`}
        >
          <span className="text-xs opacity-70 shrink-0">{getFlavorIcon(tag)}</span>
          {tag}
        </span>
      ))}
    </div>
  )
}
