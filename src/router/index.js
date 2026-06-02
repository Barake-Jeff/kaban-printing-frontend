import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'

const routes = [
  // ── Public ──────────────────────────────────────────────────────────────────
  { path: '/',     name: 'landing', component: () => import('@/views/LandingView.vue') },
  { path: '/auth', name: 'auth',    component: () => import('@/views/AuthView.vue') },

  // ── Customer shell (bottom nav + top nav visible) ────────────────────────────
  {
    path: '/app',
    component: () => import('@/views/customer/CustomerLayout.vue'),
    meta: { requiresAuth: true, role: 'customer' },
    children: [
      { path: '', name: 'home', component: () => import('@/views/customer/HomeView.vue') },
    ],
  },

  // ── Focused flows (own header, no CustomerLayout) ───────────────────────────
  {
    path: '/app/new-job',
    name: 'new-job',
    component: () => import('@/views/customer/NewJobView.vue'),
    meta: { requiresAuth: true, role: 'customer' },
  },
  {
    path: '/app/payment',
    name: 'payment',
    component: () => import('@/views/customer/PaymentView.vue'),
    meta: { requiresAuth: true, role: 'customer' },
  },
  {
    path: '/app/jobs/:id',
    name: 'job-detail',
    component: () => import('@/views/customer/JobDetailView.vue'),
    meta: { requiresAuth: true, role: 'customer' },
  },

  // ── Admin ────────────────────────────────────────────────────────────────────
  {
    path: '/admin',
    component: () => import('@/views/admin/AdminLayout.vue'),
    meta: { requiresAuth: true, role: 'admin' },
    children: [
      { path: '',          name: 'admin-dashboard', component: () => import('@/views/admin/DashboardView.vue') },
      { path: 'customers', name: 'admin-customers', component: () => import('@/views/admin/CustomersView.vue') },
      { path: 'reports',   name: 'admin-reports',   component: () => import('@/views/admin/ReportsView.vue') },
      { path: 'settings',  name: 'admin-settings',  component: () => import('@/views/admin/SettingsView.vue') },
    ],
  },

  // ── Fallback ─────────────────────────────────────────────────────────────────
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isLoggedIn) return { name: 'auth' }
  if (to.meta.role === 'admin' && !auth.isAdmin)  return { name: 'home' }
  if (to.name === 'auth' && auth.isLoggedIn) {
    return auth.isAdmin ? { name: 'admin-dashboard' } : { name: 'home' }
  }
})

export default router
