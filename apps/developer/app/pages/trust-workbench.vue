<script setup lang="ts">
import type {
  TrustPolicyWorkbenchModelConfigurationId,
  TrustPolicyWorkbenchResult,
  TrustPopulationWorkbenchResult,
  TrustSimulationScenarioId
} from '@m2oath/control-plane-client'

definePageMeta({
  middleware: 'auth'
})

useSeoMeta({
  title: 'Trust Policy Workbench'
})

interface ModelConfigurationOption {
  label: string
  value: TrustPolicyWorkbenchModelConfigurationId
  description: string
}

interface ScenarioOption {
  label: string
  value: TrustSimulationScenarioId
  description: string
}

const modelConfigurations: ModelConfigurationOption[] = [
  {
    label: 'Canonical Day 10',
    value: 'canonical-day-10',
    description:
      'Run the canonical Day 10 trust model baseline.'
  },
  {
    label: 'Operation Equivalence v1',
    value: 'operation-equivalence-v1',
    description:
      'Run the registered model with operation-equivalence protections.'
  },
  {
    label: 'Farming Resistance v1',
    value: 'farming-resistance-v1',
    description:
      'Run the registered farming-resistance trust model.'
  }
]

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

type WorkbenchMode =
  | 'scenario'
  | 'population'

const workbenchMode =
  ref<WorkbenchMode>('scenario')

const workbenchModes = [
  {
    label: 'Scenario',
    value: 'scenario'
  },
  {
    label: 'Population',
    value: 'population'
  }
]

const selectedModelConfiguration =
  ref<TrustPolicyWorkbenchModelConfigurationId>(
    'farming-resistance-v1'
  )

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

const populationResult =
  ref<TrustPopulationWorkbenchResult | null>(
    null
  )

const errorMessage =
  ref<string | null>(
    null
  )

const selectedModelConfigurationDescription =
  computed(
    () =>
      modelConfigurations.find(
        model =>
          model.value
          === selectedModelConfiguration.value
      )?.description
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

const compositeTrustDistribution =
  computed(() => {
    if (!populationResult.value) {
      return []
    }

    const counts =
      new Map<number, number>()

    for (
      const agent
      of populationResult.value.agents
    ) {
      counts.set(
        agent.compositeTrustScore,
        (counts.get(
          agent.compositeTrustScore
        ) ?? 0) + 1
      )
    }

    const maximumCount =
      Math.max(
        1,
        ...counts.values()
      )

    return [...counts.entries()]
      .sort(
        ([left], [right]) =>
          left - right
      )
      .map(
        ([score, count]) => ({
          score,
          count,
          percentage:
            (count / maximumCount) * 100
        })
      )
  })

async function runPopulationSimulation() {
  running.value = true
  populationResult.value = null
  errorMessage.value = null

  try {
    populationResult.value =
      await $fetch<TrustPopulationWorkbenchResult>(
        '/api/trust-population-simulations',
        {
          method: 'POST'
        }
      )
  } catch {
    errorMessage.value =
      'The trust population simulation could not be completed through the M2Oath control plane.'
  } finally {
    running.value = false
  }
}

async function runSimulation() {
  running.value = true
  result.value = null
  populationResult.value = null
  errorMessage.value = null

  try {
    result.value =
      await $fetch<TrustPolicyWorkbenchResult>(
        '/api/trust-simulations',
        {
          method: 'POST',

          body: {
            scenarioId:
              selectedScenario.value,
            modelConfigurationId:
              selectedModelConfiguration.value
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
              Simulation
            </h2>

            <p class="mt-1 text-sm text-muted">
              Inspect one deterministic scenario or the
              authoritative Day 11 population baseline.
            </p>
          </div>
        </template>

        <div class="space-y-5">
          <UFormField
            label="Mode"
            description="Choose a single trust scenario or a multi-Agent population simulation."
          >
            <USelect
              v-model="workbenchMode"
              class="w-full"
              :items="workbenchModes"
              label-key="label"
              value-key="value"
              :disabled="running"
            />
          </UFormField>

          <template v-if="workbenchMode === 'scenario'">
          <UFormField
            label="Trust model"
            :description="selectedModelConfigurationDescription"
          >
            <USelect
              v-model="selectedModelConfiguration"
              class="w-full"
              :items="modelConfigurations"
              label-key="label"
              value-key="value"
              :disabled="running"
            />
          </UFormField>

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
              Run Scenario
            </UButton>
          </template>

          <template v-else>
            <UAlert
              color="neutral"
              variant="subtle"
              icon="i-lucide-users"
              title="Population 001"
              description="Deterministic ten-Agent isolation baseline using the frozen Farming Resistance v1 model."
            />

            <UButton
              icon="i-lucide-play"
              :loading="running"
              :disabled="running"
              @click="runPopulationSimulation"
            >
              Run Population
            </UButton>
          </template>
        </div>
      </UCard>

      <UAlert
        v-if="errorMessage"
        color="error"
        icon="i-lucide-circle-alert"
        title="Simulation failed"
        :description="errorMessage"
      />

      <template v-if="populationResult">
        <UCard>
          <template #header>
            <div
              class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
            >
              <div>
                <p class="text-sm text-muted">
                  Population result
                </p>

                <h2 class="mt-1 text-xl font-semibold">
                  {{ populationResult.population.name }}
                </h2>

                <p
                  v-if="populationResult.population.description"
                  class="mt-1 text-sm text-muted"
                >
                  {{ populationResult.population.description }}
                </p>
              </div>

              <UBadge variant="subtle">
                {{ populationResult.population.id }}
              </UBadge>
            </div>
          </template>

          <dl
            class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
          >
            <div>
              <dt class="text-sm text-muted">
                Agents
              </dt>
              <dd class="mt-1 text-2xl font-semibold">
                {{ populationResult.summary.agentCount }}
              </dd>
            </div>

            <div>
              <dt class="text-sm text-muted">
                Allowed
              </dt>
              <dd class="mt-1 text-2xl font-semibold">
                {{ populationResult.summary.allowedCount }}
              </dd>
            </div>

            <div>
              <dt class="text-sm text-muted">
                Denied
              </dt>
              <dd class="mt-1 text-2xl font-semibold">
                {{ populationResult.summary.deniedCount }}
              </dd>
            </div>

            <div>
              <dt class="text-sm text-muted">
                Average Composite
              </dt>
              <dd class="mt-1 text-2xl font-semibold">
                {{
                  populationResult.summary.compositeScore
                    ?.average ?? '—'
                }}
              </dd>
            </div>
          </dl>

          <div class="mt-5 border-t border-default pt-5">
            <p class="text-sm text-muted">
              Model
            </p>
            <p class="mt-1 font-mono text-sm">
              {{ populationResult.model.modelId }}
              /
              {{ populationResult.model.modelVersion }}
              ·
              {{ populationResult.model.configurationHash }}
            </p>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <div>
              <h2 class="text-xl font-semibold">
                Composite Trust Distribution
              </h2>

              <p class="mt-1 text-sm text-muted">
                Distribution of authoritative Composite Trust
                scores returned for the simulated Agents.
              </p>
            </div>
          </template>

          <div
            v-if="compositeTrustDistribution.length"
            class="space-y-4"
          >
            <div
              v-for="bucket in compositeTrustDistribution"
              :key="bucket.score"
              class="grid grid-cols-[4rem_1fr_4rem] items-center gap-4"
            >
              <div class="font-mono text-sm">
                {{ bucket.score }}
              </div>

              <div
                class="h-8 overflow-hidden rounded-md bg-elevated"
              >
                <div
                  class="flex h-full min-w-8 items-center justify-end rounded-md bg-primary px-2 text-xs font-semibold text-inverted"
                  :style="{
                    width: `${bucket.percentage}%`
                  }"
                >
                  {{ bucket.count }}
                </div>
              </div>

              <div class="text-right text-sm text-muted">
                {{ bucket.count }}
                Agent{{ bucket.count === 1 ? '' : 's' }}
              </div>
            </div>

            <div
              class="grid grid-cols-[4rem_1fr_4rem] gap-4 text-xs text-muted"
            >
              <div>Score</div>
              <div>
                Relative population count
              </div>
              <div class="text-right">
                Count
              </div>
            </div>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <div>
              <h2 class="text-xl font-semibold">
                Agent Results
              </h2>

              <p class="mt-1 text-sm text-muted">
                Authoritative Agent, Domain, and Composite Trust
                scores for each simulated Agent.
              </p>
            </div>
          </template>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead>
                <tr class="border-b border-default">
                  <th class="px-3 py-3 font-medium">
                    Agent
                  </th>
                  <th class="px-3 py-3 text-right font-medium">
                    Agent Trust
                  </th>
                  <th class="px-3 py-3 text-right font-medium">
                    Domain Trust
                  </th>
                  <th class="px-3 py-3 text-right font-medium">
                    Composite
                  </th>
                  <th class="px-3 py-3 text-right font-medium">
                    Decision
                  </th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="agent in populationResult.agents"
                  :key="agent.agentId"
                  class="border-b border-default last:border-0"
                >
                  <td class="px-3 py-3 font-mono">
                    {{ agent.agentId }}
                  </td>

                  <td class="px-3 py-3 text-right font-mono">
                    {{ agent.agentTrustScore }}
                  </td>

                  <td class="px-3 py-3 text-right font-mono">
                    {{ agent.domainTrustScore }}
                  </td>

                  <td class="px-3 py-3 text-right font-mono">
                    {{ agent.compositeTrustScore }}
                  </td>

                  <td class="px-3 py-3 text-right">
                    <UBadge
                      :color="
                        agent.allowed
                          ? 'success'
                          : 'error'
                      "
                    >
                      {{
                        agent.allowed
                          ? 'ALLOW'
                          : 'DENY'
                      }}
                    </UBadge>

                    <p
                      v-if="agent.reason"
                      class="mt-1 text-xs text-muted"
                    >
                      {{ agent.reason }}
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </UCard>
      </template>

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
