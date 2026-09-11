<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const {
  user,
  clear: clearSession
} = useUserSession()

const route = useRoute()

const identityLinkStatus = computed(() =>
  typeof route.query.identity === 'string'
    ? route.query.identity
    : undefined
)

async function signOut() {
  await clearSession()
  await navigateTo('/')
}
</script>

<template>
  <UContainer class="py-12">
    <div class="mx-auto max-w-3xl space-y-8">
      <div>
        <p class="text-sm font-medium text-muted">
          M2Oath Developer
        </p>

        <h1 class="mt-2 text-3xl font-semibold">
          Developer Dashboard
        </h1>

        <p class="mt-3 text-muted">
          Your authenticated Developer account and
          M2Oath account identity.
        </p>
      </div>

      <UAlert
        v-if="identityLinkStatus === 'linked'"
        color="success"
        title="Sign-in method linked"
        description="The additional authenticated identity is now linked to this Developer account."
      />

      <UAlert
        v-else-if="identityLinkStatus === 'link-failed'"
        color="error"
        title="Sign-in method could not be linked"
        description="The identity may already belong to another Developer account, or authentication may have failed."
      />

      <UCard>
        <template #header>
          <div>
            <h2 class="text-xl font-semibold">
              Developer Account
            </h2>

            <p class="mt-1 text-sm text-muted">
              Canonical M2Oath Developer identity
            </p>
          </div>
        </template>

        <dl class="space-y-5">
          <div>
            <dt class="text-sm text-muted">
              Developer ID
            </dt>

            <dd class="mt-1 font-mono break-all">
              {{ user?.developerId }}
            </dd>
          </div>

          <div>
            <dt class="text-sm text-muted">
              Role
            </dt>

            <dd class="mt-1">
              <UBadge>
                {{ user?.role }}
              </UBadge>
            </dd>
          </div>

          <div v-if="user?.name">
            <dt class="text-sm text-muted">
              Name
            </dt>

            <dd class="mt-1">
              {{ user.name }}
            </dd>
          </div>

          <div v-if="user?.email">
            <dt class="text-sm text-muted">
              Email
            </dt>

            <dd class="mt-1">
              {{ user.email }}
            </dd>
          </div>
        </dl>

        <template #footer>
          <div class="flex flex-wrap gap-3">
            <UButton to="/agents">
              My Agents
            </UButton>

            <UButton
              to="/agents/new"
              variant="outline"
            >
              Register an Agent
            </UButton>

            <a href="/auth/link">
              <UButton
                variant="outline"
              >
                Link another sign-in method
              </UButton>
            </a>

            <UButton
              variant="outline"
              @click="signOut"
            >
              Sign out
            </UButton>
          </div>
        </template>
      </UCard>

      <UCard v-if="user?.role === 'admin'">
        <template #header>
          <h2 class="text-lg font-semibold">
            Administration
          </h2>
        </template>

        <p class="text-muted">
          Administrative tools will appear here for
          M2Oath administrators.
        </p>
      </UCard>
    </div>
  </UContainer>
</template>
