import { useState, useRef, useEffect } from 'react'

/**
 * 带历史补全的文本输入：下拉显示与当前输入匹配的历史唯一值
 */
export function AutocompleteInput({
  value,
  onChange,
  options,
  placeholder,
  className = '',
  id,
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
  placeholder?: string
  className?: string
  id?: string
}) {
  const [open, setOpen] = useState(false)
  const [focus, setFocus] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const normalized = value.trim().toLowerCase()
  const filtered =
    !normalized || normalized.length === 0
      ? options.slice(0, 20)
      : options.filter((o) => o.toLowerCase().includes(normalized)).slice(0, 20)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const showDropdown = open && focus && filtered.length > 0

  return (
    <div ref={containerRef} className="relative">
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => {
          setFocus(true)
          setOpen(true)
        }}
        onBlur={() => setFocus(false)}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />
      {showDropdown && (
        <ul
          className="absolute z-20 w-full mt-0.5 py-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
          onMouseDown={(e) => e.preventDefault()}
        >
          {filtered.map((opt) => (
            <li key={opt}>
              <button
                type="button"
                className="w-full text-left px-3 py-1.5 text-sm hover:bg-indigo-50 text-slate-800"
                onClick={() => {
                  onChange(opt)
                  setOpen(false)
                }}
              >
                {opt}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
