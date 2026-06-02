<template>
  <span :class="['badge', badgeClass]">{{ label }}</span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: { type: String, required: true },
  type: { type: String, default: 'job' }, // 'job' | 'payment' | 'delivery'
})

const CONFIG = {
  job:      { pending: ['badge-pending','Pending'], printing: ['badge-printing','Printing'], ready: ['badge-ready','Ready'], delivered: ['badge-delivered','Delivered'] },
  payment:  { paid: ['badge-paid','Paid'], unpaid: ['badge-unpaid','Unpaid'], pay_on_pickup: ['badge-pickup-pay','Pay on pickup'] },
  delivery: { pickup: ['badge-pickup','Pickup'], delivery: ['badge-delivery','Delivery'] },
}

const badgeClass = computed(() => CONFIG[props.type]?.[props.status]?.[0] ?? 'badge-delivered')
const label      = computed(() => CONFIG[props.type]?.[props.status]?.[1] ?? props.status)
</script>
