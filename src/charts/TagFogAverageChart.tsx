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
        <p className="text-white/40 text-sm">No tagged meals paired with fog entries yet</p>
        <p className="text-white/30 text-xs">Log meals (Gemini will tag them) then log brain fog entries within the correlation window</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={averages} margin={{ top: 10, right: 16, bottom: 36, left: -10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#241D2E" />
        <XAxis
          dataKey="label"
          tick={{ fill: '#8B8590', fontSize: 10 }}
          angle={-20}
          textAnchor="end"
          interval={0}
        />
        <YAxis
          domain={[0, 10]}
          tick={{ fill: '#8B8590', fontSize: 11 }}
        />
        <ReferenceLine y={5} stroke="#3A3540" strokeDasharray="4 4" />
        <Tooltip
          formatter={(value: number, _name: string, props: { payload?: { count?: number } }) => [
            `${value}/10 (${props.payload?.count ?? 0} pairings)`,
            'Avg fog score',
          ]}
          contentStyle={{ background: '#1B1622', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: '#8B8590' }}
          itemStyle={{ color: '#F5F4F7' }}
        />
        <Bar dataKey="avgFog" radius={[4, 4, 0, 0]}>
          {averages.map(d => <Cell key={d.tag} fill={d.color} opacity={0.85} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
