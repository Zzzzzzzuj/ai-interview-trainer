<script setup lang="ts">
import { computed, ref } from 'vue'
import type { InterviewQuestion } from '@/types/interview'

const props = defineProps<{
  question: InterviewQuestion
}>()

const emit = defineEmits<{
  submit: [option: string]
}>()

const selectedOption = ref('')
const hasSubmitted = ref(false)

const selectedLabel = computed(
  () => props.question.options?.find((option) => option.value === selectedOption.value)?.label ?? '',
)

function submit() {
  if (!selectedOption.value) return
  hasSubmitted.value = true
  emit('submit', selectedOption.value)
}
</script>

<template>
  <section class="practice-card">
    <p class="question-text">{{ question.question }}</p>

    <div class="option-list">
      <label
        v-for="option in question.options"
        :key="option.value"
        class="option-card"
        :class="{ active: selectedOption === option.value }"
      >
        <input v-model="selectedOption" type="radio" :value="option.value" />
        <span class="option-label">{{ option.label }}</span>
        <span>{{ option.value }}</span>
      </label>
    </div>

    <div class="action-row">
      <button class="primary-button" :disabled="!selectedOption" @click="submit">提交答案</button>
      <span v-if="hasSubmitted && selectedLabel" class="muted-label">已选择：{{ selectedLabel }}</span>
    </div>
  </section>
</template>
