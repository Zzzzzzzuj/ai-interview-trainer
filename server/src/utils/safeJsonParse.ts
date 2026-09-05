export function safeJsonParse<T>(content: string): T | null {
  const trimmed = content.trim()
  const fencedJson = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]?.trim()
  const firstBrace = trimmed.indexOf('{')
  const lastBrace = trimmed.lastIndexOf('}')
  const objectLike = firstBrace >= 0 && lastBrace > firstBrace
    ? trimmed.slice(firstBrace, lastBrace + 1)
    : ''
  const candidates = [
    fencedJson ?? '',
    trimmed,
    trimmed.replace(/^```(?:json)?\s*/i, '').replace(/```$/i, '').trim(),
    objectLike,
  ].filter(Boolean)

  for (const candidate of [...new Set(candidates)]) {
    try {
      return JSON.parse(candidate) as T
    } catch {
      // Try the next shape. LLMs occasionally wrap JSON in markdown fences.
    }
  }

  return null
}
