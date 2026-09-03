<script setup lang="ts">
import { computed, ref } from 'vue'
import CategoryFilter from '@/components/CategoryFilter.vue'
import QuestionCard from '@/components/QuestionCard.vue'
import { usePracticeStore } from '@/stores/practiceStore'
import { categories } from '@/types/interview'

const store = usePracticeStore()
const selectedCategory = ref<'全部' | (typeof categories)[number]>('全部')

const filteredMistakes = computed(() =>
  store.mistakeQuestions.filter(
    (item) => selectedCategory.value === '全部' || item.category === selectedCategory.value,
  ),
)
</script>

<template>
  <section class="page-section">
    <div class="section-head">
      <div>
        <p class="eyebrow">Mistakes</p>
        <h2>错题本</h2>
      </div>
      <p class="section-copy">自动收集选择题答错、简答题低分或掌握度不足的题目。</p>
    </div>

    <div class="filters-row">
      <CategoryFilter
        v-model="selectedCategory"
        label="分类筛选"
        :options="['全部', ...categories]"
      />
    </div>

    <div v-if="filteredMistakes.length" class="question-grid">
      <QuestionCard
        v-for="question in filteredMistakes"
        :key="question.id"
        :question="question"
        :favorite="store.isFavorite(question.id)"
        :mastery-label="store.getQuestionMastery(question.id)?.level"
        data-removable
        @toggle-favorite="store.toggleFavorite"
        @remove-mistake="store.removeMistake"
      />
    </div>

    <div v-else class="empty-card">当前没有错题，继续保持。</div>
  </section>
</template>
