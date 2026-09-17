# M2Oath Raven Architecture

**Document Type:** Hosted Server / Trust-Network Architecture\
**Status:** Draft V0.1 --- Target Engineering Architecture\
**Date:** 2026-09-16\
**Repository:** `m2oath-web` (architecture source of truth until
`m2oath-raven` exists)\
**Target Repository:** `m2oath-raven`\
**Related Documents:** `docs/ARCHITECTURE.md`,
`docs/ARCHITECTURE_DECISIONS.md`,
`m2oath-agent/docs/M2OATH_STEP_10_DAY_1_15_SEQUENCE.md`

------------------------------------------------------------------------

## 1. Purpose

This document defines the target engineering architecture of **M2Oath
Raven**.

Raven is the future trusted server-side application runtime and API host
for the M2Oath platform. It exposes authenticated application APIs,
composes proprietary M2Oath server capabilities, connects to Trusted
Domain services through explicit authenticated boundaries, and provides
specialized trust infrastructure such as simulation, diagnostics,
audit/history, and future Trust Model lifecycle operations.

The physical `m2oath-raven` repository does **not** yet exist. This
document defines the target boundary before implementation so Raven can
be created from an explicit authority and dependency model rather than
evolving accidentally from transport code.

The canonical engineering definition is:

> **M2Oath Raven is the trusted server-side application runtime and API
> host for the M2Oath platform. It exposes authenticated application
> APIs, including ordinary resource CRUD and specialized
> trust/simulation operations, and connects or orchestrates trusted
> server services through narrow authority-preserving interfaces.**

Raven is not the AI Trust Container and does not become
protected-operation execution authority.

------------------------------------------------------------------------

## 2. Current State and Target State

The current hosted backend exists in `m2oath-web` as:

``` text
m2oath-web/
└── apps/
    └── control-plane/
```

That application is a working hosted control-plane/API prototype. It
proves shared Developer/Agent state, authentication boundaries,
canonical Agent enrollment, ownership-scoped operations, and durable
hosted state.

It is the **architectural predecessor of Raven**, not a second permanent
backend that should coexist indefinitely with Raven.

Current proprietary implementation packages are also temporarily
colocated with public framework work while package boundaries are being
proven:

``` text
m2oath-agent
├── @m2oath/agent
│       public Trust Container contracts/runtime
│
├── @m2oath/trust
│       proprietary trust/control-plane implementation
│       temporary repository location
│
└── @m2oath/trust-simulation
        proprietary deterministic simulation engine
        temporary repository location
```

The target is:

``` text
m2oath-web
    │
    ├── Developer
    ├── Agent
    └── Trust Policy Workbench
             │
             ▼
        thin Nuxt BFF
             │
       authenticated REST / JSON
             │
             ▼
┌───────────────────────────────────────────────────────┐
│                    M2Oath Raven                       │
│                                                       │
│  hosted application/API/orchestration runtime         │
│                                                       │
│  ┌─────────────────────────────────────────────────┐  │
│  │ @m2oath/trust                                   │  │
│  │ identity • lifecycle • accumulated trust        │  │
│  │ provenance • policy services • persistence      │  │
│  └─────────────────────────────────────────────────┘  │
│                                                       │
│  ┌─────────────────────────────────────────────────┐  │
│  │ @m2oath/trust-simulation                        │  │
│  │ deterministic simulation • diagnostics          │  │
│  │ adversarial scenarios • Workbench projections   │  │
│  └─────────────────────────────────────────────────┘  │
│                                                       │
│  application services • API controllers               │
│  authentication/authorization integration             │
│  Trusted Domain registry/connectors                   │
│  audit/history/model-management APIs                  │
└───────────────────────┬───────────────────────────────┘
                        │
                authenticated service
                     boundaries
                        │
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
   M2Oath Weather    Finance       Logistics
          │             │             │
     M2Oath-hosted   customer      third-party
```

Physical extraction should occur after the implementation contracts are
stable enough that moving them is an extraction exercise rather than an
architectural redesign.

------------------------------------------------------------------------

## 3. Raven Is an Application Runtime, Not a Trust Algorithm

Raven and `@m2oath/trust` are different architectural concepts.

`@m2oath/trust` contains proprietary M2Oath trust/control-plane
implementation.

Raven is the network-facing server application/runtime that **hosts,
composes, secures, and exposes** that implementation.

``` text
                    m2oath-raven
                         │
       ┌─────────────────┼─────────────────┐
       │                 │                 │
       ▼                 ▼                 ▼
 API/controllers   application services  service adapters
                         │
                         ▼
                   @m2oath/trust
                         │
                         ▼
                 persistence/adapters
```

Trust algorithms must not be copied into Raven controllers, HTTP routes,
UI-specific services, or transport clients.

The same rule applies to simulation. Raven exposes simulation
operations, but `@m2oath/trust-simulation` remains the simulation engine
and exercises the real M2Oath trust implementation.

> **Raven orchestrates M2Oath. It does not redefine M2Oath.**

------------------------------------------------------------------------

## 4. Hosted Application Boundary

M2Oath web applications should not become independent backend systems.

The preferred path is:

``` text
Browser
   │
   ▼
Nuxt application
   │
   ▼
Nuxt server / thin BFF
   │
   │ authenticated request
   ▼
M2Oath Raven
```

The Nuxt BFF may:

-   maintain browser-facing session context;
-   protect browser credentials from direct backend exposure;
-   translate UI-friendly calls into typed Raven API requests;
-   preserve upstream authentication/authorization errors;
-   perform presentation-oriented aggregation where appropriate.

The Nuxt BFF must not:

-   issue canonical Agent identity;
-   calculate authoritative trust;
-   implement M2Oath lifecycle policy;
-   manufacture domain evidence;
-   reproduce simulation algorithms;
-   become a second control plane; or
-   execute protected Agent operations.

The long-term transition is:

``` text
CURRENT

Developer / Agent
       ↓
apps/control-plane


TARGET

Developer / Agent / Workbench
       ↓
thin Nuxt BFF
       ↓
M2Oath Raven
```

The existing control-plane client may evolve into or be replaced by a
Raven-oriented typed client once concrete API boundaries justify the
change. Naming should follow implementation rather than forcing a
premature transport refactor.

------------------------------------------------------------------------

## 5. Raven API Classes

Raven exposes more than one kind of operation. These should remain
conceptually distinct even when they share HTTP infrastructure.

### 5.1 Application Resource APIs

Normal hosted application resources may include:

-   Developers;
-   Organizations;
-   Agents;
-   ownership and membership relationships;
-   API credentials;
-   Agent credential/binding metadata;
-   Trust Model metadata and configuration;
-   Trusted Domain registrations;
-   model versions;
-   administrative configuration; and
-   other hosted product resources.

Conceptually:

``` text
GET    /v1/agents
POST   /v1/agents
GET    /v1/agents/:agentId

GET    /v1/organizations
POST   /v1/organizations

GET    /v1/trust-models
POST   /v1/trust-models
```

These paths are illustrative, not frozen API contracts.

Ordinary resource operations still pass through application/service
boundaries. A security-sensitive lifecycle operation must not be reduced
to arbitrary SQL merely because an HTTP API resembles CRUD.

For example:

``` text
POST /v1/agents/:agentId/disable
            │
            ▼
Raven application service
            │
            ▼
authoritative lifecycle service
            │
       authorization
       state transition
       audit/provenance
```

### 5.2 Specialized Trust APIs

Raven may expose specialized operations such as:

-   accumulated trust retrieval;
-   trust history;
-   evidence history;
-   provenance;
-   audit;
-   Trust Model evaluation;
-   diagnostics;
-   policy/model metadata;
-   model-version comparison; and
-   future certification/adversarial-test results.

These APIs expose or orchestrate authoritative services. They do not
move trust calculation authority into HTTP controllers.

### 5.3 Simulation APIs

Raven is the correct network host for the Trust Policy Workbench
simulation boundary.

Conceptually:

``` text
GET  /v1/trust-simulations/scenarios
POST /v1/trust-simulations/run
```

Exact routes are deferred until Raven implementation begins.

------------------------------------------------------------------------

## 6. Trust Policy Workbench Architecture

The Trust Policy Workbench belongs to `m2oath-web`.

The deterministic simulation engine belongs on the trusted server side.

``` text
Trust Policy Workbench
        │
        │ scenario / model / parameters
        ▼
Nuxt thin BFF
        │
        │ authenticated REST / JSON
        ▼
Raven Simulation API
        │
        ▼
@m2oath/trust-simulation
        │
        ▼
@m2oath/trust
```

The browser receives JSON-safe simulation projections and visualizes
them.

It may display:

-   trust evolution;
-   raw activity versus effective evidence;
-   evidence count;
-   effective evidence weight;
-   meaningful diversity;
-   usage trust;
-   behavioral trust;
-   composite trust;
-   ALLOW/DENY decisions;
-   decision reasons;
-   evidence contribution diagnostics;
-   event/evaluation timelines;
-   attack behavior;
-   stale/replayed evidence effects; and
-   Trusted Domain evidence presented independently from accumulated
    behavioral trust.

The browser must not approximate, recalculate, or reinterpret
authoritative trust mathematics.

The governing product principle is:

> **M2Oath should make Agent trust observable, not merely calculable.**

And the simulation principle is:

> **The simulation framework observes M2Oath. It does not redefine
> M2Oath.**

------------------------------------------------------------------------

## 7. Simulation Authority Boundary

Simulation is powerful but non-authoritative with respect to production
execution.

A simulation result may show:

``` text
ALLOW
```

or:

``` text
DENY
```

for a hypothetical evaluation checkpoint.

That result is a simulation observation. It does not itself grant or
revoke production Agent capability.

The simulation service may:

-   run deterministic Agent histories;
-   exercise production trust calculators;
-   exercise production policy/rule implementations;
-   produce diagnostics;
-   compare scenarios;
-   run adversarial attacks;
-   evaluate hypothetical operation checkpoints.

It may not:

-   invoke `ProtectedOperationExecutor` to perform a real protected
    operation;
-   silently mutate production Agent trust;
-   silently publish a Trust Model;
-   convert simulation state into production authorization;
-   bypass model review/approval; or
-   treat Workbench UI state as authoritative production configuration.

------------------------------------------------------------------------

## 8. Developer-Defined Trust Models

M2Oath should ultimately support developers testing their own Trust
Models.

There are two useful levels.

### 8.1 Configuration of Existing M2Oath Primitives

Developers may configure supported M2Oath mechanisms such as:

-   thresholds;
-   decay;
-   evidence weights;
-   authority weights;
-   diminishing returns;
-   diversity requirements;
-   provisional/cold-start rules;
-   operation-specific policies; and
-   Trusted Domain rules.

This can be represented through explicit validated model configuration.

### 8.2 Custom Executable Trust Logic

M2Oath's trust rules are programmable executable TypeScript objects
rather than merely a fixed data-driven rules language.

Future advanced developers may therefore supply executable Trust Model
components conforming to public M2Oath contracts.

However:

> **Raven must never execute arbitrary uploaded developer TypeScript
> inside its primary trusted server process.**

Custom executable code requires an isolated/sandboxed simulation worker
with:

-   a narrow serializable input/output contract;
-   bounded CPU and memory;
-   bounded execution time;
-   no Raven process memory access;
-   no database credentials;
-   no Raven service credentials;
-   no Trust Container execution credentials;
-   no unrestricted network access;
-   explicit package/module policy;
-   deterministic execution where required;
-   auditability; and
-   fail-closed worker termination.

Conceptually:

``` text
Raven
   │
   │ simulation job
   ▼
Isolated Simulation Worker
   │
   ├── approved public contracts
   ├── scenario/model input
   └── bounded simulation capability
   │
   ▼
JSON-safe result
   │
   ▼
Raven
```

The exact sandbox technology is deferred.

------------------------------------------------------------------------

## 9. Trust Model Lifecycle

A model should not move from editing directly into production.

The intended lifecycle is:

``` text
DRAFT POLICY / MODEL
        ↓
SIMULATE
        ↓
CANONICAL ADVERSARIAL TEST
        ↓
INSPECT INDIVIDUAL AGENT BEHAVIOR
        ↓
POPULATION SIMULATION
        ↓
COMPARE MODEL VERSIONS
        ↓
REVIEW
        ↓
APPROVE
        ↓
PUBLISH
        ↓
PRODUCTION TRUST CONTAINER
```

Day 10 establishes deterministic individual/scenario simulation and the
Workbench.

Large population simulation belongs to the subsequent scale phase rather
than being silently folded into the Day 10 engine.

Publication is an explicit authority transition. Changing a Workbench
control must never directly alter production enforcement.

------------------------------------------------------------------------

## 10. Canonical Adversarial Suite

The Day 9 anti-trust-farming work establishes the beginning of a
reusable M2Oath adversarial/certification suite.

Canonical attack classes include:

1.  success-volume farming;
2.  failure laundering;
3.  fake diversity;
4.  cross-operation farming;
5.  authority concentration/farming;
6.  outage versus cold-start confusion;
7.  provisional-state abuse by established Agents;
8.  evidence replay;
9.  conflicting duplicate evidence;
10. Trusted Domain evidence leaking into generic accumulated trust;
11. recursive use of derived trust artifacts; and
12. combined farming attacks.

Raven should eventually expose these scenarios through
simulation/certification APIs without reimplementing their trust
semantics.

A developer-defined Trust Model can then be tested against a stable
M2Oath adversarial corpus before publication.

Passing an adversarial suite is evidence about model behavior. It is not
by itself protected-operation execution authority.

------------------------------------------------------------------------

## 11. Raven and Trusted Domains

Trusted Domains are independent authorities for domain-specific evidence
and semantics.

Examples include:

``` text
M2Oath Weather
Finance
Logistics
Energy
Mobility
Insurance
Commerce
customer-defined domains
third-party domains
```

Raven is connective infrastructure between authenticated callers and
these services.

``` text
                    M2Oath Raven
                         │
                 Domain Registry
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
       Weather        Finance       Logistics
          │              │              │
       evidence        evidence       evidence
       semantics       semantics      semantics
       provenance      provenance     provenance
```

Raven may provide:

-   Trusted Domain registration;
-   service discovery;
-   endpoint metadata;
-   authentication configuration;
-   authenticated request orchestration;
-   request correlation;
-   timeout/error handling;
-   provenance transport;
-   domain capability metadata; and
-   audit visibility.

Raven must not reinterpret a domain's factual semantics as if Raven were
that domain authority.

------------------------------------------------------------------------

## 12. Deployment Topology Does Not Define Authority

An M2Oath-owned Trusted Domain may eventually run:

-   in the same deployment as Raven;
-   in another process;
-   in another container;
-   in another cluster;
-   in another M2Oath service;
-   or remotely.

A customer or third-party domain may also be remote.

None of those deployment choices changes the logical authority boundary.

> **Raven discovers, authenticates, connects to, and orchestrates
> Trusted Domain services. A Raven deployment may colocate M2Oath-owned
> domain services, but colocation does not collapse the service or
> authority boundary.**

Therefore:

``` text
Repository co-location != architectural coupling
Process co-location    != shared authority
Container co-location  != shared authority
Network separation     != automatically trusted
```

Authority comes from explicit contracts, authentication, authorization,
provenance, and policy---not from filesystem or deployment proximity.

------------------------------------------------------------------------

## 13. Trusted Domain Composition

A protected operation may depend on more than accumulated behavioral
trust.

Conceptually:

``` text
M2Oath behavioral trust
        │
        ▼
AgentTrustState
        ───────────────┐
                       │
                       ▼
                 executable policy
                       ▲
                       │
Trusted Domain         │
        │              │
        ▼              │
ExternalTrustEvidenceProvider<T>
        │
        ▼
TEvidence
        ───────────────┘
```

Raven may facilitate retrieval and transport of both categories of
server-side input, but they remain distinct.

Domain evidence must not silently increase:

-   accumulated behavioral trust score;
-   behavioral evidence count;
-   effective behavioral weight; or
-   behavioral operation diversity.

Domain evidence is presented to the policy according to its own
semantics.

> **The evidence is vertical. The method of trust is horizontal.**

------------------------------------------------------------------------

## 14. Narrow Trust Boundaries

M2Oath repeatedly places authority behind narrow interfaces.

### Protected execution

``` text
Production Agent
      │
      │ narrow IPC
      ▼
Trusted Host / AI Trust Container
```

### Trust and domain inputs

``` text
AI Trust Container
      │
      │ authenticated provider/service API
      ▼
Raven / M2Oath Trust / Trusted Domains
```

### Simulation

``` text
Trust Policy Workbench
      │
      │ authenticated REST / JSON
      ▼
Raven Simulation API
```

These boundaries have different security purposes. The Trusted Host
boundary protects actual execution. The Workbench boundary protects
analysis/simulation separation. Raven-to-domain boundaries preserve
service and evidence authority.

The common architectural principle is:

> **M2Oath places authority behind narrow trust boundaries. Agents,
> Trusted Domains, developer tools, and user interfaces exchange
> explicit requests, evidence, decisions, and diagnostics across those
> boundaries rather than importing or sharing authority.**

A related principle is:

> **Interfaces separate software. Authentication separates trust
> domains.**

An interface alone is not a trust boundary. Authentication,
authorization, provenance, and explicit authority semantics are required
when crossing independently trusted systems.

------------------------------------------------------------------------

## 15. Raven Does Not Execute Protected Agent Operations

This is a hard invariant.

Raven may:

-   authenticate callers;
-   authorize hosted application operations;
-   register Agents;
-   manage lifecycle workflows;
-   retrieve trust state;
-   calculate server-owned trust state through authoritative services;
-   retrieve Trusted Domain evidence;
-   run simulations;
-   expose diagnostics;
-   manage Trust Model lifecycle;
-   provide audit/history APIs; and
-   orchestrate service interactions.

Raven may **not** become the executor of the encapsulated Agent's
protected operation merely because it provided or coordinated the inputs
used in the decision.

The execution path remains:

``` text
M2Oath Trust State ───────┐
                          │
Domain Evidence ──────────┼──► Executable Trust Rules
                          │              │
Operation Context ────────┘              ▼
                                       Policy
                                         │
                                         ▼
                                     ALLOW / DENY
                                         │
                                         ▼
                              ProtectedOperationExecutor
                                         │
                                  only if permitted
                                         ▼
                                  Encapsulated Agent
```

`ProtectedOperationExecutor` remains inside the AI Trust Container
enforcement boundary.

------------------------------------------------------------------------

## 16. Authentication and Authorization

Raven is a trusted server application but must not equate authentication
with authority.

The invariant remains:

``` text
Authentication != Authorization
Authorization  != Trust
Identity       != Trust
```

Human Developer authentication, Agent Runtime authentication, service
authentication, and Trusted Domain authentication are distinct principal
classes.

Examples:

``` text
Developer Browser
    ↓ Auth0/OIDC
Developer Nuxt Session
    ↓ request-scoped credential
Raven
    ↓ M2Oath Developer identity resolution + authorization
Application operation
```

and:

``` text
Trust Container
    ↓ service credential
Raven
    ↓ authenticated Agent/service context
Trust-state request
```

and:

``` text
Raven
    ↓ domain/service credential
Trusted Domain
    ↓ domain-authoritative evidence
Raven / requesting trust path
```

JWT `scope`/`scp` claims remain authenticated claims unless an explicit
M2Oath authority mapping grants a capability.

------------------------------------------------------------------------

## 17. Persistence Boundary

Raven will ultimately compose proprietary persistence infrastructure,
but the database does not become policy authority.

``` text
Raven
   │
   ▼
@m2oath/trust / authoritative application services
   │
   ▼
persistence adapters
   │
   ▼
durable database
```

Persistence stores durable facts and transaction state.

It does not independently decide:

-   canonical identity policy;
-   lifecycle policy;
-   authorization;
-   trust policy;
-   Trusted Domain semantics; or
-   protected-operation execution.

Existing persistence engineering may be physically extracted with the
proprietary server implementation when repository boundaries are
finalized.

------------------------------------------------------------------------

## 18. API and Service Design Rules

Raven APIs should follow these rules:

1.  use explicit versioned contracts;
2.  authenticate every authority-bearing service boundary;
3.  preserve caller identity as security context rather than ordinary
    payload data;
4.  distinguish authentication failures from authorization failures;
5.  never accept client-supplied canonical Agent identity as proof of
    identity;
6.  keep HTTP/controllers thin;
7.  delegate lifecycle and trust behavior to authoritative services;
8.  keep domain-specific semantics outside generic Raven core;
9.  carry sufficient provenance for trust/evidence operations;
10. return JSON-safe diagnostics to presentation clients;
11. fail closed when required authoritative evidence is unavailable;
12. distinguish evidence outage from legitimate empty/cold-start state;
13. never expose server credentials to browsers;
14. never allow simulation endpoints to execute protected production
    operations; and
15. preserve future service extraction through narrow interfaces.

------------------------------------------------------------------------

## 19. Raven as Trust Infrastructure for the AI Machine Economy

Raven's long-term opportunity is larger than a conventional SaaS
backend.

AI Agents acting economically may need to establish trust across
organizations and specialized domains before high-impact operations can
proceed.

For example:

``` text
AI Agent requests high-value logistics transaction
                       │
                       ▼
                  M2Oath Raven
                       │
        ┌──────────────┼─────────────────┐
        ▼              ▼                 ▼
 M2Oath Trust      Weather Domain    Finance Domain
 identity/history  route/weather     financial authority
 behavioral trust  evidence          evidence
        │              │                 │
        └──────────────┼─────────────────┘
                       │
                  trust inputs
                       ▼
                AI Trust Container
                       │
                executable policy
                       │
                  ALLOW / DENY
                       │
                       ▼
              protected operation
```

Raven can provide the authenticated API and orchestration fabric through
which those authorities are discovered and accessed.

This supports a higher-level vision:

> **M2Oath Raven is trust infrastructure for the AI Machine Economy when
> understood as the trusted API and orchestration fabric connecting
> machine participants to M2Oath trust services, Trusted Domains,
> simulation/certification infrastructure, and cross-organization trust
> evidence.**

The qualification matters. Raven is not itself every evidence authority,
and it does not replace the Trust Container's execution boundary.

------------------------------------------------------------------------

## 20. Future Cross-Organization Trust

The Raven architecture should preserve seams for future
cross-organization verification.

Potential future capabilities include:

-   signed trust attestations;
-   signed domain evidence;
-   service identity;
-   cross-organization provenance;
-   evidence-integrity verification;
-   portable certification artifacts;
-   trust-model/version identifiers;
-   organization-scoped trust policy;
-   optional blockchain anchoring of hashes or attestations.

Blockchain, if used, complements the architecture.

It must not:

-   calculate M2Oath trust;
-   become canonical Agent identity authority;
-   expose private factual evidence unnecessarily;
-   replace Trusted Domain evidence authority; or
-   become protected-operation execution authority.

Private and factual evidence should remain primarily off-chain.

------------------------------------------------------------------------

## 21. Target Repository Boundary

When created, the initial Raven repository should be a focused trusted
server application rather than an immediate dumping ground for every
proprietary package.

Conceptually:

``` text
m2oath-raven/
├── apps/
│   └── raven/
│       └── trusted Node/API runtime
│
├── packages/
│   ├── trust/
│   ├── trust-simulation/
│   ├── persistence/
│   ├── persistence-mysql/
│   └── server-specific adapters/contracts as justified
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API.md
│   └── SECURITY.md
│
├── package.json
└── pnpm-workspace.yaml
```

This is a target shape, not a frozen repository tree.

Extraction should preserve package boundaries and tests. It should not
require rewriting trust algorithms.

Public packages that developers require to construct and run Trust
Containers remain outside the proprietary Raven repository.

------------------------------------------------------------------------

## 22. Migration Strategy

The migration should be incremental.

### Stage 1 --- Prove contracts

Continue proving `@m2oath/trust` and `@m2oath/trust-simulation`
boundaries without introducing cross-repository friction prematurely.

### Stage 2 --- Create Raven

Create the `m2oath-raven` repository with a minimal trusted Node/API
runtime, health endpoint, authentication/composition structure, tests,
and documentation.

### Stage 3 --- First Raven vertical slice

Use Trust Policy Workbench simulation as a strong first specialized
Raven API:

``` text
Workbench
   ↓
Nuxt BFF
   ↓
Raven
   ↓
trust-simulation
   ↓
trust
```

This proves the browser/proprietary boundary without requiring protected
Agent execution.

### Stage 4 --- Migrate hosted control-plane operations

Move the durable hosted application responsibilities currently proven by
`m2oath-web/apps/control-plane` behind Raven.

Avoid running two independent canonical control planes.

### Stage 5 --- Extract proprietary packages

Move server-owned trust, simulation, persistence, lifecycle, provenance,
and related implementation to the Raven repository when dependency
direction is stable.

### Stage 6 --- Connect Trusted Domains

Add the domain-neutral registry/connector boundary and connect M2Oath
Weather as the first reference domain.

### Stage 7 --- Advanced model lifecycle

Add adversarial certification, model comparison, isolated custom-model
simulation workers, review/approval, and publishing infrastructure.

------------------------------------------------------------------------

## 23. Security Invariants

Every Raven implementation must preserve:

``` text
Authentication != Authorization
Authorization != Trust
Identity != Trust

Developer Identity != Agent Identity
Developer Credential != Agent Runtime Credential

Agent Trust != Domain Trust Evidence
Domain Evidence != Execution Authority
Domain Controller != ProtectedOperationExecutor

Simulation Result != Production Authority
Workbench State != Production Trust Model
Model Draft != Published Model

Trust Rule != ProtectedOperationExecutor
Raven != ProtectedOperationExecutor
@m2oath/trust != ProtectedOperationExecutor
Trusted Domain != ProtectedOperationExecutor

Public Trust Container != Proprietary Raven Runtime
Repository Co-location != Architectural Coupling
Deployment Co-location != Shared Authority
Service Orchestration != Authority Transfer
```

Additional invariants:

1.  Raven does not duplicate trust algorithms.
2.  Raven does not duplicate Trusted Domain semantics.
3.  Raven does not execute arbitrary developer code in its primary
    process.
4.  Raven does not silently promote simulation state into production.
5.  Raven does not expose backend credentials to browser clients.
6.  Raven does not permit a domain to bypass Trust Container
    enforcement.
7.  Raven preserves canonical identity and lifecycle authorization
    boundaries.
8.  Raven preserves evidence provenance across service boundaries.
9.  Raven treats authoritative-evidence outage differently from valid
    empty evidence.
10. Raven keeps protected execution local to the Trust Container.

------------------------------------------------------------------------

## 24. Governing Architecture

The target M2Oath architecture is:

``` text
                 DEVELOPERS / ORGANIZATIONS
                           │
                           ▼
                    M2Oath Web
       Developer • Agent • Trust Policy Workbench
                           │
                     thin Nuxt BFF
                           │
                           ▼
════════════════════════════════════════════════════════════
                 HOSTED TRUST/API BOUNDARY
════════════════════════════════════════════════════════════
                           │
                           ▼
                    M2Oath Raven
                API / orchestration fabric
                           │
       ┌───────────────────┼────────────────────┐
       │                   │                    │
       ▼                   ▼                    ▼
@m2oath/trust    @m2oath/trust-simulation  Trusted Domains
       │                   │               │    │    │
 identity              scenarios         Weather Finance ...
 lifecycle             diagnostics
 behavioral trust      adversarial tests
 accumulated trust
 provenance
 persistence
       │                   │                    │
       └───────────────────┼────────────────────┘
                           │
                    authoritative inputs
                           │
                           ▼
════════════════════════════════════════════════════════════
              DEVELOPER / CUSTOMER RUNTIME
════════════════════════════════════════════════════════════
                           │
                           ▼
                   AI TRUST CONTAINER
                     @m2oath/agent
                           │
                  executable policy
                           │
                     ALLOW / DENY
                           │
                           ▼
                ProtectedOperationExecutor
                           │
                    only if permitted
                           ▼
                    Encapsulated Agent
```

The core authority rule is:

> **Raven may authenticate, expose, compose, coordinate, simulate,
> diagnose, and orchestrate. M2Oath Trust remains authoritative for
> M2Oath trust state. Trusted Domains remain authoritative for their
> domain evidence and semantics. The AI Trust Container remains
> authoritative for final protected-operation enforcement.**

------------------------------------------------------------------------

## 25. Governing Principles

The Raven architecture is governed by five principles:

> **Raven orchestrates M2Oath. It does not redefine M2Oath.**

> **The simulation framework observes M2Oath. It does not redefine
> M2Oath.**

> **The evidence is vertical. The method of trust is horizontal.**

> **Interfaces separate software. Authentication separates trust
> domains.**

> **M2Oath places authority behind narrow trust boundaries. Agents,
> Trusted Domains, developer tools, and user interfaces exchange
> explicit requests, evidence, decisions, and diagnostics across those
> boundaries rather than importing or sharing authority.**

And above all:

> **Neither Raven, M2Oath Trust, nor a Trusted Domain may bypass the AI
> Trust Container. Protected Agent execution occurs only through the
> Trust Container's `ProtectedOperationExecutor` boundary.**
