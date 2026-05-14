import type { MealTag } from '../db'

export type AIProvider = 'gemini' | 'xai'

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'
const XAI_URL = 'https://api.x.ai/v1/chat/completions'

export const AI_KEY_STORAGE = 'lucid:aiKey'
export const AI_PROVIDER_STORAGE = 'lucid:aiProvider'

export function getAIKey(): string {
  // migrate old geminiKey storage transparently
  const old = localStorage.getItem('lucid:geminiKey')
  if (old) {
    localStorage.setItem(AI_KEY_STORAGE, old)
    localStorage.removeItem('lucid:geminiKey')
  }
  return localStorage.getItem(AI_KEY_STORAGE) ?? ''
}

export function setAIKey(key: string): void {
  const trimmed = key.trim()
  trimmed
    ? localStorage.setItem(AI_KEY_STORAGE, trimmed)
    : localStorage.removeItem(AI_KEY_STORAGE)
  localStorage.removeItem('lucid:geminiKey')
}

export function getAIProvider(): AIProvider {
  return (localStorage.getItem(AI_PROVIDER_STORAGE) ?? 'gemini') as AIProvider
}

export function setAIProvider(p: AIProvider): void {
  localStorage.setItem(AI_PROVIDER_STORAGE, p)
}

const VALID_TAGS = new Set<string>([
  'contains_refined_carbs',
  'contains_aged_protein',
  'contains_leftovers',
  'contains_fermented',
])

const SYSTEM_PROMPT = `Identify which food sensitivity tags apply to a meal. Reply with ONLY a JSON array of tag strings — no explanation, no markdown, no wrapper object.

Tags:
- "contains_refined_carbs": white bread, pasta, white rice, sugar, pastries, chips, biscuits, cereals, pizza base, crackers
- "contains_aged_protein": cured/processed meats (salami, bacon, ham, chorizo, prosciutto, pepperoni, hot dogs), aged cheeses (parmesan, cheddar, gouda, blue cheese, brie), smoked or pickled fish, slow-cooked/braised meats
- "contains_leftovers": explicitly described as leftovers, reheated, or made the previous day or earlier
- "contains_fermented": yogurt, kefir, kimchi, sauerkraut, kombucha, miso, tempeh, pickles, vinegar-heavy sauces, beer, wine, sourdough

JSON array only — example: ["contains_refined_carbs","contains_fermented"]`

function parseTagsFromText(text: string): MealTag[] {
  const match = text.match(/\[[\s\S]*?\]/)
  if (!match) return []
  try {
    const parsed: unknown = JSON.parse(match[0])
    if (!Array.isArray(parsed)) return []
    return parsed.filter((t): t is MealTag => typeof t === 'string' && VALID_TAGS.has(t))
  } catch {
    return []
  }
}

async function analyzeWithGemini(description: string, apiKey: string): Promise<MealTag[]> {
  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${SYSTEM_PROMPT}\n\nMeal: "${description}"` }] }],
      generationConfig: { temperature: 0, maxOutputTokens: 200 },
    }),
  })

  if (!res.ok) {
    let msg = `HTTP ${res.status}`
    try {
      const body = await res.json() as { error?: { message?: string } }
      if (body.error?.message) msg = body.error.message
    } catch { /* ignore */ }
    throw new Error(msg)
  }

  const data = await res.json() as {
    candidates?: { content?: { parts?: { text?: string }[] } }[]
  }
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]'
  return parseTagsFromText(text)
}

async function analyzeWithXAI(description: string, apiKey: string): Promise<MealTag[]> {
  const res = await fetch(XAI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'grok-3-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Meal: "${description}"` },
      ],
      temperature: 0,
      max_tokens: 200,
    }),
  })

  if (!res.ok) {
    let msg = `HTTP ${res.status}`
    try {
      const body = await res.json() as { error?: { message?: string } }
      if (body.error?.message) msg = body.error.message
    } catch { /* ignore */ }
    throw new Error(msg)
  }

  const data = await res.json() as {
    choices?: { message?: { content?: string } }[]
  }
  const text = data.choices?.[0]?.message?.content ?? '[]'
  return parseTagsFromText(text)
}

export async function analyzeWithAI(description: string): Promise<MealTag[]> {
  const apiKey = getAIKey()
  const provider = getAIProvider()
  if (!apiKey) throw new Error('No API key set')
  return provider === 'xai'
    ? analyzeWithXAI(description, apiKey)
    : analyzeWithGemini(description, apiKey)
}
