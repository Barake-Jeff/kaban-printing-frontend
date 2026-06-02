import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { CURRENT_USER } from '@/data/dummy.js'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const loading = ref(false)
  const error = ref(null)

  const isLoggedIn = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  // ── Dummy login ─────────────────────────────────────────────────────────────
  // Replace this function body with an axios.post('/auth/login') call
  // when NestJS is ready. The store interface stays the same.
  async function login({ phone, password }) {
    loading.value = true
    error.value = null
    await delay(800) // simulate network
    if (phone === '0712345678' && password === 'password') {
      user.value = { ...CURRENT_USER, role: 'customer' }
    } else if (phone === '0700000000' && password === 'admin') {
      user.value = { id: 'adm_001', name: 'Admin', phone, role: 'admin' }
    } else {
      error.value = 'Invalid phone number or password.'
    }
    loading.value = false
  }

  async function signup(payload) {
    loading.value = true
    error.value = null
    await delay(1000)
    // In production: POST /auth/signup
    user.value = { ...payload, id: 'usr_new', role: 'customer' }
    loading.value = false
  }

  function logout() {
    user.value = null
    error.value = null
  }

  return { user, loading, error, isLoggedIn, isAdmin, login, signup, logout }
})

function delay(ms) { return new Promise(r => setTimeout(r, ms)) }
