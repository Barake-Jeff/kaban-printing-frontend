import { defineStore } from 'pinia'
import { ref } from 'vue'
import { JOBS, calculateCost } from '@/data/dummy.js'

export const useJobsStore = defineStore('jobs', () => {
  const jobs = ref([...JOBS])
  const loading = ref(false)
  const activeJob = ref(null)

  // ── Fetch jobs for current user ──────────────────────────────────────────────
  // Replace with: axios.get('/jobs/my') when NestJS is ready
  async function fetchMyJobs() {
    loading.value = true
    await delay(600)
    jobs.value = [...JOBS]
    loading.value = false
  }

  // ── Submit new print job ─────────────────────────────────────────────────────
  // Replace with: axios.post('/jobs', payload)
  async function submitJob(payload) {
    loading.value = true
    await delay(900)
    const { printCost, deliveryFee, total } = calculateCost(payload)
    const newJob = {
      id: `JOB-${1046 + jobs.value.length}`,
      userId: 'usr_001',
      paymentStatus: payload.paymentMethod === 'pay_on_pickup' ? 'pay_on_pickup' : 'unpaid',
      status: 'pending',
      cost: printCost,
      deliveryFee,
      total,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      mpesaRef: null,
      adminNotes: '',
      ...payload,
    }
    jobs.value.unshift(newJob)
    activeJob.value = newJob
    loading.value = false
    return newJob
  }

  // ── Simulate M-Pesa STK push ──────────────────────────────────────────────
  // Replace with: axios.post('/payments/mpesa/stk', { jobId, phone })
  async function initiateMpesa(jobId) {
    loading.value = true
    await delay(3000) // simulate STK push round-trip
    const job = jobs.value.find(j => j.id === jobId)
    if (job) {
      job.paymentStatus = 'paid'
      job.status = 'pending'
      job.mpesaRef = randomMpesaRef()
    }
    loading.value = false
    return { success: true }
  }

  function setActiveJob(job) { activeJob.value = job }

  return { jobs, loading, activeJob, fetchMyJobs, submitJob, initiateMpesa, setActiveJob }
})

function delay(ms) { return new Promise(r => setTimeout(r, ms)) }
function randomMpesaRef() {
  return 'Q' + Math.random().toString(36).toUpperCase().slice(2, 9)
}
