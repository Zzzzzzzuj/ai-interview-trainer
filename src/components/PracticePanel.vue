<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { categories, type PracticeFilters } from '@/types/interview'
import { usePracticeStore } from '@/stores/practiceStore'
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

const currentIndex = ref(0)
const choiceFeedback = ref<{ isCorrect: boolean; answer: string } | null>(null)
const reviewResult = ref<Awaited<ReturnType<typeof store.submitShortAnswer>> | null>(null)
const showStandardAnswer = ref(false)

const categoryOptions = ['全部', ...categories] as const
const typeOptions = ['全部', 'choice', 'short_answer']
const difficultyOptions = ['全部', 'easy', 'medium', 'hard']

const availableQuestions = computed(() => store.getFilteredQuestions(filters.value))
const currentQuestion = computed(() => availableQuestions.value[currentIndex.value] ?? null)

onMounted(() => store.loadQuestionBank())

function resetQuestionState() {
  choiceFeedback.value = null
  reviewResult.value = null
  showStandardAnswer.value = false
}

watch(availableQuestions, () => {
  currentIndex.value = 0
  resetQuestionState()
})

function nextQuestion() {
  if (availableQuestions.value.length === 0) return
  currentIndex.value = (currentIndex.value + 1) % availableQuestions.value.length
  resetQuestionState()
}

function randomQuestion() {
  if (availableQuestions.value.length === 0) return
  currentIndex.value = Math.floor(Math.random() * availableQuestions.value.length)
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
</script>

<template>
  <section class="panel-section">
    <div class="section-head">
      <div>
        <p class="eyebrow">Practice Mode</p>
        <h2>按筛选条件刷题</h2>
      </div>
      <div class="action-row">
        <button class="ghost-button" @click="randomQuestion">随机一题</button>
        <button class="ghost-button" @click="nextQuestion">下一题</button>
      </div>
    </div>

    <div class="filters-row">
      <CategoryFilter v-model="filters.category" label="分类" :options="[...categoryOptions]" />
      <CategoryFilter v-model="filters.type" label="题型" :options="typeOptions" />
      <CategoryFilter v-model="filters.difficulty" label="难度" :options="difficultyOptions" />
      <label class="filter-field wide">
        <span>关键词搜索</span>
        <input v-model="filters.search" class="filter-input" placeholder="输入题干或关键词" />
      </label>
    </div>

    <div class="subtle-banner">
      当前题量：{{ availableQuestions.length }} / 总题量：{{ store.allQuestions.length }}
    </div>

    <div v-if="currentQuestion" class="practice-layout">
      <div class="question-shell">
        <div class="tag-list">
          <span class="tag">{{ currentQuestion.category }}</span>
          <span class="tag subtle">{{ currentQuestion.type === 'choice' ? '选择题' : '简答题' }}</span>
          <span class="tag">{{ currentQuestion.difficulty }}</span>
        </div>

        <ChoiceQuestion
          v-if="currentQuestion.type === 'choice'"
          :question="currentQuestion"
          @submit="submitChoice"
        />
        <ShortAnswerQuestion v-else :question="currentQuestion" @submit="submitShortAnswer" />

        <section v-if="choiceFeedback" class="review-panel">
          <h3>{{ choiceFeedback.isCorrect ? '回答正确' : '回答错误' }}</h3>
          <p class="answer-text">正确答案：{{ choiceFeedback.answer }}</p>
          <p class="explanation-text">{{ currentQuestion.explanation }}</p>
          <CodeExampleBlock
            v-if="currentQuestion.codeExample"
            :code="currentQuestion.codeExample"
          />
        </section>

        <ReviewResult v-if="reviewResult" :result="reviewResult" />

        <section v-if="currentQuestion.type === 'short_answer'" class="practice-card">
          <button class="text-button" @click="showStandardAnswer = !showStandardAnswer">
            {{ showStandardAnswer ? '隐藏标准答案' : '查看标准答案' }}
          </button>
          <p v-if="showStandardAnswer" class="answer-text">{{ currentQuestion.answer }}</p>
          <CodeExampleBlock
            v-if="currentQuestion.codeExample"
            :code="currentQuestion.codeExample"
          />
        </section>
      </div>

      <aside class="side-note-card">
        <p class="muted-label">练习建议</p>
        <ul class="plain-list">
          <li>选择题先判断概念边界，再看题解补细节。</li>
          <li>简答题尽量控制在 30-60 秒，先讲定义，再讲场景。</li>
          <li>如果评分是“一般”或“不会”，建议顺手复盘到错题本。</li>
        </ul>
      </aside>
    </div>

    <div v-else class="empty-card">
      当前筛选条件下暂无题目，换一个分类或清空搜索词试试。
    </div>
  </section>
</template>
