<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { categories, type PracticeFilters, type PracticeMode, type ReviewLevel } from '@/types/interview'
import { usePracticeStore } from '@/stores/practiceStore'
import { filterQuestions } from '@/utils/questionFilter'
import CategoryFilter from './CategoryFilter.vue'
import ChoiceQuestion from './ChoiceQuestion.vue'
import ShortAnswerQuestion from './ShortAnswerQuestion.vue'
import ReviewResult from './ReviewResult.vue'
import CodeExampleBlock from './CodeExampleBlock.vue'

const store = usePracticeStore()

const filters = ref<PracticeFilters>({
  category: '全部',
  type: '全部',
  difficulty: '全部',
  search: '',
})
const practiceMode = ref<PracticeMode>('random')
const currentIndex = ref(0)
const choiceFeedback = ref<{ isCorrect: boolean; answer: string } | null>(null)
const reviewResult = ref<Awaited<ReturnType<typeof store.submitShortAnswer>> | null>(null)
const showStandardAnswer = ref(false)
const showExplanation = ref(false)
const showCodeExample = ref(false)

const categoryOptions = ['全部', ...categories]
const typeOptions = ['全部', 'choice', 'short_answer']
const difficultyOptions = ['全部', 'easy', 'medium', 'hard']
const practiceModeOptions: { label: string; value: PracticeMode }[] = [
  { label: '随机刷题', value: 'random' },
  { label: '顺序刷题', value: 'sequential' },
  { label: '只刷错题', value: 'mistakes' },
  { label: '只刷收藏', value: 'favorites' },
  { label: '只刷高频题', value: 'highFrequency' },
]

const availableQuestions = computed(() =>
  filterQuestions(store.questions, {
    filters: filters.value,
    mode: practiceMode.value,
    favoriteIds: store.favorites,
    mistakeIds: store.mistakes,
  }),
)
const currentQuestion = computed(() => availableQuestions.value[currentIndex.value] ?? null)
const currentPosition = computed(() => (currentQuestion.value ? currentIndex.value + 1 : 0))
const canGoPrevious = computed(() => practiceMode.value === 'sequential' && currentIndex.value > 0)
const canGoNext = computed(() =>
  practiceMode.value === 'sequential'
    ? currentIndex.value < availableQuestions.value.length - 1
    : availableQuestions.value.length > 0,
)
const hasCodeExample = computed(() => Boolean(currentQuestion.value?.codeExample?.trim()))
const emptyMessage = computed(() => {
  if (store.isLoadingQuestions) return '题库加载中，稍等一下就能开始练习。'
  if (practiceMode.value === 'mistakes') return '错题本里还没有题。先去练几道题，答错或低分题会自动收进来。'
  if (practiceMode.value === 'favorites') return '收藏夹里还没有题。可以先在题库页或练习时收藏想重点复盘的题。'
  if (practiceMode.value === 'highFrequency') return '当前题库里暂时没有可识别的高频题，或者当前筛选条件太窄。'
  return '当前条件下没有可练习题目，换一个分类、题型或清空搜索词试试。'
})

onMounted(() => store.loadQuestions())

function resetQuestionState() {
  choiceFeedback.value = null
  reviewResult.value = null
  showStandardAnswer.value = false
  showExplanation.value = false
  showCodeExample.value = false
}

function pickRandomIndex() {
  if (availableQuestions.value.length <= 1) return 0
  let nextIndex = currentIndex.value
  while (nextIndex === currentIndex.value) {
    nextIndex = Math.floor(Math.random() * availableQuestions.value.length)
  }
  return nextIndex
}

watch([availableQuestions, practiceMode], () => {
  currentIndex.value = practiceMode.value === 'random' ? pickRandomIndex() : 0
  resetQuestionState()
})

function previousQuestion() {
  if (!canGoPrevious.value) return
  currentIndex.value -= 1
  resetQuestionState()
}

function nextQuestion() {
  if (!canGoNext.value) return
  currentIndex.value = practiceMode.value === 'random'
    ? pickRandomIndex()
    : Math.min(currentIndex.value + 1, availableQuestions.value.length - 1)
  resetQuestionState()
}

function submitChoice(option: string) {
  if (!currentQuestion.value) return
  choiceFeedback.value = store.submitChoice(currentQuestion.value, option)
}

async function submitShortAnswer(answer: string) {
  if (!currentQuestion.value) return
  reviewResult.value = await store.submitShortAnswer(currentQuestion.value, answer)
}

function markMastery(level: ReviewLevel) {
  if (!currentQuestion.value) return
  const scoreByLevel: Record<ReviewLevel, number> = { 不会: 0, 一般: 60, 熟练: 100 }
  store.updateMastery(currentQuestion.value.id, level, scoreByLevel[level])
  if (level !== '熟练') store.addMistake(currentQuestion.value.id)
}

function addCurrentToMistakes() {
  if (!currentQuestion.value) return
  store.addMistake(currentQuestion.value.id)
}
</script>

<template>
  <section class="panel-section">
    <div class="section-head">
      <div>
        <p class="eyebrow">Practice Mode</p>
        <h2>刷题练习</h2>
      </div>
      <div class="action-row">
        <button class="ghost-button" :disabled="!canGoPrevious" @click="previousQuestion">上一题</button>
        <button class="ghost-button" :disabled="!canGoNext" @click="nextQuestion">
          {{ practiceMode === 'random' ? '随机下一题' : '下一题' }}
        </button>
      </div>
    </div>

    <div class="filters-row practice-filters">
      <label class="filter-field">
        <span>练习模式</span>
        <select v-model="practiceMode" class="filter-select">
          <option v-for="option in practiceModeOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </label>
      <CategoryFilter v-model="filters.category" label="分类" :options="categoryOptions" />
      <CategoryFilter v-model="filters.type" label="题型" :options="typeOptions" />
      <CategoryFilter v-model="filters.difficulty" label="难度" :options="difficultyOptions" />
      <label class="filter-field wide">
        <span>关键词搜索</span>
        <input v-model="filters.search" class="filter-input" placeholder="输入题干或关键词" />
      </label>
    </div>

    <div class="subtle-banner">
      当前可练：{{ availableQuestions.length }} 题 · 位置：{{ currentPosition }} / {{ availableQuestions.length }} ·
      总题量：{{ store.totalQuestions }} · {{ store.questionSource === 'api' ? '数据库题库' : '本地题库 fallback' }}
    </div>

    <div v-if="currentQuestion" class="practice-layout">
      <div class="question-shell">
        <div class="practice-card">
          <div class="card-top">
            <div class="tag-list">
              <span class="tag">{{ currentQuestion.category }}</span>
              <span class="tag subtle">{{ currentQuestion.type === 'choice' ? '选择题' : '简答题' }}</span>
              <span class="tag">{{ currentQuestion.difficulty }}</span>
              <span v-if="store.getQuestionMastery(currentQuestion.id)" class="tag mastery">
                {{ store.getQuestionMastery(currentQuestion.id)?.level }}
              </span>
            </div>
            <button class="ghost-button" @click="store.toggleFavorite(currentQuestion.id)">
              {{ store.isFavorite(currentQuestion.id) ? '取消收藏' : '收藏' }}
            </button>
          </div>
        </div>

        <ChoiceQuestion
          v-if="currentQuestion.type === 'choice'"
          :key="currentQuestion.id"
          :question="currentQuestion"
          @submit="submitChoice"
        />
        <ShortAnswerQuestion
          v-else
          :key="currentQuestion.id"
          :question="currentQuestion"
          @submit="submitShortAnswer"
        />

        <section class="practice-card">
          <div class="card-actions">
            <button class="text-button" @click="showStandardAnswer = !showStandardAnswer">
              {{ showStandardAnswer ? '隐藏答案' : '查看答案' }}
            </button>
            <button class="text-button" @click="showExplanation = !showExplanation">
              {{ showExplanation ? '隐藏题解' : '查看题解' }}
            </button>
            <button v-if="hasCodeExample" class="text-button" @click="showCodeExample = !showCodeExample">
              {{ showCodeExample ? '隐藏代码例子' : '查看代码例子' }}
            </button>
            <button class="text-button" @click="addCurrentToMistakes">加入错题</button>
          </div>
          <p v-if="showStandardAnswer" class="answer-text">{{ currentQuestion.answer }}</p>
          <p v-if="showExplanation" class="explanation-text">{{ currentQuestion.explanation }}</p>
          <CodeExampleBlock
            v-if="showCodeExample && hasCodeExample && currentQuestion.codeExample"
            :code="currentQuestion.codeExample"
          />
        </section>

        <section v-if="choiceFeedback" class="review-panel">
          <h3>{{ choiceFeedback.isCorrect ? '回答正确' : '回答错误' }}</h3>
          <p class="answer-text">正确答案：{{ choiceFeedback.answer }}</p>
          <p class="explanation-text">{{ currentQuestion.explanation }}</p>
        </section>

        <ReviewResult v-if="reviewResult" :result="reviewResult" />
      </div>

      <aside class="side-note-card">
        <p class="muted-label">练习建议</p>
        <ul class="plain-list">
          <li>随机刷题适合热身，顺序刷题适合系统复盘。</li>
          <li>错题和收藏会继续使用 localStorage，刷新后仍然保留。</li>
          <li>简答题尽量控制在 30-60 秒，先讲结论，再补机制和场景。</li>
        </ul>
        <div class="mastery-actions">
          <p class="muted-label">标记掌握程度</p>
          <div class="action-row spaced">
            <button class="danger-button" @click="markMastery('不会')">不会</button>
            <button class="ghost-button" @click="markMastery('一般')">一般</button>
            <button class="primary-button" @click="markMastery('熟练')">熟练</button>
          </div>
        </div>
      </aside>
    </div>

    <div v-else class="empty-card">
      {{ emptyMessage }}
    </div>
  </section>
</template>
