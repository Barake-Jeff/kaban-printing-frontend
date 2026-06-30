<template>
  <div class="min-h-screen bg-surface flex flex-col">

    <!-- Top bar -->
    <header class="flex items-center gap-xs px-6 h-14 bg-primary">
      <span class="material-symbols-outlined text-on-primary">print</span>
      <div class="flex flex-col leading-tight">
        <span class="font-bold text-on-primary text-sm tracking-wide">PrintEase</span>
        <span class="text-on-primary/70 text-[10px] uppercase tracking-widest">Staff Portal</span>
      </div>
    </header>

    <!-- Form -->
    <main class="flex-grow flex flex-col justify-center px-6 py-10 max-w-sm mx-auto w-full">
      <h1 class="text-xl font-bold text-primary mb-1">Staff sign in</h1>
      <p class="text-sm text-on-surface-variant mb-8">For PrintEase team members only.</p>

      <form @submit.prevent="handleLogin" class="space-y-5">

        <div class="space-y-1">
          <label class="block text-sm font-semibold text-primary">Phone number</label>
          <input
            v-model="form.phone"
            type="tel"
            placeholder="0712 345 678"
            class="input-field"
            required
            autocomplete="username"
          />
        </div>

        <div class="space-y-1">
          <label class="block text-sm font-semibold text-primary">Password</label>
          <div class="relative">
            <input
              v-model="form.password"
              :type="showPass ? 'text' : 'password'"
              placeholder="••••••••"
              class="input-field"
              required
              autocomplete="current-password"
            />
            <button
              @click="showPass = !showPass"
              type="button"
              class="absolute right-3 top-3 text-outline hover:text-primary transition-colors"
            >
              <span class="material-symbols-outlined text-xl">{{ showPass ? 'visibility_off' : 'visibility' }}</span>
            </button>
          </div>
        </div>

        <p v-if="auth.error" class="text-sm text-red-600">{{ auth.error }}</p>

        <button
          type="submit"
          :disabled="auth.loading"
          class="w-full h-12 bg-primary text-on-primary font-semibold uppercase tracking-widest rounded-lg active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-60"
        >
          {{ auth.loading ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>

      <div class="mt-12 pt-6 border-t border-outline-variant/40 text-center">
        <NuxtLink to="/auth" class="text-xs text-on-surface-variant/50 hover:text-on-surface-variant transition-colors">
          ← Customer login
        </NuxtLink>
      </div>
    </main>

  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const auth   = useAuthStore()
const router = useRouter()

const form     = reactive({ phone: '', password: '' })
const showPass = ref(false)

// Redirect already-logged-in staff
onMounted(() => {
  if (auth.isLoggedIn && auth.isAdmin) {
    router.replace(auth.user?.role === 'clerk' ? '/admin/queue' : '/admin')
  }
})

async function handleLogin() {
  await auth.adminLogin({ phone: form.phone, password: form.password })
  if (!auth.error) {
    router.push(auth.user?.role === 'clerk' ? '/admin/queue' : '/admin')
  }
}
</script>

<style scoped>
.input-field {
  width: 100%;
  height: 3rem;
  padding-left: 16px;
  padding-right: 44px;
  background: white;
  border: 1px solid #c5c6d0;
  border-radius: 12px;
  font-size: 16px;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.input-field:focus {
  border-color: #021745;
  box-shadow: 0 0 0 1px #021745;
}
</style>
