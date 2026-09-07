<script setup lang="ts">
const route = useRoute()

const agentId = computed(() => String(route.params.agentId ?? ''))

useSeoMeta({
  title: () => agentId.value ? `Agent ${agentId.value}` : 'Agent'
})
</script>

<template>
  <UContainer class="py-12">
    <div class="max-w-4xl">
      <p class="text-sm text-muted">
        Agent
      </p>

      <h1 class="mt-2 text-3xl font-bold tracking-tight">
        {{ agentId }}
      </h1>

      <UAlert
        class="mt-8"
        title="Unverified route identifier"
        description="The Agent ID in this URL is input only. Authoritative agent identity will be resolved by the M2Oath control-plane API."
        icon="i-lucide-shield"
      />
    </div>
  </UContainer>
</template>
