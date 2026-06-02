import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ALL_JOBS, ADMIN_STATS, ALERTS, CUSTOMERS } from '@/data/dummy.js'

export const useAdminStore = defineStore('admin', () => {
  const jobs = ref([...ALL_JOBS])
  const stats = ref({ ...ADMIN_STATS })
  const alerts = ref([...ALERTS])
  const customers = ref([...CUSTOMERS])
  const loading = ref(false)
  const selectedJob = ref(null)

  // Replace with: axios.get('/admin/jobs')
  async function fetchQueue() {
    loading.value = true
    await delay(600)
    jobs.value = [...ALL_JOBS]
    loading.value = false
  }

  // Replace with: axios.patch('/admin/jobs/:id/status', { status })
  async function updateJobStatus(jobId, status) {
    const job = jobs.value.find(j => j.id === jobId)
    if (job) {
      job.status = status
      job.updatedAt = new Date().toISOString()
    }
    if (selectedJob.value?.id === jobId) selectedJob.value.status = status
  }

  // Replace with: axios.patch('/admin/jobs/:id/payment')
  async function markAsPaid(jobId) {
    const job = jobs.value.find(j => j.id === jobId)
    if (job) {
      job.paymentStatus = 'paid'
      job.mpesaRef = null // cash payment
    }
    if (selectedJob.value?.id === jobId) selectedJob.value.paymentStatus = 'paid'
    alerts.value = alerts.value.filter(a => a.jobId !== jobId)
  }

  // Replace with: axios.patch('/admin/jobs/:id/notes', { notes })
  async function saveNotes(jobId, notes) {
    const job = jobs.value.find(j => j.id === jobId)
    if (job) job.adminNotes = notes
  }

  // Replace with: axios.delete('/admin/jobs/:id')
  async function cancelJob(jobId) {
    jobs.value = jobs.value.filter(j => j.id !== jobId)
    if (selectedJob.value?.id === jobId) selectedJob.value = null
  }

  function selectJob(job) { selectedJob.value = job }
  function clearSelectedJob() { selectedJob.value = null }

  function lookupCustomer(houseNumber) {
    return customers.value.find(
      c => c.houseNumber.toLowerCase() === houseNumber.trim().toLowerCase()
    ) ?? null
  }

  return {
    jobs, stats, alerts, customers, loading, selectedJob,
    fetchQueue, updateJobStatus, markAsPaid, saveNotes, cancelJob,
    selectJob, clearSelectedJob, lookupCustomer,
  }
})

function delay(ms) { return new Promise(r => setTimeout(r, ms)) }
