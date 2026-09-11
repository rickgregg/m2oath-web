<script setup lang="ts">
import type {
  RegisterAgentResponse
} from '@m2oath/control-plane-client'

definePageMeta({
  middleware: 'auth'
})

useSeoMeta({
  title: 'Register Agent'
})

const {
  user,
  clear: clearSession
} = useUserSession()

const displayName = ref('')

const identifierType
  = ref('runtime-jwt')

const identifierValue
  = ref('')

const identifierIssuer
  = ref('')

const keyId
  = ref('')

const algorithm
  = ref('')

const publicKey
  = ref('')

const registering
  = ref(false)

const registration
  = ref<RegisterAgentResponse | null>(null)

const errorMessage
  = ref<string | null>(null)

async function registerAgent() {
  registering.value = true
  registration.value = null
  errorMessage.value = null

  const trimmedIdentifierType
    = identifierType.value.trim()

  const trimmedIdentifierValue
    = identifierValue.value.trim()

  if (
    !trimmedIdentifierType
    || !trimmedIdentifierValue
  ) {
    errorMessage.value
      = 'Identifier type and identifier value are required.'

    registering.value = false
    return
  }

  const trimmedKeyId
    = keyId.value.trim()

  const trimmedAlgorithm
    = algorithm.value.trim()

  const trimmedPublicKey
    = publicKey.value.trim()

  const hasAnyCryptographicMaterial
    = Boolean(
      trimmedKeyId
      || trimmedAlgorithm
      || trimmedPublicKey
    )

  const hasCompleteCryptographicMaterial
    = Boolean(
      trimmedKeyId
      && trimmedAlgorithm
      && trimmedPublicKey
    )

  if (
    hasAnyCryptographicMaterial
    && !hasCompleteCryptographicMaterial
  ) {
    errorMessage.value
      = 'If cryptographic material is provided, key ID, algorithm, and public key are all required.'

    registering.value = false
    return
  }

  try {
    registration.value
      = await $fetch<RegisterAgentResponse>(
        '/api/agents/register',
        {
          method: 'POST',

          body: {
            displayName:
              displayName.value,

            identifier: {
              type:
                trimmedIdentifierType,

              value:
                trimmedIdentifierValue,

              issuer:
                identifierIssuer.value.trim()
            },

            ...(hasCompleteCryptographicMaterial
              ? {
                  cryptographicMaterial: {
                    keyId:
                      trimmedKeyId,

                    algorithm:
                      trimmedAlgorithm,

                    publicKey:
                      trimmedPublicKey
                  }
                }
              : {})
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
        The canonical Agent ID is issued by M2Oath.
      </p>

      <UAlert
        class="mt-6"
        color="success"
        title="Developer authenticated"
        icon="i-lucide-shield-check"
      >
        <template #description>
          <div class="space-y-2">
            <p>
              {{ user?.name || user?.email || user?.subject }}
            </p>

            <UButton
              variant="ghost"
              size="sm"
              @click="clearSession"
            >
              Sign out
            </UButton>
          </div>
        </template>
      </UAlert>

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

          <div>
            <h2 class="text-lg font-semibold">
              External identity
            </h2>

            <p class="mt-1 text-sm text-muted">
              These values identify the external runtime identity that
              will be bound to the canonical M2Oath Agent ID.
            </p>
          </div>

          <UFormField
            label="Identifier type"
            description="The kind of external identity presented by the agent."
            required
          >
            <UInput
              v-model="identifierType"
              class="w-full"
              placeholder="runtime-jwt"
              :disabled="registering"
            />
          </UFormField>

          <UFormField
            label="Identifier value"
            description="The external identity value that uniquely identifies this agent."
            required
          >
            <UInput
              v-model="identifierValue"
              class="w-full"
              placeholder="weather-agent-runtime"
              :disabled="registering"
            />
          </UFormField>

          <UFormField
            label="Issuer"
            description="Optional issuer associated with this external identity."
          >
            <UInput
              v-model="identifierIssuer"
              class="w-full"
              placeholder="https://issuer.example"
              :disabled="registering"
            />
          </UFormField>

          <div>
            <h2 class="text-lg font-semibold">
              Cryptographic binding
            </h2>

            <p class="mt-1 text-sm text-muted">
              Optional public cryptographic material can be bound to the
              new canonical identity during enrollment.
            </p>
          </div>

          <UFormField
            label="Key ID"
          >
            <UInput
              v-model="keyId"
              class="w-full"
              placeholder="weather-key-1"
              :disabled="registering"
            />
          </UFormField>

          <UFormField
            label="Algorithm"
          >
            <UInput
              v-model="algorithm"
              class="w-full"
              placeholder="RS256"
              :disabled="registering"
            />
          </UFormField>

          <UFormField
            label="Public key"
            description="Public key material only. Never enter a private key."
          >
            <UTextarea
              v-model="publicKey"
              class="w-full"
              :rows="6"
              placeholder="-----BEGIN PUBLIC KEY-----"
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
              The canonical Agent ID below was issued by the
              authoritative M2Oath identity stack.
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

        <template #footer>
          <UButton
            :to="`/agents/${encodeURIComponent(registration.agent.agentId)}`"
          >
            View Agent
          </UButton>
        </template>
      </UCard>
    </div>
  </UContainer>
</template>
