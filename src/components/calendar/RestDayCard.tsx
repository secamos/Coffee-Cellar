interface RestDayCardProps {
  tomorrowHint?: string
}

export function RestDayCard({ tomorrowHint }: RestDayCardProps) {
  return (
    <div className="text-center py-4">
      <span className="inline-block px-2 py-1 rounded text-sm text-slate-300 bg-slate-100">
        休息日
      </span>
      {tomorrowHint && (
        <p className="text-xs text-slate-400 mt-2">{tomorrowHint}</p>
      )}
    </div>
  )
}
