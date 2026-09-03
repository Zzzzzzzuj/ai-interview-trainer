import type { InterviewQuestion, ReviewResult } from '@/types/interview'
import { localRuleReview } from '@/utils/scoring'

export async function aiReviewAnswer(
  question: InterviewQuestion,
  userAnswer: string,
): Promise<ReviewResult> {
  const mock = localRuleReview(question, userAnswer)

  return Promise.resolve({
    ...mock,
    feedback: `AI mock 批改结果：${mock.feedback}`,
  })
}

export async function reviewAnswer(
  question: InterviewQuestion,
  userAnswer: string,
  mode: 'local' | 'ai' = 'local',
): Promise<ReviewResult> {
  if (mode === 'ai') {
    return aiReviewAnswer(question, userAnswer)
  }

  return Promise.resolve(localRuleReview(question, userAnswer))
}
