import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import { useCorrelation } from '../hooks/useCorrelation'

interface Props {
  windowHours: number
}

interface TooltipPayload {
  name: string
  value: number
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null
  const x = payload.find(p => p.name === 'x')?.value
  const y = payload.find(p => p.name === 'y')?.value
  return (
    <div className="bg-ink-700 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/90 shadow-lg">
      <div>Fog score: <span className="font-bold">{y}/10</span></div>
      <div>Time since meal: <span className="font-bold">{x}h</span></div>
    </div>
  )
}

export function CorrelationScatter({ windowHours }: Props) {
  const groups = useCorrelation(windowHours)

  if (groups.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-white/40 text-sm">
        Log meals and brain fog entries to see correlations
      </div>
    )
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={260}>
        <ScatterChart margin={{ top: 10, right: 16, bottom: 10, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#241D2E" />
          <XAxis
            type="number"
            dataKey="x"
            name="x"
            domain={[0, windowHours]}
            label={{ value: 'Hours since meal', position: 'insideBottom', offset: -2, fill: '#8B8590', fontSize: 11 }}
            tick={{ fill: '#8B8590', fontSize: 11 }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="y"
            domain={[0, 10]}
            tick={{ fill: '#8B8590', fontSize: 11 }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: '#3A3540' }} />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
            formatter={(value: string) => <span style={{ color: '#8B8590' }}>{value}</span>}
          />
          {groups.map(group => (
            <Scatter
              key={group.tag}
              name={group.label}
              data={group.points}
              fill={group.color}
              opacity={0.85}
            />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}
