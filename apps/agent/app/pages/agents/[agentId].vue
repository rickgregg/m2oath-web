<script setup lang="ts">
import type {
  AgentSummary
} from '@m2oath/control-plane-client'

const route = useRoute()

const requestedAgentId = computed(
  () => String(route.params.agentId ?? '')
)

useSeoMeta({
  title: () => requestedAgentId.value
    ? `Agent ${requestedAgentId.value}`
    : 'Agent'
})

const {
  data: agent,
  status,
  error,
  refresh
} = await useFetch<AgentSummary>(
  () => `/api/agents/${encodeURIComponent(requestedAgentId.value)}`
)
</script>

<template>
  <UContainer class="py-12">
    <div class="max-w-4xl">
      <p class="text-sm text-muted">
        Agent
      </p>

      <h1 class="mt-2 text-3xl font-bold tracking-tight">
        {{ agent?.displayName || requestedAgentId }}
      </h1>

      <div
        v-if="status === 'pending'"
        class="mt-8"
      >
        <p class="text-muted">
          Resolving authoritative agent identity...
        </p>
      </div>

      <UAlert
        v-else-if="error"
        class="mt-8"
        color="error"
        title="Agent not found"
        description="The Agent ID in the URL could not be resolved to an authoritative agent record."
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

      <UCard
        v-else-if="agent"
        class="mt-8"
      >
        <template #header>
          <div>
            <p class="font-semibold">
              Authoritative Agent Identity
            </p>

            <p class="mt-1 text-sm text-muted">
              This record was resolved through the shared M2Oath control plane.
            </p>
          </div>
        </template>

        <dl class="space-y-4">
          <div>
            <dt class="text-sm text-muted">
              Canonical Agent ID
            </dt>

            <dd class="mt-1 font-mono">
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

      <UAlert
        v-if="agent"
        class="mt-8"
        title="Identity boundary verified"
        description="The URL Agent ID was treated only as input. The displayed canonical identity came from the authoritative control-plane record."
        icon="i-lucide-shield-check"
      />
    </div>
  </UContainer>
</template>
