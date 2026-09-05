import type { InterviewQuestion, PracticeFilters, PracticeMode } from '@/types/interview'

interface QuestionFilterOptions {
  filters: PracticeFilters
  mode?: PracticeMode
  favoriteIds?: string[]
  mistakeIds?: string[]
}

export function isHighPriorityQuestion(question: InterviewQuestion) {
  return question.priority === 'high' || (typeof question.priority === 'number' && question.priority >= 80)
}

export function filterQuestions(
  questions: InterviewQuestion[],
  { filters, mode = 'sequential', favoriteIds = [], mistakeIds = [] }: QuestionFilterOptions,
) {
  const search = filters.search.trim().toLowerCase()
  const favoriteSet = new Set(favoriteIds)
  const mistakeSet = new Set(mistakeIds)

  return questions.filter((question) => {
    const matchesMode =
      mode === 'mistakes'
        ? mistakeSet.has(question.id)
        : mode === 'favorites'
          ? favoriteSet.has(question.id)
          : mode === 'highFrequency'
            ? isHighPriorityQuestion(question)
            : true
    const matchesCategory = filters.category === '全部' || question.category === filters.category
    const matchesType = filters.type === '全部' || question.type === filters.type
    const matchesDifficulty = filters.difficulty === '全部' || question.difficulty === filters.difficulty
    const matchesSearch =
      search.length === 0 ||
      question.question.toLowerCase().includes(search) ||
      question.keywords.some((keyword) => keyword.toLowerCase().includes(search))

    return matchesMode && matchesCategory && matchesType && matchesDifficulty && matchesSearch
  })
}
