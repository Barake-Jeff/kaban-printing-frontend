<template>
  <div class="flex flex-col min-h-screen">

    <!-- TopAppBar -->
    <nav class="fixed top-0 w-full z-50 flex justify-between items-center px-margin-mobile h-12 bg-primary-container">
      <div class="flex items-center gap-xs">
        <span class="material-symbols-outlined text-on-primary">print</span>
        <span class="font-headline-md text-headline-md font-bold text-on-primary">PrintEase</span>
      </div>
      <RouterLink
        to="/auth"
        class="font-label-bold text-label-bold px-md py-sm rounded-lg active:scale-95 transition-transform"
        style="background-color: #F97316; color: #5c2400;"
      >
        Login
      </RouterLink>
    </nav>

    <!-- Main content (offset for fixed nav) -->
    <main class="mt-12 flex-grow">

      <!-- Hero Section -->
      <section class="px-margin-mobile py-xl flex flex-col gap-md text-center bg-surface-container-low">
        <div
          v-for="(_, i) in [0,1]" :key="i"
          ref="heroRefs"
          class="transition-all duration-500"
          :class="heroVisible[i] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'"
        >
          <!-- Heading block (index 0) -->
          <template v-if="i === 0">
            <h1 class="font-headline-lg-mobile text-headline-lg-mobile text-primary font-bold">
              Your neighbourhood print shop, now online.
            </h1>
            <p class="font-body-lg text-body-lg text-on-surface-variant max-w-[320px] mx-auto font-normal mt-sm">
              Upload a file or send instructions — we print and deliver to your door.
            </p>
          </template>
          <!-- CTA buttons block (index 1) -->
          <template v-else>
            <div class="flex flex-col gap-sm w-full mt-md">
              <RouterLink to="/auth" class="btn-primary flex items-center justify-center">
                Submit a print job
              </RouterLink>
              <RouterLink to="/auth" class="btn-outline flex items-center justify-center">
                Log in
              </RouterLink>
            </div>
          </template>
        </div>

        <!-- Hero image -->
        <div
          ref="heroImageRef"
          class="mt-xl relative rounded-xl overflow-hidden aspect-[4/3] transition-all duration-500"
          :class="heroImageVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'"
        >
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDGR2Byu_-Qzv-u7d2uNITOkB4Mtzh4tN2sR-mXkgLUcv5Qg4c4Spkxjxcp9s3yr4lm_QFRwlinHHRFApuNaHcXh1rTSJlzGcqkhR2-9JN2s3KEO4tXOAOFcfaXLBSdhCH2o0xD-hQwKr9mYUi_dgcw-4vt_4T0uytYUF4VaBsjM00L3MBWn2Tui19X8OuYcQ9VbHDS0dXaFp2UqMbZgW3u5QQDZOivt9Wo2p2tNkvPFRabo44vzP9DF-Pu-o4rGCD9rhE-55WqVwc"
            alt="A clean, minimalist workspace featuring a high-end commercial document printer"
            class="w-full h-full object-cover rounded-xl"
          />
        </div>
      </section>

      <!-- Features Section -->
      <section class="px-margin-mobile py-xl grid grid-cols-1 gap-md">
        <div
          v-for="(feature, i) in features"
          :key="feature.title"
          :ref="el => { featureRefs[i] = el }"
          class="p-lg bg-surface-container rounded-xl flex flex-col items-start gap-sm transition-all duration-500"
          :class="featureVisible[i] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'"
          :style="{ transitionDelay: `${i * 100}ms` }"
        >
          <div class="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <span class="material-symbols-outlined text-primary">{{ feature.icon }}</span>
          </div>
          <div>
            <h3 class="font-headline-md text-headline-md text-primary font-bold">{{ feature.title }}</h3>
            <p class="font-body-sm text-body-sm text-on-surface-variant font-normal">{{ feature.sub }}</p>
          </div>
        </div>
      </section>

    </main>

    <!-- Footer -->
    <footer class="w-full flex flex-col items-center gap-sm py-xl px-margin-mobile text-center bg-surface-container border-t border-outline-variant">
      <div class="flex flex-col gap-xs mb-md">
        <span class="font-headline-md text-headline-md text-primary font-bold">PrintEase</span>
        <p class="font-body-sm text-body-sm text-on-surface-variant font-normal">
          Business Hours: 08:00 – 18:00 (Mon–Sat)
        </p>
        <a
          href="https://wa.me/1234567890"
          class="flex items-center justify-center gap-xs font-label-bold text-label-bold text-secondary hover:text-secondary-container transition-colors"
        >
          <span class="material-symbols-outlined text-[18px]">chat</span>
          WhatsApp Support
        </a>
      </div>
      <nav class="flex flex-wrap justify-center gap-md mb-md">
        <span class="font-body-sm text-body-sm text-on-surface-variant hover:text-secondary cursor-pointer transition-colors">Business Hours</span>
        <span class="font-body-sm text-body-sm text-on-surface-variant hover:text-secondary cursor-pointer transition-colors">WhatsApp Support</span>
        <span class="font-body-sm text-body-sm text-on-surface-variant hover:text-secondary cursor-pointer transition-colors">Privacy Policy</span>
      </nav>
      <p class="font-body-sm text-body-sm text-on-surface-variant/60 font-normal">
        © 2026 PrintEase. All rights reserved.
      </p>
    </footer>

    <!-- Bottom Nav Bar (mobile) -->
    <div class="md:hidden fixed bottom-0 w-full z-50 flex justify-around items-center h-16 bg-surface-container-lowest border-t border-outline-variant">
      <RouterLink
        v-for="item in bottomNav"
        :key="item.label"
        :to="item.to"
        class="flex flex-col items-center justify-center px-4 py-1 rounded-full transition-transform active:scale-90 cursor-pointer"
        :class="item.active
          ? 'bg-secondary-container text-on-secondary-container'
          : 'text-on-surface-variant hover:bg-surface-container-high'"
      >
        <span
          class="material-symbols-outlined"
          :class="{ filled: item.active }"
        >{{ item.icon }}</span>
        <span class="font-label-bold text-label-bold">{{ item.label }}</span>
      </RouterLink>
    </div>

    <!-- Spacer for fixed bottom nav on mobile -->
    <div class="h-16 md:hidden"></div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'

const features = [
  { icon: 'upload_file',   title: 'Send your file',      sub: 'PDF, Word, JPEG and more.' },
  { icon: 'print_connect', title: 'We handle it',        sub: 'Printed and ready fast.' },
  { icon: 'home',          title: 'Pickup or delivery',  sub: 'You choose how you get it.' },
]

const bottomNav = [
  { label: 'Home',     icon: 'home',         to: '/',      active: true },
  { label: 'Services', icon: 'print_connect', to: '/auth',  active: false },
  { label: 'Orders',   icon: 'receipt_long',  to: '/auth',  active: false },
  { label: 'Profile',  icon: 'person',        to: '/auth',  active: false },
]

// Scroll reveal refs and visibility state
const heroRefs      = ref([])
const heroImageRef  = ref(null)
const featureRefs   = ref([])
const heroVisible   = ref([false, false])
const heroImageVisible = ref(false)
const featureVisible = ref(features.map(() => false))

onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return
        const el = entry.target

        heroRefs.value.forEach((ref, i) => {
          if (ref === el) heroVisible.value[i] = true
        })
        if (heroImageRef.value === el) heroImageVisible.value = true
        featureRefs.value.forEach((ref, i) => {
          if (ref === el) featureVisible.value[i] = true
        })

        observer.unobserve(el)
      })
    },
    { threshold: 0.1 }
  )

  // Observe all animated elements
  ;[...heroRefs.value, heroImageRef.value, ...featureRefs.value]
    .filter(Boolean)
    .forEach(el => observer.observe(el))

  // Micro-interactions for touch devices
  document.querySelectorAll('button, .cursor-pointer').forEach(el => {
    el.addEventListener('touchstart', () => el.classList.add('scale-[0.97]'), { passive: true })
    el.addEventListener('touchend', () => el.classList.remove('scale-[0.97]'))
  })
})
</script>
