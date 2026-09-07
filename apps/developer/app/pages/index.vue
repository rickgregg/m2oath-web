<script setup lang="ts">
useSeoMeta({
  title: 'Developer'
})
</script>

<template>
  <UContainer class="py-12">
    <div class="max-w-3xl">
      <h1 class="text-3xl font-bold tracking-tight">
        Developer
      </h1>

      <p class="mt-4 text-muted">
        Build and register agents with M2Oath.
      </p>

      <div class="mt-8">
        <UButton
          to="/agents/new"
          label="Register an Agent"
        />
      </div>
    </div>
  </UContainer>
</template>
