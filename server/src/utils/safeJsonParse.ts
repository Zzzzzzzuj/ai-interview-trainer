export function safeJsonParse<T>(content: string): T | null {
  const trimmed = content.trim()
  const candidates = [
    trimmed,
    trimmed.replace(/^```json\s*/i, '').replace(/```$/i, '').trim(),
    trimmed.match(/\{[\s\S]*\}/)?.[0] ?? '',
  ].filter(Boolean)

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate) as T
    } catch {
      // Try the next shape. LLMs occasionally wrap JSON in markdown fences.
    }
  }

  return null
}
