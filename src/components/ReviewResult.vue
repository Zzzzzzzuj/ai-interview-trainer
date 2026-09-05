<script setup lang="ts">
import type { ReviewResult as ReviewResultType } from '@/types/interview'

defineProps<{
  result: ReviewResultType
}>()
</script>

<template>
  <section class="review-panel">
    <div class="review-score-row">
      <div>
        <p class="muted-label">评分结果</p>
        <h3>{{ result.score }} 分 / {{ result.level }}</h3>
      </div>
      <div class="tag-list">
        <span class="badge badge-score">{{ result.level }}</span>
        <span class="tag subtle">{{ result.source === 'ai' ? 'AI 批改' : '本地规则评分' }}</span>
      </div>
    </div>

    <p class="review-feedback">{{ result.feedback }}</p>

    <div class="review-grid">
      <div>
        <p class="muted-label">命中关键词</p>
        <div class="tag-list">
          <span v-for="keyword in result.matchedKeywords" :key="keyword" class="tag success">
            {{ keyword }}
          </span>
          <span v-if="result.matchedKeywords.length === 0" class="empty-inline">暂无命中</span>
        </div>
      </div>

      <div>
        <p class="muted-label">缺失关键词</p>
        <div class="tag-list">
          <span v-for="keyword in result.missingKeywords" :key="keyword" class="tag danger">
            {{ keyword }}
          </span>
          <span v-if="result.missingKeywords.length === 0" class="empty-inline">覆盖完整</span>
        </div>
      </div>
    </div>

    <div>
      <p class="muted-label">遗漏点提醒</p>
      <ul class="plain-list">
        <li v-for="point in result.missedPoints" :key="point">{{ point }}</li>
      </ul>
    </div>

    <div>
      <p class="muted-label">更稳的参考回答</p>
      <p class="answer-text">{{ result.betterAnswer }}</p>
    </div>
  </section>
</template>
