# M2Oath Web Architecture Decisions

**Document Type:** Architecture Decision Record  
**Status:** Active  
**Date:** 2026-09-08  
**Repository:** `m2oath-web`  
**Related Documents:** `docs/ARCHITECTURE.md`, `docs/WEBSITE_REQUIREMENTS.md`

---

## 1. Purpose

This document records the significant architectural decisions for the M2Oath hosted web platform.

`ARCHITECTURE.md` describes the architecture as it exists.

This document explains **why** important boundaries and technology choices were made, what alternatives were rejected or deferred, and which invariants future changes must preserve.

Decisions may evolve, but changes should be deliberate and recorded rather than emerging accidentally through implementation.

---

# ADR-001 — Separate the Hosted Web Platform from the Open-Source Framework

**Status:** Accepted

## Context

M2Oath has two fundamentally different concerns:

1. a reusable open-source framework that outside developers can install and integrate; and
2. an M2Oath-operated hosted product experience.

Combining these concerns in one repository would make it easier for hosted-product assumptions, UI dependencies, deployment concerns, and private service architecture to leak into the reusable framework.

## Decision

Maintain two separate repositories:

```text
m2oath-agent/
    Open-source framework and npm packages

m2oath-web/
    M2Oath-operated hosted web platform
```

`m2oath-web` consumes stable public M2Oath boundaries. It does not own or redefine the reusable M2Oath security model.

## Consequences

The repositories can evolve and deploy independently.

The open-source framework remains usable without M2Oath-hosted services.

Integration between the repositories must occur through explicit package, service, or API contracts.

## Governing Test

> Could an outside developer use `m2oath-agent` without needing any M2Oath hosted website code?

The answer must remain **yes**.

---

# ADR-002 — Separate Developer and Agent into Durable Applications

**Status:** Accepted

## Context

Developer workflows and Agent operational workflows represent different identities, responsibilities, and security concerns.

Developer concerns include onboarding, integration, credentials, and registration.

Agent concerns include canonical identity, lifecycle, behavior, evidence, trust, KPIs, policy outcomes, and authority.

Combining these into one undifferentiated application would blur the distinction between the human/developer principal and the machine/agent principal.

## Decision

Use separate Nuxt applications:

```text
developer.m2oath.com
agent.m2oath.com
```

The permanent product boundary is:

> **Developer is where you build and register. Agent is where registered agents land and where their identity, lifecycle, behavior, evidence, trust, KPIs, policy outcomes, and authority are observed and managed.**

## Consequences

Developer identity remains distinct from Agent identity.

Developer credentials cannot become Agent Runtime credentials merely because both experiences are part of the M2Oath product.

The applications can evolve independently while sharing authoritative backend state.

---

# ADR-003 — Use a Shared Control Plane as the Authoritative Hosted Boundary

**Status:** Accepted

## Context

Developer and Agent are separate applications but operate on the same registered agents.

Allowing each application to maintain its own agent state would create divergent identity models and undermine canonical identity.

## Decision

Both applications communicate through a shared control-plane boundary:

```text
Developer
    │
    ▼
Shared Control Plane
    ▲
    │
Agent
```

The current implementation lives at:

```text
apps/control-plane
```

## Consequences

A registered agent has one hosted authoritative record.

Developer and Agent observe the same canonical Agent ID.

The control plane becomes the natural integration point for authoritative M2Oath services, authentication, authorization, persistence, lifecycle, and future trust data.

---

# ADR-004 — Introduce a Typed Control-Plane Client

**Status:** Accepted

## Context

Direct ad hoc HTTP calls from multiple hosted applications would duplicate endpoint knowledge, error handling, serialization, and route construction.

It would also make future control-plane changes harder to isolate.

## Decision

Create:

```text
@m2oath/control-plane-client
```

at:

```text
packages/control-plane-client
```

The client owns the typed transport contract between hosted application servers and the shared control plane.

## Consequences

Nuxt applications depend on a stable typed client rather than reproducing control-plane HTTP details.

The client remains thin and must not become an alternate location for identity, authorization, lifecycle, or trust policy.

---

# ADR-005 — Keep Authoritative Calls on the Nuxt Server Side

**Status:** Accepted

## Context

Browsers are untrusted clients.

Exposing the internal control-plane topology directly to browser code would unnecessarily couple UI code to backend deployment details and complicate future authentication/session handling.

## Decision

Use application-owned Nuxt server routes as the browser-facing boundary.

Example:

```text
Browser
    │
    ▼
Developer /api/agents/register
    │
    ▼
Developer Nuxt Server
    │
    ▼
Control-Plane Client
    │
    ▼
Shared Control Plane
```

The same pattern applies to Agent application reads and future mutations.

## Consequences

Private runtime configuration can hold the control-plane address.

The browser remains separated from internal service topology.

Future authentication, cookies, CSRF controls, authorization context, and service credentials have an appropriate server-side integration point.

---

# ADR-006 — Treat Browser and URL Agent IDs as Untrusted Input

**Status:** Accepted

## Context

A route such as:

```text
/agents/agt_123
```

contains a client-supplied identifier.

Displaying that identifier as though it were authoritative would allow presentation input to masquerade as canonical identity.

## Decision

Route parameters identify what record the client is requesting.

The authoritative Agent identity displayed by the application must come from the control-plane response.

## Consequences

The Agent detail page resolves the requested ID through the shared control plane.

The UI may show that the identity boundary was verified.

The governing identity rule remains:

> **An Agent ID is issued through enrollment or canonical identity mapping and cannot be self-asserted as proof of identity.**

---

# ADR-007 — Keep Hosted Directory State as a Temporary Projection

**Status:** Accepted Temporarily

## Context

The first hosted slice used an in-memory store both to prove shared state and to issue temporary sequential Agent IDs. Authoritative M2Oath enrollment is now integrated, so the hosted store must no longer be described as the canonical identity authority.

## Decision

Retain process-local hosted directory state only as a temporary projection for current Agent list/detail experiences. Canonical Agent identity is issued by M2Oath enrollment.

## Consequences

Restarting the control plane can still lose the hosted projection. Durable persistence remains required, but no future persistence design may turn the hosted directory into a competing identity or policy authority.

---

# ADR-008 — Canonical Agent IDs Are Issued by M2Oath Enrollment

**Status:** Superseded Scaffold Decision / Current Rule Accepted

## Context

The initial Day 3 scaffold issued sequential IDs such as `agt_000001` only to prove that browsers did not manufacture identity. Phase 5 replaced that temporary authority path.

## Decision

The hosted control plane must not manufacture canonical Agent IDs. Registration delegates to the public M2Oath lifecycle/enrollment boundary, which issues canonical `agt_<UUID>` identities.

## Consequences

The browser, Developer Nuxt server, control-plane transport, and hosted directory cannot choose canonical Agent identity. The original sequential-ID mechanism is historical scaffold behavior only.

---

# ADR-009 — Preserve M2Oath Core as the Security Authority

**Status:** Accepted

## Context

A management UI can easily accumulate business logic until presentation or API code begins deciding identity, authorization, trust, or execution.

That would duplicate and weaken the M2Oath security architecture.

## Decision

The hosted platform may orchestrate and display authoritative results, but it does not replace M2Oath core security services.

The target path remains:

```text
Authenticate
    ↓
Resolve Canonical Identity
    ↓
Authorize
    ↓
Evaluate Trust
    ↓
Policy ALLOW / DENY
    ↓
Trust Container Enforcement
    ↓
Protected Operation
```

## Consequences

UI code cannot calculate authoritative trust.

Control-plane transport code cannot grant execution authority.

Trust policy decides but does not execute protected operations.

`ProtectedOperationExecutor` / the Trust Container remains the enforcement boundary.

---

# ADR-010 — Developer Credentials and Agent Runtime Credentials Remain Separate

**Status:** Accepted

## Context

Developer registration requires a human/developer authority to create and manage an Agent.

Runtime operation requires the registered Agent to authenticate independently.

Using the Developer credential as the Agent's runtime credential would collapse two principals and undermine provenance.

## Decision

Maintain:

```text
Developer JWT
    authenticates developer

Agent Runtime JWT
    authenticates agent runtime
```

A Developer credential may authorize lifecycle operations such as `agent.create` when policy permits.

It must not become the Agent Runtime credential.

## Consequences

Registration must provision or bind independent Agent runtime cryptographic identity.

The hosted UI must not encourage copying Developer bearer credentials into Agent runtimes.

---

# ADR-011 — Registration Does Not Create Behavioral Trust

**Status:** Accepted

## Context

A newly registered Agent has identity and lifecycle state but has not yet accumulated behavioral history.

Treating registration as trust would confuse identity with evidence.

## Decision

Registration establishes identity and related provenance/bindings.

It does not grant accumulated behavioral trust merely by succeeding.

## Consequences

New Agents may begin with provisional or policy-defined authority, but any such authority must be explicit policy—not an implied trust score created by registration.

Historical behavior remains the basis for accumulated Agent Trust.

---

# ADR-012 — Use Nuxt 4 for Hosted Applications

**Status:** Accepted

## Context

The hosted platform needs SSR/server capabilities, routing, Vue integration, server endpoints, and a productive application framework.

Nuxt 3 reached end of life in 2026.

## Decision

Use Nuxt 4 for:

```text
apps/web
apps/developer
apps/agent
```

## Consequences

The applications share a modern Vue/Nuxt development model.

Nuxt server routes provide the browser-to-control-plane seam.

Future upgrades should be deliberate and validated through workspace regression.

---

# ADR-013 — Use VitePress as a Separate Public Documentation Application

**Status:** Accepted

## Context

Developer documentation has different publishing, navigation, search, and content requirements from the Developer application itself.

Embedding all documentation directly inside the Developer Nuxt application would unnecessarily couple two different workloads.

## Decision

Use VitePress in:

```text
apps/docs
```

with target path:

```text
developer.m2oath.com/docs/
```

## Consequences

Documentation remains independently buildable and deployable.

The VitePress application can share selected visual assets later without becoming a Nuxt application.

Internal engineering documentation remains separate under root `docs/`.

---

# ADR-014 — Separate Internal Engineering Documentation from Public Documentation

**Status:** Accepted

## Context

Architecture decisions, implementation checkpoints, workplans, and internal requirements are useful to maintainers but should not automatically appear in public developer documentation.

## Decision

Use:

```text
docs/
```

for repository engineering documentation.

Use:

```text
apps/docs/
```

for curated public developer documentation.

## Consequences

Documents such as these remain internal/project-facing:

```text
docs/ARCHITECTURE.md
docs/ARCHITECTURE_DECISIONS.md
docs/WEBSITE_REQUIREMENTS.md
```

Stable public concepts can later be distilled into VitePress pages.

---

# ADR-015 — Use Nuxt UI Defaults Before Building a Design System

**Status:** Accepted

## Context

The initial web-platform work is intended to prove product boundaries, authority paths, API contracts, and workflows.

Building a custom visual system before those boundaries stabilize would add cost without reducing architectural risk.

## Decision

Use Nuxt UI defaults for the current hosted applications.

Defer custom branding, colors, typography, and extensive shared presentation components.

## Consequences

Current UI work remains functional and consistent.

Future branding should be centralized when introduced.

A shared UI package should contain only genuinely reusable components rather than speculative abstractions.

---

# ADR-016 — Keep Trusted Domains Outside M2Oath Core Authority

**Status:** Accepted

## Context

External domains such as weather have their own semantics, data quality models, verification processes, and evidence.

Embedding those semantics into M2Oath core would make the framework domain-specific.

## Decision

Trusted Domains produce domain evidence through explicit external-evidence boundaries.

M2Oath consumes that evidence under policy and retains final execution authority.

## Consequences

Weather can be the flagship reference domain without becoming a core dependency.

Future domains can integrate using the same architectural seam.

The governing principle is:

> **The evidence is vertical. The method of trust is horizontal.**

---

# ADR-017 — Do Not Use “Console” as a Product Boundary

**Status:** Accepted

## Context

Earlier product exploration used generic “console” terminology.

As the product architecture matured, that term became too ambiguous because it obscured the important distinction between Developer workflows and Agent operations.

## Decision

Use explicit durable product names:

```text
Developer
Agent
```

Do not introduce a generic M2Oath “Console” as an architectural application boundary.

## Consequences

Documentation and UI should consistently describe the Developer application and Agent application by their actual roles.

This improves both product clarity and security reasoning.

---

# ADR-018 — Preserve Package Name Separation Between Agent Core and Agent Web

**Status:** Accepted

## Context

The open-source repository already owns:

```text
@m2oath/agent
```

The hosted Agent application also needed a package name.

Using the same package name would create ambiguity in tooling, documentation, and dependency reasoning.

## Decision

Name the hosted application:

```text
@m2oath/agent-web
```

while preserving:

```text
@m2oath/agent
```

for the reusable framework package.

## Consequences

Package references clearly distinguish the security framework from the hosted application.

---

# ADR-019 — Validate the Workspace as a Whole at Architectural Checkpoints

**Status:** Accepted

## Context

The web platform is a monorepo with multiple applications and packages.

A change that passes locally in one package can still break another workspace project.

## Decision

At meaningful checkpoints run:

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

## Consequences

Architectural milestones are validated across the repository rather than only at the package being edited.

The September 7, 2026 Developer → Control Plane → Agent checkpoint passed all four commands.

---

# ADR-020 — Automate the Cross-Application Identity Invariant

**Status:** Accepted and Implemented

## Context

Developer and Agent are separate applications that must observe the same canonical registered Agent.

## Decision

Maintain acceptance coverage proving:

> **An Agent registered through the Developer path can be retrieved through the Agent path using the same M2Oath-issued canonical Agent ID.**

## Consequences

Refactoring of routing, clients, persistence, or M2Oath composition is protected against accidental divergence of Developer and Agent identity state.

---

# ADR-021 — Integrate Authoritative M2Oath Enrollment Through Public Package Boundaries

**Status:** Accepted and Implemented

## Context

The hosted control plane needed authoritative M2Oath enrollment without copying framework internals into `m2oath-web`.

## Decision

Use a hosted adapter/composition boundary that delegates registration through `@m2oath/sdk` and authoritative M2Oath lifecycle services. The hosted control plane does not issue canonical identity itself.

Current path:

```text
m2oath-web Control Plane
    ↓
M2OathAgentRegistrationGateway
    ↓
M2OathSdk.registerAgent()
    ↓
AuthorizedAgentEnrollmentService
    ↓
AgentEnrollmentService
    ↓
AgentRegistrationService
    ↓
canonical Agent ID
```

## Consequences

Canonical ID issuance, creator provenance, identity/binding semantics, and lifecycle authorization remain M2Oath-owned. The hosted repository remains an orchestration/API surface rather than a duplicate security engine.

---

# ADR-022 — Developer Authentication Is Request-Scoped and Cryptographically Verified

**Status:** Accepted

## Context

Protected Developer lifecycle operations require a Developer principal, but Developer credentials must remain distinct from Agent enrollment data and Agent Runtime credentials. Authentication and authorization also need distinct failure semantics.

## Decision

For protected registration:

- the Developer Nuxt server attaches a private Bearer credential through `@m2oath/control-plane-client`;
- the client keeps the credential out of `RegisterAgentRequest`;
- the control plane passes authentication per request and never caches caller credentials in the registration gateway;
- production composition verifies Developer JWT signature, issuer, and audience through `@m2oath/auth-jwt` using remote JWKS configuration;
- M2Oath lifecycle policy grants `agent.create` only to configured exact Developer principals;
- JWT `scope` / `scp` claims do not automatically become M2Oath lifecycle authority;
- missing credentials map to 401, failed authentication maps to 401, and authenticated-but-unauthorized principals map to 403.

## Consequences

The Developer credential remains HTTP/security context only. It does not become canonical Agent identity, Agent Runtime credential, Agent trust evidence, or automatic capability authority.

The currently configured Developer Nuxt token is a private server-side seam. A future OIDC/login/session implementation can replace how that request-scoped credential is obtained without changing the control-plane security boundary.

---

# Decision Summary

Accepted architecture currently establishes:

```text
Open Source Framework
        │
        │ stable public boundaries
        ▼
Hosted Control Plane
        ▲
        │
  ┌─────┴─────┐
  │           │
Developer    Agent
  │           │
  └──── UI / management ────┘
```

The most important separation remains:

> **The hosted platform is a management and observation surface over M2Oath authority. It is not a replacement authority system.**

Future decisions should preserve that boundary unless a later ADR explicitly supersedes it.
