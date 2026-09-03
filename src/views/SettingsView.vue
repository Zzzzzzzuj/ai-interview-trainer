<script setup lang="ts">
import { usePracticeStore } from '@/stores/practiceStore'

const store = usePracticeStore()
</script>

<template>
  <section class="page-section">
    <div class="section-head">
      <div>
        <p class="eyebrow">Settings</p>
        <h2>设置</h2>
      </div>
      <p class="section-copy">第一版默认本地规则评分，同时预留 AI 批改模式切换。</p>
    </div>

    <div class="two-column">
      <section class="panel-section">
        <h3>批改模式</h3>
        <div class="option-list">
          <label class="option-card">
            <input
              :checked="store.settings.reviewMode === 'local'"
              type="radio"
              name="review-mode"
              @change="store.setReviewMode('local')"
            />
            <span>localRuleReview（默认）</span>
          </label>
          <label class="option-card">
            <input
              :checked="store.settings.reviewMode === 'ai'"
              type="radio"
              name="review-mode"
              @change="store.setReviewMode('ai')"
            />
            <span>aiReviewAnswer（mock 预留）</span>
          </label>
        </div>
      </section>

      <section class="panel-section">
        <h3>本地数据</h3>
        <p class="section-copy">
          当前会保存在浏览器 localStorage 中：练习记录、简答答案、评分结果、错题、收藏、掌握度和每日统计。
        </p>
        <button class="danger-button" @click="store.clearAllData">清空本地练习数据</button>
      </section>
    </div>
  </section>
</template>
