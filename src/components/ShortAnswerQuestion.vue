<script setup lang="ts">
import { ref } from 'vue'
import type { InterviewQuestion } from '@/types/interview'

defineProps<{
  question: InterviewQuestion
}>()

const emit = defineEmits<{
  submit: [answer: string]
}>()

const answerText = ref('')

function submit() {
  if (!answerText.value.trim()) return
  emit('submit', answerText.value)
}
</script>

<template>
  <section class="practice-card">
    <p class="question-text">{{ question.question }}</p>
    <textarea
      v-model="answerText"
      class="answer-textarea"
      placeholder="请输入你的口述答案，可以按“定义 - 原理 - 场景 - 注意点”组织"
      rows="8"
    />
    <div class="action-row">
      <button class="primary-button" :disabled="!answerText.trim()" @click="submit">提交评分</button>
      <span class="muted-label">{{ answerText.length }} 字</span>
    </div>
  </section>
</template>
