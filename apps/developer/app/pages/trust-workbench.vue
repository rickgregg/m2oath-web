<script setup lang="ts">
import type {
  TrustPolicyWorkbenchModelConfigurationId,
  TrustPolicyWorkbenchResult,
  TrustPopulationWorkbenchAgentResult,
  TrustPopulationWorkbenchResult,
  TrustSimulationScenarioId
} from '@m2oath/control-plane-client'

definePageMeta({
  middleware: 'auth'
})

useSeoMeta({
  title: 'Trust Policy Workbench'
})

const cohortDefinitions: Record<string, string> = {
  'normal-trusted':
    'Agent with successful usage plus independent Trusted Domain evidence. Represents normal trust accumulation.',
  'cold-start':
    'New Agent with no accumulated usage or Domain Trust evidence. Tests provisional and default trust behavior.',
  'usage-only':
    'Agent with successful usage evidence but no Domain Trust evidence. Tests how Agent Trust alone contributes to the authorization decision.',
  'domain-only':
    'Agent with Trusted Domain evidence but no successful usage evidence. Tests how Domain Trust alone contributes to the authorization decision.',
  'repetition-farming':
    'Agent repeatedly performs the same successful operation. Tests diminishing returns against reputation farming through repetition.',
  'fake-diversity':
    'Agent performs equivalent or aliased operations intended to appear diverse. Tests whether operation equivalence prevents artificial diversity.',
  'cross-operation-farming':
    'Agent earns trust on one operation and then requests a different protected operation. Tests operation-scoped trust isolation.',
  'authority-concentration':
    'Domain evidence repeatedly comes from the same authority. Tests diminishing returns for concentrated evidence sources.',
  'combined-farming':
    'Agent combines multiple trust-building techniques across Agent Trust and Domain Trust. Tests how individually diminished evidence composes into a final trust decision.',
  'stale-reputation':
    'Agent previously accumulated trust, but the evidence has aged beyond the configured freshness window. Tests trust decay and stale-evidence handling.',
  'unclassified':
    'Simulation Agent without an assigned cohort classification.'
}

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

const populationCohortAnalysis =
  computed(() => {
    if (!populationResult.value) {
      return []
    }

    const cohorts =
      new Map<
        string,
        {
          agentCount: number
          agentTrustTotal: number
          domainTrustTotal: number
          compositeTrustTotal: number
          allowedCount: number
          deniedCount: number
        }
      >()

    for (
      const agent
      of populationResult.value.agents
    ) {
      const cohortId =
        agent.cohortId ?? 'unclassified'

      const cohort =
        cohorts.get(cohortId) ?? {
          agentCount: 0,
          agentTrustTotal: 0,
          domainTrustTotal: 0,
          compositeTrustTotal: 0,
          allowedCount: 0,
          deniedCount: 0
        }

      cohort.agentCount += 1
      cohort.agentTrustTotal +=
        agent.agentTrustScore
      cohort.domainTrustTotal +=
        agent.domainTrustScore
      cohort.compositeTrustTotal +=
        agent.compositeTrustScore

      if (agent.allowed) {
        cohort.allowedCount += 1
      } else {
        cohort.deniedCount += 1
      }

      cohorts.set(
        cohortId,
        cohort
      )
    }

    return [...cohorts.entries()]
      .map(
        ([cohortId, cohort]) => ({
          cohortId,
          agentCount: cohort.agentCount,
          agentTrustScore:
            cohort.agentTrustTotal
            / cohort.agentCount,
          domainTrustScore:
            cohort.domainTrustTotal
            / cohort.agentCount,
          compositeTrustScore:
            cohort.compositeTrustTotal
            / cohort.agentCount,
          allowedCount:
            cohort.allowedCount,
          deniedCount:
            cohort.deniedCount
        })
      )
  })

const sortedPopulationAgents =
  computed(() =>
    populationResult.value
      ? [...populationResult.value.agents]
          .sort(
            (left, right) =>
              left.agentId.localeCompare(
                right.agentId
              )
          )
      : []
  )

const selectedPopulationAgent =
  ref<TrustPopulationWorkbenchAgentResult | null>(
    null
  )

const selectedPopulationAgentGraph =
  computed(() => {
    const agent =
      selectedPopulationAgent.value

    if (!agent || agent.timeline.length === 0) {
      return null
    }

    const width = 800
    const height = 320
    const padding = {
      top: 24,
      right: 24,
      bottom: 48,
      left: 48
    }

    const plotWidth =
      width - padding.left - padding.right

    const plotHeight =
      height - padding.top - padding.bottom

    const times =
      agent.timeline.map(
        point =>
          new Date(point.time).getTime()
      )

    const minimumTime =
      Math.min(...times)

    const maximumTime =
      Math.max(...times)

    const timeRange =
      maximumTime - minimumTime

    const xFor =
      (time: string) => {
        if (timeRange === 0) {
          return padding.left
            + plotWidth / 2
        }

        return padding.left
          + (
            (
              new Date(time).getTime()
              - minimumTime
            )
            / timeRange
          )
          * plotWidth
      }

    const yFor =
      (score: number) =>
        padding.top
        + ((100 - score) / 100)
        * plotHeight

    const points =
      agent.timeline.map(
        point => ({
          ...point,
          x: xFor(point.time),
          agentY:
            yFor(point.agentTrustScore),
          domainY:
            yFor(point.domainTrustScore),
          compositeY:
            yFor(point.compositeTrustScore)
        })
      )

    const polylineFor =
      (
        key:
          | 'agentY'
          | 'domainY'
          | 'compositeY'
      ) =>
        points
          .map(
            point =>
              `${point.x},${point[key]}`
          )
          .join(' ')

    const thresholdY =
      yFor(55)

    const elapsedStartLabel =
      '0m'

    const elapsedMinutes =
      Math.round(
        timeRange / 60_000
      )

    const elapsedEndLabel =
      `${elapsedMinutes}m`

    return {
      width,
      height,
      padding,
      plotWidth,
      plotHeight,
      points,
      agentPolyline:
        polylineFor('agentY'),
      domainPolyline:
        polylineFor('domainY'),
      compositePolyline:
        polylineFor('compositeY'),
      thresholdY,
      elapsedStartLabel,
      elapsedEndLabel
    }
  })

function selectPopulationAgent(
  agent: TrustPopulationWorkbenchAgentResult
) {
  selectedPopulationAgent.value =
    agent
}

function closePopulationAgent() {
  selectedPopulationAgent.value =
    null
}

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
              title="Population 002"
              description="Deterministic 100-Agent heterogeneous behavioral population using the frozen Farming Resistance v1 model."
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
                Cohort Analysis
              </h2>

              <p class="mt-1 text-sm text-muted">
                Aggregate view of the authoritative Agent results,
                grouped by simulation cohort.
              </p>
            </div>
          </template>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead>
                <tr class="border-b border-default">
                  <th class="px-3 py-3 font-medium">
                    Cohort
                  </th>
                  <th class="px-3 py-3 text-right font-medium">
                    Agents
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
                    Allowed
                  </th>
                  <th class="px-3 py-3 text-right font-medium">
                    Denied
                  </th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="cohort in populationCohortAnalysis"
                  :key="cohort.cohortId"
                  class="border-b border-default last:border-0"
                >
                  <td class="px-3 py-3">
                    <UPopover>
                      <UBadge
                        color="neutral"
                        variant="subtle"
                        class="cursor-pointer"
                      >
                        {{ cohort.cohortId }}
                      </UBadge>

                      <template #content>
                        <div class="max-w-sm p-4">
                          <p class="font-medium">
                            {{ cohort.cohortId }}
                          </p>

                          <p class="mt-2 text-sm text-muted">
                            {{
                              cohortDefinitions[
                                cohort.cohortId
                              ]
                              ?? cohortDefinitions.unclassified
                            }}
                          </p>

                          <div
                            class="mt-3 border-t border-default pt-3"
                          >
                            <p class="text-xs font-medium">
                              Simulation cohort
                            </p>

                            <p class="mt-1 text-xs text-muted">
                              Descriptive metadata only. This
                              classification is not supplied to the
                              trust model and does not participate in
                              trust calculation.
                            </p>
                          </div>
                        </div>
                      </template>
                    </UPopover>
                  </td>

                  <td class="px-3 py-3 text-right font-mono">
                    {{ cohort.agentCount }}
                  </td>

                  <td class="px-3 py-3 text-right font-mono">
                    {{ cohort.agentTrustScore }}
                  </td>

                  <td class="px-3 py-3 text-right font-mono">
                    {{ cohort.domainTrustScore }}
                  </td>

                  <td class="px-3 py-3 text-right font-mono">
                    {{ cohort.compositeTrustScore }}
                  </td>

                  <td class="px-3 py-3 text-right font-mono">
                    {{ cohort.allowedCount }}
                  </td>

                  <td class="px-3 py-3 text-right font-mono">
                    {{ cohort.deniedCount }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p class="mt-4 text-xs text-muted">
            Trust scores are cohort averages calculated only for
            presentation from the authoritative per-Agent results.
            Cohort metadata is not trust evidence and does not
            participate in trust calculation.
          </p>
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
                  <th class="px-3 py-3 font-medium">
                    Cohort
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
                <template
                  v-for="agent in sortedPopulationAgents"
                  :key="agent.agentId"
                >
                  <tr
                    class="border-b border-default"
                  >
                  <td class="px-3 py-3 font-mono">
                    <button
                      type="button"
                      class="cursor-pointer underline decoration-dotted underline-offset-4 hover:decoration-solid"
                      @click="selectPopulationAgent(agent)"
                    >
                      {{ agent.agentId }}
                    </button>
                  </td>

                  <td class="px-3 py-3">
                    <UPopover>
                      <UBadge
                        color="neutral"
                        variant="subtle"
                        class="cursor-pointer"
                      >
                        {{ agent.cohortId ?? 'unclassified' }}
                      </UBadge>

                      <template #content>
                        <div class="max-w-sm p-4">
                          <p class="font-medium">
                            {{ agent.cohortId ?? 'unclassified' }}
                          </p>

                          <p class="mt-2 text-sm text-muted">
                            {{
                              cohortDefinitions[
                                agent.cohortId
                                ?? 'unclassified'
                              ]
                              ?? cohortDefinitions.unclassified
                            }}
                          </p>

                          <div
                            class="mt-3 border-t border-default pt-3"
                          >
                            <p class="text-xs font-medium">
                              Simulation cohort
                            </p>

                            <p class="mt-1 text-xs text-muted">
                              Descriptive metadata only. This
                              classification is not supplied to the
                              trust model and does not participate in
                              trust calculation.
                            </p>
                          </div>
                        </div>
                      </template>
                    </UPopover>
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

                  <tr
                    v-if="
                      selectedPopulationAgent?.agentId
                      === agent.agentId
                      && selectedPopulationAgentGraph
                    "
                    class="border-b border-default"
                  >
                    <td
                      colspan="6"
                      class="px-3 py-4"
                    >
                      <UCard>
                        <template #header>
                          <div
                            class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
                          >
                            <div>
                              <p class="text-sm text-muted">
                                Agent trust history
                              </p>

                              <h2 class="mt-1 text-xl font-semibold">
                                Agent Trust Over Time
                              </h2>

                              <p class="mt-1 font-mono text-sm">
                                {{ selectedPopulationAgent.agentId }}
                              </p>

                              <p class="mt-2 text-sm text-muted">
                                Authoritative trust scores at simulation
                                checkpoints. Lines connect observed checkpoints
                                for visualization only and do not imply continuous
                                trust measurement.
                              </p>
                            </div>

                            <div class="flex items-center gap-2">
                              <UBadge
                                color="neutral"
                                variant="subtle"
                              >
                                {{
                                  selectedPopulationAgent.cohortId
                                  ?? 'unclassified'
                                }}
                              </UBadge>

                              <UButton
                                color="neutral"
                                variant="ghost"
                                icon="i-lucide-x"
                                aria-label="Close Agent trust history"
                                @click="closePopulationAgent"
                              >
                                Close
                              </UButton>
                            </div>
                          </div>
                        </template>

                        <div class="space-y-6">
                          <div
                            class="flex flex-wrap gap-x-6 gap-y-2 text-sm"
                          >
                            <div class="flex items-center gap-2">
                              <span
                                class="inline-block h-0.5 w-6 bg-primary"
                              />
                              <span>Agent Trust</span>
                            </div>

                            <div class="flex items-center gap-2">
                              <span
                                class="inline-block h-0.5 w-6 border-t-2 border-dashed border-warning"
                              />
                              <span>Domain Trust</span>
                            </div>

                            <div class="flex items-center gap-2">
                              <span
                                class="inline-block h-1 w-6 bg-success"
                              />
                              <span>Composite Trust</span>
                            </div>

                            <div class="flex items-center gap-2 text-muted">
                              <span
                                class="inline-block h-0.5 w-6 border-t border-dashed border-error"
                              />
                              <span>Policy threshold · 55</span>
                            </div>
                          </div>

                          <div class="overflow-x-auto">
                            <svg
                              :viewBox="
                                `0 0 ${selectedPopulationAgentGraph.width} ${selectedPopulationAgentGraph.height}`
                              "
                              class="min-w-[700px] w-full"
                              role="img"
                              :aria-label="
                                `Trust over time for ${selectedPopulationAgent.agentId}`
                              "
                            >
                              <line
                                v-for="score in [0, 25, 50, 75, 100]"
                                :key="`grid-${score}`"
                                :x1="selectedPopulationAgentGraph.padding.left"
                                :x2="
                                  selectedPopulationAgentGraph.width
                                  - selectedPopulationAgentGraph.padding.right
                                "
                                :y1="
                                  selectedPopulationAgentGraph.padding.top
                                  + ((100 - score) / 100)
                                  * selectedPopulationAgentGraph.plotHeight
                                "
                                :y2="
                                  selectedPopulationAgentGraph.padding.top
                                  + ((100 - score) / 100)
                                  * selectedPopulationAgentGraph.plotHeight
                                "
                                stroke="currentColor"
                                stroke-opacity="0.12"
                              />

                              <text
                                v-for="score in [0, 25, 50, 75, 100]"
                                :key="`label-${score}`"
                                :x="
                                  selectedPopulationAgentGraph.padding.left
                                  - 10
                                "
                                :y="
                                  selectedPopulationAgentGraph.padding.top
                                  + ((100 - score) / 100)
                                  * selectedPopulationAgentGraph.plotHeight
                                  + 4
                                "
                                text-anchor="end"
                                fill="currentColor"
                                opacity="0.65"
                                font-size="12"
                              >
                                {{ score }}
                              </text>

                              <line
                                :x1="selectedPopulationAgentGraph.padding.left"
                                :x2="selectedPopulationAgentGraph.padding.left"
                                :y1="selectedPopulationAgentGraph.padding.top"
                                :y2="
                                  selectedPopulationAgentGraph.height
                                  - selectedPopulationAgentGraph.padding.bottom
                                "
                                stroke="currentColor"
                                stroke-opacity="0.35"
                              />

                              <line
                                :x1="selectedPopulationAgentGraph.padding.left"
                                :x2="
                                  selectedPopulationAgentGraph.width
                                  - selectedPopulationAgentGraph.padding.right
                                "
                                :y1="
                                  selectedPopulationAgentGraph.height
                                  - selectedPopulationAgentGraph.padding.bottom
                                "
                                :y2="
                                  selectedPopulationAgentGraph.height
                                  - selectedPopulationAgentGraph.padding.bottom
                                "
                                stroke="currentColor"
                                stroke-opacity="0.35"
                              />

                              <line
                                :x1="selectedPopulationAgentGraph.padding.left"
                                :x2="
                                  selectedPopulationAgentGraph.width
                                  - selectedPopulationAgentGraph.padding.right
                                "
                                :y1="selectedPopulationAgentGraph.thresholdY"
                                :y2="selectedPopulationAgentGraph.thresholdY"
                                class="text-error"
                                stroke="currentColor"
                                stroke-width="1"
                                stroke-dasharray="5 5"
                                opacity="0.7"
                              />

                              <text
                                :x="
                                  selectedPopulationAgentGraph.width
                                  - selectedPopulationAgentGraph.padding.right
                                  - 4
                                "
                                :y="
                                  selectedPopulationAgentGraph.thresholdY
                                  - 6
                                "
                                text-anchor="end"
                                class="fill-error"
                                font-size="10"
                              >
                                55
                              </text>

                              <polyline
                                :points="
                                  selectedPopulationAgentGraph.agentPolyline
                                "
                                fill="none"
                                class="text-primary"
                                stroke="currentColor"
                                stroke-width="2"
                              />

                              <polyline
                                :points="
                                  selectedPopulationAgentGraph.domainPolyline
                                "
                                fill="none"
                                class="text-warning"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-dasharray="7 5"
                              />

                              <polyline
                                :points="
                                  selectedPopulationAgentGraph.compositePolyline
                                "
                                fill="none"
                                class="text-success"
                                stroke="currentColor"
                                stroke-width="4"
                              />

                              <g
                                v-for="
                                  point in selectedPopulationAgentGraph.points
                                "
                                :key="point.sequence"
                              >
                                <circle
                                  :cx="point.x"
                                  :cy="point.agentY"
                                  r="4"
                                  class="fill-primary"
                                >
                                  <title>
                                    Agent Trust {{ point.agentTrustScore }}
                                    — {{ point.label ?? point.time }}
                                  </title>
                                </circle>

                                <circle
                                  :cx="point.x"
                                  :cy="point.domainY"
                                  r="4"
                                  class="fill-warning"
                                >
                                  <title>
                                    Domain Trust {{ point.domainTrustScore }}
                                    — {{ point.label ?? point.time }}
                                  </title>
                                </circle>

                                <circle
                                  :cx="point.x"
                                  :cy="point.compositeY"
                                  r="5"
                                  class="fill-success"
                                >
                                  <title>
                                    Composite Trust
                                    {{ point.compositeTrustScore }}
                                    — {{ point.label ?? point.time }}
                                  </title>
                                </circle>
                              </g>

                              <text
                                :x="
                                  selectedPopulationAgentGraph.padding.left
                                "
                                :y="
                                  selectedPopulationAgentGraph.height - 12
                                "
                                text-anchor="start"
                                fill="currentColor"
                                opacity="0.65"
                                font-size="11"
                              >
                                {{
                                  selectedPopulationAgentGraph.elapsedStartLabel
                                }}
                              </text>

                              <text
                                :x="
                                  selectedPopulationAgentGraph.width
                                  - selectedPopulationAgentGraph.padding.right
                                "
                                :y="
                                  selectedPopulationAgentGraph.height - 12
                                "
                                text-anchor="end"
                                fill="currentColor"
                                opacity="0.65"
                                font-size="11"
                              >
                                {{
                                  selectedPopulationAgentGraph.elapsedEndLabel
                                }}
                              </text>
                            </svg>
                          </div>

                          <div class="overflow-x-auto">
                            <table class="w-full text-left text-sm">
                              <thead>
                                <tr class="border-b border-default">
                                  <th class="px-3 py-3 font-medium">
                                    Checkpoint
                                  </th>
                                  <th class="px-3 py-3 font-medium">
                                    Time
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
                                  v-for="
                                    point in selectedPopulationAgent.timeline
                                  "
                                  :key="point.sequence"
                                  class="border-b border-default last:border-0"
                                >
                                  <td class="px-3 py-3">
                                    <p class="font-medium">
                                      {{
                                        point.label
                                        ?? `Checkpoint ${point.sequence}`
                                      }}
                                    </p>

                                    <p class="mt-1 font-mono text-xs text-muted">
                                      #{{ point.sequence }}
                                    </p>
                                  </td>

                                  <td class="px-3 py-3 font-mono text-xs">
                                    {{ point.time }}
                                  </td>

                                  <td class="px-3 py-3 text-right font-mono">
                                    {{ point.agentTrustScore }}
                                  </td>

                                  <td class="px-3 py-3 text-right font-mono">
                                    {{ point.domainTrustScore }}
                                  </td>

                                  <td class="px-3 py-3 text-right font-mono">
                                    {{ point.compositeTrustScore }}
                                  </td>

                                  <td class="px-3 py-3 text-right">
                                    <UBadge
                                      :color="
                                        point.allowed
                                          ? 'success'
                                          : 'error'
                                      "
                                    >
                                      {{
                                        point.allowed
                                          ? 'ALLOW'
                                          : 'DENY'
                                      }}
                                    </UBadge>

                                    <p
                                      v-if="point.reason"
                                      class="mt-1 text-xs text-muted"
                                    >
                                      {{ point.reason }}
                                    </p>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>

                          <p class="text-xs text-muted">
                            Trust scores and policy decisions are authoritative
                            simulation results returned by M2Oath Trust. Graph
                            coordinates and connecting lines are presentation
                            only; the Developer portal does not recalculate trust.
                          </p>
                        </div>
                      </UCard>
                    </td>
                  </tr>
                </template>
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
