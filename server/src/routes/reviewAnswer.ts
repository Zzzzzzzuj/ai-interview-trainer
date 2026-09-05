import { Router } from 'express'
import { localFallbackReview, reviewAnswerWithLlm, type ReviewAnswerRequest } from '../services/llmReviewService'

export const reviewAnswerRouter = Router()

const MAX_QUESTION_LENGTH = 1000
const MAX_REFERENCE_ANSWER_LENGTH = 2000
const MAX_USER_ANSWER_LENGTH = 3000
const MAX_ARRAY_ITEMS = 30
const MAX_ARRAY_ITEM_LENGTH = 80

function truncateText(value: string, maxLength: number) {
  return value.length > maxLength ? value.slice(0, maxLength) : value
}

function stringArray(value: unknown) {
  if (!Array.isArray(value)) return null
  return value
    .map(String)
    .map((item) => truncateText(item.trim(), MAX_ARRAY_ITEM_LENGTH))
    .filter(Boolean)
    .slice(0, MAX_ARRAY_ITEMS)
}

function normalizeRequest(body: unknown): ReviewAnswerRequest | null {
  if (body === null || typeof body !== 'object') return null
  const input = body as Record<string, unknown>
  const questionId = typeof input.questionId === 'string' ? input.questionId.trim() : ''
  const question = typeof input.question === 'string'
    ? truncateText(input.question.trim(), MAX_QUESTION_LENGTH)
    : ''
  const referenceAnswer = typeof input.referenceAnswer === 'string'
    ? truncateText(input.referenceAnswer.trim(), MAX_REFERENCE_ANSWER_LENGTH)
    : ''
  const userAnswer = typeof input.userAnswer === 'string'
    ? truncateText(input.userAnswer.trim(), MAX_USER_ANSWER_LENGTH)
    : ''
  const keywords = stringArray(input.keywords)
  const commonMissingPoints = stringArray(input.commonMissingPoints)

  if (!questionId || !question || !referenceAnswer || !userAnswer) return null
  if (!keywords || !commonMissingPoints) return null

  return {
    questionId,
    question,
    referenceAnswer,
    userAnswer,
    keywords,
    commonMissingPoints,
  }
}

reviewAnswerRouter.post('/', async (request, response, next) => {
  try {
    const input = normalizeRequest(request.body)
    if (!input) {
      return response.status(400).json({
        message: 'Invalid review-answer payload',
      })
    }

    const result = await reviewAnswerWithLlm(input)
    response.json(result)
  } catch (error) {
    const input = normalizeRequest(request.body)
    if (input) return response.json(localFallbackReview(input))
    next(error)
  }
})
