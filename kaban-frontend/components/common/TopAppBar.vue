<template>
  <nav class="fixed top-0 w-full z-50 flex justify-between items-center px-margin-mobile h-12 bg-primary-container">
    <div class="flex items-center gap-xs">
      <span class="material-symbols-outlined text-on-primary">print</span>
      <span class="font-headline-md text-headline-md font-bold text-on-primary">PrintEase</span>
    </div>
    <NuxtLink
      to="/auth"
      class="font-label-bold text-label-bold px-md py-sm rounded-lg active:scale-95 transition-transform"
      style="background-color: #F97316; color: #5c2400;"
    >
      Login
    </NuxtLink>
  </nav>
</template>
