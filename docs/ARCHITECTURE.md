# M2Oath Web Architecture

**Document Type:** Hosted Platform Architecture  
**Status:** Draft V0.1 — Authoritative Engineering Architecture  
**Date:** 2026-09-16  
**Repository:** `m2oath-web`  
**Related Requirements:** `docs/WEBSITE_REQUIREMENTS.md`

---

## 1. Purpose

This document defines the engineering architecture of the M2Oath-operated web platform.

It describes how the public website, Developer application, Agent application, documentation site, shared control plane, and shared client packages are separated and how authority flows between them.

Product and information-architecture requirements belong in `docs/WEBSITE_REQUIREMENTS.md`. This document is the engineering source of truth for how those requirements are implemented.

---

## 2. System and Repository Boundary

M2Oath separates the public Trust Container runtime from proprietary server-side trust services and domain-specific trust services.

The current physical repository layout is allowed to lag the architectural boundary. `m2oath-agent` and `m2oath-trust` may be developed in the same monorepo while package and dependency boundaries are being proven, but they must remain independently extractable.

```text
PUBLIC / npm / developer runtime

m2oath-agent
    framework for constructing and running AI Trust Containers
    Trust Container runtime and protected-operation enforcement
    trust/evidence provider contracts
    executable trust-rule and policy contracts
    MCP and runtime integration adapters

                    authenticated service APIs
                              │
══════════════════════════════╪══════════════════════════════
                       NETWORK BOUNDARY
══════════════════════════════╪══════════════════════════════
                              │
                 ┌────────────┴────────────┐
                 ▼                         ▼
PROPRIETARY M2OATH SERVICE          TRUSTED DOMAIN SERVICES

m2oath-trust                       m2oath-weather
    Developer accounts                 weather observations
    Agent registration                 forecasts/verification
    canonical Agent identity           weather trust evidence
    lifecycle                          domain semantics
    credential/binding management
    behavioral evidence            future domains
    accumulated trust                  finance
    trust history                      logistics
    provenance/audit                   energy
    policy services                    mobility
    persistence/database               ...
    REST/service APIs
```

`m2oath-web` is the M2Oath-operated product and presentation layer. Its current `apps/control-plane` implementation is a prototype/evolutionary predecessor of the future **M2Oath Raven** trusted server application/runtime.

Raven is the target hosted API and orchestration runtime for the M2Oath platform. It will host and compose proprietary M2Oath server capabilities such as `@m2oath/trust` and `@m2oath/trust-simulation`, expose authenticated application and trust APIs, and connect to independent Trusted Domain services through explicit authenticated boundaries. Raven does not become protected-operation execution authority.

The physical `m2oath-raven` repository does not yet exist. Raven is therefore a target architecture, not a claim about current deployed topology.

The governing architectural tests are:

> **Can an outside developer install the public M2Oath packages and construct a Trust Container without receiving the proprietary M2Oath Trust Service implementation?**

> **Can `m2oath-agent` and `m2oath-trust` be moved into separate repositories without redesigning their security or dependency architecture?**

Both answers must remain **yes**.

Repository co-location is a development convenience, not permission for architectural coupling. Public Trust Container packages must not depend on proprietary Trust Service implementations, proprietary persistence implementations, or Trusted Domain server implementations.


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

A baseline M2Oath brand treatment is now present in the Developer Portal and Auth0 Universal Login, while a full shared design system remains deferred.

The current UI rule is:

> **Use Nuxt UI as the baseline, centralize M2Oath brand assets, and avoid speculative design-system coupling.**

The Developer header supports light/dark logo variants. Auth0 Universal Login uses M2Oath branding but remains a separately hosted authentication document. Architecture, security boundaries, API contracts, workflow correctness, and tests continue to take precedence over broader visual-system work.

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

The Developer Nuxt application now obtains the Developer's request-scoped credential through an interactive Auth0/OIDC login and Nuxt server-side session. This replaces the earlier configured-token seam without changing the control-plane authentication or authorization boundary. The credential remains server-side security context and is attached per request.

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

Current endpoints include:

```text
GET  /health
POST /v1/agents
GET  /v1/agents
GET  /v1/agents/:agentId
POST /v1/developers/me/identity-bindings
```

Developer-account bootstrap/resolution and ownership-scoped Agent operations are also composed through the hosted control-plane boundary.

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

Current Developer routes include:

```text
/
/dashboard
/agents
/agents/new
/agents/:agentId
/auth/auth0
/auth/signup
/auth/link
```

Protected application pages use centralized authentication middleware. `/auth/link` requires an existing Developer session before a second Auth0 login may begin.

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

The browser does not generate canonical Agent IDs and does not receive the Developer control-plane access token as application data. Auth0/OIDC establishes the authenticated human session; the Nuxt server stores the request-scoped control-plane access token in secure session state and attaches it server-side. Registration preserves control-plane 401 and 403 outcomes; unexpected upstream failures remain upstream/application errors rather than being converted into authority.

The Developer Account is canonical M2Oath application identity and is distinct from both the Auth0 external identity and canonical Agent identity. Email is profile data, not the canonical Developer key.

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

## 13. Retired Hosted Scaffolds and Current Developer Authentication

The original hosted scaffolds have been replaced by durable authoritative paths.

### 13.1 Hosted Directory Projection — Retired

Agent list/detail reads no longer depend on process-local hosted directory state. The hosted composition uses the domain-neutral `AgentIdentityDirectory` boundary backed by durable MySQL identity state. A fresh hosted composition can reconstruct Agent detail and list state from the same database.

### 13.2 Canonical ID Issuance — Replaced

Temporary sequential web-issued IDs have been removed from the authoritative registration path. Canonical IDs are issued by M2Oath enrollment using the M2Oath persistence/composition boundary.

### 13.3 Developer Authentication — Interactive OIDC/Session Connected

Developer authentication now uses Auth0 Universal Login / OIDC. On successful authentication, the Developer Nuxt server resolves/bootstrap the canonical M2Oath Developer Account through the control-plane client and establishes a Nuxt server-side session containing Developer identity context and a request-scoped control-plane access token.

```text
Developer Browser
    ↓
Auth0 / OIDC
    ↓
Nuxt Developer Session
    ↓ request-scoped Bearer credential
Developer Nuxt Server
    ↓
Hosted Control Plane
    ↓
canonical M2Oath Developer Account + authorization
```

Developer roles/status and `agent.create` authority remain M2Oath-owned. Auth0 claims authenticate an external principal but do not directly become M2Oath lifecycle authority.

Agent Runtime JWT authentication remains a separate principal and is not derived from the Developer session.

### 13.4 External Developer Identity Linking

A canonical Developer may link multiple Auth0 identities. Linking requires both an existing authenticated Developer session and a fresh independently authenticated external identity. The control plane authenticates both credentials before creating the binding.

An external identity already bound to another canonical Developer produces a conflict and is not reassigned. The `/auth/link` entry route refuses to start Auth0 unless an existing Developer session is present. Missing or blank secondary credentials fail closed.

---

## 14. Current Authoritative Integration and Architectural Transition

The current hosted registration path proves the required security behavior, but its implementation boundaries are transitional.

```text
m2oath-web Control Plane
    ↓
M2OathAgentRegistrationGateway
    ↓
current M2Oath SDK/lifecycle composition
    ↓
Developer authentication
agent.create authorization
authoritative enrollment
canonical Agent ID issuance
creator provenance
cryptographic binding
durable state
```

The architectural destination separates the public Trust Container runtime from proprietary server responsibilities. Those proprietary server capabilities are ultimately hosted and composed by Raven:

```text
m2oath-agent
    public Trust Container SDK/runtime
    local protected-operation enforcement
    trust/evidence provider contracts
    executable policy/rule contracts

m2oath-trust
    proprietary server-side support
    Developer accounts
    Agent registration and canonical identity
    lifecycle and credential/binding management
    behavioral and accumulated trust
    trust history and provenance
    hosted policy services
    persistence/database
    authenticated service APIs

Trusted Domain services
    domain-specific facts, verification, evidence, and semantics
```

Existing registration, lifecycle, persistence, and server-side trust code should be treated as implementation assets to classify and extract rather than rewrite. Code that currently resides in `m2oath-agent` but belongs to the proprietary server responsibility may remain co-located temporarily while the package boundary is established.

### 14.1 Persistence ownership

Persistence is server-side infrastructure behind authoritative M2Oath services. The database stores durable facts and transaction state; it does not become identity policy, lifecycle policy, trust policy, authorization authority, or protected-operation execution authority.

The current `@m2oath/persistence-mysql` implementation is reusable engineering work, but its long-term product ownership belongs with the proprietary `m2oath-trust` server side rather than the public Trust Container SDK.

```text
m2oath-trust
    authoritative server services
        ↓
persistence adapters
        ↓
MySQL / durable infrastructure
```

The physical repository move does not need to occur immediately. Dependency direction must nevertheless allow the persistence implementation to be extracted from the public repository before public npm/repository boundaries are finalized.


## 14.2 M2Oath Raven Target Runtime

The future proprietary network server/runtime is named **M2Oath Raven** (`m2oath-raven`).

Raven is the trusted server-side application runtime and API host for the M2Oath platform. It is the target successor to the current hosted `apps/control-plane` process and will compose server-owned M2Oath capabilities behind explicit authenticated interfaces.

Its target responsibilities include ordinary hosted application APIs, lifecycle and security-sensitive application operations delegated to authoritative M2Oath services, trust/history/provenance/policy APIs, Trust Policy Workbench simulation and diagnostics, and Trusted Domain discovery and orchestration.

> **M2Oath Raven is the trusted server-side application runtime and API host for the M2Oath platform. It exposes authenticated application APIs, including ordinary resource CRUD and specialized trust/simulation operations, and connects or orchestrates trusted server services through narrow authority-preserving interfaces.**

Longer term, Raven may serve as a trusted API and orchestration fabric for the AI Machine Economy, connecting AI applications, M2Oath trust services, Trusted Domains, simulation infrastructure, and organizations across explicit authenticated boundaries. This does not make Raven the source of every form of trust authority.

### Raven and proprietary packages

`@m2oath/trust` is the proprietary trust/control-plane implementation package. Raven is the server application/runtime that hosts and composes it.

`@m2oath/trust-simulation` is the proprietary deterministic simulation engine currently being proven in `m2oath-agent`. Its long-term repository ownership belongs with Raven alongside the proprietary trust implementation it exercises.

```text
TODAY

m2oath-agent
    ├── @m2oath/agent
    ├── @m2oath/trust
    └── @m2oath/trust-simulation

EVENTUAL

m2oath-agent
    └── public Trust Container contracts/runtime

m2oath-raven
    ├── Raven API/runtime
    ├── @m2oath/trust
    ├── @m2oath/trust-simulation
    ├── proprietary persistence/composition
    └── Trusted Domain connectors/registry
```

The simulation engine may remain temporarily in `m2oath-agent` while its contracts are being proven. A Node/HTTP simulation service should not be added to the public framework repository merely to expose the engine. The HTTP/API boundary belongs in Raven.

### Raven and the Trust Policy Workbench

```text
Trust Policy Workbench
        │
        ▼
Developer Nuxt server / thin BFF
        │ authenticated REST / JSON
        ▼
M2Oath Raven Simulation API
        │
        ▼
@m2oath/trust-simulation
        │
        ▼
@m2oath/trust
```

The browser visualizes JSON results and must not import proprietary trust implementations or reproduce trust arithmetic. Simulation does not execute protected Agent operations and does not automatically deploy a simulated Trust Model into production.

Future developer-defined executable Trust Models must not run as arbitrary uploaded TypeScript in Raven's primary server process. Hosted custom executable models require an isolated/sandboxed simulation worker behind a narrow serializable interface.

```text
DRAFT MODEL
    ↓
SIMULATE
    ↓
ADVERSARIAL TEST
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

### Raven and Trusted Domains

Raven discovers, authenticates, connects to, and orchestrates Trusted Domain services. A Raven deployment may colocate M2Oath-owned domain services, but colocation does not collapse the service or authority boundary.

```text
M2Oath Raven
      ├──────── M2Oath Weather
      ├──────── Finance Trusted Domain
      ├──────── Logistics Trusted Domain
      ├──────── Energy Trusted Domain
      └──────── customer / third-party domains
```

Trusted Domains remain authoritative for their domain-specific evidence and semantics. Raven does not convert domain evidence directly into protected-operation execution authority.

### Narrow authority-preserving interfaces

> **M2Oath places authority behind narrow trust boundaries. Agents, Trusted Domains, developer tools, and user interfaces exchange explicit requests, evidence, decisions, and diagnostics across those boundaries rather than importing or sharing authority.**

> **Interfaces separate software. Authentication separates trust domains.**

The Trusted Host/Trust Container boundary protects actual execution. The Workbench-to-Raven boundary supports analysis and simulation. Raven-to-domain boundaries protect service/domain authority. None transfers protected-operation execution authority away from the AI Trust Container.

## 15. AI Trust Container and Network Boundary

The AI Trust Container is the public runtime security boundary constructed with `m2oath-agent`. It encapsulates the Agent and controls whether protected Agent operations may execute.

```text
                    DEVELOPER / CUSTOMER RUNTIME

┌──────────────────────────────────────────────────────────┐
│                    @m2oath/agent                         │
│                                                          │
│                  AI TRUST CONTAINER                      │
│                                                          │
│   ┌──────────────────────────────────────────────────┐   │
│   │                Encapsulated Agent                │   │
│   │                                                  │   │
│   │   Reasoning • Tools • APIs • Memory • Actions   │   │
│   └──────────────────────────────────────────────────┘   │
│                                                          │
│   Authentication / Identity Context                      │
│   AgentTrustStateProvider                                │
│   ExternalTrustEvidenceProvider<T>                       │
│   Executable TypeScript Trust Rules                      │
│   Policy Evaluation                                      │
│   ProtectedOperationExecutor                             │
│                                                          │
│                       ALLOW / DENY                       │
└────────────────────────────┬─────────────────────────────┘
                             │ authenticated service APIs
═════════════════════════════╪══════════════════════════════
                       NETWORK BOUNDARY
═════════════════════════════╪══════════════════════════════
                             │
                 ┌───────────┴────────────┐
                 ▼                        ▼
        ┌──────────────────┐     ┌────────────────────────┐
        │   m2oath-trust   │     │    TRUSTED DOMAINS     │
        │   proprietary    │     │                        │
        │                  │     │  m2oath-weather        │
        │ identity         │     │  finance               │
        │ lifecycle        │     │  logistics             │
        │ behavioral trust │     │  energy                │
        │ accumulated trust│     │  future domains...     │
        │ provenance       │     │                        │
        │ persistence      │     │ domain evidence and    │
        │ policy services  │     │ domain semantics       │
        └──────────────────┘     └────────────────────────┘
```

Both M2Oath Trust and Trusted Domain services are across an authenticated network/service boundary from the public Trust Container runtime. They supply authoritative inputs; neither server class may bypass local Trust Container enforcement.

The two trust-input paths are:

```text
m2oath-trust
    ↓
AgentTrustStateProvider
    ↓
AgentTrustState
    ───────────────┐
                   │
                   ▼
             Trust Policy
                   ▲
                   │
Domain Server      │
    ↓              │
ExternalTrustEvidenceProvider<T>
    ↓
TEvidence
    ───────────────┘
```

Operation context may also participate in policy evaluation.

Trust rules are programmable executable TypeScript objects. They decide whether execution is permitted, but they do not gain protected-operation execution authority.

```text
Agent Trust State ──────┐
                       │
Domain Trust Evidence ─┼──► Executable TypeScript Rules
                       │              │
Operation Context ─────┘              ▼
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

`ProtectedOperationExecutor` / the AI Trust Container remains the final protected-operation enforcement boundary.

---

## 16. Trusted Domain Server Boundary and Controller Interface

Trusted Domains are independent domain authorities that contribute domain-specific evidence and semantics across the network boundary.

Examples include weather, finance, logistics, energy, mobility, and future third-party domains.

A Trusted Domain is authoritative for the meaning, verification, quality, and provenance of evidence within its domain. It is not authoritative for whether an encapsulated Agent may execute a protected operation.

The governing distinction remains:

> **The evidence is vertical. The method of trust is horizontal.**

and:

> **Domain systems determine the meaning and quality of evidence within their domains. The AI Trust Container determines whether the Agent may execute under its configured M2Oath policy.**

### 16.1 Server-side Trusted Domain controller seam

`m2oath-trust` must provide a domain-neutral server-side interface/registration seam through which additional Trusted Domain controllers can be plugged into the M2Oath trust network without modifying M2Oath core trust logic.

The exact TypeScript API remains subject to implementation design, but the conceptual contract is:

```ts
export interface TrustedDomainController<TRequest, TEvidence> {
  readonly domain: string

  getEvidence(request: TRequest): Promise<TEvidence>
}
```

Conceptual registration:

```text
m2oath-trust
      │
      ▼
Trusted Domain Controller Registry
      │
      ├── WeatherTrustedDomainController
      ├── FinanceTrustedDomainController
      ├── LogisticsTrustedDomainController
      └── third-party domain controllers
```

The interface must preserve these rules:

1. adding a domain does not require adding domain-specific conditionals to M2Oath core;
2. domain controllers expose domain evidence through explicit contracts;
3. domain controllers retain authority over their domain-specific evidence and semantics;
4. domain evidence carries sufficient provenance for policy and audit use;
5. domain controllers do not receive protected-operation execution authority;
6. a domain controller cannot bypass Trust Container policy or `ProtectedOperationExecutor`;
7. M2Oath-hosted and third-party domain services may use the same architectural seam; and
8. Weather remains the first reference Trusted Domain, not a dependency of generic M2Oath trust architecture.

This creates a plugin architecture on the server side while preserving the provider/evidence abstraction on the Trust Container side.


## 17. Security and Packaging Invariants

Every implementation must preserve these invariants:

```text
Authentication != Authorization
Authorization != Trust
Identity != Trust

Developer Identity != Agent Identity
Developer Credential != Agent Runtime Credential

Agent Trust != Domain Trust Evidence
Domain Evidence != Execution Authority
Domain Controller != Protected Operation Executor
Trust Rule != Protected Operation Executor

Registration != Behavioral Trust
Key Rotation != New Agent Identity
Disabled Identity != Executable Identity

AI Agent != Trust Container
M2Oath Trust != Trusted Domain
M2Oath Core != Weather Domain

Public Trust Container SDK != Proprietary M2Oath Trust Service
Repository Co-location != Architectural Coupling
Server Authority != Local Protected-Operation Execution Authority
Raven Orchestration != Protected-Operation Execution Authority
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
9. executable trust rules decide but cannot bypass Trust Container enforcement;
10. `ProtectedOperationExecutor` remains the final protected-operation execution boundary;
11. Trusted Domain controllers cannot grant protected-operation execution authority;
12. public `m2oath-agent` packages must not depend on proprietary `m2oath-trust` implementations;
13. public packages must not depend on Trusted Domain server implementations;
14. server-side persistence remains behind authoritative services and does not become policy authority; and
15. temporary repository co-location must preserve clean eventual repository extraction.


## 18. Runtime Configuration

The Developer and Agent Nuxt applications use private Nuxt runtime configuration for the shared control-plane address.

Development control-plane value:

```text
http://127.0.0.1:4000
```

The Developer application additionally uses a private server-side `developerToken` configuration value, overridable through `NUXT_DEVELOPER_TOKEN`. It is intentionally not placed under Nuxt `public` runtime configuration.

The production control plane requires Developer JWT verification configuration for issuer, audience, JWKS URI, and the exact authorized Developer subject.

The browser communicates with its owning Nuxt server route; the Nuxt server communicates with the control plane. The implemented Developer login/session flow uses this seam so request-scoped credentials stay in server-side session/transport context rather than application payloads or browser-managed control-plane calls.

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
developer.m2oath.com/dashboard
developer.m2oath.com/agents
developer.m2oath.com/agents/new
developer.m2oath.com/agents/:agentId
developer.m2oath.com/auth/auth0
developer.m2oath.com/auth/signup
developer.m2oath.com/auth/link
```

Protected Developer application pages require a Nuxt Developer session. The identity-linking route additionally requires an existing Developer session before initiating the fresh Auth0 login used to prove the secondary external identity.

### Shared Authentication Presentation

Auth0 Universal Login is branded as M2Oath but remains a separately hosted authentication document. The Developer Portal supports light/dark Nuxt UI color modes with separate transparent M2Oath logo assets. A future Auth0 customization may receive presentation-only light/dark context from the Nuxt OAuth entry route so Universal Login visually follows the user's selected theme.

Theme context must never influence authentication, Developer identity resolution, authorization, ownership, token issuance, session security, or Trust Container policy. The same branded authentication experience may later serve other human M2Oath account types using server-side sessions without exposing an M2Oath API JWT to browser code.

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

The latest committed and pushed hosted-platform checkpoint before the current Phase 8 working tree is:

```text
34028e8  Update 09-09-2026 2:01pm
```

The current Phase 8 working tree adds the remaining Developer authentication/session hardening, secure external-identity linking coverage, M2Oath/Auth0 branding, light/dark logo presentation, and documentation updates described here. The final full-workspace validation and Phase 8 commit/push remain pending.

---

## 23. Next Architectural Milestones

The current implementation should advance without forcing a premature physical repository split.

Recommended sequence:

1. complete and stabilize the Day 10 deterministic Trust simulation engine and Trust Policy Workbench result contracts;
2. establish Raven as the documented target successor to the current hosted `apps/control-plane` boundary;
3. create the `m2oath-raven` repository as the trusted Node/server application and API runtime;
4. expose the first Raven simulation REST/JSON boundary for the Trust Policy Workbench without duplicating trust algorithms;
5. connect the Developer Nuxt server to Raven through a thin authenticated BFF/client boundary;
6. keep `@m2oath/trust` and `@m2oath/trust-simulation` in their temporary location until their contracts and dependency boundaries are stable;
7. extract proprietary trust, simulation, persistence, registration, lifecycle, provenance, and related server-owned implementation into the Raven repository without changing authority semantics;
8. define Raven's domain-neutral Trusted Domain registry/discovery/connector boundary;
9. integrate `m2oath-weather` as the first reference Trusted Domain through that interface rather than through core-specific coupling;
10. preserve `AgentTrustStateProvider` and `ExternalTrustEvidenceProvider<T>` as explicit Trust Container input paths;
11. prove that a standalone developer can construct a Trust Container from public packages without receiving proprietary server implementations;
12. prove that the same Trust Container can consume authenticated M2Oath trust state and Trusted Domain evidence across narrow network boundaries;
13. add isolated/sandboxed simulation-worker infrastructure before hosted Raven accepts arbitrary developer-defined executable TypeScript Trust Models; and
14. before public repository/npm boundaries are finalized, physically separate public and proprietary repositories without architectural redesign.

The existing `mcp-workspace` remains the M2Oath Weather/reference-domain workspace. This document does not authorize moving Raven into that repository or modifying `mcp-workspace` as part of the Raven bootstrap.


## 24. Governing Principle

M2Oath separates evidence authority, trust-service authority, and protected-operation execution authority.

```text
Browser / Developer / Management UI
                │
                ▼
       M2Oath Web Applications
                │
                ▼
════════════════════════════════════════════════════════════
                    SERVICE / NETWORK BOUNDARY
════════════════════════════════════════════════════════════
          │                              │
          ▼                              ▼
     m2oath-trust                 Trusted Domains
 identity / lifecycle /          domain-specific
 behavioral trust /              evidence / semantics
 accumulated trust /
 provenance / persistence
          │                              │
          └──────────────┬───────────────┘
                         │ authenticated inputs
                         ▼
                 AI TRUST CONTAINER
                   @m2oath/agent
                         │
                         ▼
                Executable Policy
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

The target hosted path adds Raven without changing the execution boundary:

```text
M2Oath Web / Trust Policy Workbench
                │
           thin Nuxt BFF
                │
                ▼
          M2Oath Raven
        API / orchestration
          │             │
          ▼             ▼
 @m2oath/trust     Trusted Domains
          │             │
          └──────┬──────┘
                 │ authoritative inputs
                 ▼
          AI Trust Container
                 │
          executable policy
                 │
            ALLOW / DENY
                 │
                 ▼
     ProtectedOperationExecutor
```

The authority model is:

- **M2Oath Raven** is the trusted hosted API/application/orchestration runtime. Hosting or orchestrating a capability does not give Raven protected-operation execution authority.
- **`@m2oath/trust`** is authoritative for M2Oath server-side identity, lifecycle, behavioral/accumulated trust, provenance, and related trust state.
- **Trusted Domain servers** are authoritative for evidence and semantics within their domains.
- **The AI Trust Container** is authoritative for local policy evaluation and final protected-operation enforcement for the encapsulated Agent.

The web platform may request, orchestrate, display, and manage.

M2Oath Trust and Trusted Domain servers may provide authoritative inputs.

**Neither may bypass the AI Trust Container. Protected execution occurs only through the Trust Container's enforcement boundary.**

