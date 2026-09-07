<script setup lang="ts">
useSeoMeta({
  title: 'Agent'
})
</script>

<template>
  <UContainer class="py-12">
    <div class="max-w-3xl">
      <h1 class="text-3xl font-bold tracking-tight">
        Agent
      </h1>

      <p class="mt-4 text-muted">
        Observe and manage registered M2Oath agents.
      </p>

      <div class="mt-8">
        <UButton
          to="/agents"
          label="View Agents"
        />
      </div>
    </div>
  </UContainer>
</template>
