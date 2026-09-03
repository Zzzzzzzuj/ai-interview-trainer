import type { InterviewQuestion } from '@/types/interview'

interface QuestionListResponse {
  items: InterviewQuestion[]
  total: number
  page: number
  pageSize: number
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001/api'

export async function fetchQuestions(): Promise<QuestionListResponse> {
  const response = await fetch(`${apiBaseUrl}/questions?page=1&pageSize=100`)
  if (!response.ok) throw new Error(`Question API failed: ${response.status}`)
  return response.json() as Promise<QuestionListResponse>
}
