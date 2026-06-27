<template>
  <div class="flex flex-col min-h-screen">

    <CommonTopAppBar />

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
              <NuxtLink to="/auth" class="btn-primary flex items-center justify-center">
                Submit a print job
              </NuxtLink>
              <NuxtLink to="/auth" class="btn-outline flex items-center justify-center">
                Log in
              </NuxtLink>
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

    <CommonAppFooter />
    <CommonBottomNavBar />

  </div>
</template>

<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'

const features = [
  { icon: 'upload_file',   title: 'Send your file',      sub: 'PDF, Word, JPEG and more.' },
  { icon: 'print_connect', title: 'We handle it',        sub: 'Printed and ready fast.' },
  { icon: 'home',          title: 'Pickup or delivery',  sub: 'You choose how you get it.' },
]

const heroRefs         = ref<Element[]>([])
const heroImageRef     = ref<Element | null>(null)
const featureRefs      = ref<Array<Element | ComponentPublicInstance | null>>([])
const heroVisible      = ref([false, false])
const heroImageVisible = ref(false)
const featureVisible   = ref(features.map(() => false))

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

  ;[...heroRefs.value, heroImageRef.value, ...featureRefs.value]
    .filter((el): el is Element => el instanceof Element)
    .forEach(el => observer.observe(el))

  document.querySelectorAll('button, .cursor-pointer').forEach(el => {
    el.addEventListener('touchstart', () => el.classList.add('scale-[0.97]'), { passive: true })
    el.addEventListener('touchend', () => el.classList.remove('scale-[0.97]'))
  })
})
</script>
