<script setup lang="ts">
import type {
  RegisterAgentResponse
} from '@m2oath/control-plane-client'

useSeoMeta({
  title: 'Register Agent'
})

const displayName = ref('')
const registering = ref(false)
const registration = ref<RegisterAgentResponse | null>(null)
const errorMessage = ref<string | null>(null)

async function registerAgent() {
  registering.value = true
  registration.value = null
  errorMessage.value = null

  try {
    registration.value = await $fetch<RegisterAgentResponse>(
      '/api/agents/register',
      {
        method: 'POST',
        body: {
          displayName: displayName.value
        }
      }
    )
  } catch {
    errorMessage.value
      = 'The agent could not be registered through the M2Oath control plane.'
  } finally {
    registering.value = false
  }
}
</script>

<template>
  <UContainer class="py-12">
    <div class="max-w-3xl">
      <h1 class="text-3xl font-bold tracking-tight">
        Register Agent
      </h1>

      <p class="mt-4 text-muted">
        Register a new agent through the authoritative M2Oath control plane.
        The canonical Agent ID is issued by the server.
      </p>

      <UCard class="mt-8">
        <form
          class="space-y-6"
          @submit.prevent="registerAgent"
        >
          <UFormField
            label="Display name"
            description="An optional human-readable name for this agent."
          >
            <UInput
              v-model="displayName"
              class="w-full"
              placeholder="Weather Agent"
              :disabled="registering"
            />
          </UFormField>

          <UButton
            type="submit"
            :loading="registering"
            :disabled="registering"
          >
            Register Agent
          </UButton>
        </form>
      </UCard>

      <UAlert
        v-if="errorMessage"
        class="mt-8"
        color="error"
        title="Registration failed"
        :description="errorMessage"
        icon="i-lucide-circle-alert"
      />

      <UCard
        v-if="registration"
        class="mt-8"
      >
        <template #header>
          <div>
            <p class="font-semibold">
              Agent registered
            </p>

            <p class="mt-1 text-sm text-muted">
              The canonical Agent ID below was issued by the M2Oath
              control plane.
            </p>
          </div>
        </template>

        <dl class="space-y-4">
          <div>
            <dt class="text-sm text-muted">
              Agent ID
            </dt>

            <dd class="mt-1 font-mono">
              {{ registration.agent.agentId }}
            </dd>
          </div>

          <div v-if="registration.agent.displayName">
            <dt class="text-sm text-muted">
              Display name
            </dt>

            <dd class="mt-1">
              {{ registration.agent.displayName }}
            </dd>
          </div>

          <div>
            <dt class="text-sm text-muted">
              Status
            </dt>

            <dd class="mt-1">
              {{ registration.agent.status }}
            </dd>
          </div>
        </dl>
      </UCard>
    </div>
  </UContainer>
</template>
