<script setup lang="ts">
import QuestionCard from '@/components/QuestionCard.vue'
import { usePracticeStore } from '@/stores/practiceStore'

const store = usePracticeStore()
</script>

<template>
  <section class="page-section">
    <div class="section-head">
      <div>
        <p class="eyebrow">Projects</p>
        <h2>项目追问专区</h2>
      </div>
      <p class="section-copy">
        已内置你的实习经历、CrisisAgent 和 AI 求职助手相关问题，适合做 40 秒口述训练。
      </p>
    </div>

    <div class="subtle-banner">
      重点覆盖：森林图前端化、Adapter、Loading / Error / Result、EDC 字段联调、Workflow vs Agent、
      AgentState、Trace、RAG、Rerank、质量门控、Fallback、Human Review、SSE、PDF 导出、localStorage。
    </div>

    <div class="question-grid">
      <QuestionCard
        v-for="question in store.projectQuestions"
        :key="question.id"
        :question="question"
        :favorite="store.isFavorite(question.id)"
        :mastery-label="store.getQuestionMastery(question.id)?.level"
        @toggle-favorite="store.toggleFavorite"
      />
    </div>
  </section>
</template>
