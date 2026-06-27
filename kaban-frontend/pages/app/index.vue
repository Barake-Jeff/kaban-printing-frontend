<template>
  <main class="pt-20 px-margin-mobile flex flex-col gap-xl">

    <!-- Greeting -->
    <header class="flex flex-col">
      <h1 class="font-headline-lg-mobile text-headline-lg-mobile text-primary font-medium">
        Hello {{ firstName }}
      </h1>
      <p class="font-label-bold text-label-bold text-secondary">
        House {{ auth.user?.houseNumber }}
      </p>
    </header>

    <!-- New print job CTA -->
    <section>
      <NuxtLink
        :to="{ name: 'app-new-job' }"
        class="w-full h-[48px] rounded-xl font-headline-md text-headline-md flex items-center justify-center gap-sm active:scale-[0.98] transition-all text-on-primary"
        style="background-color: #F97316;"
      >
        <span class="material-symbols-outlined">print</span>
        <span class="font-medium">New print job +</span>
      </NuxtLink>
    </section>

    <!-- Job list -->
    <section class="flex flex-col gap-md">
      <h2 class="font-headline-md text-headline-md text-primary font-medium">Your jobs</h2>

      <!-- Loading state -->
      <div v-if="jobs.loading" class="flex flex-col gap-md">
        <div
          v-for="n in 3" :key="n"
          class="bg-surface-container-low rounded-xl p-md h-28 animate-pulse"
        />
      </div>

      <!-- Empty state -->
      <div
        v-else-if="jobs.jobs.length === 0"
        class="bg-surface-container-low rounded-xl p-lg text-center"
      >
        <span class="material-symbols-outlined text-outline text-4xl">inbox</span>
        <p class="font-body-sm text-body-sm text-on-surface-variant mt-sm">
          No print jobs yet. Tap "New print job" to get started.
        </p>
      </div>

      <!-- Job cards -->
      <div v-else class="flex flex-col gap-md">
        <NuxtLink
          v-for="job in jobs.jobs"
          :key="job.id"
          :to="{ name: 'app-jobs-id', params: { id: job.id } }"
          @click="jobs.setActiveJob(job)"
          custom
          v-slot="{ navigate, href }"
        >
          <article
            :href="href"
            @click="navigate"
            @touchstart="touching = job.id"
            @touchend="touching = null"
            :class="[
              'rounded-xl p-md flex flex-col gap-sm cursor-pointer transition-colors',
              touching === job.id ? 'bg-surface-container-high' : 'bg-surface-container-low'
            ]"
          >
            <!-- Top row: reference + status badge -->
            <div class="flex justify-between items-start">
              <span class="font-label-bold text-label-bold text-on-surface-variant">
                {{ job.id }}
              </span>
              <span
                :class="['font-status-badge text-status-badge px-2 py-1 rounded-[4px] uppercase tracking-wider text-on-primary', statusBg(job.status)]"
              >
                {{ statusLabel(job.status) }}
              </span>
            </div>

            <!-- File name / instruction -->
            <div>
              <h3 class="font-headline-md text-headline-md text-primary font-bold truncate">
                {{ job.fileName ?? 'Custom instructions' }}
              </h3>
              <div class="flex flex-wrap gap-xs mt-xs">
                <span class="bg-surface-container-highest text-on-surface-variant font-label-bold text-[10px] px-2 py-0.5 rounded-full">
                  {{ job.pages }} {{ job.pages === 1 ? 'Page' : 'Pages' }}
                </span>
                <span class="bg-surface-container-highest text-on-surface-variant font-label-bold text-[10px] px-2 py-0.5 rounded-full">
                  {{ job.colorMode === 'bw' ? 'B&W' : 'Color' }}
                </span>
                <span class="bg-surface-container-highest text-on-surface-variant font-label-bold text-[10px] px-2 py-0.5 rounded-full">
                  {{ job.sides === 'single' ? 'Single-sided' : 'Double-sided' }}
                </span>
              </div>
            </div>

            <!-- Timestamp -->
            <div class="flex items-center gap-xs text-on-surface-variant mt-xs">
              <span class="material-symbols-outlined text-[16px]">{{ timestampIcon(job.status) }}</span>
              <span class="font-body-sm text-body-sm">{{ formatDate(job.createdAt) }}</span>
            </div>
          </article>
        </NuxtLink>
      </div>
    </section>

    <!-- Stats bento -->
    <section class="grid grid-cols-2 gap-gutter mb-xl">
      <div class="bg-primary-container p-md rounded-xl flex flex-col gap-xs">
        <span class="material-symbols-outlined text-on-primary-container">account_balance_wallet</span>
        <span class="text-on-primary-container font-headline-md text-headline-md font-bold">
          KES {{ creditBalance }}
        </span>
        <span class="text-on-primary-container/70 font-label-bold text-[10px] uppercase tracking-wider">
          Credit balance
        </span>
      </div>
      <div class="bg-surface-container p-md rounded-xl flex flex-col gap-xs">
        <span class="material-symbols-outlined text-primary">auto_awesome</span>
        <span class="text-primary font-headline-md text-headline-md font-bold">
          {{ loyaltyPoints }}
        </span>
        <span class="text-on-surface-variant font-label-bold text-[10px] uppercase tracking-wider">
          Loyalty points
        </span>
      </div>
    </section>

  </main>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'customer',
  middleware: 'auth',
  requiresAuth: true,
  role: 'customer',
})

const auth = useAuthStore()
const jobs = useJobsStore()

const touching = ref<string | null>(null)

const creditBalance  = ref(0)
const loyaltyPoints  = ref(jobs.jobs.length)

onMounted(() => jobs.fetchMyJobs())

const firstName = computed(() =>
  auth.user?.name?.split(' ')[0] ?? 'there'
)

function statusBg(status: string): string {
  const map: Record<string, string> = {
    pending:   'bg-secondary-container',
    printing:  'bg-blue-600',
    ready:     'bg-green-600',
    delivered: 'bg-outline',
  }
  return map[status] ?? 'bg-outline'
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    pending:   'Pending',
    printing:  'Printing',
    ready:     'Ready',
    delivered: 'Delivered',
  }
  return map[status] ?? status
}

function timestampIcon(status: string): string {
  const map: Record<string, string> = {
    pending:   'schedule',
    printing:  'schedule',
    ready:     'history',
    delivered: 'calendar_today',
  }
  return map[status] ?? 'schedule'
}

function formatDate(iso: string): string {
  if (!iso) return ''
  const date  = new Date(iso)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  const sameDay = (a: Date, b: Date) =>
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()

  if (sameDay(date, today)) {
    return 'Today, ' + date.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })
  }
  if (sameDay(date, yesterday)) return 'Yesterday'
  return date.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>
