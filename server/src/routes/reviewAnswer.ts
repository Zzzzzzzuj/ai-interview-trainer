import { Router } from 'express'
import { localFallbackReview, reviewAnswerWithLlm, type ReviewAnswerRequest } from '../services/llmReviewService'

export const reviewAnswerRouter = Router()

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.map(String).map((item) => item.trim()).filter(Boolean) : []
}

function normalizeRequest(body: unknown): ReviewAnswerRequest | null {
  if (body === null || typeof body !== 'object') return null
  const input = body as Record<string, unknown>
  const questionId = typeof input.questionId === 'string' ? input.questionId.trim() : ''
  const question = typeof input.question === 'string' ? input.question.trim() : ''
  const referenceAnswer = typeof input.referenceAnswer === 'string' ? input.referenceAnswer.trim() : ''
  const userAnswer = typeof input.userAnswer === 'string' ? input.userAnswer.trim() : ''

  if (!questionId || !question || !referenceAnswer || !userAnswer) return null

  return {
    questionId,
    question,
    referenceAnswer,
    userAnswer,
    keywords: stringArray(input.keywords),
    commonMissingPoints: stringArray(input.commonMissingPoints),
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
