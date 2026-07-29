interface ProgressBadgeProps {
  userName: string
  state: string
  season?: number
}

export default function ProgressBadge({ userName, state, season }: ProgressBadgeProps) {
  return (
    <div className="p-2 border rounded bg-slate-50 text-xs">
      <span className="font-bold">{userName}:</span> {state}
      {season && ` (S${season})`}
    </div>
  )
}