<script setup lang="ts">
import QuestionCard from '@/components/QuestionCard.vue'
import { usePracticeStore } from '@/stores/practiceStore'

const store = usePracticeStore()
</script>

<template>
  <section class="page-section">
    <div class="section-head">
      <div>
        <p class="eyebrow">Favorites</p>
        <h2>收藏题目</h2>
      </div>
      <p class="section-copy">把高频题和薄弱题先收藏，后续集中刷。</p>
    </div>

    <div v-if="store.favoriteQuestions.length" class="question-grid">
      <QuestionCard
        v-for="question in store.favoriteQuestions"
        :key="question.id"
        :question="question"
        :favorite="true"
        :mastery-label="store.getQuestionMastery(question.id)?.level"
        @toggle-favorite="store.toggleFavorite"
      />
    </div>

    <div v-else class="empty-card">还没有收藏题目，可以先去题库挑一些高频题。</div>
  </section>
</template>
