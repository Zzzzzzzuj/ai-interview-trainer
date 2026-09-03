<script setup lang="ts">
defineProps<{
  code: string
}>()
</script>

<template>
  <div class="code-block">
    <div class="code-head">代码例子</div>
    <pre><code>{{ code }}</code></pre>
  </div>
</template>
