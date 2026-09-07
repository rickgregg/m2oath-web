<script setup lang="ts">
import type {
  AgentSummary
} from '@m2oath/control-plane-client'

useSeoMeta({
  title: 'Agents'
})

const {
  data: agents,
  status,
  error,
  refresh
} = await useFetch<AgentSummary[]>('/api/agents', {
  default: () => []
})
</script>

<template>
  <UContainer class="py-12">
    <div class="max-w-4xl">
      <h1 class="text-3xl font-bold tracking-tight">
        Agents
      </h1>

      <p class="mt-4 text-muted">
        Agents registered through the M2Oath control plane.
      </p>

      <div
        v-if="status === 'pending'"
        class="mt-8"
      >
        <p class="text-muted">
          Loading agents...
        </p>
      </div>

      <UAlert
        v-else-if="error"
        class="mt-8"
        color="error"
        title="Unable to load agents"
        description="The Agent application could not retrieve authoritative agent data from the M2Oath control plane."
        icon="i-lucide-circle-alert"
      >
        <template #actions>
          <UButton
            size="sm"
            variant="soft"
            @click="refresh()"
          >
            Retry
          </UButton>
        </template>
      </UAlert>

      <UAlert
        v-else-if="agents.length === 0"
        class="mt-8"
        title="No registered agents"
        description="Register an agent through the M2Oath Developer application first."
        icon="i-lucide-info"
      />

      <div
        v-else
        class="mt-8 space-y-4"
      >
        <UCard
          v-for="agent in agents"
          :key="agent.agentId"
        >
          <div class="flex items-center justify-between gap-6">
            <div>
              <p class="font-semibold">
                {{ agent.displayName || agent.agentId }}
              </p>

              <p class="mt-1 font-mono text-sm text-muted">
                {{ agent.agentId }}
              </p>

              <p class="mt-2 text-sm text-muted">
                Status: {{ agent.status }}
              </p>
            </div>

            <UButton
              :to="`/agents/${encodeURIComponent(agent.agentId)}`"
              variant="soft"
            >
              View Agent
            </UButton>
          </div>
        </UCard>
      </div>
    </div>
  </UContainer>
</template>
