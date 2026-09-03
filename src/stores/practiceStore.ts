import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { allQuestions as questionBank } from '@/data/questions'
import { reviewAnswer } from '@/services/answerReviewService'
import { fetchQuestions } from '@/services/questionApi'
import type {
  InterviewQuestion,
  MasteryRecord,
  PracticeFilters,
  PracticeRecord,
  ReviewLevel,
} from '@/types/interview'
import { categories } from '@/types/interview'
import { loadFromStorage, saveToStorage } from '@/utils/storage'

const STORAGE_KEYS = {
  records: 'interview-practice-records',
  favorites: 'interview-practice-favorites',
  mistakes: 'interview-practice-mistakes',
  mastery: 'interview-practice-mastery',
  dailyStats: 'interview-practice-daily-stats',
  settings: 'interview-practice-settings',
}

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function levelFromChoice(isCorrect: boolean): ReviewLevel {
  return isCorrect ? '熟练' : '不会'
}

function loadArray<T>(key: string): T[] {
  const value = loadFromStorage<unknown>(key, [])
  return Array.isArray(value) ? (value as T[]) : []
}

function loadObject<T extends object>(key: string): T {
  const value = loadFromStorage<unknown>(key, {})
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as T) : ({} as T)
}

function isRecord(value: unknown): value is PracticeRecord {
  return value !== null && typeof value === 'object'
}

function isMasteryRecord(value: unknown): value is MasteryRecord {
  return value !== null && typeof value === 'object'
}

export const usePracticeStore = defineStore('practice', () => {
  const allQuestions = ref<InterviewQuestion[]>(questionBank)
  const records = ref<PracticeRecord[]>(loadArray<unknown>(STORAGE_KEYS.records).filter(isRecord))
  const favorites = ref<string[]>(loadArray<unknown>(STORAGE_KEYS.favorites).filter((id): id is string => typeof id === 'string'))
  const mistakes = ref<string[]>(loadArray<unknown>(STORAGE_KEYS.mistakes).filter((id): id is string => typeof id === 'string'))
  const masteryMap = ref<Record<string, MasteryRecord>>(
    Object.fromEntries(
      Object.entries(loadObject<Record<string, unknown>>(STORAGE_KEYS.mastery)).filter(([, value]) =>
        isMasteryRecord(value),
      ),
    ) as Record<string, MasteryRecord>,
  )
  const dailyStats = ref<Record<string, number>>(
    Object.fromEntries(
      Object.entries(loadObject<Record<string, unknown>>(STORAGE_KEYS.dailyStats)).filter(
        ([, value]) => typeof value === 'number' && Number.isFinite(value),
      ),
    ) as Record<string, number>,
  )
  const storedSettings = loadObject<{ reviewMode?: string }>(STORAGE_KEYS.settings)
  const settings = ref<{ reviewMode: 'local' | 'ai' }>({
    reviewMode: storedSettings.reviewMode === 'ai' ? 'ai' : 'local',
  })
  const questionSource = ref<'local' | 'api'>('local')

  watch(records, (value) => saveToStorage(STORAGE_KEYS.records, value), { deep: true })
  watch(favorites, (value) => saveToStorage(STORAGE_KEYS.favorites, value), { deep: true })
  watch(mistakes, (value) => saveToStorage(STORAGE_KEYS.mistakes, value), { deep: true })
  watch(masteryMap, (value) => saveToStorage(STORAGE_KEYS.mastery, value), { deep: true })
  watch(dailyStats, (value) => saveToStorage(STORAGE_KEYS.dailyStats, value), { deep: true })
  watch(settings, (value) => saveToStorage(STORAGE_KEYS.settings, value), { deep: true })

  const favoriteQuestions = computed(() =>
    allQuestions.value.filter((question) => favorites.value.includes(question.id)),
  )
  const mistakeQuestions = computed(() =>
    allQuestions.value.filter((question) => mistakes.value.includes(question.id)),
  )
  const projectQuestions = computed(() =>
    allQuestions.value.filter((question) => question.category === '项目追问'),
  )

  const totalPracticeCount = computed(() => records.value.length)
  const todayPracticeCount = computed(() => dailyStats.value[todayKey()] ?? 0)
  const choiceRecords = computed(() => records.value.filter((item) => item.type === 'choice'))
  const shortAnswerRecords = computed(() => records.value.filter((item) => item.type === 'short_answer'))
  const correctChoiceCount = computed(() => choiceRecords.value.filter((item) => item.isCorrect).length)
  const choiceAccuracy = computed(() =>
    choiceRecords.value.length === 0 ? 0 : Math.round((correctChoiceCount.value / choiceRecords.value.length) * 100),
  )
  const shortAnswerAverageScore = computed(() => {
    if (shortAnswerRecords.value.length === 0) return 0
    const total = shortAnswerRecords.value.reduce(
      (sum, item) => sum + (item.reviewResult?.score ?? 0),
      0,
    )
    return Math.round(total / shortAnswerRecords.value.length)
  })
  const masteredCount = computed(
    () => Object.values(masteryMap.value).filter((item) => item.level === '熟练').length,
  )

  const categoryMastery = computed(() =>
    categories.map((category) => {
      const categoryQuestions = allQuestions.value.filter((item) => item.category === category)
      const mastered = categoryQuestions.filter(
        (item) => masteryMap.value[item.id]?.level === '熟练',
      ).length
      const practiced = categoryQuestions.filter((item) => masteryMap.value[item.id]).length

      return {
        category,
        total: categoryQuestions.length,
        practiced,
        mastered,
        rate: categoryQuestions.length === 0 ? 0 : Math.round((mastered / categoryQuestions.length) * 100),
      }
    }),
  )

  function getQuestionById(questionId: string) {
    return allQuestions.value.find((question) => question.id === questionId)
  }

  async function loadQuestionBank() {
    try {
      const result = await fetchQuestions()
      if (result.items.length > 0) {
        allQuestions.value = result.items
        questionSource.value = 'api'
      }
    } catch {
      allQuestions.value = questionBank
      questionSource.value = 'local'
    }
  }

  function isFavorite(questionId: string) {
    return favorites.value.includes(questionId)
  }

  function isMistake(questionId: string) {
    return mistakes.value.includes(questionId)
  }

  function toggleFavorite(questionId: string) {
    favorites.value = isFavorite(questionId)
      ? favorites.value.filter((id) => id !== questionId)
      : [...favorites.value, questionId]
  }

  function removeMistake(questionId: string) {
    mistakes.value = mistakes.value.filter((id) => id !== questionId)
  }

  function addMistake(questionId: string) {
    if (!mistakes.value.includes(questionId)) {
      mistakes.value = [...mistakes.value, questionId]
    }
  }

  function updateMastery(questionId: string, level: ReviewLevel, score: number) {
    masteryMap.value = {
      ...masteryMap.value,
      [questionId]: {
        questionId,
        level,
        lastScore: score,
        updatedAt: new Date().toISOString(),
      },
    }
  }

  function recordDailyPractice() {
    const key = todayKey()
    dailyStats.value = {
      ...dailyStats.value,
      [key]: (dailyStats.value[key] ?? 0) + 1,
    }
  }

  function appendRecord(record: PracticeRecord) {
    records.value = [record, ...records.value]
    recordDailyPractice()
  }

  function getFilteredQuestions(filters: PracticeFilters) {
    const search = filters.search.trim().toLowerCase()

    return allQuestions.value.filter((question) => {
      const matchesCategory = filters.category === '全部' || question.category === filters.category
      const matchesType = filters.type === '全部' || question.type === filters.type
      const matchesDifficulty = filters.difficulty === '全部' || question.difficulty === filters.difficulty
      const matchesSearch =
        search.length === 0 ||
        question.question.toLowerCase().includes(search) ||
        question.keywords.some((keyword) => keyword.toLowerCase().includes(search))

      return matchesCategory && matchesType && matchesDifficulty && matchesSearch
    })
  }

  function getQuestionPracticeRecords(questionId: string) {
    return records.value.filter((item) => item.questionId === questionId)
  }

  function getQuestionMastery(questionId: string) {
    return masteryMap.value[questionId]
  }

  function setReviewMode(mode: 'local' | 'ai') {
    settings.value.reviewMode = mode
  }

  function clearAllData() {
    records.value = []
    favorites.value = []
    mistakes.value = []
    masteryMap.value = {}
    dailyStats.value = {}
    settings.value.reviewMode = 'local'
  }

  function submitChoice(question: InterviewQuestion, selectedOption: string) {
    const isCorrect = selectedOption === question.answer
    const level = levelFromChoice(isCorrect)
    const score = isCorrect ? 100 : 0

    appendRecord({
      id: crypto.randomUUID(),
      questionId: question.id,
      category: question.category,
      type: question.type,
      createdAt: new Date().toISOString(),
      isCorrect,
      selectedOption,
    })

    updateMastery(question.id, level, score)
    if (!isCorrect) {
      addMistake(question.id)
    }

    return { isCorrect, answer: question.answer }
  }

  async function submitShortAnswer(question: InterviewQuestion, userAnswer: string) {
    const reviewResult = await reviewAnswer(question, userAnswer, settings.value.reviewMode)

    appendRecord({
      id: crypto.randomUUID(),
      questionId: question.id,
      category: question.category,
      type: question.type,
      createdAt: new Date().toISOString(),
      userAnswer,
      reviewResult,
    })

    updateMastery(question.id, reviewResult.level, reviewResult.score)
    if (reviewResult.score < 75 || reviewResult.level !== '熟练') {
      addMistake(question.id)
    }

    return reviewResult
  }

  return {
    allQuestions,
    questionSource,
    records,
    favorites,
    mistakes,
    settings,
    favoriteQuestions,
    mistakeQuestions,
    projectQuestions,
    totalPracticeCount,
    todayPracticeCount,
    choiceAccuracy,
    shortAnswerAverageScore,
    masteredCount,
    categoryMastery,
    getQuestionById,
    loadQuestionBank,
    getFilteredQuestions,
    getQuestionPracticeRecords,
    getQuestionMastery,
    isFavorite,
    isMistake,
    toggleFavorite,
    removeMistake,
    submitChoice,
    submitShortAnswer,
    setReviewMode,
    clearAllData,
  }
})
