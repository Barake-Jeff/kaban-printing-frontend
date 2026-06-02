<template>
  <div class="bg-background text-on-background min-h-screen pb-24">

    <!-- Top Navigation -->
    <nav class="fixed top-0 w-full z-50 bg-primary h-12 flex justify-between items-center px-margin-mobile">
      <div class="flex items-center gap-2">
        <span class="material-symbols-outlined text-on-primary">print</span>
        <span class="font-headline-md text-headline-md font-bold text-on-primary">PrintEase</span>
      </div>
      <button class="relative active:scale-95 transition-transform">
        <span class="material-symbols-outlined text-on-primary">notifications</span>
        <span class="absolute top-0 right-0 block h-2 w-2 rounded-full bg-secondary ring-2 ring-primary"></span>
      </button>
    </nav>

    <!-- Page content (offset for fixed nav) -->
    <RouterView />

    <!-- Bottom Navigation -->
    <nav class="fixed bottom-0 inset-x-0 flex justify-around items-center h-16 px-xs border-t z-50"
      style="background-color: #1B2D5B; border-color: #1B2D5B;">
      <RouterLink
        v-for="item in navItems"
        :key="item.label"
        :to="{ name: item.route }"
        custom
        v-slot="{ navigate, href, isActive }"
      >
        <a
          :href="href"
          @click="navigate"
          :class="[
            'flex flex-col items-center justify-center px-4 py-1 rounded-full transition-all active:scale-90',
            isActive || (item.route === 'home' && isHomeActive)
              ? 'bg-brand-orange text-on-primary'
              : 'text-on-primary/80 hover:text-on-primary'
          ]"
        >
          <span
            class="material-symbols-outlined"
            :style="(isActive || (item.route === 'home' && isHomeActive)) ? filledIcon : ''"
          >{{ item.icon }}</span>
          <span class="font-label-bold text-label-bold">{{ item.label }}</span>
        </a>
      </RouterLink>
    </nav>

  </div>
</template>

<script setup>
import { computed } from 'vue'
import { RouterView, RouterLink, useRoute } from 'vue-router'

const route = useRoute()

const filledIcon = "font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;"

// Home is active when on the home route or job-detail route
const isHomeActive = computed(() =>
  ['home', 'job-detail'].includes(route.name)
)

const navItems = [
  { label: 'Home',     icon: 'home',         route: 'home' },
  { label: 'Services', icon: 'print_connect', route: 'new-job' },
  { label: 'Orders',   icon: 'receipt_long',  route: 'home' },
  { label: 'Profile',  icon: 'person',        route: 'home' },
]
</script>
