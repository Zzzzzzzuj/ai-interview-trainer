export type QuestionType = 'choice' | 'short_answer'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type ReviewLevel = '不会' | '一般' | '熟练'
export type PracticeMode = 'random' | 'sequential' | 'mistakes' | 'favorites' | 'highFrequency'

export const categories = [
  'HTML / CSS',
  'JavaScript 基础',
  'Vue',
  'React',
  '性能优化',
  '前端工程化',
  'HTTP / 网络',
  '浏览器原理',
  '手写代码',
  '代码输出',
  'AI Agent',
  'RAG',
  '项目追问',
] as const

export type Category = (typeof categories)[number]

export interface QuestionOption {
  label: string
  value: string
}

export interface InterviewQuestion {
  id: string
  category: Category
  type: QuestionType
  difficulty: Difficulty
  question: string
  options?: QuestionOption[]
  answer: string
  explanation: string
  keywords: string[]
  commonMissingPoints: string[]
  codeExample?: string
  followUps?: string[]
  sourceName?: string
  sourceUrl?: string
  quality?: string
  priority?: 'high' | 'medium' | 'low' | number | null
}

export interface ReviewResult {
  score: number
  level: ReviewLevel
  matchedKeywords: string[]
  missingKeywords: string[]
  missedPoints: string[]
  feedback: string
  betterAnswer: string
}

export interface PracticeRecord {
  id: string
  questionId: string
  category: Category
  type: QuestionType
  createdAt: string
  isCorrect?: boolean
  selectedOption?: string
  userAnswer?: string
  reviewResult?: ReviewResult
}

export interface DailyStats {
  date: string
  count: number
}

export interface MasteryRecord {
  questionId: string
  level: ReviewLevel
  lastScore: number
  updatedAt: string
}

export interface PracticeFilters {
  category: Category | '全部'
  type: QuestionType | '全部'
  difficulty: Difficulty | '全部'
  search: string
}
