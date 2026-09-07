<script setup lang="ts">
useSeoMeta({
  title: 'Agents'
})
</script>

<template>
  <UContainer class="py-12">
    <div class="max-w-4xl">
      <h1 class="text-3xl font-bold tracking-tight">
        Agents
      </h1>

      <p class="mt-4 text-muted">
        Registered agents will appear here once the shared control-plane API
        is connected.
      </p>

      <UAlert
        class="mt-8"
        title="No agent data connected"
        description="This route is present, but authoritative agent data has not been wired in yet."
        icon="i-lucide-info"
      />
    </div>
  </UContainer>
</template>
