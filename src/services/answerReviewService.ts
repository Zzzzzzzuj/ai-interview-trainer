import type { InterviewQuestion, ReviewResult } from '@/types/interview'
import { localRuleReview } from '@/utils/scoring'
import { getApiBaseUrl } from './apiConfig'

const apiBaseUrl = getApiBaseUrl()
const reviewTimeoutMs = 30000

function isReviewResult(value: unknown): value is ReviewResult {
  if (value === null || typeof value !== 'object') return false
  const result = value as Partial<ReviewResult>
  return (
    typeof result.score === 'number' &&
    ['不会', '一般', '熟练'].includes(String(result.level)) &&
    Array.isArray(result.matchedKeywords) &&
    Array.isArray(result.missingKeywords) &&
    Array.isArray(result.missedPoints) &&
    typeof result.feedback === 'string' &&
    typeof result.betterAnswer === 'string'
  )
}

function fallbackReview(question: InterviewQuestion, userAnswer: string): ReviewResult {
  return {
    ...localRuleReview(question, userAnswer),
    source: 'local_fallback',
  }
}

export async function aiReviewAnswerViaApi(
  question: InterviewQuestion,
  userAnswer: string,
): Promise<ReviewResult> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), reviewTimeoutMs)

  try {
    const response = await fetch(`${apiBaseUrl}/review-answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questionId: question.id,
        question: question.question,
        referenceAnswer: question.answer,
        keywords: question.keywords,
        commonMissingPoints: question.commonMissingPoints,
        userAnswer,
      }),
      signal: controller.signal,
    })

    if (!response.ok) return fallbackReview(question, userAnswer)

    const result = await response.json()
    if (!isReviewResult(result)) return fallbackReview(question, userAnswer)

    return {
      ...result,
      source: result.source === 'ai' ? 'ai' : 'local_fallback',
    }
  } catch {
    return fallbackReview(question, userAnswer)
  } finally {
    window.clearTimeout(timeout)
  }
}

export async function aiReviewAnswer(
  question: InterviewQuestion,
  userAnswer: string,
): Promise<ReviewResult> {
  return aiReviewAnswerViaApi(question, userAnswer)
}

export async function reviewAnswer(
  question: InterviewQuestion,
  userAnswer: string,
  mode: 'local' | 'ai' = 'local',
): Promise<ReviewResult> {
  if (mode === 'ai') {
    return aiReviewAnswerViaApi(question, userAnswer)
  }

  return Promise.resolve(fallbackReview(question, userAnswer))
}
