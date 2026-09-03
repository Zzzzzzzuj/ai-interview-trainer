<script setup lang="ts">
defineProps<{
  title: string
  value: string | number
  hint?: string
}>()
</script>

<template>
  <article class="stats-card">
    <p class="muted-label">{{ title }}</p>
    <h3>{{ value }}</h3>
    <p v-if="hint" class="stats-hint">{{ hint }}</p>
  </article>
</template>
