import { defineStore } from 'pinia'
import { ref } from 'vue'
import { JOBS, calculateCost } from '@/data/dummy'
import type { Job, SubmitJobPayload } from '~/types'

export const useJobsStore = defineStore('jobs', () => {
  const jobs = ref<Job[]>([...JOBS])
  const loading = ref(false)
  const activeJob = ref<Job | null>(null)

  // Replace with: axios.get('/jobs/my') when NestJS is ready
  async function fetchMyJobs() {
    loading.value = true
    await delay(600)
    jobs.value = [...JOBS]
    loading.value = false
  }

  // Replace with: axios.post('/jobs', payload)
  async function submitJob(payload: SubmitJobPayload): Promise<Job> {
    loading.value = true
    await delay(900)
    const { printCost, deliveryFee, total } = calculateCost(payload)
    const newJob = {
      id: `JOB-${1046 + jobs.value.length}`,
      userId: 'usr_001',
      fileType: null,
      paymentMethod: payload.paymentMethod ?? 'mpesa',
      paymentStatus: payload.paymentMethod === 'pay_on_pickup' ? 'pay_on_pickup' : 'unpaid',
      status: 'pending',
      cost: printCost,
      deliveryFee,
      total,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      mpesaRef: null,
      adminNotes: '',
      notifySms: true,
      notifyWhatsapp: false,
      ...payload,
    } as Job
    jobs.value.unshift(newJob)
    activeJob.value = newJob
    loading.value = false
    return newJob
  }

  // Replace with: axios.post('/payments/mpesa/stk', { jobId, phone })
  async function initiateMpesa(jobId: string | undefined): Promise<{ success: boolean }> {
    loading.value = true
    await delay(3000)
    const job = jobs.value.find(j => j.id === jobId)
    if (job) {
      job.paymentStatus = 'paid'
      job.status = 'pending'
      job.mpesaRef = randomMpesaRef()
    }
    loading.value = false
    return { success: true }
  }

  function setActiveJob(job: Job) { activeJob.value = job }

  return { jobs, loading, activeJob, fetchMyJobs, submitJob, initiateMpesa, setActiveJob }
})

function delay(ms: number): Promise<void> { return new Promise(r => setTimeout(r, ms)) }

function randomMpesaRef(): string {
  return 'Q' + Math.random().toString(36).toUpperCase().slice(2, 9)
}
