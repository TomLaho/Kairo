interface Props {
  value: number
  onChange: (v: number) => void
}

// green → amber → red ramp, aligned to the tier palette
const SCORE_COLORS = [
  '#3DD68C', '#6FDB7E', '#A8D86B', '#D6CF5E', '#FFB454',
  '#FFA84E', '#FF9248', '#FF7E4E', '#FF6B6B', '#F85C5C', '#E84A4A',
]

export function ScoreSlider({ value, onChange }: Props) {
  const color = SCORE_COLORS[value] ?? '#8B8590'
  const label =
    value <= 2 ? 'Clear' :
    value <= 4 ? 'Mild' :
    value <= 6 ? 'Moderate' :
    value <= 8 ? 'Significant' : 'Severe'

  return (
    <div className="space-y-3">
      <div className="flex items-baseline gap-3">
        <span className="text-6xl font-bold tabular-nums" style={{ color }}>{value}</span>
        <span className="text-white/55 text-lg">{label}</span>
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
          background: `linear-gradient(to right, ${color} ${value * 10}%, #241D2E ${value * 10}%)`,
        }}
      />
      <div className="flex justify-between text-xs text-white/40">
        <span>0</span>
        <span>5</span>
        <span>10</span>
      </div>
    </div>
  )
}
