<script setup lang="ts">
import { onMounted } from 'vue'
import StatsCard from '@/components/StatsCard.vue'
import { usePracticeStore } from '@/stores/practiceStore'

const store = usePracticeStore()

onMounted(() => store.loadQuestions())
</script>

<template>
  <section class="page-section">
    <div class="section-head">
      <div>
        <p class="eyebrow">Dashboard</p>
        <h2>练习总览</h2>
      </div>
      <p class="section-copy">本地保存练习记录、错题和收藏，刷新后也会保留。</p>
    </div>

    <div class="stats-grid">
      <StatsCard title="今日练习题数" :value="store.todayPracticeCount" />
      <StatsCard title="累计练习题数" :value="store.totalPracticeCount" />
      <StatsCard title="选择题正确率" :value="`${store.choiceAccuracy}%`" />
      <StatsCard title="简答题平均分" :value="store.shortAnswerAverageScore" />
      <StatsCard title="熟练题数" :value="store.masteredCount" />
      <StatsCard title="错题数" :value="store.mistakes.length" />
      <StatsCard title="收藏题数" :value="store.favorites.length" />
      <StatsCard title="题库总量" :value="store.totalQuestions" />
    </div>

    <div class="two-column">
      <section class="panel-section">
        <h3>分类掌握情况</h3>
        <div class="mastery-list">
          <article v-for="item in store.categoryMastery" :key="item.category" class="mastery-card">
            <div class="mastery-row">
              <strong>{{ item.category }}</strong>
              <span>{{ item.mastered }}/{{ item.total }} 熟练</span>
            </div>
            <div class="progress-track">
              <span class="progress-bar" :style="{ width: `${item.rate}%` }" />
            </div>
            <p class="stats-hint">已练习 {{ item.practiced }} 题，掌握率 {{ item.rate }}%</p>
          </article>
        </div>
      </section>

      <section class="panel-section">
        <h3>题库分布</h3>
        <p class="stats-hint">
          当前数据源：{{ store.questionSource === 'api' ? '数据库题库' : '本地题库 fallback' }}
        </p>
        <div class="tag-list spaced">
          <span v-for="(count, category) in store.categoryStats" :key="category" class="tag">
            {{ category }} · {{ count }}
          </span>
        </div>
      </section>
    </div>
  </section>
</template>
