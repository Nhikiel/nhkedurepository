import AppLayout from '@/layouts/AppLayout.vue'
import { createRouter, createWebHistory } from 'vue-router'
import { auth } from '@/config/firebaseConfig'
import { onAuthStateChanged } from 'firebase/auth'

let isAuthenticated = false

// Check authentication status
onAuthStateChanged(auth, (user) => {
    isAuthenticated = !!user
})

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            redirect: '/login'
        },
        {
            path: '/login',
            name: 'login',
            component: () => import('@/views/guest/LoginView.vue'),
        },
        {
            path: '/register',
            name: 'register',
            component: () => import('@/views/guest/RegisterView.vue'),
        },
        {
            path: '/dashboard',
            component: AppLayout,
            meta: { requiresAuth: true },
            children: [
                {
                    path: '',
                    redirect: '/dashboard/feed'
                },
                {
                    path: 'feed',
                    name: 'feed',
                    component: () => import('@/views/authenticated/FeedView.vue'),
                },
                {
                    path: 'assignments',
                    name: 'assignments',
                    component: () => import('@/views/authenticated/AssignmentsView.vue'),
                },
                {
                    path: 'chats',
                    name: 'chats',
                    component: () => import('@/views/authenticated/ChatsView.vue'),
                },
                {
                    path: 'profile',
                    name: 'profile',
                    component: () => import('@/views/authenticated/ProfileView.vue'),
                },
            ],
        },
    ],
})

// Route guard
router.beforeEach((to, from, next) => {
    if (to.meta.requiresAuth && !isAuthenticated) {
        next('/login')
    } else if ((to.path === '/login' || to.path === '/register') && isAuthenticated) {
        next('/dashboard/feed')
    } else {
        next()
    }
})

export default router
