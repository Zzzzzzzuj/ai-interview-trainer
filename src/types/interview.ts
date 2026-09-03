export type QuestionType = 'choice' | 'short_answer'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type ReviewLevel = '不会' | '一般' | '熟练'

export const categories = [
  'JavaScript 基础',
  'Vue',
  'React',
  '浏览器原理',
  'HTTP / 网络',
  '前端工程化',
  '性能优化',
  '手写代码',
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
  priority?: number
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
