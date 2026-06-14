import type { MealTag } from '../db'
import { MEAL_TAGS } from '../db'

interface Props {
  tag: MealTag
  selected: boolean
  onToggle: (tag: MealTag) => void
}

export function TagPill({ tag, selected, onToggle }: Props) {
  const label = MEAL_TAGS.find(t => t.value === tag)?.label ?? tag
  return (
    <button
      type="button"
      onClick={() => onToggle(tag)}
      className={`px-3 py-2 rounded-full text-sm font-medium transition-colors min-h-[44px] flex items-center ${
        selected
          ? 'bg-spotlight text-ink'
          : 'bg-white/[0.06] text-white/70 hover:bg-white/10'
      }`}
    >
      {label}
    </button>
  )
}
