interface Props {
  value: number
  onChange: (v: number) => void
}

const SCORE_COLORS = [
  '#22c55e', '#4ade80', '#86efac', '#fbbf24', '#fbbf24',
  '#f97316', '#f97316', '#ef4444', '#ef4444', '#dc2626', '#b91c1c',
]

export function ScoreSlider({ value, onChange }: Props) {
  const color = SCORE_COLORS[value] ?? '#94a3b8'
  const label =
    value <= 2 ? 'Clear' :
    value <= 4 ? 'Mild' :
    value <= 6 ? 'Moderate' :
    value <= 8 ? 'Significant' : 'Severe'

  return (
    <div className="space-y-3">
      <div className="flex items-baseline gap-3">
        <span className="text-6xl font-bold tabular-nums" style={{ color }}>{value}</span>
        <span className="text-slate-400 text-lg">{label}</span>
      </div>
      <input
        type="range"
        min={0}
        max={10}
        step={1}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-3 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${color} ${value * 10}%, #334155 ${value * 10}%)`,
        }}
      />
      <div className="flex justify-between text-xs text-slate-500">
        <span>0</span>
        <span>5</span>
        <span>10</span>
      </div>
    </div>
  )
}
