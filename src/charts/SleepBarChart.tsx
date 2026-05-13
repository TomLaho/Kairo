import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import { useSleep } from '../hooks/useSleep'
import { subDays } from 'date-fns'
import { sleepDurationHours, formatDate } from '../utils/time'

interface DataPoint {
  date: string
  duration: number
  battery?: number
}

interface TooltipPayload {
  name: string
  value: number
  color: string
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayload[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-xs text-slate-200 shadow-lg">
      <div className="font-medium mb-1">{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color }}>
          {p.name}: <span className="font-bold">{p.value}{p.name === 'Sleep (h)' ? 'h' : ''}</span>
        </div>
      ))}
    </div>
  )
}

export function SleepBarChart() {
  const entries = useSleep()
  const cutoff = subDays(new Date(), 13)

  const data: DataPoint[] = entries
    .filter(e => new Date(e.wake_time) >= cutoff)
    .map(e => ({
      date: formatDate(e.wake_time),
      duration: Math.round(sleepDurationHours(e.bedtime, e.wake_time) * 10) / 10,
      battery: e.body_battery,
    }))
    .reverse()

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-36 text-slate-500 text-sm">
        No sleep entries in the last 14 days
      </div>
    )
  }

  const hasBattery = data.some(d => d.battery !== undefined)

  return (
    <ResponsiveContainer width="100%" height={200}>
      <ComposedChart data={data} margin={{ top: 5, right: 16, bottom: 20, left: -10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} angle={-30} textAnchor="end" interval={0} />
        <YAxis yAxisId="left" domain={[0, 12]} tick={{ fill: '#64748b', fontSize: 11 }} />
        {hasBattery && <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} />}
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} formatter={(v: string) => <span style={{ color: '#94a3b8' }}>{v}</span>} />
        <Bar yAxisId="left" dataKey="duration" name="Sleep (h)" fill="#3b82f6" opacity={0.8} radius={[4, 4, 0, 0]} />
        {hasBattery && (
          <Line yAxisId="right" type="monotone" dataKey="battery" name="Body battery" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981' }} connectNulls />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  )
}
