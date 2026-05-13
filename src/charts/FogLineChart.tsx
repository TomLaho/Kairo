import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { useBrainFog } from '../hooks/useBrainFog'
import { subDays, startOfDay } from 'date-fns'
import { formatTime, formatDateTime } from '../utils/time'

interface DataPoint {
  time: number
  score: number
  label: string
}

interface TooltipPayload {
  payload?: DataPoint
  value?: number
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.[0]?.payload) return null
  const p = payload[0].payload
  return (
    <div className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-xs text-slate-200 shadow-lg">
      <div className="font-medium">{p.label}</div>
      <div>Fog: <span className="font-bold text-purple-300">{p.score}/10</span></div>
    </div>
  )
}

export function FogLineChart() {
  const entries = useBrainFog()
  const cutoff = startOfDay(subDays(new Date(), 6)).getTime()

  const data: DataPoint[] = entries
    .filter(e => new Date(e.timestamp).getTime() >= cutoff)
    .map(e => ({
      time: new Date(e.timestamp).getTime(),
      score: e.score,
      label: formatDateTime(e.timestamp),
    }))
    .sort((a, b) => a.time - b.time)

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-36 text-slate-500 text-sm">
        No brain fog entries in the last 7 days
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data} margin={{ top: 5, right: 16, bottom: 5, left: -10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis
          dataKey="time"
          type="number"
          scale="time"
          domain={['dataMin', 'dataMax']}
          tickFormatter={v => formatTime(new Date(v).toISOString())}
          tick={{ fill: '#64748b', fontSize: 10 }}
          minTickGap={40}
        />
        <YAxis domain={[0, 10]} tick={{ fill: '#64748b', fontSize: 11 }} />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={5} stroke="#475569" strokeDasharray="4 4" />
        <Line
          type="monotone"
          dataKey="score"
          stroke="#a78bfa"
          strokeWidth={2}
          dot={{ fill: '#a78bfa', r: 4 }}
          activeDot={{ r: 6, fill: '#c4b5fd' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
