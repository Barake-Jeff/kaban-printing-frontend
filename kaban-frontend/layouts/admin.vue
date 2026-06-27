<template>
  <div class="bg-surface text-on-surface flex min-h-screen font-work-sans">

    <!-- ── Sidebar ── -->
    <aside class="fixed left-0 top-0 h-full w-[260px] flex flex-col py-8 z-50" style="background-color: #1B2D5B;">

      <!-- Logo -->
      <div class="px-6 mb-10 flex items-center gap-3">
        <span class="material-symbols-outlined text-secondary-container text-4xl">print</span>
        <div class="flex flex-col">
          <h1 class="text-2xl font-bold text-on-primary leading-tight">PrintEase</h1>
          <p class="text-label-caps font-label-caps text-on-primary/60 uppercase tracking-widest">Admin Dashboard</p>
        </div>
      </div>

      <!-- Nav links -->
      <nav class="flex-grow space-y-1">
        <NuxtLink
          v-for="item in navItems"
          :key="item.name"
          :to="{ name: item.route }"
          custom
          v-slot="{ navigate, href, isActive }"
        >
          <a
            :href="href ?? undefined"
            @click="navigate"
            :class="[
              'flex items-center gap-3 px-6 py-3 transition-all duration-200',
              isActive
                ? 'border-l-4 border-secondary-container text-on-primary bg-primary-container/40'
                : 'text-on-primary/70 hover:text-on-primary hover:bg-primary-container/10 border-l-4 border-transparent'
            ]"
          >
            <span class="material-symbols-outlined">{{ item.icon }}</span>
            <span class="font-body-md text-body-md">{{ item.name }}</span>
          </a>
        </NuxtLink>
      </nav>

      <!-- New print job button -->
      <div class="px-4 mb-4">
        <button
          class="w-full text-on-secondary-container py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          style="background-color: #F97316;"
        >
          <span class="material-symbols-outlined">add</span>
          New Print Job
        </button>
      </div>

      <!-- User profile -->
      <div class="px-6 border-t border-on-primary/10 pt-6">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center overflow-hidden border border-on-primary/20 flex-shrink-0">
            <span class="material-symbols-outlined text-on-primary-container text-[20px]">person</span>
          </div>
          <div class="flex flex-col min-w-0">
            <span class="text-on-primary font-bold text-body-md truncate">{{ auth.user?.name ?? 'Admin' }}</span>
            <span class="text-on-primary/50 text-label-caps uppercase">Store Manager</span>
          </div>
        </div>
        <button
          @click="handleLogout"
          class="flex items-center gap-3 py-2 text-on-primary/70 hover:text-on-primary transition-colors w-full"
        >
          <span class="material-symbols-outlined">logout</span>
          <span class="font-body-md text-body-md">Logout</span>
        </button>
      </div>
    </aside>

    <!-- ── Main canvas (offset for sidebar) ── -->
    <main class="ml-[260px] flex-grow flex flex-col min-h-screen">
      <slot />
    </main>

  </div>
</template>

<script setup lang="ts">
const auth   = useAuthStore()
const router = useRouter()

const navItems = [
  { name: 'Queue',     icon: 'pending_actions', route: 'admin' },
  { name: 'Customers', icon: 'group',            route: 'admin-customers' },
  { name: 'Reports',   icon: 'assessment',       route: 'admin-reports'   },
  { name: 'Settings',  icon: 'settings',         route: 'admin-settings'  },
]

function handleLogout() {
  auth.logout()
  router.push('/')
}
</script>
