<script setup lang="ts">
const {
  loggedIn,
  user
} = useUserSession()

useSeoMeta({
  title: 'M2Oath Developer'
})
</script>

<template>
  <UContainer class="py-12">
    <div class="max-w-3xl space-y-8">
      <div>
        <p class="text-sm font-medium text-muted">
          M2Oath Developer
        </p>

        <h1 class="mt-2 text-3xl font-bold tracking-tight">
          Build trusted AI agents with M2Oath.
        </h1>

        <p class="mt-4 text-muted">
          Create a Developer account, register Agents,
          and manage their identity and trust lifecycle.
        </p>
      </div>

      <UCard v-if="loggedIn">
        <template #header>
          <div>
            <h2 class="text-xl font-semibold">
              Welcome back
            </h2>

            <p class="mt-1 text-sm text-muted">
              Your M2Oath Developer account is active.
            </p>
          </div>
        </template>

        <div class="space-y-4">
          <div v-if="user?.developerId">
            <p class="text-sm text-muted">
              Developer ID
            </p>

            <p class="mt-1 font-mono break-all">
              {{ user.developerId }}
            </p>
          </div>

          <div v-if="user?.role">
            <p class="text-sm text-muted">
              Role
            </p>

            <UBadge class="mt-1">
              {{ user.role }}
            </UBadge>
          </div>
        </div>

        <template #footer>
          <UButton to="/dashboard">
            Open Developer Dashboard
          </UButton>
        </template>
      </UCard>

      <UCard v-else>
        <template #header>
          <div>
            <h2 class="text-xl font-semibold">
              Developer Account
            </h2>

            <p class="mt-1 text-sm text-muted">
              Sign in or create your M2Oath Developer account.
            </p>
          </div>
        </template>

        <div class="flex flex-wrap gap-3">
          <a href="/auth/auth0">
            <UButton>
              Sign In
            </UButton>
          </a>

          <a href="/auth/auth0">
            <UButton variant="outline">
              Create Developer Account
            </UButton>
          </a>
        </div>
      </UCard>
    </div>
  </UContainer>
</template>
