<script setup lang="ts">
import { computed, ref } from 'vue'
import type { InterviewQuestion } from '@/types/interview'
import CodeExampleBlock from './CodeExampleBlock.vue'

const props = defineProps<{
  question: InterviewQuestion
  favorite: boolean
  masteryLabel?: string
  compact?: boolean
}>()

const emit = defineEmits<{
  toggleFavorite: [questionId: string]
  removeMistake: [questionId: string]
}>()

const showExplanation = ref(false)
const showCode = ref(false)
const showAnswer = ref(false)

const difficultyClass = computed(() => `difficulty-${props.question.difficulty}`)
</script>

<template>
  <article class="question-card" :class="{ compact: compact }">
    <div class="card-top">
      <div class="tag-list">
        <span class="tag">{{ question.category }}</span>
        <span class="tag subtle">{{ question.type === 'choice' ? '选择题' : '简答题' }}</span>
        <span class="tag" :class="difficultyClass">{{ question.difficulty }}</span>
        <span v-if="masteryLabel" class="tag mastery">{{ masteryLabel }}</span>
      </div>
      <button class="ghost-button" @click="emit('toggleFavorite', question.id)">
        {{ favorite ? '取消收藏' : '收藏' }}
      </button>
    </div>

    <h3 class="card-title">{{ question.question }}</h3>

    <div v-if="question.type === 'choice' && question.options" class="option-preview">
      <span v-for="option in question.options" :key="option.value" class="option-chip">
        {{ option.label }}. {{ option.value }}
      </span>
    </div>

    <div class="card-actions">
      <button class="text-button" @click="showAnswer = !showAnswer">
        {{ showAnswer ? '隐藏答案' : '查看答案' }}
      </button>
      <button class="text-button" @click="showExplanation = !showExplanation">
        {{ showExplanation ? '隐藏题解' : '查看题解' }}
      </button>
      <button v-if="question.codeExample" class="text-button" @click="showCode = !showCode">
        {{ showCode ? '隐藏代码例子' : '查看代码例子' }}
      </button>
      <button v-if="$attrs['data-removable'] !== undefined" class="text-button danger-text" @click="emit('removeMistake', question.id)">
        移出错题本
      </button>
    </div>

    <p v-if="showAnswer" class="answer-text">{{ question.answer }}</p>
    <p v-if="showExplanation" class="explanation-text">{{ question.explanation }}</p>

    <CodeExampleBlock v-if="showCode && question.codeExample" :code="question.codeExample" />

    <div v-if="question.followUps?.length" class="follow-up-block">
      <p class="muted-label">可能追问</p>
      <ul class="plain-list">
        <li v-for="item in question.followUps" :key="item">{{ item }}</li>
      </ul>
    </div>
  </article>
</template>
