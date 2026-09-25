<script setup lang="ts">
import type {
  TrustPolicyWorkbenchResult,
  TrustSimulationScenarioId
} from '@m2oath/control-plane-client'

definePageMeta({
  middleware: 'auth'
})

useSeoMeta({
  title: 'Trust Policy Workbench'
})

interface ScenarioOption {
  label: string
  value: TrustSimulationScenarioId
  description: string
}

const scenarios: ScenarioOption[] = [
  {
    label: 'Normal trust growth',
    value: 'normal-trust-growth',
    description:
      'Observe trust accumulating through normal evidence over time.'
  },
  {
    label: 'Repetition farming',
    value: 'repetition-farming',
    description:
      'Exercise protections against repeated evidence used to farm trust.'
  },
  {
    label: 'Failure laundering',
    value: 'failure-laundering',
    description:
      'Observe how prior failures affect subsequent trust evaluation.'
  },
  {
    label: 'Cold start',
    value: 'cold-start',
    description:
      'Evaluate an Agent with little or no accumulated trust history.'
  },
  {
    label: 'Fake diversity',
    value: 'fake-diversity',
    description:
      'Exercise protections against artificial evidence diversity.'
  },
  {
    label: 'Cross-operation farming',
    value: 'cross-operation-farming',
    description:
      'Observe whether trust accumulated through one operation transfers improperly to another.'
  },
  {
    label: 'Authority concentration',
    value: 'authority-concentration',
    description:
      'Exercise diminishing returns for overly concentrated evidence authority.'
  },
  {
    label: 'Stale reputation',
    value: 'stale-reputation',
    description:
      'Observe the effect of evidence age and decay on accumulated trust.'
  },
  {
    label: 'Replay attack',
    value: 'replay-attack',
    description:
      'Exercise protections against replayed trust evidence.'
  },
  {
    label: 'Combined farming attack',
    value: 'combined-farming-attack',
    description:
      'Exercise multiple trust-farming strategies together.'
  },
  {
    label: 'Trusted Domain composition',
    value: 'trusted-domain-composition',
    description:
      'Observe horizontal Agent trust composed with Trusted Domain evidence.'
  }
]

const selectedScenario =
  ref<TrustSimulationScenarioId>(
    'normal-trust-growth'
  )

const running =
  ref(false)

const result =
  ref<TrustPolicyWorkbenchResult | null>(
    null
  )

const errorMessage =
  ref<string | null>(
    null
  )

const selectedScenarioDescription =
  computed(
    () =>
      scenarios.find(
        scenario =>
          scenario.value
          === selectedScenario.value
      )?.description
  )

async function runSimulation() {
  running.value = true
  result.value = null
  errorMessage.value = null

  try {
    result.value =
      await $fetch<TrustPolicyWorkbenchResult>(
        '/api/trust-simulations',
        {
          method: 'POST',

          body: {
            scenarioId:
              selectedScenario.value
          }
        }
      )
  } catch {
    errorMessage.value =
      'The trust simulation could not be completed through the M2Oath control plane.'
  } finally {
    running.value = false
  }
}
</script>

<template>
  <UContainer class="py-12">
    <div class="mx-auto max-w-6xl space-y-8">
      <div>
        <p class="text-sm font-medium text-muted">
          M2Oath Developer
        </p>

        <h1 class="mt-2 text-3xl font-bold tracking-tight">
          Trust Policy Workbench
        </h1>

        <p class="mt-4 max-w-3xl text-muted">
          Run deterministic trust scenarios against the
          authoritative M2Oath Trust simulation service and inspect
          how accumulated evidence contributes to policy decisions.
        </p>
      </div>

      <UAlert
        color="neutral"
        variant="subtle"
        icon="i-lucide-shield-check"
        title="Authoritative simulation"
        description="Trust scores, evidence diagnostics, and policy decisions shown here are returned by M2Oath Trust. The Developer portal does not recalculate trust."
      />

      <UCard>
        <template #header>
          <div>
            <h2 class="text-xl font-semibold">
              Scenario
            </h2>

            <p class="mt-1 text-sm text-muted">
              Select a trust behavior to simulate.
            </p>
          </div>
        </template>

        <div class="space-y-5">
          <UFormField
            label="Trust scenario"
            :description="selectedScenarioDescription"
          >
            <USelect
              v-model="selectedScenario"
              class="w-full"
              :items="scenarios"
              label-key="label"
              value-key="value"
              :disabled="running"
            />
          </UFormField>

          <UButton
            icon="i-lucide-play"
            :loading="running"
            :disabled="running"
            @click="runSimulation"
          >
            Run Simulation
          </UButton>
        </div>
      </UCard>

      <UAlert
        v-if="errorMessage"
        color="error"
        icon="i-lucide-circle-alert"
        title="Simulation failed"
        :description="errorMessage"
      />

      <template v-if="result">
        <UCard>
          <template #header>
            <div
              class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
            >
              <div>
                <p class="text-sm text-muted">
                  Simulation result
                </p>

                <h2 class="mt-1 text-xl font-semibold">
                  {{ result.scenario.name }}
                </h2>
              </div>

              <UBadge variant="subtle">
                {{ result.scenario.id }}
              </UBadge>
            </div>
          </template>

          <dl
            class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
          >
            <div>
              <dt class="text-sm text-muted">
                Model
              </dt>

              <dd class="mt-1 font-mono text-sm">
                {{ result.model.modelId }}
              </dd>
            </div>

            <div>
              <dt class="text-sm text-muted">
                Version
              </dt>

              <dd class="mt-1 font-mono text-sm">
                {{ result.model.modelVersion }}
              </dd>
            </div>

            <div>
              <dt class="text-sm text-muted">
                Started
              </dt>

              <dd class="mt-1 text-sm">
                {{ result.scenario.startedAt }}
              </dd>
            </div>

            <div>
              <dt class="text-sm text-muted">
                Completed
              </dt>

              <dd class="mt-1 text-sm">
                {{ result.scenario.completedAt }}
              </dd>
            </div>
          </dl>

          <div class="mt-5">
            <p class="text-sm text-muted">
              Configuration
            </p>

            <p class="mt-1 break-all font-mono text-sm">
              {{ result.model.configurationHash }}
            </p>
          </div>
        </UCard>

        <div>
          <div
            class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"
          >
            <div>
              <h2 class="text-2xl font-semibold">
                Trust Timeline
              </h2>

              <p class="mt-1 text-sm text-muted">
                Authoritative trust state and policy decision at
                each simulation point.
              </p>
            </div>

            <p class="text-sm text-muted">
              {{ result.timeline.length }}
              timeline points
            </p>
          </div>

          <div class="mt-5 space-y-4">
            <UCard
              v-for="point in result.timeline"
              :key="point.sequence"
            >
              <div
                class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between"
              >
                <div class="min-w-0 space-y-3">
                  <div class="flex flex-wrap items-center gap-2">
                    <UBadge variant="outline">
                      #{{ point.sequence }}
                    </UBadge>

                    <UBadge
                      :color="
                        point.decision.allowed
                          ? 'success'
                          : 'error'
                      "
                    >
                      {{
                        point.decision.allowed
                          ? 'ALLOW'
                          : 'DENY'
                      }}
                    </UBadge>

                    <span
                      v-if="point.label"
                      class="font-medium"
                    >
                      {{ point.label }}
                    </span>
                  </div>

                  <div>
                    <p class="text-sm text-muted">
                      Operation
                    </p>

                    <p class="mt-1 font-mono text-sm">
                      {{ point.operation.operationType }}
                      /
                      {{ point.operation.operationName }}
                    </p>

                    <p
                      v-if="point.operation.serverName"
                      class="mt-1 text-sm text-muted"
                    >
                      {{ point.operation.serverName }}
                    </p>
                  </div>

                  <div>
                    <p class="text-sm text-muted">
                      Agent
                    </p>

                    <p
                      class="mt-1 break-all font-mono text-sm"
                    >
                      {{ point.agentId }}
                    </p>
                  </div>

                  <p
                    v-if="point.decision.reason"
                    class="text-sm text-muted"
                  >
                    {{ point.decision.reason }}
                  </p>
                </div>

                <div
                  class="grid shrink-0 gap-3 sm:grid-cols-3"
                >
                  <div
                    class="min-w-32 rounded-lg border border-default p-4"
                  >
                    <p class="text-xs font-medium text-muted">
                      Agent Trust
                    </p>

                    <p class="mt-1 text-xs text-muted">
                      Accumulated Agent evidence
                    </p>

                    <p class="mt-1 text-2xl font-semibold">
                      {{ point.trust.usage.state.score }}
                    </p>

                    <div class="mt-3 space-y-1 text-xs text-muted">
                      <p>
                        Evidence:
                        {{
                          point.trust.usage.state
                            .evidenceCount
                        }}
                      </p>

                      <p>
                        Effective weight:
                        {{
                          point.trust.usage.state
                            .evidenceWeight ?? '—'
                        }}
                      </p>

                      <p>
                        Diversity:
                        {{
                          point.trust.usage.state
                            .evidenceDiversityCount ?? '—'
                        }}
                      </p>
                    </div>
                  </div>

                  <div
                    class="min-w-32 rounded-lg border border-default p-4"
                  >
                    <p class="text-xs font-medium text-muted">
                      Domain Trust
                    </p>

                    <p class="mt-1 text-xs text-muted">
                      Trusted Domain evidence
                    </p>

                    <p class="mt-1 text-2xl font-semibold">
                      {{
                        point.trust
                          .behavioralVerification
                          .state.score
                      }}
                    </p>

                    <div class="mt-3 space-y-1 text-xs text-muted">
                      <p>
                        Evidence:
                        {{
                          point.trust
                            .behavioralVerification
                            .state.evidenceCount
                        }}
                      </p>

                      <p>
                        Effective weight:
                        {{
                          point.trust
                            .behavioralVerification
                            .state.evidenceWeight ?? '—'
                        }}
                      </p>

                      <p>
                        Diversity:
                        {{
                          point.trust
                            .behavioralVerification
                            .state.evidenceDiversityCount ?? '—'
                        }}
                      </p>
                    </div>
                  </div>

                  <div
                    class="min-w-32 rounded-lg border border-default p-4"
                  >
                    <p class="text-xs font-medium text-muted">
                      Composite Trust
                    </p>

                    <p class="mt-1 text-xs text-muted">
                      Policy trust composition
                    </p>

                    <p class="mt-1 text-2xl font-semibold">
                      {{ point.trust.composite.score }}
                    </p>

                    <p class="mt-1 text-xs text-muted">
                      {{
                        point.trust.composite
                          .evidenceCount
                      }}
                      evidence
                    </p>
                  </div>
                </div>
              </div>

              <details
                class="mt-5 border-t border-default pt-4"
              >
                <summary
                  class="cursor-pointer text-sm font-medium"
                >
                  Evidence explanation
                </summary>

                <div
                  class="mt-4 grid gap-6 lg:grid-cols-2"
                >
                  <section>
                    <div>
                      <h3 class="text-sm font-semibold">
                        Agent Trust Evidence
                      </h3>

                      <p class="mt-1 text-xs text-muted">
                        Evidence contributing to accumulated
                        Agent Trust.
                      </p>
                    </div>

                    <div
                      v-if="point.trust.usage.evidence.length"
                      class="mt-3 space-y-3"
                    >
                      <div
                        v-for="evidence in point.trust.usage.evidence"
                        :key="evidence.evidenceIdentity"
                        class="rounded-lg border border-default p-3"
                      >
                        <div
                          class="flex flex-wrap items-start justify-between gap-2"
                        >
                          <div>
                            <p class="font-mono text-xs">
                              {{
                                evidence.operation.operationType
                              }}
                              /
                              {{
                                evidence.operation.operationName
                              }}
                            </p>

                            <p
                              v-if="evidence.operation.serverName"
                              class="mt-1 text-xs text-muted"
                            >
                              {{
                                evidence.operation.serverName
                              }}
                            </p>
                          </div>

                          <UBadge
                            :color="
                              evidence.included
                                ? 'success'
                                : 'neutral'
                            "
                            variant="subtle"
                          >
                            {{
                              evidence.included
                                ? 'Included'
                                : 'Excluded'
                            }}
                          </UBadge>
                        </div>

                        <dl
                          class="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs"
                        >
                          <dt class="text-muted">
                            Score
                          </dt>
                          <dd class="text-right font-mono">
                            {{ evidence.scoreBefore }}
                            →
                            {{ evidence.scoreAfter }}
                          </dd>

                          <dt class="text-muted">
                            Contribution
                          </dt>
                          <dd class="text-right font-mono">
                            {{ evidence.scoreDelta }}
                          </dd>

                          <dt class="text-muted">
                            Evidence weight
                          </dt>
                          <dd class="text-right font-mono">
                            {{ evidence.evidenceWeight }}
                          </dd>

                          <dt class="text-muted">
                            Decay weight
                          </dt>
                          <dd class="text-right font-mono">
                            {{ evidence.decayWeight }}
                          </dd>

                          <dt class="text-muted">
                            Operation diminishing
                          </dt>
                          <dd class="text-right font-mono">
                            {{
                              evidence
                                .operationDiminishingReturnsWeight
                            }}
                          </dd>

                          <dt class="text-muted">
                            Effective weight
                          </dt>
                          <dd class="text-right font-mono">
                            {{ evidence.effectiveWeight }}
                          </dd>
                        </dl>

                        <p
                          v-if="evidence.exclusionReason"
                          class="mt-3 text-xs text-muted"
                        >
                          Exclusion:
                          {{ evidence.exclusionReason }}
                        </p>
                      </div>
                    </div>

                    <p
                      v-else
                      class="mt-3 text-sm text-muted"
                    >
                      No Agent Trust evidence contributed at
                      this point.
                    </p>
                  </section>

                  <section>
                    <div>
                      <h3 class="text-sm font-semibold">
                        Domain Trust Evidence
                      </h3>

                      <p class="mt-1 text-xs text-muted">
                        Trusted Domain evidence contributing
                        to Domain Trust.
                      </p>
                    </div>

                    <div
                      v-if="
                        point.trust.behavioralVerification
                          .evidence.length
                      "
                      class="mt-3 space-y-3"
                    >
                      <div
                        v-for="
                          evidence in
                            point.trust
                              .behavioralVerification
                              .evidence
                        "
                        :key="evidence.evidenceIdentity"
                        class="rounded-lg border border-default p-3"
                      >
                        <div
                          class="flex flex-wrap items-start justify-between gap-2"
                        >
                          <div>
                            <p class="font-mono text-xs">
                              {{
                                evidence.operation.operationType
                              }}
                              /
                              {{
                                evidence.operation.operationName
                              }}
                            </p>

                            <p
                              v-if="evidence.operation.serverName"
                              class="mt-1 text-xs text-muted"
                            >
                              {{
                                evidence.operation.serverName
                              }}
                            </p>
                          </div>

                          <UBadge
                            :color="
                              evidence.included
                                ? 'success'
                                : 'neutral'
                            "
                            variant="subtle"
                          >
                            {{
                              evidence.included
                                ? 'Included'
                                : 'Excluded'
                            }}
                          </UBadge>
                        </div>

                        <dl
                          class="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs"
                        >
                          <dt class="text-muted">
                            Score
                          </dt>
                          <dd class="text-right font-mono">
                            {{ evidence.scoreBefore }}
                            →
                            {{ evidence.scoreAfter }}
                          </dd>

                          <dt class="text-muted">
                            Contribution
                          </dt>
                          <dd class="text-right font-mono">
                            {{ evidence.scoreDelta }}
                          </dd>

                          <dt class="text-muted">
                            Evidence weight
                          </dt>
                          <dd class="text-right font-mono">
                            {{ evidence.evidenceWeight }}
                          </dd>

                          <dt class="text-muted">
                            Decay weight
                          </dt>
                          <dd class="text-right font-mono">
                            {{ evidence.decayWeight }}
                          </dd>

                          <dt class="text-muted">
                            Authority diminishing
                          </dt>
                          <dd class="text-right font-mono">
                            {{
                              evidence
                                .authorityDiminishingReturnsWeight
                            }}
                          </dd>

                          <dt class="text-muted">
                            Effective weight
                          </dt>
                          <dd class="text-right font-mono">
                            {{ evidence.effectiveWeight }}
                          </dd>
                        </dl>

                        <p
                          v-if="evidence.exclusionReason"
                          class="mt-3 text-xs text-muted"
                        >
                          Exclusion:
                          {{ evidence.exclusionReason }}
                        </p>
                      </div>
                    </div>

                    <p
                      v-else
                      class="mt-3 text-sm text-muted"
                    >
                      No Domain Trust evidence contributed at
                      this point.
                    </p>
                  </section>
                </div>
              </details>
            </UCard>
          </div>
        </div>
      </template>
    </div>
  </UContainer>
</template>
