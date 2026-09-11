# M2Oath Web Development Roadmap

**Document Type:** Engineering Development Roadmap  
**Status:** Active  
**Date:** 2026-09-11  
**Repository:** `m2oath-web`  
**Current Checkpoint:** Phase 8 FINAL CHECKPOINT — Developer OIDC/session, canonical Developer Account, ownership, recovery, lifecycle authorization, secure external-identity linking, route/session hardening, and branded authentication UX are implemented; final full-workspace validation remains before Phase 8 is marked complete  
**Related Documents:** `docs/WEBSITE_REQUIREMENTS.md`, `docs/ARCHITECTURE.md`, `docs/ARCHITECTURE_DECISIONS.md`

---

## 1. Purpose

This roadmap defines the ordered implementation path for the M2Oath hosted product and the transition to the long-term M2Oath Trust architecture.

It translates product requirements and engineering architecture into development phases while preserving three distinct system responsibilities:

```text
m2oath-agent
    public/npm developer framework
    constructs and runs AI Trust Containers
    owns local protected-operation enforcement

m2oath-trust
    proprietary server-side trust platform
    registration, canonical identity, lifecycle,
    behavioral/accumulated trust, provenance,
    policy services, credentials, persistence, APIs

Trusted Domain services
    domain-specific evidence and semantics
    m2oath-weather is the first reference domain
```

These components may be developed in the same repository temporarily. Repository co-location is a development convenience, not an architectural coupling. Package and dependency boundaries must permit `m2oath-agent` and `m2oath-trust` to be physically separated later without redesign.

The roadmap is implementation-oriented. It should be updated as milestones are completed or architectural decisions change.

---

## 2. Governing Development Principle

Every phase must preserve the separation between server-side authority inputs and local protected-operation enforcement.

```text
                         @m2oath/agent
                      AI TRUST CONTAINER
                              │
                    policy + ALLOW / DENY
                              │
                    ProtectedOperationExecutor
                              │
══════════════════════════════╪══════════════════════════════
                       NETWORK BOUNDARY
══════════════════════════════╪══════════════════════════════
                              │
                 ┌────────────┴────────────┐
                 ▼                         ▼
            m2oath-trust             Trusted Domains
         proprietary service       domain evidence/semantics
```

`m2oath-trust` is authoritative for M2Oath server-side identity, lifecycle, behavioral/accumulated trust, provenance, and related trust state.

Trusted Domain servers are authoritative for evidence and semantics within their domains.

The AI Trust Container remains authoritative for local policy evaluation and final protected-operation enforcement for its encapsulated Agent.

Neither M2Oath Trust nor a Trusted Domain server may bypass `ProtectedOperationExecutor`.


## 3. Current Platform Baseline

Current repository structure:

```text
m2oath-web/
├── apps/
│   ├── web/
│   ├── developer/
│   ├── agent/
│   ├── control-plane/
│   └── docs/
├── packages/
│   └── control-plane-client/
└── docs/
```

Current technologies:

```text
Nuxt 4
Nuxt UI
VitePress
TypeScript
pnpm
Vitest
Node.js
```

Current hosted application package names:

```text
@m2oath/web
@m2oath/developer
@m2oath/agent-web
@m2oath/control-plane
@m2oath/docs
@m2oath/control-plane-client
```

---

# Phase 0 — Repository and Application Foundation

**Status:** COMPLETE

## Goals

Establish the independent hosted-platform repository and application boundaries.

## Completed

- created separate `m2oath-web` repository;
- established pnpm workspace;
- created public Nuxt application;
- created Developer Nuxt application;
- created Agent Nuxt application;
- created VitePress documentation application;
- established Nuxt UI as the initial UI baseline;
- established light/dark appearance support;
- normalized workspace scripts;
- configured generated output exclusions;
- established independent package name `@m2oath/agent-web`;
- kept hosted platform separate from `m2oath-agent`.

## Validation

Root workspace supports:

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

---

# Phase 1 — Initial Application Routing

**Status:** COMPLETE

## Public Application

Implemented:

```text
/
```

## Developer Application

Implemented:

```text
/
/agents/new
```

## Agent Application

Implemented:

```text
/
/agents
/agents/:agentId
```

## Documentation

VitePress configured with:

```text
base: /docs/
```

for future:

```text
developer.m2oath.com/docs/
```

## Result

The durable public, Developer, Agent, and documentation application boundaries now exist.

---

# Phase 2 — Shared Control-Plane Client

**Status:** COMPLETE

## Goal

Prevent individual hosted applications from implementing ad hoc control-plane HTTP logic.

## Implemented

Created:

```text
packages/control-plane-client
```

Package:

```text
@m2oath/control-plane-client
```

Current operations:

```text
registerAgent()
getAgent()
listAgents()
```

Current HTTP endpoints:

```text
POST /v1/agents
GET  /v1/agents
GET  /v1/agents/:agentId
```

## Security Boundary

The client does not:

- issue canonical identity;
- authenticate principals;
- authorize operations;
- calculate trust;
- implement lifecycle policy;
- execute protected operations.

It is a typed transport boundary only.

## Validation

Current baseline:

```text
5 tests passing
```

---

# Phase 3 — Shared Control Plane and First Vertical Slice

**Status:** COMPLETE — ARCHITECTURE SCAFFOLD

## Goal

Prove that Developer and Agent applications observe one shared authoritative server state.

## Implemented

Created:

```text
apps/control-plane
```

Package:

```text
@m2oath/control-plane
```

Current API:

```text
GET  /health
POST /v1/agents
GET  /v1/agents
GET  /v1/agents/:agentId
```

Implemented temporary:

```text
InMemoryAgentStore
```

with server-side development Agent IDs such as:

```text
agt_000001
```

## Developer Integration

Implemented:

```text
Developer Browser
    ↓
POST /api/agents/register
    ↓
Developer Nuxt Server
    ↓
@m2oath/control-plane-client
    ↓
Shared Control Plane
```

## Agent Integration

Implemented:

```text
Agent Browser
    ↓
Agent Nuxt Server
    ↓
@m2oath/control-plane-client
    ↓
Shared Control Plane
```

for:

```text
/agents
/agents/:agentId
```

## Manual Acceptance Proof

Registered:

```text
Weather Agent
```

Control plane issued:

```text
agt_000001
```

Agent application retrieved the same record:

```text
Display Name:       Weather Agent
Canonical Agent ID: agt_000001
Status:             active
```

## Security Property Proven

The browser does not manufacture canonical Agent ID.

The Agent URL identifier is treated as requested input and resolved through the shared server authority.

## Test Baseline

Control-plane API:

```text
5 tests passing
```

Control-plane client:

```text
4 tests passing
```

Full workspace:

```text
pnpm test       GREEN
pnpm typecheck  GREEN
pnpm lint       GREEN
pnpm build      GREEN
```

## Git Checkpoint

```text
5cc41ca  Update 09-07-2026 4:38pm
```

---

# Phase 4 — Automated Cross-Application Acceptance Proof

**Status:** COMPLETE

## Result

Automated acceptance coverage now proves:

> **An Agent registered through the Developer path can be retrieved through the Agent path using the same M2Oath-issued canonical Agent ID.**

The test uses the shared control-plane boundary and protects against Developer/Agent divergence without moving identity authority into either Nuxt application.

---

# Phase 5 — Authoritative M2Oath Integration Boundary

**Status:** COMPLETE

## Result

The hosted control plane now delegates registration through a stable M2Oath package/service boundary:

```text
m2oath-web Control Plane
    ↓
M2OathAgentRegistrationGateway
    ↓
@m2oath/sdk
    ↓
Authoritative M2Oath lifecycle services
```

Canonical Agent IDs are issued by M2Oath enrollment rather than by the hosted web layer. Creator provenance, identity/binding semantics, and lifecycle authorization remain M2Oath-owned.

The hosted control plane remains the composition root; no speculative `createM2OathSdk()` factory was introduced.

---

# Phase 6 — Authoritative Agent Registration and Developer Security Boundary

**Status:** COMPLETE

## Goal Achieved

Replace temporary hosted identity issuance with authoritative M2Oath enrollment and protect `agent.create` with real Developer authentication and lifecycle authorization.

## Implemented Flow

```text
Developer Browser
    ↓ enrollment facts only
Developer Nuxt Server
    ↓ private Bearer credential
@m2oath/control-plane-client
    ↓
POST /v1/agents
    ↓
@m2oath/auth-jwt
    ↓ signature + issuer + audience verification
Authenticated Developer Principal
    ↓
Exact-principal M2Oath lifecycle authorization
    ↓ agent.create
M2OathSdk.registerAgent()
    ↓
Authoritative M2Oath Enrollment
    ↓
canonical agt_<UUID>
```

## Security Properties Proven

- canonical Agent ID is issued by M2Oath;
- browser cannot choose Agent ID;
- Developer authentication is request-scoped;
- Bearer authentication stays out of the registration payload;
- real RS256 JWT verification is covered by integration tests;
- a JWT signed by an untrusted key is rejected;
- JWT `scope` / `scp` does not automatically become M2Oath authority;
- exact authenticated Developer principal authorization controls `agent.create`;
- missing Bearer credential returns 401;
- failed authentication returns 401;
- authenticated but unauthorized Developer returns 403;
- Developer credential remains distinct from Agent Runtime identity and trust evidence;
- registration remains fail-closed.

## Developer Application Integration

At the Phase 6 checkpoint, the Developer Nuxt server used a configured private Developer token as a temporary hosting seam. Phase 8 subsequently replaced that seam with interactive Auth0/OIDC login and a Nuxt server-side Developer session while preserving the same request-scoped control-plane authentication boundary.

## Validation

September 8, 2026 workspace checkpoint:

```text
@m2oath/control-plane-client   5/5 tests
@m2oath/control-plane         12/12 tests
Total                         17/17 tests

pnpm typecheck                GREEN
pnpm test                     GREEN
pnpm build                    GREEN
```

Phase 6 coding is complete.

---

# Phase 7 — Persistent Control-Plane State

**Status:** COMPLETE

## Goal

Replace process-local hosted control-plane state with persistent authoritative
storage while preserving M2Oath service authority.

## Persistence Foundation — COMPLETE

The required persistence architecture was initially implemented in the
`m2oath-agent` repository through `@m2oath/persistence-mysql`.

This implementation remains valid completed engineering work. Under the governing
architecture, however, server-side persistence belongs long-term to proprietary
`m2oath-trust`, not to the public Trust Container SDK. Its current repository
location is transitional and must not be treated as the permanent public package
boundary.

Checkpoint:

```text
75b9e58  Update 09-08-2026 2:16pm
```

The reusable package persists:

- canonical Agent identity;
- lifecycle state;
- external identity bindings;
- cryptographic bindings;
- registration provenance;
- lifecycle audit evidence;
- general Agent audit evidence; and
- factual usage/outcome history.

It also provides atomic enrollment and cryptographic-rotation persistence
boundaries and real-MySQL control-plane reconstruction coverage.

## Hosted Control-Plane Integration — COMPLETE

The hosted control plane now consumes the reusable MySQL persistence boundary
through `@m2oath/persistence-mysql`.

Canonical Agent registration and lifecycle state are persisted through
authoritative M2Oath services and durable MySQL transaction boundaries.

The hosted Agent list and detail paths no longer depend on a process-local
directory or duplicate hosted copy of Agent identity state. They read through
the domain-neutral `AgentIdentityDirectory` boundary backed by
`MysqlAgentIdentityStore`.

The hosted architecture is now:

```text
Developer / Agent Apps
        |
        v
Shared Hosted Control Plane
        |
        v
Authoritative M2Oath Services
        |
        v
@m2oath/persistence-mysql
        |
        v
Hosted MySQL Infrastructure
```

## Restart-Survival Proof — COMPLETE

A real-MySQL hosted integration test proves that registered Agent state survives
hosted control-plane reconstruction. The test registers an Agent through the
hosted registration gateway, creates a fresh hosted composition against the same
MySQL database, and verifies that both Agent detail and Agent list reconstruct
the same canonical Agent from durable state.

Hosted integration validation:

```text
@m2oath/control-plane
    hosted restart-survival integration
    1 test file / 1 test passed

Proven:
    - hosted registration persists canonical Agent state in MySQL
    - a fresh hosted composition reconstructs Agent detail
    - a fresh hosted composition reconstructs the Agent list
    - hosted Agent reads do not depend on process-local identity state
```

## Requirements

Hosted persistence supports:

- canonical Agent identity;
- lifecycle state;
- external identity bindings where applicable;
- cryptographic bindings;
- registration provenance;
- lifecycle audit evidence.

The persistence implementation also supports factual usage/outcome history.
Future `m2oath-trust` persistence/read models must support, as the corresponding
M2Oath contracts mature:

- behavioral evidence;
- derived/reconstructable trust state where appropriate;
- policy evidence;
- Trusted Domain references.

## Constraint

Persistence is an implementation behind authoritative M2Oath services.

The database itself does not become identity-policy, authorization, trust,
policy, or protected-operation execution authority.

## Exit Criteria — SATISFIED

Reconstructing the hosted control plane does not lose registered Agent state or
require previous process-local hosted directory objects to recover canonical
identity and lifecycle data.

---

# Phase 8 — Developer Login, OIDC, Session, and Agent Ownership Experience

**Status:** FINAL CHECKPOINT — IMPLEMENTATION AND FOCUSED SECURITY COVERAGE COMPLETE; FULL WORKSPACE VALIDATION PENDING

## Goal

Replace the configured server-side Developer-token seam with a real interactive Developer authentication/session experience and establish the M2Oath-owned Developer Account and Developer→Agent ownership model without weakening the request-scoped control-plane security boundary.

## Implemented / Proven

The current implementation proves:

```text
Developer Browser
    ↓
Auth0 / OIDC Login or Signup
    ↓
Nuxt Developer Session / Short-Lived Credential
    ↓
Developer Nuxt Server
    ↓
request-scoped Developer Bearer JWT
    ↓
Hosted Control Plane
    ↓
canonical M2Oath Developer Account
    ↓
Developer-account lifecycle authorization
    ↓
canonical Agent registration
    ↓
Developer → Agent owner relationship
    ↓
ownership-scoped Agent list/detail
```

Completed Phase 8 work includes:

- signed-out Developer landing experience;
- Auth0 OIDC sign-in and signup routes;
- stable canonical M2Oath Developer Account resolution;
- Developer dashboard and centralized auth middleware for protected pages;
- Agent registration and persisted Developer→Agent `owner` relationship;
- ownership-scoped Agent detail and My Agents list;
- sign-out/sign-in with owned Agent state preserved;
- automated Developer→Agent ownership acceptance coverage;
- registration recovery/idempotency when Agent creation succeeds before ownership persistence;
- Developer-account/role/policy lifecycle authorization replacing the temporary configured-subject seam;
- real-MySQL proof that active Developers may register while missing/disabled Developers are denied;
- secure external Auth0 identity linking to one canonical Developer Account;
- idempotent same-Developer linking and conflict rejection when an external identity belongs to another Developer;
- normal sign-in through a newly linked identity resolving to the same canonical Developer Account;
- `/auth/link` session guard so signed-out callers cannot start the linking flow;
- automated regression coverage for the `/auth/link` session guard;
- malformed/missing secondary-link credential rejection and unauthenticated primary-request rejection;
- conflict UX mapping to a Developer-facing link-failed state;
- Auth0 Universal Login M2Oath branding for login/signup;
- shared light/dark M2Oath logo assets in the Developer header; and
- explicit decision not to use OIDC `login_hint` where it could confuse multi-identity linking.

The Developer Account is a M2Oath-owned application/domain identity and remains distinct from the Auth0 identity and from canonical Agent identity. External identities are issuer/subject bindings; email is profile data rather than canonical identity.

Developer roles, status, Agent ownership, and lifecycle authority are M2Oath-owned state, not authority inferred directly from Auth0 claims.

## Authentication Presentation

The Developer Portal now uses a baseline M2Oath visual identity and branded Auth0 Universal Login. A future enhancement may synchronize Auth0 light/dark presentation with the Nuxt color-mode toggle. That theme value is presentation-only and must not affect authentication, canonical identity, authorization, ownership, token issuance, session security, or Trust Container policy.

The same branded authentication experience may later support other human M2Oath account types using server-side sessions without requiring an M2Oath API JWT in browser code.

## Remaining Work

1. run the final full-workspace Phase 8 checkpoint (`pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build` as supported by the workspace);
2. fix any regressions discovered by that checkpoint;
3. remove temporary/backup artifacts if any remain; and
4. commit and push the completed Phase 8 checkpoint.

After the full checkpoint is green, change this phase status to **COMPLETE** and begin Phase 9.

## Security Constraint

The login/session layer must not place Developer credentials in enrollment payloads, reuse Developer credentials as Agent Runtime credentials, convert JWT scopes into automatic M2Oath authority, use email as canonical Developer identity, or allow external-identity linking without independently authenticated existing and new identities.

## Architectural Interpretation

The current hosted `apps/control-plane` is an implementation/prototype predecessor of the future proprietary `m2oath-trust` service. Phase 8 should be completed in place before a physical repository/service extraction is attempted.

---


# Phase 9 — Public Trust Container / Proprietary Trust Service Separation

**Status:** PLANNED — ARCHITECTURAL DECISION ACCEPTED

## Goal

Turn the newly established architecture into enforceable package and service boundaries without prematurely forcing a physical repository split.

The target architecture is:

```text
PUBLIC / npm
@m2oath/agent
    AI Trust Container runtime
    protected-operation enforcement
    trust/evidence provider contracts
    executable trust-rule/policy contracts
    portable integration adapters

                    authenticated APIs
                           │
═══════════════════════════╪════════════════════════════════
                    NETWORK BOUNDARY
═══════════════════════════╪════════════════════════════════
                           │
              ┌────────────┴─────────────┐
              ▼                          ▼
       PROPRIETARY M2OATH          TRUSTED DOMAINS
          m2oath-trust             m2oath-weather
                                   future domains
```

## Work Track A — Package Classification

Inventory the existing M2Oath packages, classes, stores, services, and examples and classify each as:

```text
PUBLIC TRUST CONTAINER
PROPRIETARY TRUST SERVICE
SHARED CONTRACT
```

Do not rewrite working implementations merely because their current physical location is transitional.

## Work Track B — Dependency Direction

Establish enforceable dependency rules:

- public `m2oath-agent` packages must not depend on proprietary `m2oath-trust` implementations;
- public packages must not depend on server-side persistence implementations;
- public packages must not depend on Trusted Domain server implementations;
- proprietary services may implement or consume stable public/shared contracts where appropriate; and
- introduce a separate shared-contract package only if actual dependency pressure demonstrates that it is necessary.

## Work Track C — M2Oath Trust Service Boundary

Establish `m2oath-trust` as the long-term home for server-side concerns including:

- Developer accounts and ownership relationships;
- Agent registration and canonical identity authority;
- lifecycle management;
- credential and cryptographic-binding management;
- behavioral evidence/history;
- accumulated-trust computation/state;
- provenance and audit;
- hosted policy management/distribution;
- persistence/database adapters;
- authenticated service APIs; and
- administration/commercial service concerns.

## Work Track D — Trusted Domain Controller Interface

Define and implement a domain-neutral server-side interface and registry through which Trusted Domain controllers can be added without modifying M2Oath core trust logic.

Conceptual contract:

```ts
export interface TrustedDomainController<TRequest, TEvidence> {
  readonly domain: string

  getEvidence(request: TRequest): Promise<TEvidence>
}
```

The exact API is an implementation decision for this phase.

Required properties:

- domain controllers own domain-specific evidence and semantics;
- evidence includes appropriate provenance;
- adding a new domain does not add domain-specific conditionals to generic M2Oath trust code;
- domain controllers never gain protected-operation execution authority;
- M2Oath-hosted and third-party domains can use the same architectural seam; and
- `m2oath-weather` becomes the first reference implementation.

## Work Track E — Trust Container Network Inputs

Preserve the two explicit Trust Container trust-input paths:

```text
m2oath-trust
    ↓
AgentTrustStateProvider
    ↓
AgentTrustState
    ──────────────┐
                  │
                  ▼
             Trust Policy
                  ▲
                  │
Trusted Domain    │
    ↓             │
ExternalTrustEvidenceProvider<T>
    ↓
TEvidence
    ──────────────┘
```

Executable TypeScript rules evaluate Agent trust state, domain evidence, and operation context as configured. Rules decide; `ProtectedOperationExecutor` enforces.

## Repository Strategy

`m2oath-agent` and `m2oath-trust` may remain in one repository during this phase.

The governing requirement is independent extractability, not immediate physical separation.

The existing `mcp-workspace` may later host/deploy `m2oath-trust` and `m2oath-weather`, but it must not be modified until these package and service boundaries are proven.

## Exit Criteria

Phase 9 is complete when:

1. existing code is classified by long-term ownership;
2. dependency direction is documented and enforced;
3. public Trust Container packages have no proprietary implementation dependencies;
4. the `m2oath-trust` server responsibility is explicit in code/package composition;
5. the Trusted Domain controller interface/registry exists;
6. Weather can integrate through the generic domain seam;
7. Trust Container network/provider contracts are explicit;
8. working registration/lifecycle/persistence behavior survives the separation unchanged; and
9. the eventual repository split can be performed as an extraction rather than a redesign.

---


# Phase 10 — Agent Identity and Provenance Experience

**Status:** PLANNED

## Goal

Expand the Agent detail page from the current identity proof into an authoritative identity/lifecycle view.

## Target Information

```text
Canonical Agent ID
Display Name
Lifecycle Status
Registration Time
Creator Provenance
External Identity Bindings
Cryptographic Bindings
Current Key ID
Binding Status
Rotation History
```

## Requirements

The UI displays authoritative data returned by the control plane.

It must not infer or manufacture lifecycle or cryptographic state.

---

# Phase 11 — Lifecycle Operations

**Status:** PLANNED

## Initial Operations

Implement Developer-authorized or appropriate management flows for:

```text
agent.rotate-key
agent.disable
```

## Required Key-Rotation Behavior

Key rotation:

- preserves canonical Agent ID;
- preserves accumulated history;
- revokes/retires the previous binding as designed;
- creates the replacement binding;
- records lifecycle/audit evidence.

## Required Disable Behavior

Disable:

- does not delete canonical identity;
- does not erase behavioral history;
- prevents executable identity use according to authoritative policy;
- records lifecycle/audit evidence.

## Future Operations

Contracts may later expose:

```text
agent.configure
agent.recover
agent.delete
```

only when their semantics are fully implemented.

---

# Phase 12 — Agent Runtime Authentication Visibility

**Status:** PLANNED

## Goal

Expose operational visibility into Agent Runtime authentication without turning the web application into the runtime security authority.

## Governing Runtime Path

```text
Agent Runtime JWT
    ↓
Protected Server
    ↓
Cryptographic JWT Verification
    ↓
Resolve (issuer, subject)
    ↓
Canonical M2Oath Agent ID
    ↓
Authorization
    ↓
Trust Evaluation
    ↓
Trust Container Enforcement
```

## UI Direction

The Agent application may eventually display:

- active identity binding;
- issuer;
- credential/key identifier;
- last authenticated activity;
- authentication failures;
- lifecycle status.

Private key material must never be displayed or transmitted as ordinary management data.

---

# Phase 13 — Behavior and Usage

**Status:** PLANNED

## Goal

Expose factual Agent behavior without prematurely converting facts into trust conclusions.

## Factual Data Model Direction

The UI may present:

```text
AgentOperationIntent
AgentOperationOutcome
AgentBehaviorVerification
AgentBehaviorMetrics
```

## Governing Principle

> **Usage is historical fact. Trust is an interpretation of historical evidence under a policy.**

Behavioral records should not be rewritten as authoritative trust conclusions in presentation code.

---

# Phase 14 — Accumulated Agent Trust

**Status:** PLANNED

## Goal

Expose authoritative accumulated trust state and its supporting evidence.

## Future Agent Route

```text
/agents/:agentId/trust
```

## Potential Views

- current trust state;
- evidence count;
- weighted evidence;
- operation-specific trust;
- recency;
- decay;
- diversity;
- provisional trust;
- trust changes over time;
- evidence sufficiency.

## Constraint

The UI visualizes authoritative trust results.

It does not calculate the authoritative trust state.

---

# Phase 15 — Evidence

**Status:** PLANNED

## Future Route

```text
/agents/:agentId/evidence
```

## Evidence Dimensions

Behavioral evidence may include:

1. execution outcome;
2. authorization compliance;
3. constraint compliance;
4. resource compliance;
5. independent outcome verification.

## Future Protections

Expose evidence in ways that support understanding of:

- weighting;
- recency;
- diversity;
- deduplication;
- integrity;
- operation relevance;
- anti-trust-farming safeguards.

---

# Phase 16 — Policy Outcomes

**Status:** PLANNED

## Future Route

```text
/agents/:agentId/policy
```

## Goal

Show how authoritative policy interpreted trust/evidence for requested operations.

## Required Distinction

```text
Trust Data
    ↓
Executable TypeScript Rule Object
    ↓
Policy / Evaluator
    ↓
ALLOW / DENY
    ↓
Trust Container Enforcement
```

Policy decides.

Policy does not gain protected-operation execution authority.

---

# Phase 17 — Trusted Domains Product Experience

**Status:** PLANNED — SERVER INTERFACE ESTABLISHED EARLIER IN PHASE 9

## Future Route

```text
/agents/:agentId/trusted-domains
```

## Goal

Display external/domain evidence relevant to Agent operations while preserving the domain-neutral M2Oath boundary established by the server-side Trusted Domain controller interface.

## Architecture

```text
Trusted Domain Server
    ↓
TrustedDomainController
    ↓
domain evidence + provenance
    ↓
network/service boundary
    ↓
ExternalTrustEvidenceProvider<T>
    ↓
Trust Container Policy
    ↓
ALLOW / DENY
    ↓
ProtectedOperationExecutor
```

## Governing Principle

> **Domain systems determine the meaning and quality of evidence within their domains. The AI Trust Container determines whether the Agent may execute under its configured M2Oath policy.**

The product experience must not imply that a domain server or `m2oath-trust` remotely executes the protected Agent operation.

---

# Phase 18 — Weather Trusted Domain

**Status:** PLANNED

## Goal

Use Weather as the first concrete Trusted Domain experience.

Potential public route:

```text
/trusted-domains/weather
```

Potential Agent experience:

```text
/agents/:agentId/trusted-domains
```

with Weather evidence where applicable.

## Evidence May Include

```text
Temperature
Relative Humidity
Wind
Precipitation
Forecast Provider
Model
Location
Lead Time
Sample Count
Evidence Sufficiency
Historical Accuracy
```

## Constraint

Weather remains the first reference Trusted Domain.

Weather must integrate through the generic Trusted Domain controller/provider seams. Weather logic must not leak into generic M2Oath identity, authorization, behavioral-trust, accumulated-trust, policy, or Trust Container code.

The Weather server remains authoritative for Weather evidence and Weather-specific trust semantics. It does not become protected-operation execution authority.

---

# Phase 19 — KPIs and Operations

**Status:** PLANNED

## Future Routes

```text
/agents/:agentId/kpis
/agents/:agentId/operations
/agents/:agentId/usage
```

## Goal

Provide an operational picture of:

- requested operations;
- protected executions;
- denied executions;
- authorization outcomes;
- trust-policy outcomes;
- verification;
- usage;
- operation-specific performance;
- relevant KPIs.

The UI must distinguish factual operational metrics from trust interpretation.

---

# Phase 20 — Public Product Foundation

**Status:** PLANNED

## Public Site

Build the durable `m2oath.com` experience.

Initial content:

- homepage;
- Trust Container;
- Machine Authority;
- Accumulated Agent Trust;
- Trusted Domains;
- Weather Trust;
- solutions;
- Developers;
- research;
- SaaSKamp;
- enterprise/pilot pathway.

## Priority Message

> **Trust before execution.**

The site should explain the category before requiring implementation knowledge.

---

# Phase 21 — Public Developer Documentation

**Status:** STARTED / PLANNED EXPANSION

## Existing

VitePress application exists and builds.

## Next Documentation Areas

```text
Getting Started
Core Concepts
Trust Architecture
Identity
Trusted Domains
Integrations
Examples
Security
Research
API Reference
```

Internal engineering documents in root `docs/` should be distilled into stable public documentation rather than copied wholesale.

---

# Phase 22 — Interactive Trust Demonstration

**Status:** PLANNED

## Goal

Provide an interactive explanation of:

```text
Agent Trust
    +
Trusted Domain Evidence
    ↓
Policy
    ↓
ALLOW / DENY
    ↓
Protected Action
```

The first flagship physical-world demonstration should use center-pivot irrigation.

Visitors should be able to change an evidence condition and see the authoritative decision concept transition between ALLOW and DENY.

The demo must not imply that the Agent grants itself authority.

---

# Phase 23 — Trust Laboratory

**Status:** FUTURE

## Goal

Create a richer research and simulation environment for:

- accumulated trust;
- malicious behavior;
- trust farming;
- evidence decay;
- diversity;
- policy calibration;
- false ALLOW;
- false DENY;
- convergence;
- Trusted Domain changes;
- benchmark results.

This phase should wait until the underlying trust simulation and benchmark work is sufficiently mature.

---

# Phase 24 — SaaSKamp Experience

**Status:** FUTURE

## Goal

Build the ecosystem pathway:

```text
JOIN
  ↓
LEARN
  ↓
BUILD
  ↓
VALIDATE
  ↓
FOUND
  ↓
FUND
```

Potential areas:

- Open Source Kamp;
- contributor tracks;
- Opportunity Lab;
- Paid Pilots;
- Contributor Passport;
- maintainer pathway;
- employment opportunities;
- venture pathway.

M2Oath and SaaSKamp remain conceptually distinct.

Open-source contribution does not automatically create equity or investment rights.

---

# Phase 25 — Production Hardening

**Status:** FUTURE

Production readiness will require deliberate work across:

- deployment architecture;
- TLS;
- origin controls;
- CSP;
- secure cookies;
- CSRF protection;
- secret management;
- credential rotation;
- OIDC configuration;
- persistent database security;
- audit retention;
- rate limiting;
- abuse controls;
- observability;
- backups;
- disaster recovery;
- service health;
- uptime monitoring;
- dependency/security scanning;
- production test strategy.

Production hardening must be treated as an explicit phase rather than inferred from a successful development scaffold.

---

# Phase 26 — Branding and Shared Presentation System

**Status:** DEFERRED FOR FULL DESIGN SYSTEM — BASELINE BRANDING ESTABLISHED

## Current Decision

Continue using Nuxt UI as the baseline while retaining the lightweight M2Oath branding already introduced during Phase 8:

- transparent light- and dark-theme M2Oath logo assets in the Developer header;
- M2Oath-branded Auth0 Universal Login;
- current Nuxt green/slate/Public Sans presentation as a provisional baseline; and
- no speculative shared UI package until reuse is concrete.

A future Auth0 theme synchronization enhancement may carry light/dark presentation context from Nuxt into Auth0-supported Universal Login customization. This is a presentation concern only.

Do not build a speculative design system while the product architecture is still expanding.

## Future Work

When broader branding is intentionally scheduled, centralize:

- M2Oath logo;
- typography;
- colors;
- design tokens;
- iconography;
- diagram language;
- navigation conventions;
- reusable presentation components.

Shared packages should be introduced only where reuse is real.

---

# Current Immediate Work Queue

The current ordered engineering queue is:

```text
1. Run final Phase 8 full-workspace validation and cleanup
2. Commit/push Phase 8 as COMPLETE when green
3. Classify existing code: PUBLIC TRUST CONTAINER / PROPRIETARY TRUST SERVICE / SHARED CONTRACT
4. Establish m2oath-agent ↔ m2oath-trust dependency and API boundaries
5. Define TrustedDomainController interface and registry
6. Prove m2oath-weather through the generic domain seam
7. Extract/recompose server-side registration/lifecycle/persistence under m2oath-trust ownership
8. Agent identity + provenance + cryptographic binding UI
9. rotate-key and disable lifecycle operations
10. Agent runtime authentication visibility
11. Behavior / usage
12. Accumulated trust
13. Evidence
14. Policy outcomes
15. Trusted Domain product experience
16. Weather Trusted Domain product experience
17. KPIs / operations
18. Pre-publication physical repository separation
```

This order finishes the currently proven Developer workflow first, then establishes the package/network architecture before richer trust-product work.

The physical repository split is intentionally later than the architectural and package split.

---

# Checkpoint Discipline

At significant milestones:

```bash
git status --short

pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

Then inspect generated/untracked files before committing.

Do not commit generated Nuxt, VitePress, or TypeScript build output unless explicitly required.

Meaningful architectural milestones should be committed and pushed before beginning the next risky boundary change.

---

# Definition of Done for the Current Foundation

The original hosted-platform foundation is complete:

- separate `m2oath-web` repository exists;
- Public, Developer, Agent, Docs, and Control Plane applications exist;
- Developer and Agent use the same control-plane authority boundary;
- canonical Agent identity is server-owned;
- browser/URL identity is treated as input rather than authority;
- typed control-plane client exists;
- Developer → Agent identity flow has automated acceptance coverage;
- authoritative M2Oath enrollment is integrated;
- durable MySQL-backed Agent state is integrated;
- hosted control-plane reconstruction preserves canonical Agent state; and
- workspace regression has remained green at completed architectural checkpoints.

The active foundation work is at the final Phase 8 full-workspace checkpoint. Once green and committed, development moves to Phase 9 public Trust Container / proprietary Trust Service separation.

---

# Guiding Roadmap Rule

Do not optimize the hosted UI ahead of the authority architecture.

The implementation order should preserve:

```text
Identity
    ↓
Authentication
    ↓
Authorization
    ↓
Lifecycle
    ↓
Behavior / Evidence
    ↓
Trust
    ↓
Policy
    ↓
Protected Execution Visibility
```

while preserving the actual distributed M2Oath architecture:

```text
                 M2Oath Trust State
                        │
                        │
Trusted Domain Evidence┼──────┐
                        │      │
                        ▼      ▼
                 AI Trust Container
                        │
             Executable TypeScript Rules
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

The public Trust Container, proprietary M2Oath Trust service, and Trusted Domain services have different authorities and must remain independently evolvable.

The website should make M2Oath easier to use and understand without becoming the system that silently replaces M2Oath authority.

Before public npm/repository boundaries are finalized, `m2oath-agent` and proprietary `m2oath-trust` must be physically separable without architectural redesign.

