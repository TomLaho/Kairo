import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts'
import { useBrainFog } from '../hooks/useBrainFog'

function hourLabel(h: number): string {
  if (h === 0) return '12am'
  if (h === 12) return '12pm'
  return h < 12 ? `${h}am` : `${h - 12}pm`
}

function fogColor(avg: number | null): string {
  if (avg === null) return 'transparent'
  return avg <= 3 ? '#10b981' : avg <= 6 ? '#f59e0b' : '#ef4444'
}

export function FogHourChart() {
  const fogEntries = useBrainFog()

  const hourData = Array.from({ length: 24 }, (_, h) => {
    const bucket = fogEntries.filter(e => new Date(e.timestamp).getHours() === h)
    return {
      h,
      label: hourLabel(h),
      avgFog: bucket.length > 0
        ? Math.round((bucket.reduce((s, e) => s + e.score, 0) / bucket.length) * 10) / 10
        : null,
      count: bucket.length,
    }
  })

  if (fogEntries.length < 3) {
    return (
      <div className="flex flex-col items-center justify-center h-36 gap-1 text-center px-4">
        <p className="text-slate-500 text-sm">Not enough data yet</p>
        <p className="text-slate-600 text-xs">Log at least 3 fog entries to see time-of-day patterns</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={hourData} margin={{ top: 5, right: 8, bottom: 5, left: -22 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: '#475569', fontSize: 9 }} interval={2} tickLine={false} axisLine={false} />
        <YAxis domain={[0, 10]} tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} axisLine={false} />
        <Tooltip
          formatter={(value: number, _: string, props: { payload?: { count: number } }) => [
            `${value}/10 (${props.payload?.count ?? 0} entries)`,
            'Avg fog',
          ]}
          contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: '#94a3b8' }}
          itemStyle={{ color: '#e2e8f0' }}
        />
        <Bar dataKey="avgFog" radius={[3, 3, 0, 0]} maxBarSize={18}>
          {hourData.map((d, i) => (
            <Cell key={i} fill={fogColor(d.avgFog)} opacity={d.count > 0 ? 0.85 : 0} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
