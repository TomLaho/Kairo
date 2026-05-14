import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer, ReferenceLine } from 'recharts'
import { useTagFogAverages } from '../hooks/useCorrelation'

interface Props {
  windowHours: number
}

export function TagFogAverageChart({ windowHours }: Props) {
  const averages = useTagFogAverages(windowHours)

  if (averages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-36 gap-2 text-center px-4">
        <p className="text-slate-500 text-sm">No tagged meals paired with fog entries yet</p>
        <p className="text-slate-600 text-xs">Log meals (Gemini will tag them) then log brain fog entries within the correlation window</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={averages} margin={{ top: 10, right: 16, bottom: 36, left: -10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis
          dataKey="label"
          tick={{ fill: '#64748b', fontSize: 10 }}
          angle={-20}
          textAnchor="end"
          interval={0}
        />
        <YAxis
          domain={[0, 10]}
          tick={{ fill: '#64748b', fontSize: 11 }}
        />
        <ReferenceLine y={5} stroke="#475569" strokeDasharray="4 4" />
        <Tooltip
          formatter={(value: number, _name: string, props: { payload?: { count?: number } }) => [
            `${value}/10 (${props.payload?.count ?? 0} pairings)`,
            'Avg fog score',
          ]}
          contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: '#94a3b8' }}
          itemStyle={{ color: '#e2e8f0' }}
        />
        <Bar dataKey="avgFog" radius={[4, 4, 0, 0]}>
          {averages.map(d => <Cell key={d.tag} fill={d.color} opacity={0.85} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
