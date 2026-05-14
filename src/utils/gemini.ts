import type { MealTag } from '../db'

const API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'

export const GEMINI_KEY_STORAGE = 'lucid:geminiKey'

export function getGeminiKey(): string {
  return localStorage.getItem(GEMINI_KEY_STORAGE) ?? ''
}

export function setGeminiKey(key: string): void {
  const trimmed = key.trim()
  trimmed
    ? localStorage.setItem(GEMINI_KEY_STORAGE, trimmed)
    : localStorage.removeItem(GEMINI_KEY_STORAGE)
}

const VALID_TAGS = new Set<string>([
  'contains_refined_carbs',
  'contains_aged_protein',
  'contains_leftovers',
  'contains_fermented',
])

function buildPrompt(description: string): string {
  return `Identify which food sensitivity tags apply to this meal. Reply with ONLY a JSON array of tag strings — no explanation, no markdown.

Tags:
- "contains_refined_carbs": white bread, pasta, white rice, sugar, pastries, chips, biscuits, cereals, pizza base, crackers
- "contains_aged_protein": cured/processed meats (salami, bacon, ham, chorizo, prosciutto, pepperoni, hot dogs), aged cheeses (parmesan, cheddar, gouda, blue cheese, brie), smoked or pickled fish, slow-cooked/braised meats
- "contains_leftovers": explicitly described as leftovers, reheated, or made the previous day or earlier
- "contains_fermented": yogurt, kefir, kimchi, sauerkraut, kombucha, miso, tempeh, pickles, vinegar-heavy sauces, beer, wine, sourdough

Meal: "${description}"

JSON array only:`
}

export async function analyzeWithGemini(
  description: string,
  apiKey: string,
): Promise<MealTag[]> {
  const res = await fetch(`${API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: buildPrompt(description) }] }],
      generationConfig: { temperature: 0, maxOutputTokens: 200 },
    }),
  })

  if (!res.ok) {
    let msg = `HTTP ${res.status}`
    try {
      const body = await res.json() as { error?: { message?: string } }
      if (body.error?.message) msg = body.error.message
    } catch { /* ignore parse error */ }
    throw new Error(msg)
  }

  const data = await res.json() as {
    candidates?: { content?: { parts?: { text?: string }[] } }[]
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]'
  const match = text.match(/\[[\s\S]*?\]/)
  if (!match) return []

  const parsed: unknown = JSON.parse(match[0])
  if (!Array.isArray(parsed)) return []
  return parsed.filter((t): t is MealTag => typeof t === 'string' && VALID_TAGS.has(t))
}
