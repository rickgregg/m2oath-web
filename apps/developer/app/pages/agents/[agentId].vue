<script setup lang="ts">
import type {
  AgentSummary
} from '@m2oath/control-plane-client'

const route = useRoute()

const agentId = computed(
  () => String(route.params.agentId)
)

useSeoMeta({
  title: 'Agent'
})

const {
  loggedIn
} = useUserSession()

const {
  data: agent,
  status,
  error
} = await useFetch<AgentSummary>(
  () =>
    `/api/agents/${encodeURIComponent(agentId.value)}`,
  {
    watch: [
      agentId
    ]
  }
)
</script>

<template>
  <UContainer class="py-12">
    <div class="max-w-3xl">
      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold tracking-tight">
            Agent
          </h1>

          <p class="mt-4 text-muted">
            Canonical Agent state read from the authoritative
            M2Oath control plane.
          </p>
        </div>

        <UButton
          to="/agents/new"
          variant="outline"
        >
          Register another Agent
        </UButton>
      </div>

      <UAlert
        v-if="!loggedIn"
        class="mt-8"
        color="warning"
        title="Developer authentication required"
        description="Sign in before viewing Agent state."
        icon="i-lucide-log-in"
      />

      <UCard
        v-else-if="status === 'pending'"
        class="mt-8"
      >
        Loading Agent…
      </UCard>

      <UAlert
        v-else-if="error"
        class="mt-8"
        color="error"
        title="Agent could not be loaded"
        description="The Agent could not be read from the M2Oath control plane."
        icon="i-lucide-circle-alert"
      />

      <UCard
        v-else-if="agent"
        class="mt-8"
      >
        <template #header>
          <div>
            <p class="font-semibold">
              {{ agent.displayName || 'M2Oath Agent' }}
            </p>

            <p class="mt-1 text-sm text-muted">
              Authoritative canonical Agent identity
            </p>
          </div>
        </template>

        <dl class="space-y-4">
          <div>
            <dt class="text-sm text-muted">
              Agent ID
            </dt>

            <dd class="mt-1 font-mono break-all">
              {{ agent.agentId }}
            </dd>
          </div>

          <div v-if="agent.displayName">
            <dt class="text-sm text-muted">
              Display name
            </dt>

            <dd class="mt-1">
              {{ agent.displayName }}
            </dd>
          </div>

          <div>
            <dt class="text-sm text-muted">
              Status
            </dt>

            <dd class="mt-1">
              {{ agent.status }}
            </dd>
          </div>
        </dl>
      </UCard>
    </div>
  </UContainer>
</template>
