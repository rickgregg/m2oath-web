# M2Oath Raven Architecture

**Document Type:** Hosted Server / Trust-Network Architecture
**Status:** Draft V0.2 --- Target Engineering Architecture\
**Date:** 2026-09-17\
**Repository:** `m2oath-web`\
**Target Implementation:** M2Oath Raven in `m2oath-web`, preferably as
an independently deployable Nuxt/Nitro server application. The existing
`apps/control-plane` is the architectural predecessor and must be
inspected before creating a separate `apps/raven`. **Related
Documents:** `docs/ARCHITECTURE.md`, `docs/ARCHITECTURE_DECISIONS.md`,
`m2oath-agent/docs/M2OATH_STEP_10_DAY_1_15_SEQUENCE.md`

------------------------------------------------------------------------

## 1. Purpose

This document defines the target engineering architecture of **M2Oath
Raven** under the five-component M2Oath platform architecture:

1.  `m2oath-agent` --- public developer framework and AI Trust Container
    runtime;
2.  `m2oath-web` --- hosted product domain, including Users, Accounts,
    Organizations, Developers, portals, and the Trust Policy Workbench;
3.  **M2Oath Raven** --- hosted server/API/orchestration runtime,
    initially implemented with Nuxt/Nitro in `m2oath-web`;
4.  `m2oath-trust` --- authoritative horizontal Agent trust service;
5.  `m2oath-weather` --- first authoritative vertical Trusted Domain.

The canonical engineering definition is:

> **M2Oath Raven is the trusted server-side application, REST API, and
> orchestration runtime for the hosted M2Oath platform. It supports
> M2Oath Web application services and CRUD operations while providing
> extensible adapters for M2Oath Trust, additional Trust Providers, and
> Trusted Domain Providers.**

Raven is not the AI Trust Container, is not the authoritative M2Oath
Trust algorithm/service, is not a Trusted Domain authority, and does not
become protected-operation execution authority.

Raven's architectural role is stable even if its implementation
technology or repository placement changes. Nuxt/Nitro is the preferred
initial implementation technology, not part of the provider contracts
themselves.

------------------------------------------------------------------------

## 2. Current State and Target State

The current hosted backend exists in `m2oath-web` as
`apps/control-plane`. It is a working predecessor of Raven and proves
hosted Developer/Agent state, authentication boundaries, canonical Agent
enrollment, ownership-scoped operations, and durable application state.

Do **not** create a second permanent canonical backend beside it. Before
creating `apps/raven`, inspect `apps/control-plane` and decide whether
it should evolve/rename into Raven.

Current proprietary Trust implementation is temporarily colocated in
`m2oath-agent` while package boundaries are proven:

``` text
m2oath-agent
├── @m2oath/agent
│   └── public Trust Container contracts/runtime
├── @m2oath/trust
│   └── proprietary/authoritative M2Oath Trust implementation
└── @m2oath/trust-simulation
    └── proprietary deterministic simulation engine
```

The target state separates authority:

``` text
                         m2oath-web
             Users • Accounts • Organizations
          Developer • Agent • Trust Policy Workbench
                              │
                              ▼
                         M2Oath Raven
                    Nuxt/Nitro server runtime
                              │
               ┌──────────────┴──────────────┐
               │                             │
        TrustProvider                TrustedDomainProvider
               │                             │
               ▼                             ▼
         m2oath-trust                 m2oath-weather
       horizontal authority           vertical authority
               │                             │
               ▼                             ▼
         m2oath_trust                 m2oath_weather
              DB                            DB

Raven ───────────────────────────────► m2oath_web DB
```

`m2oath-trust` owns authoritative M2Oath Trust algorithms/state and
Trust simulation/certification. `m2oath-weather` owns Weather evidence
and semantics. Raven owns hosted application/API orchestration and its
Web application persistence.

Physical extraction should follow stable contracts and a component-level
ownership matrix rather than blind package movement.

------------------------------------------------------------------------

## 3. Raven Is an Application Runtime, Not a Trust Algorithm

Raven and `m2oath-trust` are different architectural authorities.

Raven is the network-facing hosted application/API/orchestration
runtime. M2Oath Trust is an independently authoritative horizontal Trust
service.

``` text
                    M2Oath Raven
                         │
          ┌──────────────┼──────────────┐
          │              │              │
    API/controllers  application   provider registry
                       services          │
                                         ▼
                                  TrustProvider
                                         │
                                         ▼
                                   m2oath-trust
```

Raven must not import/copy authoritative accumulated-trust algorithms
into controllers, routes, UI services, or orchestration code.

The same ownership rule applies to simulation:

``` text
Workbench → Raven → M2Oath Trust Service → Trust Simulation → real Trust logic
```

Raven exposes and orchestrates simulation operations; `m2oath-trust`
owns the simulation/certification infrastructure and authoritative Trust
implementation.

> **Raven orchestrates M2Oath. It does not redefine M2Oath.**

------------------------------------------------------------------------

## 4. Hosted Application Boundary and Nuxt/Nitro

`m2oath-web` owns the hosted product domain, including:

-   Users;
-   Accounts;
-   Organizations;
-   memberships;
-   Developer profiles;
-   account settings;
-   hosted Agent application resources;
-   Trust Policy Workbench product state;
-   hosted product administration.

The rule is:

> **M2Oath Web owns what hosted product resources mean. Raven owns how
> the server side serves and orchestrates them.**

Raven should initially be implemented with **Nuxt/Nitro** inside
`m2oath-web`, preferably as an independently deployable server
application.

``` text
Browser / Web UI
       │
       ▼
Nuxt application
       │
       ▼
Raven / Nitro HTTP boundary
       │
       ▼
Raven application services
       │
       ├── repositories ─────────────► m2oath_web
       ├── TrustProvider ─────────────► m2oath-trust
       └── TrustedDomainProvider ─────► m2oath-weather / others
```

Nitro may provide HTTP handlers, middleware, deployment/runtime
infrastructure, and browser-facing session integration. Core Raven
application and provider contracts must remain framework-independent; do
not leak `H3Event` or other Nitro-specific request types into those
contracts.

The existing Developer/Agent Nuxt BFF pattern may be simplified as Raven
evolves. The important boundary is not an extra network hop for its own
sake; it is that browser-facing code cannot acquire Trust/Domain
authority or backend service credentials.

Raven/Nitro may:

-   maintain browser-facing session context;
-   authenticate and authorize hosted application requests;
-   protect backend credentials;
-   invoke Raven application services;
-   expose typed REST/JSON contracts;
-   compose UI responses from multiple authorities.

It must not:

-   manufacture canonical Agent identity;
-   calculate authoritative accumulated Trust;
-   manufacture domain evidence;
-   reproduce simulation algorithms;
-   become a second competing control plane;
-   execute protected Agent operations.

------------------------------------------------------------------------

## 5. Raven API Classes

Raven has two primary API personalities even when both use the same
Nitro HTTP infrastructure.

### 5.1 Hosted Application Resource APIs

Resources may include:

-   Users;
-   Accounts;
-   Organizations;
-   memberships;
-   Developers;
-   Agents/application-resource metadata;
-   ownership relationships;
-   API credentials;
-   Trust Model metadata/configuration;
-   provider registrations;
-   Trusted Domain registrations;
-   Workbench projects/scenarios;
-   administrative configuration.

Illustrative routes:

``` text
GET/POST  /api/users
GET/POST  /api/accounts
GET/POST  /api/organizations
GET/POST  /api/agents
GET/POST  /api/credentials
GET/POST  /api/trust-models
GET/POST  /api/providers
GET/POST  /api/trusted-domains
GET/POST  /api/workbench/...
```

Exact routes are not frozen.

Security-sensitive lifecycle operations remain application/service
operations, not arbitrary SQL.

### 5.2 Trust and Domain Orchestration APIs

Illustrative operations:

``` text
GET/POST  /api/trust/state
GET       /api/trust/history
POST      /api/trust/evaluate

GET       /api/domains
POST      /api/domains/:domain/evidence

GET/POST  /api/simulations
POST      /api/simulations/:id/run
GET       /api/simulations/:id/results
```

These endpoints call authority-preserving providers/services. Raven does
not become the underlying Trust or Domain authority.

### 5.3 Composite APIs

A Raven endpoint may compose a UI response from multiple authorities.

Example Agent details:

``` text
Raven-owned application metadata ─────► m2oath_web
canonical identity / Trust state ─────► TrustProvider
Weather evidence ─────────────────────► TrustedDomainProvider
                                       │
                                       ▼
                               unified Raven DTO
```

A unified DTO does **not** imply unified authority.

------------------------------------------------------------------------

## 6. Trust Policy Workbench Architecture

The Trust Policy Workbench belongs to `m2oath-web`. The authoritative
Trust simulation engine belongs with `m2oath-trust`.

``` text
Trust Policy Workbench
        │
        │ authenticated REST / JSON
        ▼
M2Oath Raven
        │
        ▼
M2OathTrustAdapter / TrustProvider
        │
        ▼
m2oath-trust Service API
        │
        ▼
Trust Simulation / Certification
        │
        ▼
real M2Oath Trust implementation
```

When a simulation requires Trusted Domain evidence, Raven and the Trust
service must use an authority-preserving orchestration contract; domain
evidence remains independently authoritative and must not be folded into
accumulated behavioral trust.

The browser receives JSON-safe projections and may visualize trust
evolution, raw activity vs effective evidence, evidence
count/weight/diversity, usage/behavioral/composite Trust, ALLOW/DENY
decisions, reasons, diagnostics, timelines, attacks, stale/replayed
evidence, Trusted Domain evidence, and model/version comparisons.

The browser must not approximate or recalculate authoritative Trust
mathematics.

> **M2Oath should make Agent trust observable, not merely calculable.**

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

## 11. Raven Provider Architecture

Raven must support two first-class extension axes.

``` text
                         Raven
                           │
              ┌────────────┴────────────┐
              │                         │
        Trust Providers          Trusted Domains
         horizontal                 vertical
              │                         │
       Agent trust state         domain evidence
```

### 11.1 Trust Providers

The first reference Trust Provider is `m2oath-trust`.

Future examples may include enterprise Agent governance, customer
private Trust, partner Trust, or consortium authorities.

Conceptual contract:

``` ts
interface TrustProvider {
  readonly providerId: string;

  getAgentTrustState(
    request: AgentTrustStateRequest
  ): Promise<AgentTrustState>;
}
```

### 11.2 Trusted Domain Providers

The first reference Trusted Domain is `m2oath-weather`.

Future examples include Finance, Logistics, Energy, Mobility, Insurance,
Aviation, Agriculture, Manufacturing, customer domains, and third-party
domains.

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

These are conceptual contracts; exact types are a Raven design task.

### 11.3 Provider Registry

The registry should support:

-   provider identity/name/type;
-   domain where applicable;
-   endpoint;
-   authentication method;
-   capabilities;
-   evidence/schema version;
-   health;
-   provenance characteristics;
-   supported transports.

### 11.4 Provider Adapters

Adapters own transport, authentication, serialization, timeout/retry,
capability discovery, contract translation, failure mapping, and
provenance propagation.

Adapters are not authorities.

Reference providers prove the extensibility model. Raven core must not
contain provider-name conditionals for M2Oath Trust or Weather.

### 11.5 Service API and MCP

An authority may expose both:

``` text
Authority
   ├── authenticated Service API ───► Raven / Trust Container providers
   └── MCP Adapter ─────────────────► AI/MCP clients
```

MCP is an interface to authority, not the authority itself.

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

> **Database ownership follows authority ownership.**

> **Deployment topology does not collapse authority boundaries.**

> **M2Oath federates authorities rather than absorbing them.**

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

## 17. Persistence Boundary and Database Ownership

Database ownership follows authority ownership.

Initial physical deployment may use one MySQL server/container with
three logically isolated databases:

``` text
MySQL
├── m2oath_web
├── m2oath_trust
└── m2oath_weather
```

Use least-privilege database users:

``` text
raven_web_user  → m2oath_web.* only
trust_user      → m2oath_trust.* only
weather_user    → m2oath_weather.* only
```

Hard rules:

-   Raven must not SQL-query `m2oath_trust`;
-   Raven must not SQL-query `m2oath_weather`;
-   Trust must not SQL-query `m2oath_weather`;
-   Weather must not SQL-query `m2oath_trust`;
-   cross-authority communication occurs through authenticated service
    interfaces;
-   physical co-location does not collapse authority.

Persistence stores durable facts and transaction state. It does not
independently decide identity policy, lifecycle policy, authorization,
Trust policy, Domain semantics, or protected execution.

The logical boundaries permit later physical separation into dedicated
database servers/clusters without changing service contracts.

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

## 21. Target Repository and Ownership Boundary

Raven is currently targeted to remain in `m2oath-web`.

Conceptually:

``` text
m2oath-web/
├── apps/
│   ├── developer/
│   ├── agent/
│   └── control-plane or raven/   # decide after inspection
├── packages/
│   └── Raven/Web application contracts and clients as justified
└── docs/
    └── Raven + hosted platform architecture
```

Do not move `@m2oath/trust`, `@m2oath/trust-simulation`, or
authoritative Trust persistence into Raven merely because they are
proprietary. They belong with the `m2oath-trust` authority after
classification/extraction.

Likewise, Weather-specific implementation belongs with `m2oath-weather`.

Public packages developers require to construct/run Trust Containers
remain in the public `m2oath-agent` framework.

------------------------------------------------------------------------

## 22. Migration Strategy

Migration is incremental and test-gated.

### Stage 1 --- Freeze architecture and provider contracts

Reconcile platform/Raven ADRs, inspect the existing control-plane, and
define framework-independent TrustProvider/TrustedDomainProvider
contracts.

### Stage 2 --- Inventory and ownership matrix

Inventory `m2oath-agent`, `m2oath-web`, and `mcp-workspace`. Classify
components as KEEP IN AGENT, MOVE TO TRUST, MOVE TO WEATHER, MOVE TO
RAVEN, SPLIT, or REVIEW.

### Stage 3 --- Split Trust public/proprietary code in place

Preserve public developer contracts while isolating proprietary
authoritative implementation. Run full regression.

### Stage 4 --- Establish `m2oath-trust`

Extract authoritative Trust implementation, persistence,
simulation/certification, authenticated Service API, and optional MCP
adapter.

### Stage 5 --- Recast `mcp-workspace` as `m2oath-weather`

Preserve Weather ingestion, verification, evidence/trust, persistence,
and MCP; add authenticated Weather Service API and reposition MCP as an
adapter.

### Stage 6 --- Evolve the hosted control-plane into Raven

Use Nuxt/Nitro, application services, `m2oath_web` repositories,
provider registry, and reference Trust/Weather adapters. Avoid two
canonical backends.

### Stage 7 --- Establish database isolation

Create/verify the three logical databases, least-privilege users, and
cross-database denial tests.

### Stage 8 --- Connect Workbench and simulation

Workbench → Raven → M2Oath Trust Service. Preserve domain authority and
simulation non-authority.

### Stage 9 --- Advanced model lifecycle and provider ecosystem

Add adversarial certification, model comparison, isolated custom-model
workers, review/approval/publishing, and third-party provider
onboarding.

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
11. Raven does not directly query Trust or Trusted Domain databases.
12. Provider transport does not change provider authority semantics.
13. Reference Trust/Weather providers can be replaced by compatible
    providers without modifying Raven orchestration core.
14. Provider outage is distinct from legitimate empty evidence or
    cold-start state.
15. MCP reasoning/tool access cannot bypass provider/policy enforcement.

------------------------------------------------------------------------

## 23A. Deployment and Scalability

Authority boundaries are deliberately independent from deployment
topology.

### Initial pilot

``` text
                    INTERNET
                       │
                       ▼
              ┌──────────────────┐
              │    DROPLET A     │
              │ Caddy            │
              │ m2oath-web       │
              │ Raven / Nitro    │
              │ m2oath-trust     │
              │ m2oath-weather   │
              │ separate Docker  │
              │ containers       │
              └────────┬─────────┘
                       │ private network
                       ▼
              ┌──────────────────┐
              │    DROPLET B     │
              │ MySQL            │
              │ m2oath_web       │
              │ m2oath_trust     │
              │ m2oath_weather   │
              └──────────────────┘
```

A managed MySQL service is compatible with the same model.

### Horizontal Raven scaling

Raven should avoid authoritative process-local state and scale behind a
load balancer.

### Independent Trust scaling

Trust API/application nodes can scale independently against
authoritative Trust persistence.

### Independent Weather scaling

Weather can scale its API separately from forecast-ingestion,
observation-ingestion, and verification workers.

### Simulation scaling

Population-scale simulation should eventually use dedicated
workers/queues rather than consuming the normal Trust API process. Step
10 Day 11 measurements determine when this is necessary.

### MCP scaling

Service APIs and MCP adapters may initially share a process but can
later deploy independently without changing authority semantics.

### Federation as scale

Raven and Trust Containers may consume M2Oath-owned, customer-owned, and
third-party providers. M2Oath therefore scales not only by adding
infrastructure but by federating independently authoritative services.

### Deployment progression

1.  Application droplet + database droplet.
2.  Separate Web/Raven, Trust, or Weather compute when measurements
    justify it.
3.  Load-balanced services, dedicated workers, and dedicated databases.
4.  Multi-region and federated customer/third-party authorities.

The provider/service contracts must survive every stage unchanged in
their authority semantics.

------------------------------------------------------------------------

## 24. Governing Architecture

``` text
                  DEVELOPERS / ORGANIZATIONS
                           │
                           ▼
                       m2oath-web
      Users • Accounts • Developer • Agent • Workbench
                           │
                           ▼
                     M2Oath Raven
                Nuxt/Nitro API/orchestration
                           │
             ┌─────────────┴─────────────┐
             │                           │
       TrustProvider             TrustedDomainProvider
             │                           │
             ▼                           ▼
       m2oath-trust               m2oath-weather
       identity/trust             Weather evidence
       simulation/certification   domain semantics
             │                           │
             └─────────────┬─────────────┘
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

> **Raven may authenticate, expose, compose, coordinate, diagnose, and
> orchestrate. M2Oath Trust remains authoritative for M2Oath Trust state
> and Trust simulation/certification. Trusted Domains remain
> authoritative for their domain evidence and semantics. The AI Trust
> Container remains authoritative for final protected-operation
> enforcement.**

------------------------------------------------------------------------

## 24A. V0.2 Architecture Changes

V0.2 supersedes the earlier assumption that Raven directly hosts
proprietary Trust implementation and simulation as its authority.

Changes include:

-   Raven remains in `m2oath-web` for now;
-   Nuxt/Nitro is the preferred initial Raven implementation;
-   Users and Accounts are explicitly part of the `m2oath-web` product
    domain;
-   `m2oath-trust` becomes a distinct horizontal authority/service;
-   `m2oath-weather` becomes the first distinct Trusted Domain;
-   Raven gains first-class `TrustProvider` and `TrustedDomainProvider`
    extension axes;
-   Trust/Weather connect through authenticated provider/service
    boundaries;
-   Trust simulation/certification belongs to `m2oath-trust`,
    orchestrated by Raven;
-   persistence is split into `m2oath_web`, `m2oath_trust`, and
    `m2oath_weather`;
-   Raven cannot query Trust/Weather databases directly;
-   the deployment/scalability model explicitly supports independent
    service scaling, workers, database extraction, MCP scaling, and
    federation.

------------------------------------------------------------------------

## 25. Governing Principles

The Raven architecture is governed by five principles:

> **Raven orchestrates M2Oath. It does not redefine M2Oath.**

> **The simulation framework observes M2Oath. It does not redefine
> M2Oath.**

> **The evidence is vertical. The method of trust is horizontal.**

> **Interfaces separate software. Authentication separates trust
> domains.**

> **Database ownership follows authority ownership.**

> **Deployment topology does not collapse authority boundaries.**

> **M2Oath federates authorities rather than absorbing them.**

> **M2Oath places authority behind narrow trust boundaries. Agents,
> Trusted Domains, developer tools, and user interfaces exchange
> explicit requests, evidence, decisions, and diagnostics across those
> boundaries rather than importing or sharing authority.**

And above all:

> **Neither Raven, M2Oath Trust, nor a Trusted Domain may bypass the AI
> Trust Container. Protected Agent execution occurs only through the
> Trust Container's `ProtectedOperationExecutor` boundary.**

------------------------------------------------------------------------

## 22. Day 10E.5 Raven Boundary Seal --- 2026-09-18

Day 10E.5 is complete.

`apps/control-plane` is Raven's physical predecessor. It should evolve
into Raven after Trust authority is extracted; do not create a competing
permanent `apps/raven` first.

The principal current authority leak is the direct dependency on
`@m2oath/persistence-mysql`.

``` text
Raven Web persistence
    └── Raven-owned mysql2 infrastructure → m2oath_web

Raven Trust operations
    └── remote adapter → authenticated HTTPS → m2oath-trust
```

Raven retains Web product/resource authorization, then conveys delegated
lifecycle requests. M2Oath Trust remains authoritative for canonical
lifecycle transitions.

Raven adapters implement public M2Oath provider semantics rather than
duplicate them. Raven integration tests must stop manipulating
`m2oath_trust` tables directly.

The physical control-plane → Raven rename remains deferred until Day
10E.9.
