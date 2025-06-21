import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import EditorView from '@/views/EditorView.vue'
import LoginView from '@/views/LoginView.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'home',
            component: HomeView,
        },
        {
            path: '/editor/:preset?',
            name: 'editor',
            component: EditorView,
        },
        {
            path: '/login/',
            name: 'login',
            component: LoginView,
        },
    ],
})

export default router
