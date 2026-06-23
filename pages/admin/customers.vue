<template>
  <div class="p-6">
    <h1 class="text-xl font-bold text-navy mb-2">Customers</h1>
    <p class="text-sm text-gray-400">Customer management coming soon.</p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'auth',
  requiresAuth: true,
  role: 'admin',
})
</script>
