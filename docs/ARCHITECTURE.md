# M2Oath Web Architecture

**Document Type:** Hosted Platform Architecture\
**Status:** Draft V0.2 --- Authoritative Engineering Architecture\
**Date:** 2026-09-17\
**Repository:** `m2oath-web`\
**Related Requirements:** `docs/WEBSITE_REQUIREMENTS.md`

------------------------------------------------------------------------

## 1. Purpose

This document defines the engineering architecture of the
M2Oath-operated web platform.

It describes how the public website, Developer application, Agent
application, documentation site, shared control plane, and shared client
packages are separated and how authority flows between them.

Product and information-architecture requirements belong in
`docs/WEBSITE_REQUIREMENTS.md`. This document is the engineering source
of truth for how those requirements are implemented.

------------------------------------------------------------------------

## 2. System and Repository Boundary

M2Oath now has five primary architectural roles:

``` text
1. m2oath-agent
   Public developer framework and AI Trust Container runtime.

2. m2oath-web
   Hosted M2Oath product domain: Users, Accounts, Organizations,
   Developers, Agents, portals, Workbench, and product configuration.

3. M2Oath Raven
   Hosted server/API/orchestration runtime for m2oath-web,
   initially implemented with Nuxt/Nitro.

4. m2oath-trust
   Authoritative horizontal M2Oath Agent identity/trust service.

5. m2oath-weather
   First authoritative vertical Trusted Domain.
```

The target relationship is:

``` text
                         m2oath-web
          Users • Accounts • Organizations • Developer
              Agent • Trust Policy Workbench
                              │
                              ▼
                         M2Oath Raven
                    Nuxt/Nitro server runtime
                              │
             ┌────────────────┴────────────────┐
             │                                 │
       TrustProvider                  TrustedDomainProvider
             │                                 │
             ▼                                 ▼
       m2oath-trust                    m2oath-weather
       horizontal trust               vertical evidence
       authority                      authority
```

The public Trust Container runtime remains outside those hosted
authorities:

``` text
m2oath-trust ───────────────┐
                            │ AgentTrustState
m2oath-weather ─────────────┼────► AI Trust Container
                            │      executable policy
other Trusted Domains ──────┘      ALLOW / DENY
                                   ProtectedOperationExecutor
```

`m2oath-agent` must remain independently usable without proprietary
M2Oath hosted services.

Repository co-location is a development convenience, not permission for
authority coupling. Current implementation may temporarily lag this
target while Day 10E classifies and extracts components.

Raven remains in `m2oath-web` for now. Before creating a new
`apps/raven`, the existing `apps/control-plane` must be inspected and
should evolve/rename into Raven if that preserves the cleanest single
canonical hosted backend.

`m2oath-trust` and `m2oath-weather` plug into Raven through
authenticated provider/service boundaries. Raven orchestrates them but
does not absorb their authority.

The governing tests are:

> **Can an outside developer install public M2Oath packages and
> construct/run a Trust Container without receiving proprietary server
> implementation?**

> **Can Trust, Weather, and Raven deploy and scale independently without
> changing their authority semantics?**

> **Can Raven be replaced or horizontally scaled without moving
> protected-operation execution out of the Trust Container?**

All answers must remain **yes**.

------------------------------------------------------------------------

## 3. Product Boundaries

The hosted platform consists of four user-facing properties.

``` text
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

> **Developer is where you build and register. Agent is where registered
> agents land and where their identity, lifecycle, behavior, evidence,
> trust, KPIs, policy outcomes, and authority are observed and
> managed.**

------------------------------------------------------------------------

## 4. Repository Structure

Current structure:

``` text
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

``` text
@m2oath/web
@m2oath/developer
@m2oath/agent-web
@m2oath/control-plane
@m2oath/docs
@m2oath/control-plane-client
```

`@m2oath/agent-web` is intentionally distinct from the open-source
framework package `@m2oath/agent`.

------------------------------------------------------------------------

## 5. Technology Baseline

Current platform choices:

-   Nuxt 4 for hosted web applications;
-   **Nuxt/Nitro as the preferred initial Raven server implementation**;
-   Nuxt UI for application UI;
-   VitePress for public developer documentation;
-   TypeScript;
-   pnpm workspaces;
-   Vitest for service/package tests;
-   Node.js runtime;
-   MySQL for current durable hosted persistence.

Raven is an architectural runtime, not a synonym for Nuxt. Nitro
supplies the initial HTTP/server implementation, deployment runtime,
middleware, and server endpoints. Raven application services, provider
contracts, orchestration contracts, and authority boundaries must remain
framework-independent.

The intended mapping is:

``` text
Raven architecture            Initial implementation

HTTP/API boundary       ───►  Nitro server routes
application services    ───►  server/services/*
authentication          ───►  server middleware/utilities
repositories            ───►  server/repositories/*
provider adapters       ───►  server/providers/*
orchestration           ───►  server/orchestration/*
```

Do not leak framework-specific request objects such as `H3Event` into
core Raven provider contracts.

A baseline M2Oath brand treatment is present in the Developer Portal and
Auth0 Universal Login. Auth0/OIDC remains responsible for authentication
credentials. M2Oath may pass known Developer email through OIDC
`login_hint`, but must never prefill, store, inject, or transmit
Developer passwords.

------------------------------------------------------------------------

## 6. Authority Architecture

Developer and Agent are separate applications but must observe the same
authoritative M2Oath state. They must not maintain independent canonical
identity systems.

``` text
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

The browser is a presentation and interaction boundary, not an authority
boundary.

The Developer credential is authentication context only. It is never
added to the agent enrollment payload and must never become the
canonical Agent ID, the Agent Runtime credential, Agent trust evidence,
or automatic M2Oath authority because a JWT contains `scope` or `scp`
claims.

Authentication and lifecycle authorization remain separate decisions.
The HTTP boundary preserves that distinction:

``` text
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

The Developer Nuxt application now obtains the Developer's
request-scoped credential through an interactive Auth0/OIDC login and
Nuxt server-side session. This replaces the earlier configured-token
seam without changing the control-plane authentication or authorization
boundary. The credential remains server-side security context and is
attached per request.

------------------------------------------------------------------------

## 7. Control-Plane Client

Location:

``` text
packages/control-plane-client
```

The client provides the typed transport contract between hosted
application servers and the shared control plane.

Current registration input includes an optional display name, an
external identifier, and optional public cryptographic material.
Canonical Agent ID is never client supplied.

Current operations:

``` text
POST /v1/agents
GET  /v1/agents
GET  /v1/agents/:agentId
```

`HttpControlPlaneClient` accepts an optional `bearerToken`. When
configured, it adds the token to the HTTP `Authorization` header.
Authentication remains transport context and is not serialized into
`RegisterAgentRequest`.

The client is deliberately thin. It does not issue identity,
authenticate or authorize principals, calculate trust, implement
lifecycle policy, or execute protected operations. Non-success responses
are represented as typed `ControlPlaneHttpError` failures so application
servers can preserve relevant HTTP security semantics.

------------------------------------------------------------------------

## 8. Shared Control Plane

Location:

``` text
apps/control-plane
```

Package:

``` text
@m2oath/control-plane
```

The control plane is the shared server-side hosted boundary used by both
Developer and Agent applications.

Current endpoints include:

``` text
GET  /health
POST /v1/agents
GET  /v1/agents
GET  /v1/agents/:agentId
POST /v1/developers/me/identity-bindings
```

Developer-account bootstrap/resolution and ownership-scoped Agent
operations are also composed through the hosted control-plane boundary.

Current development port:

``` text
4000
```

`POST /v1/agents` is protected. It extracts a Bearer credential, passes
request-scoped authentication into the M2Oath registration gateway, and
maps authoritative M2Oath authentication failures to HTTP 401 and
lifecycle-authorization failures to HTTP 403.

Production composition uses `@m2oath/auth-jwt` with issuer, audience,
and remote JWKS configuration. Lifecycle authorization is configured for
exact trusted Developer principals. JWT scopes remain authenticated
claims only; they do not become M2Oath lifecycle authority
automatically.

The control plane delegates registration through
`M2OathAgentRegistrationGateway` to the public
`M2OathSdk.registerAgent()` lifecycle boundary. The hosted layer does
not manufacture canonical Agent IDs.

------------------------------------------------------------------------

## 9. Developer Application

Location: `apps/developer`\
Package: `@m2oath/developer`

Current Developer routes include:

``` text
/
/dashboard
/agents
/agents/new
/agents/:agentId
/auth/auth0
/auth/signup
/auth/link
```

Protected application pages use centralized authentication middleware.
`/auth/link` requires an existing Developer session before a second
Auth0 login may begin.

Agent registration follows:

``` text
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

The browser does not generate canonical Agent IDs and does not receive
the Developer control-plane access token as application data. Auth0/OIDC
establishes the authenticated human session; the Nuxt server stores the
request-scoped control-plane access token in secure session state and
attaches it server-side. Registration preserves control-plane 401 and
403 outcomes; unexpected upstream failures remain upstream/application
errors rather than being converted into authority.

The Developer Account is canonical M2Oath application identity and is
distinct from both the Auth0 external identity and canonical Agent
identity. Email is profile data, not the canonical Developer key.

------------------------------------------------------------------------

## 10. Agent Application

Location:

``` text
apps/agent
```

Package:

``` text
@m2oath/agent-web
```

Current routes:

``` text
/
/agents
/agents/:agentId
```

Current server routes:

``` text
GET /api/agents
GET /api/agents/:agentId
```

These server routes use `@m2oath/control-plane-client` to resolve
authoritative records through the shared control plane.

For `/agents/:agentId`, the URL value is treated only as requested
input.

The authoritative identity displayed by the application is the record
returned by the control plane.

------------------------------------------------------------------------

## 11. Canonical Identity Boundary

Canonical Agent ID is authoritative server state.

The following must never be treated as proof of canonical identity:

-   a browser field;
-   a URL parameter;
-   a JavaScript object supplied by a client;
-   a JWT claim that has not passed the appropriate M2Oath
    identity-resolution path;
-   a display name;
-   a locally generated web-application identifier.

The governing M2Oath identity principle is:

> **An Agent ID is issued through enrollment or canonical identity
> mapping and cannot be self-asserted as proof of identity.**

The current Agent detail page demonstrates this distinction by resolving
the requested route identifier through the shared control plane.

------------------------------------------------------------------------

## 12. Proven Developer → Agent Vertical Slice

The hosted vertical slice now proves both shared identity and
authoritative M2Oath enrollment.

``` text
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

Automated acceptance coverage verifies that an Agent registered through
the Developer path can be retrieved through the Agent path using the
same M2Oath-issued canonical Agent ID.

The earlier sequential `agt_000001` proof was a scaffold milestone and
is no longer the registration authority.

------------------------------------------------------------------------

## 13. Retired Hosted Scaffolds and Current Developer Authentication

The original hosted scaffolds have been replaced by durable
authoritative paths.

### 13.1 Hosted Directory Projection --- Retired

Agent list/detail reads no longer depend on process-local hosted
directory state. The hosted composition uses the domain-neutral
`AgentIdentityDirectory` boundary backed by durable MySQL identity
state. A fresh hosted composition can reconstruct Agent detail and list
state from the same database.

### 13.2 Canonical ID Issuance --- Replaced

Temporary sequential web-issued IDs have been removed from the
authoritative registration path. Canonical IDs are issued by M2Oath
enrollment using the M2Oath persistence/composition boundary.

### 13.3 Developer Authentication --- Interactive OIDC/Session Connected

Developer authentication now uses Auth0 Universal Login / OIDC. On
successful authentication, the Developer Nuxt server resolves/bootstrap
the canonical M2Oath Developer Account through the control-plane client
and establishes a Nuxt server-side session containing Developer identity
context and a request-scoped control-plane access token.

``` text
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

Developer roles/status and `agent.create` authority remain M2Oath-owned.
Auth0 claims authenticate an external principal but do not directly
become M2Oath lifecycle authority.

Agent Runtime JWT authentication remains a separate principal and is not
derived from the Developer session.

### 13.4 External Developer Identity Linking

A canonical Developer may link multiple Auth0 identities. Linking
requires both an existing authenticated Developer session and a fresh
independently authenticated external identity. The control plane
authenticates both credentials before creating the binding.

An external identity already bound to another canonical Developer
produces a conflict and is not reassigned. The `/auth/link` entry route
refuses to start Auth0 unless an existing Developer session is present.
Missing or blank secondary credentials fail closed.

------------------------------------------------------------------------

## 14. Current Authoritative Integration and Architectural Transition

The current hosted control plane is a working predecessor of Raven.
Existing registration, lifecycle, authentication, persistence, and
Agent-directory code should be treated as implementation assets to
classify rather than rewrite blindly.

The architectural destination is:

``` text
m2oath-web
    product/domain model
    Users / Accounts / Organizations / Developers
    hosted Agent resources / Workbench
            │
            ▼
M2Oath Raven
    Nuxt/Nitro server/API/orchestration
            │
       ┌────┴─────────────────┐
       │                      │
TrustProvider          TrustedDomainProvider
       │                      │
       ▼                      ▼
m2oath-trust           m2oath-weather
```

### 14.1 Product ownership and Raven persistence

Users, Accounts, Organizations, memberships, Developer profiles, hosted
Agent application resources, Workbench projects, and related
hosted-product state belong to the `m2oath-web` product domain.

Raven is the only hosted server component that directly accesses that
product persistence.

``` text
Raven
  │
  ▼
m2oath_web
```

Raven is not itself a business-data authority analogous to Trust or
Weather; it is the trusted server/runtime through which the Web product
is served.

### 14.2 M2Oath Trust authority

`m2oath-trust` is a distinct authoritative horizontal service. It owns
authoritative M2Oath Agent identity/lifecycle state, cryptographic
bindings, registration provenance, usage/outcome history,
behavioral/accumulated trust, Trust history, provenance/audit, M2Oath
Trust models, authoritative Trust persistence, and Trust
simulation/certification infrastructure.

Raven does **not** host those algorithms as its own authority. It
consumes them through a `TrustProvider`/service adapter.

``` text
Raven
  │ authenticated service API
  ▼
M2OathTrustAdapter
  │
  ▼
m2oath-trust
```

The current `@m2oath/trust` and `@m2oath/trust-simulation` packages are
architectural incubators whose components must be classified into public
contracts versus proprietary Trust implementation before physical
extraction.

### 14.3 M2Oath Weather authority

`mcp-workspace` is the implementation predecessor of `m2oath-weather`.

Weather owns Weather locations/stations, observations, forecasts,
provider semantics, verification, Weather trust/evidence, Weather
persistence, and its authenticated service interfaces.

MCP becomes an adapter to Weather authority rather than the identity of
the domain architecture.

### 14.4 Raven provider architecture

Raven supports two first-class extension axes:

``` text
Raven
 ├── TrustProvider
 │    ├── M2Oath Trust
 │    └── future enterprise/partner Trust providers
 │
 └── TrustedDomainProvider
      ├── M2Oath Weather
      ├── Finance
      ├── Logistics
      ├── Energy
      └── customer/third-party domains
```

Raven does not define replacement semantic provider interfaces. Remote
Raven adapters implement the public M2Oath contracts already defined by
`@m2oath/agent`, principally `AgentTrustStateProvider` and
`ExternalTrustEvidenceProvider<TEvidence>`. Raven-specific types
describe remote integration metadata and registry concerns only.

For Trusted Domains, Raven reduces the broader `TrustEvaluationRequest`
to the narrower `TrustedDomainEvidenceQuery` before crossing the wire.
This preserves the separation between execution/authentication context
and domain evidence.

Adapters own transport, authentication, serialization, timeout/retry,
capability discovery, failure mapping, contract translation, and
provenance propagation. Adapters are not authorities.

Adding a new Trust Provider or Trusted Domain should require a new
provider/adapter implementation and registration, not modification of
Raven core orchestration logic.

### 14.5 Service API and MCP exposure pattern

M2Oath authorities should support a repeatable exposure pattern:

``` text
                 M2Oath Authority
                        │
             ┌──────────┴──────────┐
             │                     │
       Service API             MCP Adapter
       HTTPS / JSON                │
             │                     │
             ▼                     ▼
           Raven              AI Agents /
                              MCP Clients
```

Raven normally uses authenticated HTTP/JSON Service APIs. MCP is an
optional Agent/MCP-client interface and never becomes authority.

Authoritative mutation over MCP requires explicit authentication,
authorization, audit, and provenance. An Agent must never be able to
give itself identity, trust, or lifecycle authority merely by calling an
MCP tool.

### 14.6 Trust Policy Workbench

The Workbench belongs to `m2oath-web`; authoritative Trust
simulation/certification belongs to `m2oath-trust`.

``` text
Trust Policy Workbench
        │
        ▼
M2Oath Raven
        │
        ▼
M2OathTrustAdapter
        │
        ▼
m2oath-trust
        │
        ▼
Trust Simulation / Certification
        │
        ▼
real M2Oath Trust implementation
```

The browser receives JSON-safe projections and never imports proprietary
Trust implementation or reproduces authoritative Trust arithmetic.

Developer-defined executable Trust Models must not run as arbitrary
uploaded TypeScript in Raven's primary process. Future custom executable
simulation requires isolated/sandboxed workers with bounded resources
and narrow serializable interfaces.

### 14.7 Database ownership

Database ownership follows authority ownership.

Initial infrastructure may use one physical MySQL service with three
logically isolated databases:

``` text
MySQL
├── m2oath_web
├── m2oath_trust
└── m2oath_weather
```

Use least-privilege users:

``` text
raven_web_user  → m2oath_web.* only
trust_user      → m2oath_trust.* only
weather_user    → m2oath_weather.* only
```

There is no cross-domain SQL. Raven reaches Trust and Weather through
authenticated service interfaces, not their databases.

### 14.8 Deployment and scalability

Authority boundaries are independent of deployment topology.

An initial pilot can use:

``` text
Internet
   │
   ▼
Application Droplet
├── Caddy
├── m2oath-web
├── Raven / Nitro
├── m2oath-trust
└── m2oath-weather
    separate containers
   │ private network
   ▼
Database Droplet / Managed MySQL
├── m2oath_web
├── m2oath_trust
└── m2oath_weather
```

As load grows:

-   Raven can scale horizontally behind a load balancer because
    authoritative state is not process-local;
-   Trust API nodes can scale independently from Raven;
-   Weather APIs can scale independently from ingestion and verification
    workers;
-   simulation can move to dedicated worker/queue infrastructure;
-   MCP adapters can scale independently from HTTP service APIs;
-   each logical database can move to dedicated infrastructure;
-   providers can be M2Oath-owned, customer-owned, or third-party and
    may run in other regions/clouds.

This architecture therefore scales both **horizontally** and
**federatively**.

Deployment topology does not collapse authority boundaries.

### 14.9 Migration sequence

The immediate migration sequence is:

1.  freeze the five-role platform topology;
2.  inspect `apps/control-plane` before deciding `apps/control-plane` →
    Raven versus a new `apps/raven`;
3.  define Raven provider contracts and
    failure/authentication/provenance semantics;
4.  inventory existing repositories and produce a component ownership
    matrix;
5.  split public Trust contracts from proprietary Trust implementation
    in place;
6.  extract/create `m2oath-trust`;
7.  recast `mcp-workspace` as `m2oath-weather`;
8.  evolve the hosted control plane into Raven using Nuxt/Nitro;
9.  establish the three database boundaries;
10. implement M2Oath Trust and Weather adapters;
11. connect the Workbench through Raven to Trust simulation;
12. prove public `m2oath-agent` isolation and run full regressions.

No physical move occurs before inventory/classification establishes
ownership.

------------------------------------------------------------------------

## 15. AI Trust Container and Network Boundary

The AI Trust Container is the public runtime security boundary
constructed with `m2oath-agent`. It encapsulates the Agent and controls
whether protected Agent operations may execute.

``` text
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

Both M2Oath Trust and Trusted Domain services are across an
authenticated network/service boundary from the public Trust Container
runtime. They supply authoritative inputs; neither server class may
bypass local Trust Container enforcement.

The two trust-input paths are:

``` text
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

Trust rules are programmable executable TypeScript objects. They decide
whether execution is permitted, but they do not gain protected-operation
execution authority.

``` text
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

`ProtectedOperationExecutor` / the AI Trust Container remains the final
protected-operation enforcement boundary.

------------------------------------------------------------------------

## 16. Trust and Trusted Domain Provider Boundaries

Trusted Domains are independent vertical authorities that contribute
domain-specific evidence and semantics. Trust Providers are horizontal
authorities that contribute Agent Trust state and related Trust
services.

The governing distinction is:

> **Trust establishes Agent trust. Domains establish domain evidence.**

and:

> **The evidence is vertical. The method of trust is horizontal.**

Raven is the hosted orchestration point for both categories, but the
public AI Trust Container may also consume authenticated Trust and
Domain providers directly through public provider contracts.

A provider registry should record provider identity, type/domain,
endpoint, authentication method, capabilities, schema/version, health,
provenance characteristics, and supported transports.

Provider failure must remain distinguishable from valid empty evidence
or cold-start state.

Weather is the first reference Trusted Domain, not a dependency of
generic M2Oath Trust or Raven architecture.

Future Trust and Domain providers should plug in without core Raven
conditionals or changes to protected-operation enforcement.

------------------------------------------------------------------------

## 17. Security and Packaging Invariants

Every implementation must preserve these invariants:

``` text
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

1.  browsers cannot issue canonical Agent IDs;
2.  URL parameters are untrusted input;
3.  presentation code cannot grant capabilities;
4.  presentation code cannot calculate authoritative trust;
5.  client-supplied scopes do not automatically become M2Oath authority;
6.  private Agent key material must not be exposed through ordinary
    hosted UI flows;
7.  Developer credentials cannot substitute for Agent Runtime
    credentials;
8.  Developer and Agent applications must resolve the same authoritative
    backend state;
9.  executable trust rules decide but cannot bypass Trust Container
    enforcement;
10. `ProtectedOperationExecutor` remains the final protected-operation
    execution boundary;
11. Trusted Domain controllers cannot grant protected-operation
    execution authority;
12. public `m2oath-agent` packages must not depend on proprietary
    `m2oath-trust` implementations;
13. public packages must not depend on Trusted Domain server
    implementations;
14. server-side persistence remains behind authoritative services and
    does not become policy authority; and
15. temporary repository co-location must preserve clean eventual
    repository extraction;
16. Raven must not directly query `m2oath_trust` or `m2oath_weather`;
17. Trust and Weather must not directly query one another's databases;
18. provider outage must remain distinct from empty evidence or
    cold-start state;
19. MCP access must not bypass authentication, authorization,
    provenance, or Trust Container enforcement;
20. Raven orchestration must remain provider-neutral; and
21. deployment topology must not collapse authority boundaries.

## 18. Runtime Configuration

The Developer and Agent Nuxt applications use private Nuxt runtime
configuration for the shared control-plane address.

Development control-plane value:

``` text
http://127.0.0.1:4000
```

The Developer application additionally uses a private server-side
`developerToken` configuration value, overridable through
`NUXT_DEVELOPER_TOKEN`. It is intentionally not placed under Nuxt
`public` runtime configuration.

The production control plane requires Developer JWT verification
configuration for issuer, audience, JWKS URI, and the exact authorized
Developer subject.

The browser communicates with its owning Nuxt server route; the Nuxt
server communicates with the control plane. The implemented Developer
login/session flow uses this seam so request-scoped credentials stay in
server-side session/transport context rather than application payloads
or browser-managed control-plane calls.

------------------------------------------------------------------------

## 19. Testing Strategy

The architecture is tested at package, control-plane, integration, and
workspace boundaries.

### Package Tests

`@m2oath/control-plane-client` currently has **5 passing tests**,
including Bearer transport and proof that authentication stays out of
the registration payload.

### Control-Plane Tests

`@m2oath/control-plane` currently has **12 passing tests** across three
files. Coverage includes API behavior, hosted identity acceptance, HTTP
401/403 semantics, real RS256 Developer JWT verification, and rejection
of a JWT signed by an untrusted key.

### Workspace Regression

The September 8, 2026 Phase 6 checkpoint passed:

``` text
pnpm typecheck  GREEN
pnpm test       GREEN — 17 tests
pnpm build      GREEN
```

The repository also retains lint as a normal architectural checkpoint
command.

### Acceptance Invariant

Automated coverage now proves:

> **An Agent registered through the Developer path can be retrieved
> through the Agent path using the same M2Oath-issued canonical Agent
> ID.**

------------------------------------------------------------------------

## 20. Documentation Boundary

There are two distinct documentation areas.

### Repository Engineering Documentation

``` text
docs/
```

Contains internal/project engineering sources of truth such as:

``` text
ARCHITECTURE.md
WEBSITE_REQUIREMENTS.md
ARCHITECTURE_DECISIONS.md
DEVELOPMENT_ROADMAP.md
```

These documents describe how M2Oath Web is designed and built.

### Public Developer Documentation

``` text
apps/docs/
```

This is the VitePress application published at:

``` text
developer.m2oath.com/docs/
```

It contains curated documentation for users of M2Oath.

Internal workplans, temporary checkpoints, and engineering notes should
not automatically become public documentation.

------------------------------------------------------------------------

## 21. Current Routing Baseline

### Public

``` text
m2oath.com/
```

### Developer

``` text
developer.m2oath.com/
developer.m2oath.com/dashboard
developer.m2oath.com/agents
developer.m2oath.com/agents/new
developer.m2oath.com/agents/:agentId
developer.m2oath.com/auth/auth0
developer.m2oath.com/auth/signup
developer.m2oath.com/auth/link
```

Protected Developer application pages require a Nuxt Developer session.
The identity-linking route additionally requires an existing Developer
session before initiating the fresh Auth0 login used to prove the
secondary external identity.

### Shared Authentication Presentation

Auth0 Universal Login is branded as M2Oath but remains a separately
hosted authentication document. The Developer Portal supports light/dark
Nuxt UI color modes with separate transparent M2Oath logo assets. A
future Auth0 customization may receive presentation-only light/dark
context from the Nuxt OAuth entry route so Universal Login visually
follows the user's selected theme.

Theme context must never influence authentication, Developer identity
resolution, authorization, ownership, token issuance, session security,
or Trust Container policy. The same branded authentication experience
may later serve other human M2Oath account types using server-side
sessions without exposing an M2Oath API JWT to browser code.

### Agent

``` text
agent.m2oath.com/
agent.m2oath.com/agents
agent.m2oath.com/agents/:agentId
```

Stable future Agent child-route locations may include:

``` text
/agents/:agentId/trust
/agents/:agentId/evidence
/agents/:agentId/kpis
/agents/:agentId/operations
/agents/:agentId/policy
/agents/:agentId/trusted-domains
/agents/:agentId/usage
```

These future locations do not imply that their underlying capabilities
are already implemented.

------------------------------------------------------------------------

## 22. Current Git Checkpoint

The latest committed and pushed hosted-platform checkpoint before the
current Phase 8 working tree is:

``` text
34028e8  Update 09-09-2026 2:01pm
```

The current Phase 8 working tree adds the remaining Developer
authentication/session hardening, secure external-identity linking
coverage, M2Oath/Auth0 branding, light/dark logo presentation, and
documentation updates described here. The final full-workspace
validation and Phase 8 commit/push remain pending.

------------------------------------------------------------------------

## 23. Next Architectural Milestones

The current implementation now enters **Step 10 Day 10E --- Platform
Architecture & Boundary Extraction**.

``` text
Day 10A — Simulation Foundation                         COMPLETE
Day 10B — Diagnostics                                   COMPLETE
Day 10C — Canonical Scenario Library                    COMPLETE
Day 10D — Trusted Domain Composition                    COMPLETE
Day 10E — Platform Architecture & Boundary Extraction   NEXT
Day 10F — Raven Simulation API                          PLANNED
Day 10G — Trust Policy Workbench UI                     PLANNED
Day 10H — Day 10 Integration / Seal                     PLANNED

Day 11 — Population-scale simulation (~1M operations)
Day 12 — Model analysis / comparison / tuning
Day 13 — Adversarial / certification expansion
Day 14 — Operationalization / production readiness
Day 15 — Step 10 integration / validation / seal
```

Day 10E includes:

1.  freeze platform topology;
2.  design Raven;
3.  define `TrustProvider` and `TrustedDomainProvider`;
4.  inventory repositories;
5.  produce ownership/migration matrix;
6.  split public/proprietary Trust boundaries;
7.  extract `m2oath-trust`;
8.  recast `mcp-workspace` as `m2oath-weather`;
9.  evolve the current hosted control plane into Raven/Nitro;
10. establish database isolation;
11. integrate Trust + Weather adapters; and
12. run full architecture/regression validation.

Day 10E must complete before Day 10F/10G so the Workbench is built
against the durable authority topology rather than temporary monorepo
placement.

------------------------------------------------------------------------

## 24. Governing Principle

M2Oath separates evidence authority, trust-service authority, and
protected-operation execution authority.

``` text
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

The target hosted path adds Raven without changing the execution
boundary:

``` text
M2Oath Web / Trust Policy Workbench
                │
                ▼
          M2Oath Raven
        Nuxt/Nitro API + orchestration
          │             │
          ▼             ▼
   TrustProvider   TrustedDomainProvider
          │             │
          ▼             ▼
   m2oath-trust    m2oath-weather / others
```

The protected runtime path remains independently enforced:

``` text
m2oath-trust ───────────────┐
                            │
Trusted Domains ────────────┼──► AI Trust Container
                            │       │
Operation Context ──────────┘       ▼
                             executable policy
                                    │
                               ALLOW / DENY
                                    │
                                    ▼
                         ProtectedOperationExecutor
```

The authority model is:

-   **M2Oath Raven** is the trusted hosted API/application/orchestration
    runtime, initially implemented with Nuxt/Nitro in `m2oath-web`.
    Hosting or orchestrating a capability does not give Raven
    protected-operation execution authority.
-   **`m2oath-trust`** is the distinct horizontal authority for M2Oath
    Agent identity/lifecycle/trust state and Trust
    simulation/certification. The current `@m2oath/trust` package is
    implementation being classified for that authority.
-   **Trusted Domain servers** are authoritative for evidence and
    semantics within their domains.
-   **The AI Trust Container** is authoritative for local policy
    evaluation and final protected-operation enforcement for the
    encapsulated Agent.

The web platform may request, orchestrate, display, and manage.

M2Oath Trust and Trusted Domain servers may provide authoritative
inputs.

**Neither may bypass the AI Trust Container. Protected execution occurs
only through the Trust Container's enforcement boundary.**

## Day 10E.5 Boundary-Extraction Seal --- 2026-09-18

Day 10E.5 is **COMPLETE**. Repository and source inspection froze the
ownership, dependency, network, persistence, migration, and extraction
boundaries that govern Day 10E.6 and later work.

### Frozen public/proprietary boundary

`@m2oath/agent` retains the public M2Oath programming model, including
Trust contracts, programmable executable TypeScript policy/rule
primitives, identity/lifecycle contracts, provider contracts, behavioral
evidence contracts, and generic developer-usable implementations.

``` text
@m2oath/agent
      ▲
      │ public contracts
      │
@m2oath/trust
```

`@m2oath/agent` must never depend on proprietary `@m2oath/trust`.

The authoritative extraction cluster is:

``` text
@m2oath/trust
├── authoritative M2Oath Trust implementation
├── @m2oath/persistence-mysql
└── @m2oath/trust-simulation
```

`@m2oath/weather-trust` belongs with the future `m2oath-weather` Trusted
Domain and depends only on public M2Oath contracts.

### Frozen Raven dependency transformation

The current `apps/control-plane` is the implementation predecessor of
Raven. It must evolve into Raven rather than creating a competing
canonical backend.

``` text
CURRENT

Raven predecessor
    └── @m2oath/persistence-mysql
            └── @m2oath/trust

TARGET

Raven
├── m2oath_web repositories
├── public @m2oath/agent contracts
├── M2Oath Trust remote adapter
│       └── authenticated HTTPS → m2oath-trust
└── Trusted Domain remote adapters
        └── authenticated HTTPS → m2oath-weather / other domains
```

Raven must not depend directly on Trust persistence or proprietary Trust
implementation. Raven adapters reuse public M2Oath provider semantics;
they do not redefine them.

### Frozen database ownership

``` text
Authority        Database          Access
────────────────────────────────────────────────
Raven/Web        m2oath_web        m2oath_web only
M2Oath Trust     m2oath_trust      m2oath_trust only
M2Oath Weather   m2oath_weather    m2oath_weather only
```

``` text
raven_web_user → m2oath_web.* only
trust_user     → m2oath_trust.* only
weather_user   → m2oath_weather.* only
```

Current `m2oath_trust` tables:

``` text
agent_identities
agent_identity_bindings
agent_cryptographic_bindings
agent_registration_provenance
agent_lifecycle_audit_events
agent_audit_events
agent_usage_events
behavioral_verifications
```

Current `m2oath_web` product tables:

``` text
developer_accounts
developer_identity_bindings
developer_agent_relationships
```

The Developer-named tables may be generalized later into the broader
User/Account/Organization model, but that product migration is
deliberately separate from authority extraction.

### Frozen network replacements

Canonical Agent registration, registration recovery, identity lookup,
key rotation, disable, lifecycle state, provenance, and authoritative
Trust state cross Raven → M2Oath Trust through an authenticated service
boundary.

Web User/Account/relationship persistence remains local to Raven and
`m2oath_web`. Weather evidence crosses Raven → M2Oath Weather through an
authenticated Trusted Domain boundary.

Raven integration tests must stop manipulating Trust SQL directly.
Cross-authority tests must exercise the service/provider boundary.

### Frozen physical migration order

1.  Preserve public `@m2oath/agent`.
2.  Establish the `m2oath-trust` service boundary.
3.  Move authoritative Trust persistence and migrations with Trust.
4.  Prove `m2oath-trust` independently.
5.  Introduce the Raven Trust remote adapter.
6.  Replace Raven's in-process Trust lifecycle composition.
7.  Give Raven independent `m2oath_web` persistence infrastructure.
8.  Remove Raven's `@m2oath/persistence-mysql` dependency.
9.  Rewrite Raven integration tests around the network boundary.
10. Recast `mcp-workspace` as `m2oath-weather`.
11. Establish the Weather Trusted Domain API.
12. Add the Raven Weather adapter.
13. Establish isolated database users and grants.
14. Rename/evolve `apps/control-plane` into Raven after extraction is
    proven.
15. Run full cross-repository regression and architecture validation.

### Extraction gates

-   public `@m2oath/agent` builds without proprietary Trust;
-   only M2Oath Trust issues canonical Agent IDs and mutates canonical
    lifecycle state;
-   Raven cannot query Trust or Weather tables;
-   Trust cannot query Weather tables;
-   Weather cannot query Trust tables;
-   Weather evidence cannot silently mutate accumulated Agent trust;
-   simulation cannot mutate production Trust state;
-   Raven, Trust, Weather, and simulation cannot execute protected Agent
    operations;
-   only the Trust Container / `ProtectedOperationExecutor` grants
    protected execution;
-   provider outages are not interpreted as empty evidence or zero
    trust;
-   transport caller and delegated human principal remain distinct;
-   provider transport does not change authority semantics; and
-   each database principal has access only to its authority-owned
    database.

The next active architecture task is **Day 10E.6 --- Refactor the public
versus proprietary Trust boundary**.
