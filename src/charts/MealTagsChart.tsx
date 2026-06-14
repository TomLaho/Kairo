import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts'
import { useMeals } from '../hooks/useMeals'
import { TAG_COLORS, TAG_LABELS, MEAL_TAGS } from '../db'

export function MealTagsChart() {
  const meals = useMeals()

  const data = MEAL_TAGS.map(t => ({
    tag: t.value,
    label: t.label,
    count: meals.filter(m => m.tags.includes(t.value)).length,
    color: TAG_COLORS[t.value],
  }))

  if (meals.length === 0) {
    return (
      <div className="flex items-center justify-center h-36 text-white/40 text-sm">
        No meal entries yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 5, right: 16, bottom: 30, left: -10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#241D2E" />
        <XAxis dataKey="label" tick={{ fill: '#8B8590', fontSize: 10 }} angle={-20} textAnchor="end" interval={0} />
        <YAxis allowDecimals={false} tick={{ fill: '#8B8590', fontSize: 11 }} />
        <Tooltip
          formatter={(value: number) => [value, 'meals']}
          contentStyle={{ background: '#1B1622', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: '#8B8590' }}
          itemStyle={{ color: '#F5F4F7' }}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {data.map(d => <Cell key={d.tag} fill={d.color} opacity={0.85} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
