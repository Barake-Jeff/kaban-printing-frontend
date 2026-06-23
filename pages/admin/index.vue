<template>
  <div class="font-work-sans">

    <!-- Sticky topbar -->
    <header class="h-16 flex justify-between items-center px-admin-gutter bg-surface border-b border-outline-variant sticky top-0 z-40">
      <div class="flex items-center gap-4">
        <h2 class="text-2xl font-semibold text-primary">PrintEase Dashboard</h2>
        <div class="relative w-72">
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
          <input
            v-model="searchQuery"
            class="w-full pl-10 pr-4 py-2 bg-surface-container border border-outline-variant rounded-full text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            placeholder="Search orders, customers..."
            type="text"
          />
        </div>
      </div>
      <div class="flex items-center gap-4">
        <button class="p-2 rounded-full hover:bg-surface-container-high transition-colors">
          <span class="material-symbols-outlined text-on-surface-variant">notifications</span>
        </button>
        <button class="p-2 rounded-full hover:bg-surface-container-high transition-colors">
          <span class="material-symbols-outlined text-on-surface-variant">help_outline</span>
        </button>
      </div>
    </header>

    <!-- Content area -->
    <div class="p-container-padding flex flex-col gap-stack-lg">

      <!-- ── Metric cards ── -->
      <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          v-for="card in statCards"
          :key="card.label"
          class="bg-surface-container p-6 rounded-xl border border-outline-variant"
        >
          <div class="flex justify-between items-start mb-2">
            <p class="text-label-caps font-label-caps text-on-surface-variant uppercase">{{ card.label }}</p>
            <span :class="['material-symbols-outlined', card.iconColor]">{{ card.icon }}</span>
          </div>
          <p :class="['text-display-lg font-display-lg', card.valueColor]">{{ card.value }}</p>
          <p class="text-body-md text-on-surface-variant mt-2">{{ card.sub }}</p>
        </div>
      </section>

      <!-- ── Main split row ── -->
      <div class="grid grid-cols-12 gap-admin-gutter">

        <!-- Left: Active jobs table (8 cols) -->
        <div class="col-span-12 lg:col-span-8 bg-surface-container rounded-xl border border-outline-variant overflow-hidden">
          <div class="p-6 border-b border-outline-variant flex justify-between items-center">
            <h3 class="text-title-sm font-title-sm text-on-surface">Active Jobs</h3>
            <button class="text-primary hover:underline text-label-caps font-label-caps uppercase tracking-widest">
              View full queue
            </button>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-surface-container-low">
                  <th v-for="h in tableHeaders" :key="h"
                    class="px-6 py-4 text-label-caps font-label-caps text-on-surface-variant border-b border-outline-variant uppercase tracking-widest">
                    {{ h }}
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-outline-variant">
                <tr
                  v-for="job in filteredJobs"
                  :key="job.id"
                  @click="admin.selectJob(job)"
                  class="hover:bg-primary-container/5 transition-colors cursor-pointer"
                  :class="{ 'bg-primary-container/10': admin.selectedJob?.id === job.id }"
                >
                  <td class="px-6 py-4 text-body-md font-bold text-on-surface">
                    {{ job.houseNumber ?? 'House —' }}
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex flex-col">
                      <span class="text-body-md text-primary font-medium truncate max-w-[180px]">
                        {{ job.fileName ?? job.instructions?.slice(0, 30) ?? '—' }}
                      </span>
                      <span class="text-body-md text-on-surface-variant text-sm">
                        {{ job.colorMode === 'bw' ? 'B&W' : 'Colour' }}, {{ job.sides === 'single' ? 'Single-sided' : 'Double-sided' }}
                      </span>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-body-md text-on-surface">{{ job.pages }} pgs</td>
                  <td class="px-6 py-4 text-body-md text-on-surface">{{ job.copies }} {{ job.copies === 1 ? 'copy' : 'copies' }}</td>
                  <td class="px-6 py-4">
                    <span :class="['px-3 py-1 text-label-caps font-label-caps rounded-full', paymentBadge(job.paymentStatus).cls]">
                      {{ paymentBadge(job.paymentStatus).label }}
                    </span>
                  </td>
                  <td class="px-6 py-4">
                    <span :class="['px-3 py-1 text-label-caps font-label-caps rounded-full', deliveryBadge(job.deliveryType).cls]">
                      {{ deliveryBadge(job.deliveryType).label }}
                    </span>
                  </td>
                  <td :class="['px-6 py-4 border-l-4', statusBorderColor(job.status)]">
                    <div v-if="job.status === 'printing'" class="flex items-center gap-2">
                      <span class="relative flex h-2 w-2">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                      </span>
                      <span class="text-body-md text-blue-600 font-medium">Printing</span>
                    </div>
                    <span v-else :class="['text-body-md font-medium', statusTextColor(job.status)]">
                      {{ statusLabel(job.status) }}
                    </span>
                  </td>
                </tr>
                <tr v-if="filteredJobs.length === 0">
                  <td colspan="7" class="px-6 py-10 text-center text-on-surface-variant text-body-md">
                    No jobs match your search.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Right panel (4 cols) -->
        <div class="col-span-12 lg:col-span-4 flex flex-col gap-admin-gutter">

          <!-- Alerts -->
          <div class="bg-surface-container rounded-xl border border-outline-variant overflow-hidden">
            <div class="p-6 border-b border-outline-variant">
              <h3 class="text-title-sm font-title-sm text-on-surface flex items-center gap-2">
                <span class="material-symbols-outlined text-secondary">notifications_active</span>
                Active Alerts
              </h3>
            </div>
            <div class="p-4 space-y-4">
              <div v-if="admin.alerts.length === 0" class="text-center text-on-surface-variant text-body-md py-4">
                No active alerts
              </div>
              <div
                v-for="alert in admin.alerts"
                :key="alert.id"
                :class="['flex items-start gap-4 p-3 rounded-r-lg border-l-4', alertStyle(alert.type).container]"
              >
                <span :class="['material-symbols-outlined mt-1', alertStyle(alert.type).icon]">
                  {{ alertStyle(alert.type).symbol }}
                </span>
                <div>
                  <p :class="['text-body-md font-bold', alertStyle(alert.type).title]">
                    {{ alert.message }}
                  </p>
                  <p :class="['text-body-md text-sm', alertStyle(alert.type).sub]">
                    Job {{ alert.jobId }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Customer lookup -->
          <div class="bg-surface-container p-6 rounded-xl border border-outline-variant">
            <h3 class="text-title-sm font-title-sm text-on-surface mb-4 flex items-center gap-2">
              <span class="material-symbols-outlined text-primary">person_search</span>
              Customer Lookup
            </h3>
            <div class="space-y-4">
              <div>
                <label class="text-label-caps font-label-caps text-on-surface-variant block mb-2 uppercase">House Number</label>
                <div class="relative">
                  <input
                    v-model="lookupQuery"
                    @input="doLookup"
                    @keyup.enter="doLookup"
                    class="w-full px-4 py-3 border-2 border-outline-variant rounded-xl focus:border-primary focus:ring-0 text-body-md transition-all"
                    placeholder="e.g. 14B"
                    type="text"
                  />
                  <button
                    @click="doLookup"
                    class="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-on-primary p-2 rounded-lg hover:opacity-90 transition-opacity"
                  >
                    <span class="material-symbols-outlined text-[20px]">search</span>
                  </button>
                </div>
              </div>

              <div v-if="lookupResult" class="bg-surface-container-high p-4 rounded-lg">
                <p class="text-body-md font-bold text-on-surface">{{ lookupResult.name }}</p>
                <p class="text-body-md text-on-surface-variant text-sm">House {{ lookupResult.houseNumber }}</p>
                <div class="flex gap-4 mt-2 text-sm text-on-surface-variant">
                  <span>{{ lookupResult.totalJobs }} jobs</span>
                  <span>KES {{ lookupResult.totalSpent }} spent</span>
                </div>
                <div class="flex gap-4 mt-1 text-sm text-on-surface-variant">
                  <span>M-Pesa: {{ lookupResult.mpesaCount }}</span>
                  <span>Pay on pickup: {{ lookupResult.payOnPickupCount }}</span>
                </div>
              </div>
              <div v-else-if="lookupQuery" class="bg-surface-container-high p-4 rounded-lg">
                <p class="text-body-md text-on-surface-variant">No customer found for "{{ lookupQuery }}"</p>
              </div>
              <div v-else class="bg-surface-container-high p-4 rounded-lg flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-outline-variant rounded-full flex items-center justify-center text-on-surface-variant">
                    <span class="material-symbols-outlined">history</span>
                  </div>
                  <div class="flex flex-col">
                    <span class="text-body-md font-bold text-sm">Recent search</span>
                    <span class="text-label-caps font-label-caps text-on-surface-variant">House 22C (Peter Njoroge)</span>
                  </div>
                </div>
                <span class="material-symbols-outlined text-on-surface-variant">chevron_right</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- ── Job detail slide panel ── -->
      <Transition name="overlay">
        <div
          v-if="admin.selectedJob"
          class="fixed inset-0 bg-primary/20 backdrop-blur-sm z-50 flex justify-end"
          @click.self="admin.clearSelectedJob()"
        >
          <Transition name="slide" appear>
            <div
              v-if="admin.selectedJob"
              class="w-full md:w-1/3 h-full bg-white shadow-2xl flex flex-col"
            >
              <!-- Panel header -->
              <header class="p-stack-lg border-b border-outline-variant flex-shrink-0">
                <div class="flex justify-between items-start mb-2">
                  <h3 class="text-2xl font-bold text-primary-container">{{ admin.selectedJob.id }}</h3>
                  <button
                    @click="admin.clearSelectedJob()"
                    class="p-2 hover:bg-surface-container rounded-full transition-colors"
                  >
                    <span class="material-symbols-outlined">close</span>
                  </button>
                </div>
                <span :class="['px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit', statusBadgeCls(admin.selectedJob.status)]">
                  <span v-if="admin.selectedJob.status === 'printing'" class="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                  {{ statusLabel(admin.selectedJob.status) }}
                </span>
              </header>

              <!-- Scrollable content -->
              <div class="flex-grow overflow-y-auto p-stack-lg space-y-stack-lg">

                <section class="space-y-2">
                  <h4 class="text-label-caps font-label-caps text-on-surface-variant uppercase">Customer</h4>
                  <div class="bg-surface-container rounded-xl p-4 flex justify-between items-center">
                    <div>
                      <p class="text-xl font-bold text-primary-container">House {{ admin.selectedJob.houseNumber ?? '—' }}</p>
                      <p class="text-body-md text-on-surface font-normal">{{ admin.selectedJob.customerName ?? 'John Kamau' }}</p>
                      <div class="flex items-center gap-2 mt-2 text-on-surface-variant">
                        <span class="material-symbols-outlined text-sm">chat</span>
                        <p class="text-body-sm text-sm">{{ admin.selectedJob.phone ?? '0712 345 678' }}</p>
                      </div>
                    </div>
                    <div class="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-600 hover:bg-green-500 hover:text-white transition-all cursor-pointer flex-shrink-0">
                      <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;">chat</span>
                    </div>
                  </div>
                </section>

                <section class="space-y-3">
                  <h4 class="text-label-caps font-label-caps text-on-surface-variant uppercase">Job Details</h4>
                  <div class="border border-outline-variant rounded-xl overflow-hidden">
                    <div class="bg-surface-container px-4 py-3 flex justify-between items-center border-b border-outline-variant">
                      <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-primary">description</span>
                        <span class="text-body-md font-medium truncate max-w-[180px]">
                          {{ admin.selectedJob.fileName ?? 'Custom instructions' }}
                        </span>
                      </div>
                      <button class="text-primary hover:scale-110 transition-transform flex-shrink-0">
                        <span class="material-symbols-outlined">download</span>
                      </button>
                    </div>
                    <div class="p-4 space-y-3">
                      <div v-for="row in selectedJobRows" :key="row.label" class="flex justify-between text-body-sm">
                        <span class="text-on-surface-variant">{{ row.label }}</span>
                        <span class="font-bold">{{ row.value }}</span>
                      </div>
                    </div>
                  </div>
                </section>

                <section class="space-y-2">
                  <h4 class="text-label-caps font-label-caps text-on-surface-variant uppercase">Payment Information</h4>
                  <div class="bg-surface-container rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p class="text-xl font-bold text-primary-container">KES {{ admin.selectedJob.cost?.toFixed(2) }}</p>
                      <div v-if="admin.selectedJob.mpesaRef" class="flex items-center gap-2 mt-1">
                        <span class="text-body-sm text-xs text-on-surface-variant">M-Pesa Ref:</span>
                        <span class="text-xs font-bold uppercase text-on-surface">{{ admin.selectedJob.mpesaRef }}</span>
                      </div>
                    </div>
                    <span :class="['px-4 py-1.5 rounded-full text-xs font-bold uppercase', paymentBadge(admin.selectedJob.paymentStatus).cls]">
                      {{ paymentBadge(admin.selectedJob.paymentStatus).label }}
                    </span>
                  </div>
                  <button
                    v-if="admin.selectedJob.paymentStatus === 'pay_on_pickup'"
                    @click="admin.markAsPaid(admin.selectedJob.id)"
                    class="w-full py-2 bg-green-600 text-white text-label-caps font-label-caps rounded-xl hover:bg-green-700 transition-colors"
                  >
                    ✓ Mark as paid (cash collected)
                  </button>
                </section>

                <section class="space-y-3">
                  <h4 class="text-label-caps font-label-caps text-on-surface-variant uppercase">Status Update</h4>
                  <div class="flex flex-wrap gap-2">
                    <button
                      v-for="(s, i) in statusOptions"
                      :key="s.val"
                      @click="admin.updateJobStatus(admin.selectedJob.id, s.val)"
                      :class="['px-4 py-2 rounded-full text-label-caps font-label-caps transition-all', pillClass(s.val, i)]"
                    >
                      {{ s.label }}
                    </button>
                  </div>
                </section>

                <section class="space-y-2">
                  <label class="text-label-caps font-label-caps text-on-surface-variant uppercase">Internal Notes</label>
                  <textarea
                    v-model="notes"
                    @blur="admin.saveNotes(admin.selectedJob.id, notes)"
                    class="w-full border border-outline-variant rounded-xl p-4 text-body-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all resize-none h-20"
                    placeholder="Add delivery instructions or quality notes…"
                  />
                </section>

              </div>

              <!-- Panel footer -->
              <footer class="p-stack-lg border-t border-outline-variant bg-surface-container-low flex flex-col items-center flex-shrink-0">
                <button
                  @click="admin.updateJobStatus(admin.selectedJob.id, nextStatus)"
                  class="text-white w-full py-3 rounded-xl font-bold mb-4 hover:opacity-90 active:scale-[0.98] transition-all"
                  style="background-color: #F97316;"
                >
                  Update order status
                </button>
                <button
                  @click="admin.cancelJob(admin.selectedJob.id)"
                  class="text-error text-xs font-bold uppercase tracking-widest hover:underline decoration-2 underline-offset-4"
                >
                  Cancel job
                </button>
              </footer>

            </div>
          </Transition>
        </div>
      </Transition>

    </div>
  </div>
</template>

<script setup lang="ts">
import type { Customer, JobStatus } from '~/types'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
  requiresAuth: true,
  role: 'admin',
})

const admin = useAdminStore()

const searchQuery  = ref('')
const lookupQuery  = ref('')
const lookupResult = ref<Customer | null>(null)
const notes        = ref('')

onMounted(() => admin.fetchQueue())

watch(() => admin.selectedJob, job => { notes.value = job?.adminNotes ?? '' })

const filteredJobs = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return admin.jobs
  return admin.jobs.filter(j =>
    j.houseNumber?.toLowerCase().includes(q) ||
    j.fileName?.toLowerCase().includes(q) ||
    j.instructions?.toLowerCase().includes(q) ||
    j.id?.toLowerCase().includes(q)
  )
})

const statCards = computed(() => [
  { label: 'Jobs today',    icon: 'summarize',   iconColor: 'text-primary',   value: admin.stats.jobsToday,         valueColor: 'text-primary',   sub: '↑ 12% from yesterday' },
  { label: 'Pending',       icon: 'timer',        iconColor: 'text-secondary', value: admin.stats.pending,           valueColor: 'text-secondary', sub: 'Requires attention' },
  { label: 'Completed',     icon: 'check_circle', iconColor: 'text-green-600', value: admin.stats.completed,         valueColor: 'text-green-600', sub: 'All delivered/picked up' },
  { label: 'Revenue today', icon: 'payments',     iconColor: 'text-primary',   value: `KES ${admin.stats.revenueToday}`, valueColor: 'text-primary', sub: 'Processed successfully' },
])

const tableHeaders = ['House', 'File / Instructions', 'Pages', 'Copies', 'Payment', 'Delivery', 'Status']

function paymentBadge(status: string): { cls: string; label: string } {
  const map: Record<string, { cls: string; label: string }> = {
    paid:          { cls: 'bg-green-100 text-green-800',   label: 'Paid' },
    unpaid:        { cls: 'bg-red-100 text-red-800',       label: 'Unpaid' },
    pay_on_pickup: { cls: 'bg-purple-100 text-purple-800', label: 'Pay on pickup' },
  }
  return map[status] ?? { cls: 'bg-gray-100 text-gray-800', label: status }
}

function deliveryBadge(type: string): { cls: string; label: string } {
  const map: Record<string, { cls: string; label: string }> = {
    delivery: { cls: 'bg-indigo-100 text-indigo-800', label: 'Delivery' },
    pickup:   { cls: 'bg-gray-100 text-gray-800',     label: 'Pickup' },
  }
  return map[type] ?? { cls: 'bg-gray-100 text-gray-800', label: type }
}

function statusBorderColor(status: string): string {
  const map: Record<string, string> = {
    printing:  'border-blue-500',
    pending:   'border-orange-500',
    ready:     'border-green-500',
    delivered: 'border-gray-200',
  }
  return map[status] ?? 'border-gray-200'
}

function statusTextColor(status: string): string {
  const map: Record<string, string> = {
    pending:   'text-orange-600',
    ready:     'text-green-600',
    delivered: 'text-gray-500',
  }
  return map[status] ?? 'text-on-surface'
}

function statusLabel(status: string): string {
  const map: Record<string, string> = { pending: 'Pending', printing: 'Printing', ready: 'Ready', delivered: 'Delivered' }
  return map[status] ?? status
}

function alertStyle(type: string) {
  const map: Record<string, { container: string; icon: string; symbol: string; title: string; sub: string }> = {
    unpaid:   { container: 'bg-red-50 border-red-500',     icon: 'text-red-600',    symbol: 'error',   title: 'text-red-900',  sub: 'text-red-700'  },
    wait:     { container: 'bg-orange-50 border-secondary', icon: 'text-secondary',  symbol: 'warning', title: 'text-secondary-container', sub: 'text-on-secondary-container' },
    delivery: { container: 'bg-blue-50 border-blue-500',   icon: 'text-blue-600',   symbol: 'info',    title: 'text-blue-900', sub: 'text-blue-700' },
  }
  return map[type] ?? { container: 'bg-gray-50 border-gray-300', icon: 'text-gray-500', symbol: 'info', title: 'text-on-surface', sub: 'text-on-surface-variant' }
}

function doLookup() {
  lookupResult.value = lookupQuery.value.trim() ? admin.lookupCustomer(lookupQuery.value) : null
}

const selectedJobRows = computed(() => {
  const j = admin.selectedJob
  if (!j) return []
  return [
    { label: 'File',     value: j.fileName ?? 'Custom instructions' },
    { label: 'Pages',    value: j.pages },
    { label: 'Copies',   value: j.copies },
    { label: 'Colour',   value: j.colorMode === 'bw' ? 'B&W' : 'Colour' },
    { label: 'Sides',    value: j.sides === 'single' ? 'Single' : 'Double' },
    { label: 'Delivery', value: j.deliveryType === 'pickup' ? 'Pickup' : 'Delivery' },
  ]
})

const statusOptions: Array<{ val: JobStatus; label: string }> = [
  { val: 'pending',   label: 'Pending'   },
  { val: 'printing',  label: 'Printing'  },
  { val: 'ready',     label: 'Ready'     },
  { val: 'delivered', label: 'Delivered' },
]

const statusOrder: JobStatus[] = ['pending', 'printing', 'ready', 'delivered']

function pillClass(val: string, i: number): string {
  const currentIdx = statusOrder.indexOf((admin.selectedJob?.status ?? 'pending') as JobStatus)
  if (i < currentIdx)   return 'bg-outline-variant text-on-surface-variant'
  if (i === currentIdx) return 'bg-secondary-container text-white shadow-md scale-105'
  return 'border-2 border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary'
}

function statusBadgeCls(status: string): string {
  const map: Record<string, string> = {
    pending:   'bg-orange-100 text-orange-700',
    printing:  'bg-blue-100 text-blue-700',
    ready:     'bg-green-100 text-green-700',
    delivered: 'bg-gray-100 text-gray-600',
  }
  return map[status] ?? 'bg-gray-100 text-gray-600'
}

const nextStatus = computed<JobStatus>(() => {
  const idx = statusOrder.indexOf((admin.selectedJob?.status ?? 'pending') as JobStatus)
  return statusOrder[Math.min(idx + 1, statusOrder.length - 1)] ?? 'pending'
})
</script>

<style scoped>
.overlay-enter-active, .overlay-leave-active { transition: opacity .25s ease; }
.overlay-enter-from, .overlay-leave-to       { opacity: 0; }

.slide-enter-active { animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.slide-leave-active { animation: slideIn 0.2s ease reverse; }
@keyframes slideIn {
  from { transform: translateX(100%); }
  to   { transform: translateX(0); }
}
</style>
