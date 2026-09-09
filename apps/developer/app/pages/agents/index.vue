<script setup lang="ts">
import type {
  AgentSummary
} from '@m2oath/control-plane-client'

useSeoMeta({
  title: 'My Agents'
})

const {
  loggedIn
} = useUserSession()

const {
  data: agents,
  status,
  error,
  refresh
} = await useFetch<AgentSummary[]>(
  '/api/agents',
  {
    default: () => []
  }
)
</script>

<template>
  <UContainer class="py-12">
    <div class="max-w-4xl">
      <div
        class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 class="text-3xl font-bold tracking-tight">
            My Agents
          </h1>

          <p class="mt-4 text-muted">
            Agents owned by your M2Oath Developer Account.
          </p>
        </div>

        <UButton
          to="/agents/new"
          icon="i-lucide-plus"
        >
          Register Agent
        </UButton>
      </div>

      <UAlert
        v-if="!loggedIn"
        class="mt-8"
        color="warning"
        title="Developer authentication required"
        description="Sign in before viewing your Agents."
        icon="i-lucide-log-in"
      />

      <UCard
        v-else-if="status === 'pending'"
        class="mt-8"
      >
        Loading your Agents…
      </UCard>

      <UAlert
        v-else-if="error"
        class="mt-8"
        color="error"
        title="Agents could not be loaded"
        description="Your Agent ownership information could not be read from the M2Oath control plane."
        icon="i-lucide-circle-alert"
      >
        <template #actions>
          <UButton
            variant="outline"
            @click="refresh()"
          >
            Try again
          </UButton>
        </template>
      </UAlert>

      <UCard
        v-else-if="agents.length === 0"
        class="mt-8"
      >
        <div class="py-6 text-center">
          <UIcon
            name="i-lucide-bot"
            class="mx-auto size-10 text-muted"
          />

          <h2 class="mt-4 text-lg font-semibold">
            No Agents yet
          </h2>

          <p class="mt-2 text-sm text-muted">
            Register your first Agent to begin building its
            M2Oath identity and trust history.
          </p>

          <UButton
            class="mt-6"
            to="/agents/new"
            icon="i-lucide-plus"
          >
            Register your first Agent
          </UButton>
        </div>
      </UCard>

      <div
        v-else
        class="mt-8 space-y-4"
      >
        <UCard
          v-for="agent in agents"
          :key="agent.agentId"
        >
          <div
            class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div class="min-w-0">
              <div class="flex items-center gap-3">
                <UIcon
                  name="i-lucide-bot"
                  class="size-5 shrink-0"
                />

                <h2 class="font-semibold">
                  {{ agent.displayName || 'M2Oath Agent' }}
                </h2>
              </div>

              <p
                class="mt-2 break-all font-mono text-sm text-muted"
              >
                {{ agent.agentId }}
              </p>

              <p class="mt-2 text-sm">
                Status:
                <span class="font-medium">
                  {{ agent.status }}
                </span>
              </p>
            </div>

            <UButton
              :to="`/agents/${encodeURIComponent(agent.agentId)}`"
              variant="outline"
              icon="i-lucide-arrow-right"
              trailing
            >
              View Agent
            </UButton>
          </div>
        </UCard>
      </div>
    </div>
  </UContainer>
</template>
