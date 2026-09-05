import { safeJsonParse } from '../utils/safeJsonParse'

type ReviewLevel = '不会' | '一般' | '熟练'
type ReviewSource = 'ai' | 'local_fallback'

export interface ReviewAnswerRequest {
  questionId: string
  question: string
  referenceAnswer: string
  keywords: string[]
  commonMissingPoints: string[]
  userAnswer: string
}

export interface ReviewAnswerResult {
  score: number
  level: ReviewLevel
  matchedKeywords: string[]
  missingKeywords: string[]
  missedPoints: string[]
  feedback: string
  betterAnswer: string
  source: ReviewSource
}

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
}

function normalize(text: string) {
  return text.trim().toLowerCase()
}

function levelFromScore(score: number): ReviewLevel {
  if (score < 60) return '不会'
  if (score < 80) return '一般'
  return '熟练'
}

function clampScore(value: unknown) {
  const score = Number(value)
  if (!Number.isFinite(score)) return 0
  return Math.max(0, Math.min(100, Math.round(score)))
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.map(String).map((item) => item.trim()).filter(Boolean) : []
}

export function localFallbackReview(input: ReviewAnswerRequest): ReviewAnswerResult {
  const normalizedAnswer = normalize(input.userAnswer)
  const matchedKeywords = input.keywords.filter((keyword) => normalizedAnswer.includes(normalize(keyword)))
  const missingKeywords = input.keywords.filter((keyword) => !matchedKeywords.includes(keyword))
  const coverage = input.keywords.length === 0 ? 1 : matchedKeywords.length / input.keywords.length
  const score = Math.min(100, Math.round(coverage * 85 + (input.userAnswer.trim().length > 30 ? 15 : 5)))
  const level = levelFromScore(score)
  const missedPoints = input.commonMissingPoints.filter((point) =>
    missingKeywords.some((keyword) => point.includes(keyword) || keyword.includes(point)),
  )

  return {
    score,
    level,
    matchedKeywords,
    missingKeywords,
    missedPoints: missedPoints.length > 0 ? missedPoints : input.commonMissingPoints.slice(0, 3),
    feedback:
      level === '熟练'
        ? '回答结构比较完整，面试中再补一个场景化例子会更稳。'
        : level === '一般'
          ? '核心点提到了一部分，但还需要把关键机制和边界情况说完整。'
          : '当前回答偏零散，建议按“定义 - 为什么 - 怎么做 - 注意点”重新组织。',
    betterAnswer: input.referenceAnswer,
    source: 'local_fallback',
  }
}

function buildPrompt(input: ReviewAnswerRequest) {
  return [
    '你是前端与 AI 应用开发实习面试的简答题批改助手。',
    '请严格根据题目、标准答案、关键词、常见遗漏点和用户答案评分。',
    '只返回 JSON，不要返回 markdown，不要解释 JSON 外的内容。',
    '评分标准：只说很少概念 0-40；说到部分关键词但不完整 40-60；主体正确但缺少场景或细节 60-80；结构完整且关键词覆盖充分 80-100。',
    'JSON 字段必须为：score, level, matchedKeywords, missingKeywords, missedPoints, feedback, betterAnswer。',
    'level 只能是：不会、一般、熟练。',
    'betterAnswer 要适合 30-60 秒面试口述。',
    '',
    `题目ID：${input.questionId}`,
    `题目：${input.question}`,
    `标准答案：${input.referenceAnswer}`,
    `关键词：${JSON.stringify(input.keywords)}`,
    `常见遗漏点：${JSON.stringify(input.commonMissingPoints)}`,
    `用户答案：${input.userAnswer}`,
  ].join('\n')
}

function normalizeAiResult(parsed: Partial<ReviewAnswerResult>, input: ReviewAnswerRequest): ReviewAnswerResult {
  const score = clampScore(parsed.score)
  const level = ['不会', '一般', '熟练'].includes(String(parsed.level))
    ? parsed.level as ReviewLevel
    : levelFromScore(score)

  return {
    score,
    level,
    matchedKeywords: stringArray(parsed.matchedKeywords),
    missingKeywords: stringArray(parsed.missingKeywords),
    missedPoints: stringArray(parsed.missedPoints),
    feedback: typeof parsed.feedback === 'string' && parsed.feedback.trim()
      ? parsed.feedback.trim()
      : '已完成 AI 批改，建议对照关键词补齐表达。',
    betterAnswer: typeof parsed.betterAnswer === 'string' && parsed.betterAnswer.trim()
      ? parsed.betterAnswer.trim()
      : input.referenceAnswer,
    source: 'ai',
  }
}

export async function reviewAnswerWithLlm(input: ReviewAnswerRequest): Promise<ReviewAnswerResult> {
  const apiKey = process.env.LLM_API_KEY?.trim()
  const baseUrl = process.env.LLM_BASE_URL?.trim() || 'https://api.deepseek.com'
  const model = process.env.LLM_MODEL?.trim() || 'deepseek-chat'
  const timeoutMs = Number(process.env.LLM_TIMEOUT_MS) || 30000

  if (!apiKey) {
    return localFallbackReview(input)
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: '你是严谨的面试简答题批改助手，只返回合法 JSON。' },
          { role: 'user', content: buildPrompt(input) },
        ],
      }),
      signal: controller.signal,
    })

    if (!response.ok) return localFallbackReview(input)

    const data = await response.json() as ChatCompletionResponse
    const content = data.choices?.[0]?.message?.content
    if (!content) return localFallbackReview(input)

    const parsed = safeJsonParse<Partial<ReviewAnswerResult>>(content)
    if (!parsed) return localFallbackReview(input)

    return normalizeAiResult(parsed, input)
  } catch {
    return localFallbackReview(input)
  } finally {
    clearTimeout(timeout)
  }
}
