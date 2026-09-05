import type { InterviewQuestion, ReviewLevel, ReviewResult } from '@/types/interview'

function normalize(text: string) {
  return text.trim().toLowerCase()
}

function getLevel(score: number): ReviewLevel {
  if (score < 45) return '不会'
  if (score < 75) return '一般'
  return '熟练'
}

export function localRuleReview(question: InterviewQuestion, userAnswer: string): ReviewResult {
  const normalizedAnswer = normalize(userAnswer)
  const matchedKeywords = question.keywords.filter((keyword) =>
    normalizedAnswer.includes(normalize(keyword)),
  )
  const missingKeywords = question.keywords.filter(
    (keyword) => !matchedKeywords.includes(keyword),
  )
  const coverage = question.keywords.length === 0 ? 1 : matchedKeywords.length / question.keywords.length
  const score = Math.min(100, Math.round(coverage * 85 + (userAnswer.trim().length > 30 ? 15 : 5)))
  const level = getLevel(score)
  const missedPoints = question.commonMissingPoints.filter((point) =>
    missingKeywords.some((keyword) => point.includes(keyword) || keyword.includes(point)),
  )

  const feedback =
    level === '熟练'
      ? '回答结构比较完整，面试中再补一个场景化例子会更稳。'
      : level === '一般'
        ? '核心点提到了一部分，但还需要把关键机制和边界情况说完整。'
        : '当前回答偏零散，建议按“定义 - 为什么 - 怎么做 - 注意点”重新组织。'

  return {
    score,
    level,
    matchedKeywords,
    missingKeywords,
    missedPoints: missedPoints.length > 0 ? missedPoints : question.commonMissingPoints.slice(0, 3),
    feedback,
    betterAnswer: question.answer,
    source: 'local_fallback',
  }
}
