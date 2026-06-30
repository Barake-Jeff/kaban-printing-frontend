import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Job, SubmitJobPayload } from '~/types'

export const useJobsStore = defineStore('jobs', () => {
  const jobs      = ref<Job[]>([])
  const loading   = ref(false)
  const activeJob = ref<Job | null>(null)
  const error     = ref<string | null>(null)

  const activeJobs = computed(() =>
    jobs.value.filter(j => ['pending', 'printing', 'ready'].includes(j.status))
  )

  const jobsThisMonth = computed(() => {
    const now = new Date()
    return jobs.value.filter(j => {
      const d = new Date(j.createdAt)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }).length
  })

  const totalSpent = computed(() =>
    jobs.value.reduce((sum, j) => sum + (j.paymentStatus === 'paid' ? (j.cost + j.deliveryFee) : 0), 0)
  )

  async function fetchMyJobs() {
    loading.value = true
    error.value   = null
    try {
      const api = useApi()
      const res = await api<any>('/jobs/my-jobs', { params: { page: 1, size: 50 } })
      jobs.value = res.data?.jobs ?? []
    } catch (e: any) {
      error.value = e?.data?.message ?? 'Failed to load jobs'
    } finally {
      loading.value = false
    }
  }

  async function fetchPage(page: number, size = 10): Promise<Job[]> {
    const api = useApi()
    const res = await api<any>('/jobs/my-jobs', { params: { page, size } })
    return res.data?.jobs ?? []
  }

  async function submitJob(payload: SubmitJobPayload): Promise<Job> {
    loading.value = true
    error.value   = null
    try {
      const api = useApi()
      const body: Record<string, any> = {
        pages:        payload.pages,
        copies:       payload.copies,
        colorMode:    payload.colorMode,
        sides:        payload.sides,
        paperSize:    payload.paperSize ?? 'A4',
        deliveryType: payload.deliveryType,
        paymentMethod: payload.paymentMethod ?? 'mpesa',
      }
      if (payload.fileId) {
        body.fileId = payload.fileId
      } else if ((payload as any).instructions?.trim()) {
        body.instructions = (payload as any).instructions
      }
      if (payload.fileName) body.fileName = payload.fileName

      const res = await api<any>('/jobs', { method: 'POST', body })
      const job = res.data as Job
      jobs.value.unshift(job)
      activeJob.value = job
      return job
    } finally {
      loading.value = false
    }
  }

  async function initiateMpesa(jobId: string | undefined): Promise<{ success: boolean }> {
    if (!jobId) return { success: false }
    loading.value = true
    error.value   = null
    try {
      const auth = useAuthStore()
      const api  = useApi()

      await api('/payments/mpesa/initiate', {
        method: 'POST',
        body:   { jobId, phone: auth.user?.phone },
      })

      // Poll for payment confirmation (backend auto-confirms in ~5s for stub)
      const MAX_POLLS = 30
      for (let i = 0; i < MAX_POLLS; i++) {
        await delay(2000)
        const statusRes = await api<any>(`/payments/status/${jobId}`)
        const payStatus = statusRes.data?.paymentStatus

        if (payStatus === 'paid') {
          // Refresh the job
          const jobRes = await api<any>(`/jobs/${jobId}`)
          const updated = jobRes.data as Job
          const idx = jobs.value.findIndex(j => j.id === jobId)
          if (idx >= 0) jobs.value[idx] = updated
          if (activeJob.value?.id === jobId) activeJob.value = updated
          return { success: true }
        }
        if (payStatus === 'failed') return { success: false }
      }
      return { success: false }
    } catch (e: any) {
      error.value = e?.data?.message ?? 'Payment failed'
      return { success: false }
    } finally {
      loading.value = false
    }
  }

  function setActiveJob(job: Job) { activeJob.value = job }

  return {
    jobs, loading, activeJob, error,
    activeJobs, jobsThisMonth, totalSpent,
    fetchMyJobs, fetchPage, submitJob, initiateMpesa, setActiveJob,
  }
})

function delay(ms: number): Promise<void> { return new Promise(r => setTimeout(r, ms)) }
