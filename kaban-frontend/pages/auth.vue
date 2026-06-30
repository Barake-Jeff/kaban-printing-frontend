<template>
  <div class="text-on-surface">

    <!-- TopAppBar -->
    <header class="fixed top-0 w-full z-50 flex justify-between items-center px-margin-mobile h-12 bg-primary-container">
      <div class="flex items-center gap-xs">
        <span class="material-symbols-outlined text-on-primary">print</span>
        <span class="font-headline-md text-headline-md font-bold text-on-primary">PrintEase</span>
      </div>
      <button
        @click="activeTab = 'login'"
        class="text-on-primary/80 font-label-bold text-label-bold hover:bg-primary-container hover:text-on-primary-container transition-colors px-4 py-1 rounded-full active:scale-95"
      >
        Login
      </button>
    </header>

    <main class="pt-12 pb-20 min-h-screen flex flex-col">

      <!-- Auth Tabs -->
      <nav class="flex w-full bg-surface border-b border-outline-variant sticky top-12 z-40">
        <button
          @click="activeTab = 'signup'"
          :class="['flex-1 py-4 text-center font-label-bold text-label-bold uppercase tracking-wider transition-all',
            activeTab === 'signup' ? 'tab-active' : 'tab-inactive']"
        >
          Sign up
        </button>
        <button
          @click="activeTab = 'login'"
          :class="['flex-1 py-4 text-center font-label-bold text-label-bold uppercase tracking-wider transition-all',
            activeTab === 'login' ? 'tab-active' : 'tab-inactive']"
        >
          Log in
        </button>
      </nav>

      <section class="px-margin-mobile py-xl flex-grow">

        <!-- ── Sign Up Form ── -->
        <div v-if="activeTab === 'signup'" class="space-y-lg">
          <div class="bg-surface-container-low rounded-xl p-md">
            <form @submit.prevent="handleSignup" class="space-y-md">

              <div class="space-y-xs">
                <label class="block font-label-bold text-label-bold text-primary font-normal">Full name</label>
                <input
                  v-model="signupForm.name"
                  type="text"
                  placeholder="Enter your legal name"
                  class="input-field"
                  required
                />
              </div>

              <div class="space-y-xs">
                <label class="block font-label-bold text-label-bold text-primary font-normal">Phone number</label>
                <div class="relative">
                  <input
                    v-model="signupForm.phone"
                    type="tel"
                    placeholder="0712 345 678"
                    class="input-field"
                    required
                  />
                  <span class="absolute right-3 top-3 material-symbols-outlined text-outline">call</span>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-md">
                <div class="space-y-xs">
                  <label class="block font-label-bold text-label-bold text-primary font-normal">House number</label>
                  <input
                    v-model="signupForm.houseNumber"
                    type="text"
                    placeholder="e.g. 14B"
                    class="input-field"
                    required
                  />
                </div>
                <div class="space-y-xs">
                  <label class="block font-label-bold text-label-bold text-primary font-normal">Estate/Street</label>
                  <input
                    v-model="signupForm.estate"
                    type="text"
                    placeholder="Street Name"
                    class="input-field"
                    required
                  />
                </div>
              </div>

              <div class="space-y-xs">
                <label class="block font-label-bold text-label-bold text-primary font-normal">Password</label>
                <div class="relative">
                  <input
                    v-model="signupForm.password"
                    :type="showPass1 ? 'text' : 'password'"
                    placeholder="Minimum 8 characters"
                    class="input-field"
                    required
                  />
                  <button
                    @click="showPass1 = !showPass1"
                    type="button"
                    class="absolute right-3 top-3 text-outline hover:text-primary transition-colors"
                  >
                    <span class="material-symbols-outlined">{{ showPass1 ? 'visibility_off' : 'visibility' }}</span>
                  </button>
                </div>
              </div>

              <div class="space-y-xs">
                <label class="block font-label-bold text-label-bold text-primary font-normal">Confirm password</label>
                <div class="relative">
                  <input
                    v-model="signupForm.confirm"
                    :type="showPass2 ? 'text' : 'password'"
                    placeholder="Repeat password"
                    class="input-field"
                    required
                  />
                  <button
                    @click="showPass2 = !showPass2"
                    type="button"
                    class="absolute right-3 top-3 text-outline hover:text-primary transition-colors"
                  >
                    <span class="material-symbols-outlined">{{ showPass2 ? 'visibility_off' : 'visibility' }}</span>
                  </button>
                </div>
              </div>

              <p v-if="signupError || auth.error" class="text-error font-body-sm text-body-sm">
                {{ signupError || auth.error }}
              </p>

              <p class="italic text-on-surface-variant font-body-sm text-body-sm pt-2 font-normal">
                Your house number is how we identify your orders.
              </p>

            </form>
          </div>

          <button
            @click="handleSignup"
            :disabled="auth.loading"
            class="w-full h-12 bg-secondary-container text-on-primary font-label-bold text-label-bold uppercase tracking-widest rounded-lg active:scale-[0.98] transition-all flex items-center justify-center gap-sm disabled:opacity-60"
          >
            {{ auth.loading ? 'Creating account…' : 'Create account' }}
          </button>
        </div>

        <!-- ── Log In Form ── -->
        <div v-if="activeTab === 'login'" class="space-y-lg">
          <div class="bg-surface-container-low rounded-xl p-md">
            <form @submit.prevent="handleLogin" class="space-y-md">

              <div class="space-y-xs">
                <label class="block font-label-bold text-label-bold text-primary font-normal">Phone number</label>
                <input
                  v-model="loginForm.phone"
                  type="text"
                  placeholder="0712 345 678"
                  class="input-field"
                  required
                />
              </div>

              <div class="space-y-xs">
                <label class="block font-label-bold text-label-bold text-primary font-normal">Password</label>
                <div class="relative">
                  <input
                    v-model="loginForm.password"
                    :type="showLoginPass ? 'text' : 'password'"
                    placeholder="••••••••"
                    class="input-field"
                    required
                  />
                  <button
                    @click="showLoginPass = !showLoginPass"
                    type="button"
                    class="absolute right-3 top-3 text-outline hover:text-primary transition-colors"
                  >
                    <span class="material-symbols-outlined">{{ showLoginPass ? 'visibility_off' : 'visibility' }}</span>
                  </button>
                </div>
              </div>

              <div class="text-right">
                <a href="#" class="font-label-bold text-label-bold text-secondary">Forgot Password?</a>
              </div>

              <p v-if="auth.error" class="text-error font-body-sm text-body-sm">{{ auth.error }}</p>

            </form>
          </div>

          <button
            @click="handleLogin"
            :disabled="auth.loading"
            class="w-full h-12 bg-primary text-on-primary font-label-bold text-label-bold uppercase tracking-widest rounded-lg active:scale-[0.98] transition-all flex items-center justify-center gap-sm disabled:opacity-60"
          >
            {{ auth.loading ? 'Logging in…' : 'Login' }}
          </button>

          <p class="font-body-sm text-body-sm text-center text-on-surface-variant pt-sm">
            Demo: <strong>0712345678</strong> / <strong>password</strong>
          </p>
        </div>

        <!-- Staff link -->
        <p class="text-center mt-xl">
          <NuxtLink
            to="/admin/login"
            class="text-xs text-on-surface-variant/50 hover:text-on-surface-variant transition-colors"
          >
            Staff? Sign in here →
          </NuxtLink>
        </p>

        <!-- Illustration -->
        <div class="mt-md text-center">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAbmbtIHqRKdcMynD5YK3ENsxjkYSiBxYL3ulRpr0mtO4hF4wJ6f9_Tfm4bNKAQVl8TSedOwfcnOZW-iaqx4p43AaKw84KoH1B1UT6AKby5vclFSlbLoWSEhQZzwf24jlrP8LUCdUAlAvvEiZLuZ56O0o-UOtgM6_m3Y1QEZm7rAJjgDUKglNsqpWfzqaIw3Bt02S-HBBztE0VN3sUn3zr6qvp5ZKtnKXedG68zaBAo7umVxwkyxoZw3b5y3fnNNEXBVwQQGyFHcIM"
            alt="PrintEase Corporate Service"
            class="w-full aspect-video object-cover rounded-xl grayscale-[40%] opacity-90"
          />
        </div>

      </section>
    </main>

    <!-- Bottom Nav Bar -->
    <nav class="fixed bottom-0 w-full z-50 bg-surface-container-lowest border-t border-outline-variant flex justify-around items-center h-16 px-xs">
      <NuxtLink
        to="/"
        class="flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors px-4 py-1 rounded-full active:scale-90"
      >
        <span class="material-symbols-outlined">home</span>
        <span class="font-label-bold text-label-bold">Home</span>
      </NuxtLink>
      <button class="flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors px-4 py-1 rounded-full active:scale-90">
        <span class="material-symbols-outlined">print_connect</span>
        <span class="font-label-bold text-label-bold">Services</span>
      </button>
      <button class="flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors px-4 py-1 rounded-full active:scale-90">
        <span class="material-symbols-outlined">receipt_long</span>
        <span class="font-label-bold text-label-bold">Orders</span>
      </button>
      <button class="flex flex-col items-center justify-center bg-secondary-container text-on-secondary-container rounded-full px-4 py-1 active:scale-90">
        <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;">person</span>
        <span class="font-label-bold text-label-bold">Profile</span>
      </button>
    </nav>

  </div>
</template>

<script setup lang="ts">
import type { SignupPayload, LoginPayload } from '~/types'

definePageMeta({ middleware: 'auth' })

const auth   = useAuthStore()
const router = useRouter()

const activeTab     = ref<'signup' | 'login'>('signup')
const showPass1     = ref(false)
const showPass2     = ref(false)
const showLoginPass = ref(false)
const signupError   = ref('')

const signupForm = reactive<SignupPayload>({
  name: '',
  phone: '',
  houseNumber: '',
  estate: '',
  password: '',
  confirm: '',
})

const loginForm = reactive<LoginPayload>({
  phone: '',
  password: '',
})

async function handleSignup() {
  signupError.value = ''
  auth.error = null
  if (signupForm.password.length < 8) {
    signupError.value = 'Password must be at least 8 characters.'
    return
  }
  if (signupForm.password !== signupForm.confirm) {
    signupError.value = 'Passwords do not match.'
    return
  }
  await auth.signup({ ...signupForm })
  if (!auth.error) router.push({ name: 'app' })
}

async function handleLogin() {
  await auth.login({ phone: loginForm.phone, password: loginForm.password })
  if (!auth.error) {
    const role = auth.user?.role
    if (role === 'admin') router.push({ name: 'admin' })
    else if (role === 'clerk') router.push({ name: 'admin-queue' })
    else router.push({ name: 'app' })
  }
}
</script>

<style scoped>
.input-field {
  width: 100%;
  height: 3rem;
  padding-left: 16px;
  padding-right: 16px;
  background: white;
  border: 1px solid #c5c6d0;
  border-radius: 12px;
  font-size: 16px;
  line-height: 24px;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.input-field:focus {
  border-color: #fd761a;
  box-shadow: 0 0 0 1px #fd761a;
}
.tab-active {
  border-bottom: 3px solid #fd761a;
  color: #021745;
}
.tab-inactive {
  color: #757680;
}
</style>
