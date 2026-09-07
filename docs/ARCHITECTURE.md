# M2Oath Web Architecture

**Document Type:** Hosted Platform Architecture  
**Status:** Draft V0.1 — Authoritative Engineering Architecture  
**Date:** 2026-09-07  
**Repository:** `m2oath-web`  
**Related Requirements:** `docs/WEBSITE_REQUIREMENTS.md`

---

## 1. Purpose

This document defines the engineering architecture of the M2Oath-operated web platform.

It describes how the public website, Developer application, Agent application, documentation site, shared control plane, and shared client packages are separated and how authority flows between them.

Product and information-architecture requirements belong in `docs/WEBSITE_REQUIREMENTS.md`. This document is the engineering source of truth for how those requirements are implemented.

---

## 2. Repository Boundary

M2Oath deliberately separates the open-source framework from the hosted web platform.

```text
m2oath-agent/
    Open-source M2Oath framework
    npm packages
    reusable identity, authentication, authorization,
    trust, evidence, execution, MCP, SDK, and persistence APIs

m2oath-web/
    M2Oath-operated hosted platform
    public website
    Developer application
    Agent application
    documentation site
    hosted control plane
```

The governing architectural test is:

> **Could an outside developer use `m2oath-agent` without needing any M2Oath hosted website code?**

The answer must remain:

> **Yes.**

`m2oath-web` may consume stable public M2Oath APIs and packages. It must not cause hosted application concerns to leak into the reusable framework.

---

## 3. Product Boundaries

The hosted platform consists of four user-facing properties.

```text
m2oath.com
    Public product and ecosystem site

developer.m2oath.com
    Developer identity, onboarding, integration,
    credentials, and agent registration

agent.m2oath.com
    Registered agent identity, lifecycle, behavior,
    evidence, trust, KPIs, policy outcomes, and authority

developer.m2oath.com/docs/
    Public technical documentation
```

The permanent Developer/Agent distinction is:

> **Developer is where you build and register. Agent is where registered agents land and where their identity, lifecycle, behavior, evidence, trust, KPIs, policy outcomes, and authority are observed and managed.**

---

## 4. Repository Structure

Current structure:

```text
m2oath-web/
├── apps/
│   ├── web/
│   │   └── Nuxt public site
│   ├── developer/
│   │   └── Nuxt Developer application
│   ├── agent/
│   │   └── Nuxt Agent application
│   ├── control-plane/
│   │   └── shared hosted API/control-plane service
│   └── docs/
│       └── VitePress public developer documentation
│
├── packages/
│   └── control-plane-client/
│       └── typed client for the hosted control plane
│
├── docs/
│   ├── WEBSITE_REQUIREMENTS.md
│   └── ARCHITECTURE.md
│
├── package.json
└── pnpm-workspace.yaml
```

Current package names:

```text
@m2oath/web
@m2oath/developer
@m2oath/agent-web
@m2oath/control-plane
@m2oath/docs
@m2oath/control-plane-client
```

`@m2oath/agent-web` is intentionally distinct from the open-source framework package `@m2oath/agent`.

---

## 5. Technology Baseline

Current platform choices:

- Nuxt 4 for the public, Developer, and Agent applications;
- Nuxt UI for application UI;
- VitePress for public developer documentation;
- TypeScript;
- pnpm workspaces;
- Vitest for service/package tests;
- Node.js for the current control-plane HTTP service.

Branding is intentionally deferred.

The current UI rule is:

> **Use Nuxt UI defaults and keep future visual changes centralized and inexpensive.**

Architecture, security boundaries, API contracts, workflow correctness, and tests take precedence over a custom design system.

---

## 6. Authority Architecture

Developer and Agent are separate applications but must observe the same authoritative M2Oath state.

They must not maintain independent canonical identity systems.

```text
┌──────────────────────┐
│  Developer Browser   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Developer Nuxt Server│
└──────────┬───────────┘
           │
           ▼
  @m2oath/control-plane-client
           │
           ▼
┌──────────────────────────────┐
│ Shared M2Oath Control Plane  │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│ Authoritative M2Oath         │
│ Services / Stores            │
└──────────┬───────────────────┘
           │
           ▼
  @m2oath/control-plane-client
           │
           ▼
┌──────────────────────┐
│  Agent Nuxt Server   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│    Agent Browser     │
└──────────────────────┘
```

The browser is a presentation and interaction boundary, not an authority boundary.

---

## 7. Control-Plane Client

Location:

```text
packages/control-plane-client
```

The client provides a typed contract between hosted applications and the shared control plane.

Current core contract:

```ts
export interface AgentSummary {
  agentId: string
  displayName?: string
  status: 'active' | 'disabled' | 'revoked'
}

export interface RegisterAgentRequest {
  displayName?: string
}

export interface RegisterAgentResponse {
  agent: AgentSummary
}

export interface ControlPlaneClient {
  registerAgent(request: RegisterAgentRequest): Promise<RegisterAgentResponse>
  getAgent(agentId: string): Promise<AgentSummary>
  listAgents(): Promise<AgentSummary[]>
}
```

Current HTTP operations:

```text
POST /v1/agents
GET  /v1/agents
GET  /v1/agents/:agentId
```

The client is deliberately thin. It does not contain identity issuance, authentication, authorization, trust, lifecycle, or protected-execution policy.

Those decisions belong behind the authoritative server boundary.

---

## 8. Shared Control Plane

Location:

```text
apps/control-plane
```

Package:

```text
@m2oath/control-plane
```

The control plane is the shared server-side authority boundary used by both Developer and Agent applications.

Current endpoints:

```text
GET  /health
POST /v1/agents
GET  /v1/agents
GET  /v1/agents/:agentId
```

Current development port:

```text
4000
```

The service currently contains:

```text
src/agent-store.ts
src/server.ts
src/index.ts
```

The current implementation is intentionally small so that the authority boundary can be proven before production persistence and authentication are introduced.

---

## 9. Developer Application

Location:

```text
apps/developer
```

Package:

```text
@m2oath/developer
```

Current routes:

```text
/
/agents/new
```

Agent registration currently follows:

```text
Developer Browser
       │
       ▼
POST /api/agents/register
       │
       ▼
Developer Nuxt Server
       │
       ▼
HttpControlPlaneClient
       │
       ▼
POST /v1/agents
       │
       ▼
Shared Control Plane
```

The Developer browser does not generate canonical Agent IDs.

The Developer Nuxt server obtains the control-plane base URL from private runtime configuration and acts as the browser-facing server boundary.

---

## 10. Agent Application

Location:

```text
apps/agent
```

Package:

```text
@m2oath/agent-web
```

Current routes:

```text
/
/agents
/agents/:agentId
```

Current server routes:

```text
GET /api/agents
GET /api/agents/:agentId
```

These server routes use `@m2oath/control-plane-client` to resolve authoritative records through the shared control plane.

For `/agents/:agentId`, the URL value is treated only as requested input.

The authoritative identity displayed by the application is the record returned by the control plane.

---

## 11. Canonical Identity Boundary

Canonical Agent ID is authoritative server state.

The following must never be treated as proof of canonical identity:

- a browser field;
- a URL parameter;
- a JavaScript object supplied by a client;
- a JWT claim that has not passed the appropriate M2Oath identity-resolution path;
- a display name;
- a locally generated web-application identifier.

The governing M2Oath identity principle is:

> **An Agent ID is issued through enrollment or canonical identity mapping and cannot be self-asserted as proof of identity.**

The current Agent detail page demonstrates this distinction by resolving the requested route identifier through the shared control plane.

---

## 12. Proven Developer → Agent Vertical Slice

The first complete hosted-platform vertical slice was proven on September 7, 2026.

```text
Developer App
    │
    │ Register "Weather Agent"
    ▼
Developer Nuxt Server
    │
    ▼
@m2oath/control-plane-client
    │
    ▼
Shared Control Plane
    │
    │ issues agt_000001
    ▼
Shared Agent Record
    │
    ▼
@m2oath/control-plane-client
    │
    ▼
Agent Nuxt Server
    │
    ▼
Agent App
```

Observed record:

```text
Display Name:       Weather Agent
Canonical Agent ID: agt_000001
Status:             active
```

The same record created through Developer was listed and retrieved through the separate Agent application.

This proves the intended shared-state architecture at scaffold level.

---

## 13. Temporary Day 3 Scaffold

The current control-plane implementation is not the final M2Oath identity system.

### 13.1 In-Memory Persistence

The current `InMemoryAgentStore` is owned by the shared control-plane process.

Its purpose is to prove that Developer and Agent use one authoritative backend rather than separate process-local application state.

Restarting the control plane currently loses these records.

### 13.2 Temporary ID Issuance

The current store issues sequential development identifiers such as:

```text
agt_000001
```

This is temporary.

Production registration must delegate canonical identity issuance to the authoritative M2Oath enrollment/identity boundary.

The hosted platform must not develop a second independent agent identity implementation.

### 13.3 Authentication

Production Developer authentication is not yet connected to this web control-plane scaffold.

Agent Runtime JWT authentication is also not yet part of this hosted vertical slice.

The current scaffold must therefore not be represented as a production-secure control plane.

---

## 14. Future Authoritative Integration

The intended transition is:

```text
TODAY

m2oath-web
    │
    ▼
Shared Control Plane
    │
    ▼
InMemoryAgentStore
    │
    ▼
Temporary canonical ID scaffold
```

to:

```text
TARGET

m2oath-web
    │
    ▼
Shared Control Plane
    │
    ▼
Stable public M2Oath service/package boundary
    │
    ├── Developer authentication
    ├── agent.create authorization
    ├── authoritative enrollment
    ├── canonical Agent ID issuance
    ├── creator provenance
    ├── cryptographic binding
    ├── lifecycle
    └── persistent storage
```

The control-plane HTTP contract should insulate the Nuxt applications from changes in the underlying implementation wherever practical.

---

## 15. Trust Container Boundary

The hosted platform must preserve the M2Oath execution architecture.

```text
Requested Operation
        │
        ▼
Authentication
        │
        ▼
Canonical Identity
        │
        ▼
Authorization
        │
        ├───────────────┐
        ▼               ▼
  Agent Trust      Trusted Domains
        │               │
        └───────┬───────┘
                ▼
          Trust Policy
                │
          ALLOW / DENY
                │
          only if ALLOW
                ▼
       Protected Operation
```

Presentation code may display trust and policy results.

Presentation code must not become the authoritative calculator or enforcement boundary.

Trust rules decide whether execution is permitted. They do not gain protected-operation execution authority.

`ProtectedOperationExecutor` / the AI Trust Container remains the enforcement boundary.

---

## 16. Trusted Domain Boundary

Trusted Domains contribute external evidence.

They do not become execution authorities.

```text
Domain System
     │
     ▼
Domain Evidence
     │
     ▼
ExternalTrustEvidenceProvider<T>
     │
     ▼
M2Oath Policy
     │
     ▼
ALLOW / DENY
     │
     ▼
Trust Container Enforcement
```

The governing distinction is:

> **Domain systems determine the meaning and quality of evidence within their domains. M2Oath determines whether the agent may execute.**

Weather is the first reference Trusted Domain but must not become a dependency of the hosted platform's generic agent architecture.

---

## 17. Security Invariants

Every hosted implementation must preserve these invariants:

```text
Authentication != Authorization
Authorization != Trust
Identity != Trust

Developer Identity != Agent Identity
Developer Credential != Agent Runtime Credential

Domain Evidence != Execution Authority
Trust Rule != Protected Operation Executor

Registration != Behavioral Trust
Key Rotation != New Agent Identity
Disabled Identity != Executable Identity

AI Agent != Trust Container
M2Oath Core != Weather Domain
M2Oath Framework != M2Oath Hosted Platform
```

Additionally:

1. browsers cannot issue canonical Agent IDs;
2. URL parameters are untrusted input;
3. presentation code cannot grant capabilities;
4. presentation code cannot calculate authoritative trust;
5. client-supplied scopes do not automatically become M2Oath authority;
6. private Agent key material must not be exposed through ordinary hosted UI flows;
7. Developer credentials cannot substitute for Agent Runtime credentials;
8. Developer and Agent applications must resolve the same authoritative backend state;
9. policy cannot bypass Trust Container enforcement;
10. the hosted repository must not duplicate the core security engine from `m2oath-agent`.

---

## 18. Runtime Configuration

The Developer and Agent Nuxt applications currently use private Nuxt runtime configuration for the shared control-plane address.

Development value:

```text
http://127.0.0.1:4000
```

The browser communicates with its owning Nuxt server route.

The Nuxt server communicates with the control plane.

This avoids making the internal control-plane address part of the browser's authority model and provides a clean seam for future authentication, session handling, deployment routing, and policy enforcement.

---

## 19. Testing Strategy

The architecture should be tested at multiple boundaries.

### Package Tests

`@m2oath/control-plane-client` tests:

- registration;
- server-returned canonical identity;
- safe route encoding;
- agent listing;
- typed HTTP failure behavior.

Current baseline:

```text
4 tests passing
```

### Control-Plane Tests

Current API tests cover:

- health;
- registration;
- server-side canonical ID issuance;
- listing;
- lookup;
- unknown-agent behavior.

Current baseline:

```text
5 tests passing
```

### Workspace Regression

Current root validation commands:

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

All were green at the September 7, 2026 checkpoint.

### Next Acceptance Layer

The next useful test layer should automate the invariant already proven manually:

> **An agent registered through the Developer path can be retrieved through the Agent path using the same server-issued canonical Agent ID.**

This test should verify the cross-application authority boundary without moving identity logic into either Nuxt application.

---

## 20. Documentation Boundary

There are two distinct documentation areas.

### Repository Engineering Documentation

```text
docs/
```

Contains internal/project engineering sources of truth such as:

```text
ARCHITECTURE.md
WEBSITE_REQUIREMENTS.md
ARCHITECTURE_DECISIONS.md
DEVELOPMENT_ROADMAP.md
```

These documents describe how M2Oath Web is designed and built.

### Public Developer Documentation

```text
apps/docs/
```

This is the VitePress application published at:

```text
developer.m2oath.com/docs/
```

It contains curated documentation for users of M2Oath.

Internal workplans, temporary checkpoints, and engineering notes should not automatically become public documentation.

---

## 21. Current Routing Baseline

### Public

```text
m2oath.com/
```

### Developer

```text
developer.m2oath.com/
developer.m2oath.com/agents/new
```

### Agent

```text
agent.m2oath.com/
agent.m2oath.com/agents
agent.m2oath.com/agents/:agentId
```

Stable future Agent child-route locations may include:

```text
/agents/:agentId/trust
/agents/:agentId/evidence
/agents/:agentId/kpis
/agents/:agentId/operations
/agents/:agentId/policy
/agents/:agentId/trusted-domains
/agents/:agentId/usage
```

These future locations do not imply that their underlying capabilities are already implemented.

---

## 22. Current Git Checkpoint

The first shared-control-plane vertical slice is captured by:

```text
5cc41ca  Update 09-07-2026 4:38pm
```

That checkpoint includes:

- shared control-plane API;
- control-plane API tests;
- Developer registration integration;
- Agent list integration;
- Agent detail integration;
- shared control-plane client use;
- server-side canonical-ID scaffold;
- identity-boundary UI proof.

---

## 23. Next Architectural Milestones

The recommended sequence from this checkpoint is:

1. add automated Developer → Control Plane → Agent acceptance coverage;
2. define the stable integration boundary from `m2oath-web` to authoritative `m2oath-agent` services;
3. replace temporary ID issuance with authoritative M2Oath enrollment;
4. introduce persistent storage behind the control plane;
5. connect Developer authentication and `agent.create` authorization;
6. expose creator provenance and cryptographic binding information;
7. add rotate-key and disable lifecycle operations;
8. expand Agent views into behavior, evidence, trust, KPIs, policy, Trusted Domains, and usage;
9. preserve the Trust Container as the protected-execution boundary throughout.

---

## 24. Governing Principle

The hosted platform is a management and observation surface over M2Oath authority.

It is not a replacement authority system.

The architecture should continually preserve this separation:

```text
Browser / UI
    │
    ▼
Hosted Application Server
    │
    ▼
Shared Control Plane
    │
    ▼
Authoritative M2Oath Services
    │
    ▼
Identity + Authorization + Trust + Policy
    │
    ▼
Trust Container Enforcement
```

The web platform may request, orchestrate, display, and manage.

**M2Oath remains authoritative for machine execution.**
