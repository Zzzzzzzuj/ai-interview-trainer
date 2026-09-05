<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import CategoryFilter from '@/components/CategoryFilter.vue'
import QuestionCard from '@/components/QuestionCard.vue'
import { usePracticeStore } from '@/stores/practiceStore'
import { categories, type PracticeFilters } from '@/types/interview'

const store = usePracticeStore()

const filters = ref<PracticeFilters>({
  category: '全部',
  type: '全部',
  difficulty: '全部',
  search: '',
})

const categoryOptions = ['全部', ...categories] as const
const typeOptions = ['全部', 'choice', 'short_answer']
const difficultyOptions = ['全部', 'easy', 'medium', 'hard']

const filteredQuestions = computed(() => store.getFilteredQuestions(filters.value))

onMounted(() => store.loadQuestions())
</script>

<template>
  <section class="page-section">
    <div class="section-head">
      <div>
        <p class="eyebrow">Question Bank</p>
        <h2>题库浏览</h2>
      </div>
      <p class="section-copy">支持按分类、题型、难度和关键词快速筛选。</p>
    </div>

    <div class="filters-row">
      <CategoryFilter v-model="filters.category" label="分类" :options="[...categoryOptions]" />
      <CategoryFilter v-model="filters.type" label="题型" :options="typeOptions" />
      <CategoryFilter v-model="filters.difficulty" label="难度" :options="difficultyOptions" />
      <label class="filter-field wide">
        <span>关键词搜索</span>
        <input v-model="filters.search" class="filter-input" placeholder="如：闭包 / RAG / SSE" />
      </label>
    </div>

    <div class="subtle-banner">
      共找到 {{ filteredQuestions.length }} 道题，当前数据源：{{ store.questionSource === 'api' ? '数据库题库' : '本地题库 fallback' }}
    </div>

    <div class="question-grid">
      <QuestionCard
        v-for="question in filteredQuestions"
        :key="question.id"
        :question="question"
        :favorite="store.isFavorite(question.id)"
        :mastery-label="store.getQuestionMastery(question.id)?.level"
        @toggle-favorite="store.toggleFavorite"
      />
    </div>
  </section>
</template>
