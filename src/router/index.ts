import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: () => import('@/views/DashboardView.vue') },
    { path: '/questions', component: () => import('@/views/QuestionsView.vue') },
    { path: '/practice', component: () => import('@/views/PracticeView.vue') },
    { path: '/mistakes', component: () => import('@/views/MistakesView.vue') },
    { path: '/favorites', component: () => import('@/views/FavoritesView.vue') },
    { path: '/projects', component: () => import('@/views/ProjectsView.vue') },
    { path: '/settings', component: () => import('@/views/SettingsView.vue') },
  ],
})

export default router
