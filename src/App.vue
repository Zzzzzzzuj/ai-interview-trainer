<script setup lang="ts">
import { RouterLink, RouterView, useRoute } from 'vue-router'

const route = useRoute()

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/questions', label: '题库' },
  { to: '/practice', label: '练习' },
  { to: '/mistakes', label: '错题本' },
  { to: '/favorites', label: '收藏' },
  { to: '/projects', label: '项目追问' },
  { to: '/settings', label: '设置' },
]
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar">
      <div class="brand-card">
        <p class="eyebrow">Frontend + AI Interview MVP</p>
        <h1>面试练习平台</h1>
        <p class="brand-copy">
          面向前端实习和 AI 应用开发实习，支持八股、项目追问、错题复盘和本地规则评分。
        </p>
      </div>

      <nav class="nav-list">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="nav-link"
          :class="{ active: route.path === item.to }"
        >
          {{ item.label }}
        </RouterLink>
      </nav>
    </aside>

    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>
