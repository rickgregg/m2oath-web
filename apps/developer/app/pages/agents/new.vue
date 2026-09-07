<script setup lang="ts">
useSeoMeta({
  title: 'Register Agent'
})
</script>

<template>
  <UContainer class="py-12">
    <div class="max-w-3xl">
      <h1 class="text-3xl font-bold tracking-tight">
        Register Agent
      </h1>

      <p class="mt-4 text-muted">
        Agent registration will be implemented through the authoritative
        M2Oath control-plane API.
      </p>

      <UAlert
        class="mt-8"
        title="Registration scaffold"
        description="This page does not issue an Agent ID yet."
        icon="i-lucide-info"
      />
    </div>
  </UContainer>
</template>
