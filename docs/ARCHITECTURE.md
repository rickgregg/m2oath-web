# M2Oath Web Architecture

**Document Type:** Hosted Platform Architecture  
**Status:** Draft V0.1 — Authoritative Engineering Architecture  
**Date:** 2026-09-08  
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

Developer and Agent are separate applications but must observe the same authoritative M2Oath state. They must not maintain independent canonical identity systems.

```text
Developer Browser
    │ enrollment facts only
    ▼
Developer Nuxt Server
    │ private, request-scoped Developer Bearer credential
    ▼
@m2oath/control-plane-client
    │ Authorization: Bearer <Developer JWT>
    ▼
Shared M2Oath Control Plane
    │
    ├── @m2oath/auth-jwt
    │     signature + issuer + audience verification
    │
    ├── exact Developer principal lifecycle authorization
    │     agent.create
    │
    ▼
Authoritative M2Oath Enrollment
    │
    ├── canonical Agent ID
    ├── identity/binding state
    └── registration provenance
    │
    ▼
Hosted Agent Directory / Projection
    │
    ▼
@m2oath/control-plane-client
    │
    ▼
Agent Nuxt Server
    │
    ▼
Agent Browser
```

The browser is a presentation and interaction boundary, not an authority boundary.

The Developer credential is authentication context only. It is never added to the agent enrollment payload and must never become the canonical Agent ID, the Agent Runtime credential, Agent trust evidence, or automatic M2Oath authority because a JWT contains `scope` or `scp` claims.

Authentication and lifecycle authorization remain separate decisions. The HTTP boundary preserves that distinction:

```text
Missing Bearer credential
    -> 401 developer-authentication-required

Credential fails M2Oath authentication
    -> 401 developer-authentication-failed

Authenticated principal lacks agent.create
    -> 403 developer-not-authorized

Authenticated and authorized principal
    -> authoritative enrollment
    -> 201 Created
```

The Developer Nuxt application's configured token is currently a private server-side hosting/development seam. A future Developer login/session flow should supply the authenticated Developer's request-scoped credential without changing the control-plane authorization boundary.

---

## 7. Control-Plane Client

Location:

```text
packages/control-plane-client
```

The client provides the typed transport contract between hosted application servers and the shared control plane.

Current registration input includes an optional display name, an external identifier, and optional public cryptographic material. Canonical Agent ID is never client supplied.

Current operations:

```text
POST /v1/agents
GET  /v1/agents
GET  /v1/agents/:agentId
```

`HttpControlPlaneClient` accepts an optional `bearerToken`. When configured, it adds the token to the HTTP `Authorization` header. Authentication remains transport context and is not serialized into `RegisterAgentRequest`.

The client is deliberately thin. It does not issue identity, authenticate or authorize principals, calculate trust, implement lifecycle policy, or execute protected operations. Non-success responses are represented as typed `ControlPlaneHttpError` failures so application servers can preserve relevant HTTP security semantics.

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

The control plane is the shared server-side hosted boundary used by both Developer and Agent applications.

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

`POST /v1/agents` is protected. It extracts a Bearer credential, passes request-scoped authentication into the M2Oath registration gateway, and maps authoritative M2Oath authentication failures to HTTP 401 and lifecycle-authorization failures to HTTP 403.

Production composition uses `@m2oath/auth-jwt` with issuer, audience, and remote JWKS configuration. Lifecycle authorization is configured for exact trusted Developer principals. JWT scopes remain authenticated claims only; they do not become M2Oath lifecycle authority automatically.

The control plane delegates registration through `M2OathAgentRegistrationGateway` to the public `M2OathSdk.registerAgent()` lifecycle boundary. The hosted layer does not manufacture canonical Agent IDs.

---

## 9. Developer Application

Location: `apps/developer`  
Package: `@m2oath/developer`

Current routes:

```text
/
/agents/new
```

Agent registration follows:

```text
Developer Browser
    │ enrollment facts only
    ▼
POST /api/agents/register
    ▼
Developer Nuxt Server
    │ private Developer token
    ▼
HttpControlPlaneClient
    │ Bearer transport
    ▼
POST /v1/agents
    ▼
Shared Control Plane
    ▼
M2Oath authentication + lifecycle authorization + enrollment
```

The browser does not generate canonical Agent IDs and does not receive the configured Developer token. The token is held in private Nuxt runtime configuration and attached server-side. The registration route preserves control-plane 401 and 403 outcomes; unexpected upstream failures remain 502 errors.

This configured token is an interim server-side seam, not the final human login/session design.

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

The hosted vertical slice now proves both shared identity and authoritative M2Oath enrollment.

```text
Developer App
    ↓
Developer Nuxt Server
    ↓
@m2oath/control-plane-client
    ↓
Shared Control Plane
    ↓
M2OathSdk.registerAgent()
    ↓
AuthorizedAgentEnrollmentService
    ↓
AgentEnrollmentService
    ↓
AgentRegistrationService
    ↓
canonical agt_<UUID>
    ↓
Hosted Agent Directory
    ↓
Agent App retrieval
```

Automated acceptance coverage verifies that an Agent registered through the Developer path can be retrieved through the Agent path using the same M2Oath-issued canonical Agent ID.

The earlier sequential `agt_000001` proof was a scaffold milestone and is no longer the registration authority.

---

## 13. Remaining Temporary Hosted Scaffold

The authoritative registration path is now M2Oath-owned, but one hosted scaffold remains.

### 13.1 Hosted Directory Projection

The control plane still uses process-local hosted directory state for the current Agent list/detail experience. It is a projection used by the web vertical slice, not the canonical identity issuer. Restarting the process can lose this hosted projection.

### 13.2 Canonical ID Issuance — Replaced

Temporary sequential web-issued IDs have been removed from the authoritative registration path. Canonical IDs are issued by M2Oath enrollment using the M2Oath persistence/composition boundary.

### 13.3 Developer Authentication — Connected

Protected registration now requires a Bearer credential. Production composition uses cryptographic JWT verification through `@m2oath/auth-jwt` and exact-principal M2Oath lifecycle authorization for `agent.create`.

The current Developer Nuxt token is a private server-side configuration seam. Full interactive Developer OIDC/login/session UX remains future work.

Agent Runtime JWT authentication is a separate principal and remains outside this hosted registration slice.

---

## 14. Current Authoritative Integration and Next Transition

The registration authority transition is complete:

```text
m2oath-web Control Plane
    ↓
M2OathAgentRegistrationGateway
    ↓
@m2oath/sdk
    ↓
Authoritative M2Oath lifecycle services
    ├── Developer authentication
    ├── agent.create authorization
    ├── authoritative enrollment
    ├── canonical Agent ID issuance
    ├── creator provenance
    └── cryptographic binding
```

The next infrastructure transition is persistence: replace remaining process-local hosted state with durable storage behind authoritative service boundaries without changing the Nuxt applications' authority model.

The control-plane HTTP contract should continue insulating the hosted applications from underlying M2Oath implementation details wherever practical.

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

The Developer and Agent Nuxt applications use private Nuxt runtime configuration for the shared control-plane address.

Development control-plane value:

```text
http://127.0.0.1:4000
```

The Developer application additionally uses a private server-side `developerToken` configuration value, overridable through `NUXT_DEVELOPER_TOKEN`. It is intentionally not placed under Nuxt `public` runtime configuration.

The production control plane requires Developer JWT verification configuration for issuer, audience, JWKS URI, and the exact authorized Developer subject.

The browser communicates with its owning Nuxt server route; the Nuxt server communicates with the control plane. This preserves a clean seam for future Developer login/session handling without exposing service credentials or internal topology to browser code.

---

## 19. Testing Strategy

The architecture is tested at package, control-plane, integration, and workspace boundaries.

### Package Tests

`@m2oath/control-plane-client` currently has **5 passing tests**, including Bearer transport and proof that authentication stays out of the registration payload.

### Control-Plane Tests

`@m2oath/control-plane` currently has **12 passing tests** across three files. Coverage includes API behavior, hosted identity acceptance, HTTP 401/403 semantics, real RS256 Developer JWT verification, and rejection of a JWT signed by an untrusted key.

### Workspace Regression

The September 8, 2026 Phase 6 checkpoint passed:

```text
pnpm typecheck  GREEN
pnpm test       GREEN — 17 tests
pnpm build      GREEN
```

The repository also retains lint as a normal architectural checkpoint command.

### Acceptance Invariant

Automated coverage now proves:

> **An Agent registered through the Developer path can be retrieved through the Agent path using the same M2Oath-issued canonical Agent ID.**

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

The latest committed and pushed checkpoint before the current Phase 6 working tree is:

```text
6994bf1  Update 09-07-2026 7:28pm
```

That commit established authoritative M2Oath registration through the hosted control plane. The September 8 Phase 6 authentication/security work documented here is validated and awaiting its next Git checkpoint.

---

## 23. Next Architectural Milestones

From the September 8 Phase 6 checkpoint, the recommended sequence is:

1. create the Phase 6 documentation/Git checkpoint;
2. replace remaining process-local hosted directory state with durable persistence;
3. expose creator provenance and cryptographic binding information through authoritative read models;
4. add hosted rotate-key and disable lifecycle operations;
5. replace the configured Developer-token seam with a real Developer login/OIDC/session experience while preserving request-scoped control-plane authentication;
6. expand Agent views into behavior, evidence, trust, KPIs, policy, Trusted Domains, and usage;
7. preserve the Trust Container as the protected-execution boundary throughout.

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
