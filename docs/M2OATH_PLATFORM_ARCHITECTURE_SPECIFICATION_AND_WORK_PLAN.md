# M2Oath Platform Architecture Specification and Step 10 Work Plan

**Status:** Target Architecture / Working Specification\
**Date:** 2026-09-17\
**Initial home:** `m2oath-web/docs/`\
**Suggested path:**
`m2oath-web/docs/M2OATH_PLATFORM_ARCHITECTURE_SPECIFICATION_AND_WORK_PLAN.md`

## 1. Purpose

This specification consolidates the target M2Oath platform architecture
and the implementation plan for evolving the current working systems
into that architecture without losing completed work.

It covers `m2oath-agent`, `m2oath-web`, M2Oath Raven, `m2oath-trust`,
`m2oath-weather`, Trust Providers, Trusted Domain Providers, HTTP/JSON
and MCP interfaces, Trust Container access, persistence ownership,
deployment/scalability, the Trust Policy Workbench, Step 10 Days 10--15,
and outstanding/deferred roadmap items.

The goal is not merely to split repositories. The goal is to align
**authority, software, persistence, protocol, security, and deployment
boundaries** while preserving a simple public developer experience.

------------------------------------------------------------------------

# 2. Governing Principles

> **Agent enforces. Raven serves and orchestrates. Trust establishes
> Agent trust. Domains establish domain evidence.**

> **The evidence is vertical. The method of trust is horizontal.**

> **Database ownership follows authority ownership.**

> **Deployment topology does not collapse authority boundaries.**

> **Interfaces separate software. Authentication separates trust
> domains.**

> **MCP and HTTP expose authorities; neither protocol becomes the
> authority.**

> **M2Oath federates authorities rather than absorbing them.**

> **The Trust Container accesses authoritative services through provider
> contracts for enforcement. The encapsulated Agent may access those
> same services through MCP for reasoning and tool use. MCP responses
> inform the Agent; provider evidence informs policy; only the Trust
> Container grants protected execution.**

> **The simulation framework observes M2Oath. It does not redefine
> M2Oath.**

> **M2Oath should make Agent trust observable, not merely calculable.**

------------------------------------------------------------------------

# 3. Five Primary Components

## 3.1 `m2oath-agent` --- Public Developer Framework

`m2oath-agent` is the public-facing side of M2Oath. Developers install
it, program against it, extend it, and use it to place an AI Agent
inside an M2Oath Trust Container.

Responsibilities:

-   AI Trust Container;
-   protected-operation enforcement boundary;
-   public trust contracts;
-   programmable executable TypeScript rules/policies;
-   `AgentTrustStateProvider`;
-   `ExternalTrustEvidenceProvider<T>`;
-   SDK;
-   MCP integration;
-   authentication adapters;
-   CLI;
-   developer/local persistence where appropriate;
-   developer-extensible providers.

Public contracts include concepts such as `AgentTrustState`,
`TrustPolicy`, `TrustRule`, `TrustEvaluationRequest`,
`TrustEvaluationResult`, `TrustModelDescriptor`,
`AgentTrustStateProvider`, and `ExternalTrustEvidenceProvider<T>`.

**Hard requirement:** the public framework must install, build, test,
and run a Trust Container without private M2Oath source, Raven, M2Oath
databases, or M2Oath-owned providers.

## 3.2 `m2oath-web` --- Hosted M2Oath Product

`m2oath-web` owns the hosted product model and user experience:

-   Users;
-   Accounts;
-   Organizations;
-   memberships;
-   Developer profiles;
-   account settings;
-   hosted Agent configuration;
-   Developer Portal;
-   Agent Portal;
-   Trust Policy Workbench;
-   administration UI;
-   future billing/subscription UX;
-   Auth0/OIDC authentication UX;
-   hosted application state.

**Boundary:** Web owns what these resources mean. Raven owns how the
server side serves and orchestrates them.

The hosted application database is therefore `m2oath_web`, not
`m2oath_raven`.

## 3.3 M2Oath Raven --- Hosted Server/API/Orchestration Runtime

Raven is the trusted server-side application/API/orchestration runtime
for the hosted M2Oath product.

For now Raven should live in the `m2oath-web` repository and should
preferably be an independently deployable **Nuxt/Nitro** server
application. Raven is the architecture; Nitro is the initial
implementation technology.

Responsibilities:

-   REST/JSON APIs;
-   authentication/session integration;
-   authorization;
-   Web CRUD application services;
-   access to `m2oath_web`;
-   provider registry;
-   Trust Provider adapters;
-   Trusted Domain Provider adapters;
-   provider authentication;
-   capability discovery;
-   health;
-   routing;
-   orchestration;
-   failure handling;
-   provenance propagation;
-   composite responses.

Raven must not calculate authoritative accumulated trust, implement
Weather trust algorithms, query Trust/Weather databases directly,
silently promote domain evidence into accumulated trust, execute
protected Agent operations, expose service credentials to browsers, or
execute arbitrary uploaded developer TypeScript in its primary process.

## 3.4 `m2oath-trust` --- Horizontal Trust Authority

`m2oath-trust` owns authoritative horizontal Agent trust and identity
state:

-   canonical Agent identity;
-   lifecycle;
-   cryptographic bindings;
-   registration provenance;
-   usage/outcome evidence;
-   behavioral verification/history;
-   accumulated trust;
-   reconstruction;
-   weighting;
-   decay;
-   diminishing returns;
-   anti-farming;
-   authoritative model implementations;
-   audit/provenance;
-   authoritative persistence;
-   Trust simulation/certification;
-   authenticated Trust Service API;
-   optional Trust MCP adapter.

The current `@m2oath/trust` package must be classified and split: public
contracts remain available to `m2oath-agent`; proprietary authoritative
implementation moves toward `m2oath-trust`.

## 3.5 `m2oath-weather` --- First Trusted Domain

The current `mcp-workspace` should be recast as the first M2Oath Trusted
Domain.

It owns:

-   locations/stations;
-   observations;
-   forecasts;
-   forecast/observation providers;
-   forecast verification;
-   temperature/RH/wind trust;
-   precipitation trust/calibration;
-   Weather evidence and semantics;
-   Weather persistence;
-   authenticated Weather Service API;
-   Weather MCP adapter.

MCP is a protocol adapter, not the identity or authority of the Weather
domain.

------------------------------------------------------------------------

# 4. Target Topology

``` text
                         m2oath-web
                    hosted product / UI
                              |
                         REST / JSON
                              v
                        M2Oath Raven
                    Nuxt/Nitro runtime
                              |
               +--------------+--------------+
               |                             |
         TrustProvider              TrustedDomainProvider
               |                             |
               v                             v
         m2oath-trust                 m2oath-weather
      horizontal authority           vertical authority
               |                             |
               v                             v
         m2oath_trust                 m2oath_weather
              DB                            DB

Raven --------------------------------> m2oath_web DB
```

The public Agent runtime remains independently deployable:

``` text
AI Application
      |
      v
m2oath-agent / Trust Container
      |
      +--> AgentTrustStateProvider ----------> Trust authority
      |
      +--> ExternalTrustEvidenceProvider<T> -> Domain authority
```

------------------------------------------------------------------------

# 5. Raven + Nuxt/Nitro Design

Preferred placement, subject to inspection of the existing
control-plane:

``` text
m2oath-web/
  apps/
    developer/
    agent/
    docs/
    raven/        # target if control-plane does not simply evolve into Raven
```

Before creating `apps/raven`, inspect `apps/control-plane`. Avoid two
competing canonical backends.

Nitro is a strong fit because it provides server API routes, middleware,
TypeScript server code, standalone Node deployment, and deployment
portability. Raven contracts must nevertheless remain
framework-independent.

Correct layering:

``` text
Nitro HTTP Handler
      |
      v
Raven Application Service
      |
      +--> Raven Repository ----------> m2oath_web
      +--> TrustProvider -------------> m2oath-trust
      +--> TrustedDomainProvider -----> m2oath-weather / other domains
```

Do not leak `H3Event` or Nitro-specific types into core Raven
provider/application contracts.

Raven has two API personalities:

**Application resource APIs:** Users, Accounts, Organizations,
Developers, Agents, credentials, provider registrations, Workbench
state, etc.

**Trust/domain orchestration APIs:** trust state/history/evaluation,
domain evidence, simulations, simulation runs/results.

Exact endpoint shapes are a Day 10E design task.

------------------------------------------------------------------------

# 6. Extensible Provider Architecture

M2Oath has two first-class extension axes:

``` text
                       M2Oath
                         |
              +----------+----------+
              |                     |
        TRUST PROVIDERS       TRUSTED DOMAINS
          horizontal              vertical
              |                     |
      "Can this Agent       "What authoritative
       be trusted?"          domain evidence is
                              relevant now?"
```

## 6.1 Trust Providers

Reference: M2Oath Trust.

Future providers may include enterprise Agent governance, customer
private trust, partner/consortium trust, or other Agent trust
authorities.

Conceptual contract:

``` ts
interface TrustProvider {
  readonly providerId: string;
  getAgentTrustState(
    request: AgentTrustStateRequest
  ): Promise<AgentTrustState>;
}
```

## 6.2 Trusted Domain Providers

Reference: M2Oath Weather.

Future domains may include Finance, Logistics, Energy, Insurance,
Aviation, Agriculture, Manufacturing, and customer-specific authorities.

Conceptual contract:

``` ts
interface TrustedDomainProvider<TEvidence> {
  readonly providerId: string;
  readonly domain: string;
  getEvidence(
    request: TrustedDomainEvidenceRequest
  ): Promise<TEvidence>;
}
```

Exact contracts are designed in Day 10E.

## 6.3 Provider Registry

Raven should model provider ID, name, type, domain, endpoint,
authentication method, capabilities, schema/evidence version, health,
provenance characteristics, and supported transports.

Trust and Weather prove the abstraction; they must not be hard-coded
into Raven orchestration.

## 6.4 Adapter Responsibilities

Adapters own transport, authentication, serialization, timeout/retry,
capability discovery, translation, failure mapping, and provenance
propagation.

Adapters are not authorities.

------------------------------------------------------------------------

# 7. Service API + MCP Pattern

Authoritative M2Oath services should support a repeatable pattern:

``` text
                   DOMAIN / AUTHORITY
                          |
              +-----------+-----------+
              |                       |
         Service API             MCP Adapter
        HTTPS / JSON                  |
              |                       |
              v                       v
            Raven               AI / MCP clients
```

Examples:

``` text
m2oath-trust
  Trust Service API
  Trust MCP Adapter

m2oath-weather
  Weather Service API
  Weather MCP Adapter

future m2oath-finance
  Finance Service API
  Finance MCP Adapter
```

MCP is an interface to authority, not authority itself.

------------------------------------------------------------------------

# 8. Trust Container and Agent Access

## 8.1 Enforcement Path

The Trust Container accesses authoritative services through provider
contracts, initially likely backed by authenticated HTTP/JSON.

``` text
                 Trust Container
                       |
          +------------+------------+
          |                         |
 AgentTrustStateProvider    WeatherEvidenceProvider
          |                         |
          v                         v
   m2oath-trust              m2oath-weather
          |                         |
          +------------+------------+
                       v
                  TrustPolicy
                       |
                  ALLOW / DENY
                       |
                       v
            ProtectedOperationExecutor
```

The Agent does not decide whether it has enough trust.

## 8.2 Reasoning/Tool Path

The encapsulated Agent may separately use MCP:

``` text
AI Agent
  +--> MCP --> M2Oath Trust MCP
  +--> MCP --> M2Oath Weather MCP
```

That supports inspection, explanation, resources, and domain reasoning.

**MCP access never grants protected execution authority.**

## 8.3 Authentication

Cross-service requests must support authenticated caller/Agent identity,
credentials or cryptographic proof, request ID, operation/context, and
authorization/provenance data as appropriate.

Existing identity, JWT, enrollment, cryptographic binding, rotation,
audit, and provenance mechanisms should be reused rather than bypassed.

------------------------------------------------------------------------

# 9. Evidence and Enforcement

Multiple authorities may contribute evidence to one protected operation:

``` text
                    protected operation
                           |
                           v
                    Trust Container
                           |
            +--------------+--------------+
            |              |              |
            v              v              v
        Agent Trust     Weather       Logistics
            |              |              |
            +--------------+--------------+
                           v
                  Executable TrustPolicy
                           |
                      ALLOW / DENY
                           |
                           v
              ProtectedOperationExecutor
```

Trust does not execute the operation. Weather does not execute it.
Logistics does not execute it. Raven does not execute it. Simulation
does not execute it.

Only the Trust Container / `ProtectedOperationExecutor` is the
protected-operation enforcement boundary.

Provider/evidence provenance should preserve provider identity,
authenticity, authority, freshness, model/version, applicability, and
evidence provenance, with provider credibility/trust added where
appropriate.

------------------------------------------------------------------------

# 10. Persistence Architecture

Initial logical databases:

``` text
MySQL
  m2oath_web
  m2oath_trust
  m2oath_weather
```

Least-privilege users:

``` text
raven_web_user  -> m2oath_web.* only
trust_user      -> m2oath_trust.* only
weather_user    -> m2oath_weather.* only
```

No cross-domain SQL access. Services communicate through authenticated
interfaces.

Later the three logical databases can move to separate physical database
servers without changing service contracts.

------------------------------------------------------------------------

# 11. Deployment and Scalability

## 11.1 Initial Pilot

Preferred starting topology:

``` text
                    INTERNET
                       |
                       v
              +------------------+
              |    DROPLET A     |
              | Caddy            |
              | m2oath-web       |
              | Raven / Nitro    |
              | m2oath-trust     |
              | m2oath-weather   |
              | separate Docker  |
              | containers       |
              +--------+---------+
                       |
                 private network
                       |
                       v
              +------------------+
              |    DROPLET B     |
              | MySQL            |
              | m2oath_web       |
              | m2oath_trust     |
              | m2oath_weather   |
              +------------------+
```

A managed MySQL service is equally compatible.

Do not put MySQL in the same container as an application service.

## 11.2 Horizontal Raven Scale

Raven should avoid authoritative process-local state:

``` text
                    Load Balancer
                         |
             +-----------+-----------+
             v           v           v
          Raven 1     Raven 2     Raven 3
             |           |           |
             +-----------+-----------+
                         |
               Web DB / Trust / Domains
```

## 11.3 Trust Scale

Trust application/API nodes can scale independently behind a load
balancer because authoritative state lives in persistence.

## 11.4 Weather Scale

Weather can separate API and workers:

``` text
                         Weather API
                              |
                              v
                       Weather Database
                              ^
             +----------------+----------------+
             |                |                |
       Forecast Worker  Observation Worker Verification Worker
```

## 11.5 Simulation Scale

Population simulation can later move behind a queue and dedicated
workers instead of consuming the normal Trust API process. Day 11
measurements should tell us when this is necessary.

## 11.6 MCP Scale

HTTP APIs and MCP adapters may initially share a service process but can
later scale independently.

## 11.7 Federation as Scale

Raven and Trust Containers can consume M2Oath-owned, customer-owned, and
third-party authorities. Scale therefore includes federation, not just
more CPUs.

## 11.8 Deployment Stages

  -----------------------------------------------------------------------
  Stage                   Deployment              Use
  ----------------------- ----------------------- -----------------------
  1                       application droplet +   development/pilot
                          database droplet        

  2                       Web/Raven, Trust,       early production
                          Weather separated as    
                          measurements require    

  3                       load-balanced services, significant production
                          workers, dedicated DBs  

  4                       multi-region services   large-scale trust
                          and external            network
                          distributed authorities 
  -----------------------------------------------------------------------

The architecture and contracts should not change between these stages.

------------------------------------------------------------------------

# 12. Trust Policy Workbench

The Workbench belongs to `m2oath-web`.

The browser must not import proprietary Trust implementation or
approximate Trust calculations.

Target:

``` text
Trust Policy Workbench
      |
      v
    Raven
      |
      v
M2Oath Trust Service API
      |
      v
Trust Simulation using real production Trust logic
      |
      +--> Trusted Domain evidence through authority-preserving interfaces
```

Raven orchestrates. Trust owns Trust algorithms/simulation. Domains own
their evidence.

The Workbench should display scenario, Agent, operation, model
parameters/version, trust evolution, raw activity vs effective evidence,
evidence count, effective weight, meaningful diversity, ALLOW/DENY,
reasons, timeline, WHY diagnostics, per-evidence contribution detail,
and model comparisons.

Workbench/simulation state never silently becomes production state.

------------------------------------------------------------------------

# 13. Developer-Pluggable Models

**Level 1:** configure M2Oath primitives such as thresholds, decay,
weights, diminishing returns, diversity, operation policies, and Trusted
Domain rules.

**Level 2:** custom executable TypeScript models/rules conforming to
public contracts.

Hosted M2Oath must not execute arbitrary uploaded TypeScript in Raven's
primary process. Custom code requires isolated workers with bounded
CPU/memory/time, restricted credentials/network, auditability, and
fail-closed behavior.

Lifecycle:

``` text
DRAFT
  -> SIMULATE
  -> ADVERSARIAL TEST
  -> INDIVIDUAL AGENT ANALYSIS
  -> POPULATION TEST
  -> COMPARE
  -> REVIEW
  -> APPROVE
  -> PUBLISH
  -> PRODUCTION TRUST CONTAINER
```

------------------------------------------------------------------------

# 14. Step 10 --- Remaining Days 10--15

Days 1--9 remain complete historical work. Day 9 anti-trust-farming
remains sealed.

**Day 10 = microscope. Day 11 = telescope.**

## Day 10 --- Simulation Framework + Trust Policy Workbench

Already completed:

-   contract/boundary inventory;
-   `@m2oath/trust-simulation`;
-   deterministic clock;
-   scenario/event contracts and validation;
-   usage runner;
-   behavioral runner;
-   composite runner;
-   policy checkpoints;
-   usage/behavioral/JSON-safe diagnostics;
-   Workbench projection;
-   canonical scenario library;
-   adversarial catalog;
-   Trusted Domain simulation seam;
-   Trusted Domain Composition scenario.

### Day 10E --- Platform Architecture and Boundary Extraction

**10E.1 --- Freeze the five-component topology.** **COMPLETE**

**10E.2 --- Design Raven.** **COMPLETE** Decide logical layers,
Nuxt/Nitro implementation, physical placement, whether existing
`apps/control-plane` evolves into Raven, APIs, application services,
authentication/authorization, provider registry, capabilities, health,
failures, provenance, persistence, and explicit prohibitions.

**10E.3 --- Define TrustProvider and TrustedDomainProvider contracts.**
**COMPLETE** Include identity, capabilities, health, errors/failure
semantics, provenance, and transport metadata.

**10E.4 --- Inventory `m2oath-agent`, `m2oath-web`, and
`mcp-workspace`.** **COMPLETE**

**10E.5 --- Produce migration/ownership matrix:** **COMPLETE** KEEP IN
AGENT / MOVE TO TRUST / MOVE TO WEATHER / MOVE TO RAVEN / SPLIT /
REVIEW.

**10E.6 --- Split public and proprietary Trust code in place.** Full
regression.

**10E.7 --- Establish `m2oath-trust`.** Extract authoritative Trust
implementation, Trust persistence, simulation/certification,
authenticated Service API, and optional MCP adapter. Full regression +
MySQL integration.

**10E.8 --- Recast `mcp-workspace` as `m2oath-weather`.** Preserve
working ingestion/verification/trust; add Weather Service API; retain
MCP as adapter. Full regression.

**10E.9 --- Establish Raven foundation.** Implement/evolve independently
deployable Nitro server with application services, Web repositories,
provider registry/adapters, and orchestration.

**10E.10 --- Establish database isolation.** Create/verify three logical
DBs, least-privilege users, and cross-database denial tests.

**10E.11 --- Integrate M2Oath Trust and Weather reference adapters.**

**10E.12 --- Full regression and architecture validation.**

### Day 10F --- Raven Simulation API

Expose authenticated Workbench simulation endpoints through the target
architecture: scenario selection, execution, result retrieval, JSON-safe
diagnostics, model/version identification, and Trusted Domain
orchestration. No protected-operation execution.

### Day 10G --- Trust Policy Workbench UI

Implement scenario selector, Run Simulation, Agent/operation view,
parameters/models, trust evolution chart, raw vs effective evidence,
evidence/effective-weight/diversity diagnostics, ALLOW/DENY, reasons,
timeline, WHY panel, point detail, and model comparison foundation.

### Day 10H --- Day 10 Integration and Seal

Prove browser has no proprietary Trust calculation; Raven orchestrates
rather than calculates authoritative Trust; simulation uses real
production Trust logic; domain evidence remains separate from
accumulated Agent trust; simulation cannot execute protected operations;
Trust Container remains enforcement authority; canonical scenarios run
through target architecture. Update docs/ADRs, regress, commit, and
seal.

## Day 11 --- Population-Scale Simulation

**Telescope.**

Target approximately one million simulated operations across many
Agents.

Measure throughput, memory, runtime, reconstruction cost,
trust-calculation cost, model population behavior, farming resistance,
operation diversity, authority concentration, stale reputation, failure
laundering, cold start, Trusted Domain usage, and worker/queue
requirements.

Use measurements to decide simulation deployment scaling.

## Day 12 --- Model Analysis, Calibration, and Comparison

Include model/version comparison, parameter sensitivity, thresholds,
decay, weighting, diminishing returns, diversity, measurable
false-positive/false-negative tradeoffs, operation-specific behavior,
population segments, Trusted Domain policy interactions, and
reproducibility.

## Day 13 --- Adversarial Testing and Certification

Expand the canonical attack suite into repeatable certification:
success-volume farming, failure laundering, fake diversity,
cross-operation farming, authority farming, outage/cold-start behavior,
replay, conflicting duplicates, domain-evidence separation,
derived-trust non-recursion, combined attacks, and new attacks
discovered in Days 11--12.

Sandbox custom executable models before accepting arbitrary developer
code.

## Day 14 --- Operationalization and Production Readiness

Include service health, observability, metrics, logging, provider
health, timeout/retry policy, fail-closed behavior, credentials, secret
rotation, backups/restores, migrations, rate limits, queue/worker
design, incident handling, outage semantics, API versioning, MCP
operations, production hardening, uptime monitoring, deployment, and DNS
readiness.

## Day 15 --- Integration, Benchmark, Demonstration, and Step 10 Seal

Include end-to-end validation, public `m2oath-agent` isolation proof,
Raven/Trust/Weather integration, DB isolation, Trust Container
enforcement proof, population benchmark, adversarial/certification
summary, model comparison, research/benchmark artifacts, MATB artifacts
where still applicable, Trust Laboratory/market demonstration, final
Workbench demonstration, architecture/security docs, full regression,
and final Step 10 commit/tag/seal.

Day 15 extends the Workbench; it does not replace Day 10 Workbench work.

------------------------------------------------------------------------

# 15. Extraction Work Plan

1.  **Architecture first:** reconcile this spec, Raven architecture, and
    ADRs.
2.  **Inspect:** existing Web control-plane, Agent packages, Weather
    workspace.
3.  **Classify:** component-by-component ownership matrix.
4.  **Refactor in place:** public vs proprietary Trust; persistence
    store-by-store.
5.  **Regress.**
6.  **Extract Trust.**
7.  **Regress.**
8.  **Recast Weather.**
9.  **Regress.**
10. **Establish/evolve Raven.**
11. **Establish DB isolation.**
12. **Integrate Trust + Weather adapters.**
13. **Prove public Agent independence and protected-operation
    boundaries.**

Classification questions:

``` text
Developer needs it to construct/run Trust Container? -> m2oath-agent
Establishes authoritative M2Oath trust/identity?      -> m2oath-trust
Establishes Weather evidence/semantics?               -> m2oath-weather
Serves/orchestrates hosted application APIs?          -> Raven
Defines hosted user/account/product experience?       -> m2oath-web
```

Initial package classification:

  ---------------------------------------------------------------------
  Package                            Initial destination
  ---------------------------------- ----------------------------------
  `@m2oath/agent`                    Agent

  `@m2oath/sdk`                      Agent

  `@m2oath/mcp`                      Agent

  `@m2oath/auth-jwt`                 Agent / review

  `@m2oath/cli`                      Agent / review

  `@m2oath/trust`                    split

  `@m2oath/trust-simulation`         Trust

  `@m2oath/persistence`              split/review

  `@m2oath/persistence-mysql`        primarily Trust; classify
                                     store-by-store

  `@m2oath/weather-trust`            Weather / review

  examples                           classify individually
  ---------------------------------------------------------------------

------------------------------------------------------------------------

# 16. Outstanding / Deferred Work Not to Lose

The architecture refactor is not the only remaining roadmap work.

## 16.1 Web account/Agent ownership workflow

Preserve the planned `DeveloperAgentRelationshipService` work:
`assignOwner`, `isOwner`, `listOwnedAgentIds`; finish/review the
Developer authentication/account gateway before registration; and
explicitly handle enrollment-success followed by ownership-write-failure
to avoid orphaned Agents.

Re-evaluate implementation under the new rule: `m2oath-web` owns
User/Account/product semantics; Raven implements the server-side
application service and persistence.

## 16.2 CI dependency enforcement

Add CI enforcement so public packages cannot accidentally import
proprietary Trust implementation.

## 16.3 Public-package extraction proof

Automate proof that public `m2oath-agent` installs/builds/tests and runs
a Trust Container with custom policies/providers without private
repositories/source/databases.

## 16.4 Hostile-runtime containment

Preserve stronger containment as future defense-in-depth without
widening the Agent-facing API or weakening the Trust Container boundary.

## 16.5 Weather precipitation trust

Preserve precipitation trust and precipitation-probability calibration
buckets; move them with the Weather domain.

## 16.6 Weather production/deployment TODOs

Preserve production environment example/documentation for ingestion
interval and maximum backfill, explanatory comments, private
production-env/git-ignore workflow, secrets management/rotation,
additional hardening, and external uptime monitoring.

## 16.7 Accumulated-trust white paper/research

Preserve the white paper work on weighted evidence, raw vs effective
evidence, thresholds, recency/decay, dedup/integrity, operation-aware
evidence, provisional safeguards, diminishing returns, and diversity.
Step 10 simulation results should strengthen it.

## 16.8 Blockchain compatibility seams

Future only; do not implement now. Preserve seams for signed
attestations, provenance integrity, Agent/third-party capability
provenance, cross-organization verification, and optional anchoring.
Blockchain never calculates trust or becomes execution authority;
factual/private evidence remains primarily off-chain.

## 16.9 Hosted authentication UX

Preserve M2Oath-branded Auth0/OIDC login/signup, reusable visual system,
`login_hint` email prefill where known, and the hard rule that M2Oath
never prefills/stores/injects/transmits passwords.

## 16.10 Broader Web/product backlog

Preserve but do not let it block Day 10E unless required: public
marketing pages, Trust Container visualization, Trusted Domains/Weather
Trust pages, Center-Pivot demo, SaaSKamp, Research, Trust Laboratory,
VitePress migration, enterprise/pilot funnel, final visual identity,
production deployment/DNS, analytics, CMS, email, API-reference
generation, and complete developer docs.

## 16.11 Custom model isolation

Before arbitrary hosted developer code: isolated workers, bounded
resources, restricted network/credentials, audit trail, reproducibility
where practical, fail-closed behavior.

## 16.12 Provider onboarding/security

The provider architecture creates explicit work for provider
registration, authentication, capabilities, health, schema/version
negotiation, provenance, provider credibility, timeout/failure
semantics, transport adapters, and third-party onboarding.

## 16.13 MCP security classification

Separate observational/read MCP capabilities from authoritative
mutations. Registration, lifecycle, cryptographic binding, evidence
ingestion, model publication, and administrative mutation require
explicit identity, authorization, audit, and provenance. An Agent must
never increase its own trust through MCP.

## 16.14 Documentation ownership cleanup

After extraction:

-   `m2oath-agent/docs` -\> public framework/runtime/contracts;
-   `m2oath-web/docs` -\> hosted product/Raven;
-   `m2oath-trust/docs` -\> authoritative Trust/service/simulation;
-   `m2oath-weather/docs` -\> Weather domain/evidence/operations.

Historical documents should not be cosmetically renamed unless
intentionally normalized.

------------------------------------------------------------------------

# 17. Superseded Assumptions

Earlier planning that placed proprietary Trust implementation or Trust
simulation directly inside Raven is superseded.

Current ownership:

-   Raven orchestrates and exposes hosted application APIs.
-   `m2oath-trust` owns Trust algorithms and Trust
    simulation/certification.
-   Trusted Domains own their evidence.
-   Workbench is a `m2oath-web` product surface.
-   Trust Container remains protected-operation enforcement authority.

Existing docs should be amended so contradictory earlier topology does
not survive silently.

------------------------------------------------------------------------

# 18. Required Architecture Tests

The extraction is not complete until tests prove:

1.  Raven cannot query Trust tables.
2.  Raven cannot query Weather tables.
3.  Trust cannot query Weather tables.
4.  Weather cannot query Trust tables.
5.  Weather evidence cannot mutate accumulated Agent trust.
6.  Simulation cannot mutate authoritative production trust state.
7.  Raven cannot execute protected Agent operations.
8.  Trust cannot execute protected Agent operations.
9.  Weather cannot execute protected Agent operations.
10. Simulation cannot execute protected Agent operations.
11. Only Trust Container / `ProtectedOperationExecutor` can execute
    protected operations.
12. Public Agent packages build without proprietary Trust.
13. Provider outage is not interpreted as empty evidence/zero trust.
14. Conflicting identity/evidence conditions fail closed where required.
15. MCP reasoning access cannot bypass provider/policy enforcement.
16. Provider transport does not change authority semantics.
17. Trust and Weather reference providers can be replaced by compatible
    implementations without modifying Raven orchestration core.

------------------------------------------------------------------------

# 19. Immediate Next Session

Do not begin by moving repositories.

1.  Place this specification in `m2oath-web/docs/`.
2.  Reconcile `M2OATH_RAVEN_ARCHITECTURE.md` and relevant ADRs.
3.  Inspect `m2oath-web/apps/control-plane` and Developer server routes.
4.  Decide whether control-plane evolves into `apps/raven`.
5.  Design framework-independent Raven provider contracts.
6.  Inventory `m2oath-agent`.
7.  Produce package/component ownership matrix.
8.  Inventory `mcp-workspace`.
9.  Produce Weather migration matrix.
10. Only then begin public/proprietary Trust separation.

Every extraction step should end green and committed before moving to
the next authority boundary.

------------------------------------------------------------------------

# 20. Final Target

``` text
                       M2Oath Trust Network

                              Raven
                                |
               +----------------+----------------+
               |                |                |
               v                v                v
         TRUST PROVIDERS   TRUSTED DOMAINS   CUSTOMER SERVICES
               |                |                |
         M2Oath Trust        Weather         Acme Trust
         Enterprise Trust    Finance         Acme Logistics
         Partner Trust       Logistics       Acme Finance
         Consortium Trust    Energy          Acme Safety
                             Insurance
                             Aviation

                                ^
                                |
                         Trust Container
                                |
                             AI Agent
```

Protected-operation decision:

``` text
Agent Trust
    +
Domain Evidence
    +
Operation Context
    +
Executable Policy
    |
    v
ALLOW / DENY
    |
    v
Trust Container
    |
    v
ProtectedOperationExecutor
```

This is the target M2Oath architecture: multiple independently
authoritative sources can contribute authenticated, provenance-bearing
trust and domain evidence, while only the developer-controlled Trust
Container determines whether the encapsulated Agent receives protected
execution authority.

------------------------------------------------------------------------

# 17. Day 10E.5 Boundary-Extraction Seal --- 2026-09-18

Day 10E.5 is **COMPLETE**.

## Public / Proprietary Boundary

`@m2oath/agent` retains public Trust contracts, executable TypeScript
policy/rule primitives, identity/lifecycle contracts, provider
contracts, behavioral evidence contracts, and generic developer-usable
implementations. Proprietary `@m2oath/trust` implements those public
contracts; the dependency must never reverse.

`@m2oath/persistence` remains public/local. Authoritative
`@m2oath/persistence-mysql` and `@m2oath/trust-simulation` move with
M2Oath Trust. `@m2oath/weather-trust` belongs with `m2oath-weather`.

## Raven Boundary

`apps/control-plane` is Raven's implementation predecessor. Raven must
replace direct Trust persistence/lifecycle composition with
authenticated remote Trust calls. Raven owns only Web product
persistence directly.

Raven adapters implement public `AgentTrustStateProvider` and
`ExternalTrustEvidenceProvider<TEvidence>` semantics rather than
introducing duplicate Raven-specific semantic provider interfaces.

## Database Ownership

``` text
Authority        Database          Access
Raven/Web        m2oath_web        m2oath_web only
M2Oath Trust     m2oath_trust      m2oath_trust only
M2Oath Weather   m2oath_weather    m2oath_weather only
```

No cross-authority SQL is permitted.

## Physical Migration Order

1.  Preserve public `@m2oath/agent`.
2.  Establish the `m2oath-trust` service boundary.
3.  Move Trust persistence/migrations with Trust.
4.  Prove Trust independently.
5.  Add Raven Trust remote adapter.
6.  Replace Raven in-process Trust lifecycle composition.
7.  Give Raven independent Web persistence.
8.  Remove Raven `@m2oath/persistence-mysql` dependency.
9.  Rewrite Raven integration tests around the service boundary.
10. Recast `mcp-workspace` as `m2oath-weather`.
11. Establish Weather Trusted Domain API.
12. Add Raven Weather adapter.
13. Establish isolated database grants.
14. Rename/evolve control-plane → Raven after extraction is proven.
15. Run full cross-repository regression.

## Extraction Gates

Raven, Trust, Weather, and simulation may not execute protected Agent
operations. Raven may not query Trust/Weather tables. Trust and Weather
may not query one another's databases. Weather evidence may not silently
mutate accumulated Agent trust. Provider outages may not be interpreted
as zero trust or empty evidence. Only the Trust Container /
`ProtectedOperationExecutor` grants protected execution.

**Next:** Day 10E.6 --- Refactor public vs. proprietary Trust boundary.
