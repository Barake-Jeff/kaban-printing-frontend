import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, LoginPayload, SignupPayload } from '~/types'

export const useAuthStore = defineStore('auth', () => {
  const config = useRuntimeConfig()
  const base   = config.public.apiBase

  // Stored in a cookie so SSR middleware can read it on page reload
  const user = useCookie<User | null>('auth_user', {
    maxAge:   30 * 24 * 60 * 60,
    sameSite: 'lax',
    default:  () => null,
  })

  const loading = ref(false)
  const error   = ref<string | null>(null)

  const isLoggedIn = computed(() => !!user.value)
  const isAdmin    = computed(() =>
    user.value?.role === 'admin' || user.value?.role === 'clerk',
  )

  async function login({ phone, password }: LoginPayload) {
    loading.value = true
    error.value   = null

    try {
      let res: any

      try {
        res = await $fetch<any>('/auth/login', {
          baseURL: base, method: 'POST', body: { phone, password },
        })
      } catch (e: any) {
        // Backend returns 403 when an admin/clerk hits the customer endpoint
        if (e?.response?.status === 403 || e?.data?.statusCode === 403) {
          res = await $fetch<any>('/admin/auth/login', {
            baseURL: base, method: 'POST', body: { phone, password },
          })
        } else {
          throw e
        }
      }

      const { accessToken, refreshToken, user: userData } = res.data
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      user.value = userData
    } catch (e: any) {
      error.value =
        e?.data?.message ?? e?.message ?? 'Login failed. Check your credentials and try again.'
    } finally {
      loading.value = false
    }
  }

  async function signup(payload: SignupPayload) {
    loading.value = true
    error.value   = null

    try {
      const res = await $fetch<any>('/auth/register', {
        baseURL: base,
        method:  'POST',
        body: {
          name:        payload.name,
          phone:       payload.phone,
          houseNumber: payload.houseNumber,
          estate:      payload.estate,
          password:    payload.password,
        },
      })

      const { accessToken, refreshToken, user: userData } = res.data
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      user.value = userData
    } catch (e: any) {
      error.value =
        e?.data?.message ?? e?.message ?? 'Registration failed. Please try again.'
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    const refreshToken = localStorage.getItem('refreshToken')
    const accessToken  = localStorage.getItem('accessToken')

    if (refreshToken && accessToken) {
      try {
        await $fetch('/auth/logout', {
          baseURL: base,
          method:  'POST',
          body:    { refreshToken },
          headers: { Authorization: `Bearer ${accessToken}` },
        })
      } catch {}
    }

    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    user.value  = null
    error.value = null
  }

  return { user, loading, error, isLoggedIn, isAdmin, login, signup, logout }
})
