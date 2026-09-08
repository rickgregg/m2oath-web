# M2Oath Web Development Roadmap

**Document Type:** Engineering Development Roadmap  
**Status:** Active  
**Date:** 2026-09-08  
**Repository:** `m2oath-web`  
**Current Checkpoint:** Phase 6 implementation green; next Git checkpoint pending  
**Related Documents:** `docs/WEBSITE_REQUIREMENTS.md`, `docs/ARCHITECTURE.md`, `docs/ARCHITECTURE_DECISIONS.md`

---

## 1. Purpose

This roadmap defines the ordered implementation path for the M2Oath hosted web platform.

It translates the product requirements and engineering architecture into development phases while preserving the boundary between:

```text
m2oath-agent
    reusable open-source M2Oath framework

m2oath-web
    M2Oath-operated hosted platform
```

The roadmap is implementation-oriented. It should be updated as milestones are completed or architectural decisions change.

---

## 2. Governing Development Principle

Every phase must preserve:

> **The hosted platform is a management and observation surface over M2Oath authority. It is not a replacement authority system.**

The web platform may request, orchestrate, display, and manage authoritative operations.

Identity, authentication, authorization, trust, policy, and protected execution remain behind authoritative M2Oath boundaries.

---

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

The Developer Nuxt server holds the current configured Developer token in private runtime configuration and attaches it through `HttpControlPlaneClient`. The browser does not receive the token. This is an interim hosting/development seam; interactive Developer login/OIDC/session UX remains future work.

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

**Status:** PLANNED

## Goal

Replace process-local state with persistent authoritative storage.

## Requirements

Persistence must support at least:

- canonical Agent identity;
- lifecycle state;
- external identity bindings where applicable;
- cryptographic bindings;
- registration provenance;
- lifecycle audit evidence.

Future persistence must support:

- usage/outcome history;
- behavioral evidence;
- trust state;
- policy evidence;
- Trusted Domain references.

## Constraint

Persistence is an implementation behind authoritative M2Oath services.

The database itself must not become the policy or execution authority.

## Exit Criteria

Restarting the control plane does not lose registered Agent state.

---

# Phase 8 — Developer Login, OIDC, and Session Experience

**Status:** PLANNED — CONTROL-PLANE FOUNDATION COMPLETE

## Goal

Replace the current configured server-side Developer-token seam with a real interactive Developer authentication/session experience without changing the Phase 6 control-plane security boundary.

## Already Proven in Phase 6

```text
Bearer credential
    ↓
M2Oath JWT verification
    ↓
Authenticated Developer principal
    ↓
Exact-principal lifecycle authorization
    ↓
agent.create
```

Authentication and authorization failures already preserve 401/403 semantics, and Developer credentials remain separate from Agent Runtime credentials.

## Remaining Work

```text
Developer Browser
    ↓
OIDC Login
    ↓
Developer Session / Short-Lived Credential
    ↓
Developer Nuxt Server
    ↓
existing request-scoped control-plane authentication boundary
```

The login/session layer must not place Developer credentials in enrollment payloads or convert JWT scopes into automatic M2Oath authority.

---

# Phase 9 — Agent Identity and Provenance Experience

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

# Phase 10 — Lifecycle Operations

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

# Phase 11 — Agent Runtime Authentication Visibility

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

# Phase 12 — Behavior and Usage

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

# Phase 13 — Accumulated Agent Trust

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

# Phase 14 — Evidence

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

# Phase 15 — Policy Outcomes

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

# Phase 16 — Trusted Domains

**Status:** PLANNED

## Future Route

```text
/agents/:agentId/trusted-domains
```

## Goal

Display external/domain evidence relevant to Agent operations while preserving the domain-neutral M2Oath boundary.

## Architecture

```text
Domain Provider
    ↓
Domain Evidence
    ↓
ExternalTrustEvidenceProvider<T>
    ↓
M2Oath Policy
    ↓
ALLOW / DENY
```

## Governing Principle

> **Domain systems determine the meaning and quality of evidence within their domains. M2Oath determines whether the agent may execute.**

---

# Phase 17 — Weather Trusted Domain

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

Weather remains a reference/domain integration.

Weather logic must not leak into generic M2Oath identity, authorization, or trust-container code.

---

# Phase 18 — KPIs and Operations

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

# Phase 19 — Public Product Foundation

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

# Phase 20 — Public Developer Documentation

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

# Phase 21 — Interactive Trust Demonstration

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

# Phase 22 — Trust Laboratory

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

# Phase 23 — SaaSKamp Experience

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

# Phase 24 — Production Hardening

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

# Phase 25 — Branding and Shared Presentation System

**Status:** DEFERRED

## Current Decision

Continue using Nuxt UI defaults.

Do not build a speculative design system while the product architecture is still expanding.

## Future Work

When branding is intentionally scheduled, centralize:

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
1. Automated Developer → Control Plane → Agent acceptance test
2. Stable m2oath-web → m2oath-agent integration design
3. Authoritative M2Oath agent.create / enrollment
4. Persistent identity/lifecycle storage
5. Developer authentication and authorization
6. Identity + provenance + cryptographic binding UI
7. rotate-key and disable lifecycle operations
8. Agent runtime authentication visibility
9. Behavior / usage
10. Accumulated trust
11. Evidence
12. Policy
13. Trusted Domains
14. Weather Trusted Domain
15. KPIs / operations
```

This order intentionally establishes identity and authority before building richer trust visualizations.

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

The initial hosted-platform foundation is complete when all of the following are true:

- separate `m2oath-web` repository exists;
- Public, Developer, Agent, Docs, and Control Plane applications exist;
- Developer and Agent use the same control-plane authority boundary;
- canonical Agent identity is server-owned;
- browser/URL identity is treated as input rather than authority;
- typed control-plane client exists;
- Developer → Agent flow is automated by acceptance test;
- temporary identity issuance is clearly marked as temporary;
- authoritative M2Oath integration boundary is designed;
- workspace regression remains green.

At the current `5cc41ca` checkpoint, all items are complete **except** the automated cross-application acceptance test and the final authoritative M2Oath integration design.

---

# Guiding Roadmap Rule

Do not optimize the hosted UI ahead of the authority architecture.

The implementation order should remain:

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

while preserving the actual M2Oath execution boundary:

```text
Authenticate
    ↓
Resolve Canonical Identity
    ↓
Authorize
    ↓
Evaluate Trust
    ↓
ALLOW / DENY
    ↓
Trust Container Enforcement
```

The website should make M2Oath easier to use and understand without becoming the system that silently replaces M2Oath authority.
