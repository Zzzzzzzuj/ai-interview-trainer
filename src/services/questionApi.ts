import type { InterviewQuestion } from '@/types/interview'
import { getApiBaseUrl } from './apiConfig'

interface QuestionListResponse {
  items: InterviewQuestion[]
  total: number
  page: number
  pageSize: number
}

export interface QuestionCategoryStat {
  category: string
  count: number
}

const apiBaseUrl = getApiBaseUrl()

export async function fetchQuestions(page = 1, pageSize = 100): Promise<QuestionListResponse> {
  const response = await fetch(`${apiBaseUrl}/questions?page=${page}&pageSize=${pageSize}`)
  if (!response.ok) throw new Error(`Question API failed: ${response.status}`)
  return response.json() as Promise<QuestionListResponse>
}

export async function fetchAllQuestions(): Promise<QuestionListResponse> {
  const pageSize = 100
  const firstPage = await fetchQuestions(1, pageSize)
  const items = [...firstPage.items]
  const pageCount = Math.ceil(firstPage.total / firstPage.pageSize)

  for (let page = 2; page <= pageCount; page += 1) {
    const result = await fetchQuestions(page, pageSize)
    items.push(...result.items)
  }

  return {
    ...firstPage,
    items,
  }
}

export async function fetchQuestionCategories(): Promise<QuestionCategoryStat[]> {
  const response = await fetch(`${apiBaseUrl}/questions/categories`)
  if (!response.ok) throw new Error(`Question categories API failed: ${response.status}`)
  return response.json() as Promise<QuestionCategoryStat[]>
}
