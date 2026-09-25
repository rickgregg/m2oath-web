# ADR: Federated Identity and the M2Oath Principal Model

**Status:** Accepted\
**Date:** 2026-09-25\
**Scope:** M2Oath platform architecture\
**Applies to:** `m2oath-agent`, `m2oath-trust`, `m2oath-web`, Raven,
Trust Containers, Trusted Domains, and future identity-provider
integrations

## 1. Decision

M2Oath adopts a **federated identity architecture** in which external
identity providers authenticate principals and issue identity
assertions, while M2Oath remains authoritative for canonical identity
bindings, authorization, trust relationships, and protected-operation
enforcement.

M2Oath recognizes three principal categories:

1.  **Human Principal** --- a person acting directly through a
    Developer, customer, administrative, or other user-facing
    application.
2.  **Workload Principal** --- a non-human service or application acting
    as a machine identity, such as Raven.
3.  **Agent Principal** --- an AI Agent with a canonical M2Oath identity
    and, where applicable, accumulated Agent Trust.

These categories are intentionally distinct. Authentication as one
category does not silently confer the authority, trust state, or
capabilities of another.

## 2. Architectural Principle

External identity systems answer questions such as:

> Who authenticated this caller, and what identity assertion did the
> trusted issuer provide?

M2Oath answers different questions:

> Which canonical M2Oath principal does that external identity
> represent?

> What is that principal authorized to do?

> What trust evidence applies to the requested operation?

> Should the protected operation be allowed to execute?

An external identity provider is therefore a **trusted identity
issuer**, not the canonical M2Oath identity system and not the M2Oath
trust authority.

## 3. Canonical Principal Model

A M2Oath principal may contain or reference:

-   a canonical M2Oath principal identifier;
-   a principal category;
-   one or more external identity bindings;
-   authentication evidence;
-   authorization policies, scopes, or capabilities;
-   provenance and lifecycle information;
-   audit evidence.

Agent Principals may additionally participate in accumulated trust and
domain-specific trust evaluation.

Conceptually:

``` text
External Identity Provider
        |
        | authentication assertion
        v
+-------------------------------+
| M2Oath External Identity      |
| Binding / Resolution          |
+-------------------------------+
        |
        v
+-------------------------------+
| Canonical M2Oath Principal    |
|                               |
| - Human Principal             |
| - Workload Principal          |
| - Agent Principal             |
+-------------------------------+
        |
        +------> Authorization / Capabilities
        |
        +------> Audit / Provenance
        |
        +------> Trust State (when applicable)
```

The canonical M2Oath identity is stable independently of any particular
external identity provider.

## 4. Human Principals

Human Principals represent people using M2Oath applications.

The current Developer application uses Auth0/OIDC authentication. Auth0
authenticates the Developer and supplies an external identity assertion.
M2Oath binds that assertion to the Developer's canonical M2Oath
identity.

The Developer access token is a **user-delegated credential**. It
represents the authenticated human principal and must not be repurposed
as a service identity or Agent identity.

Where refresh tokens are available, the Developer server may use the
OAuth/OIDC refresh-token lifecycle to maintain the user's authenticated
session without exposing credentials to browser code.

Passwords remain the responsibility of the external identity provider.
M2Oath does not store, prefill, or transmit Developer passwords.

## 5. Workload Principals

Workload Principals represent services that authenticate independently
of a human user.

Raven is the first concrete implementation of this model.

Raven uses OAuth 2.0 **Client Credentials** against Auth0 to obtain an
access token for the M2Oath Control Plane audience. Raven acquires the
credential on demand, caches it according to its lifetime, and obtains a
replacement when it approaches expiration.

Raven does **not** use:

-   a human refresh token;
-   a pre-generated JWT file;
-   a local JWT minting service;
-   a background JWT refresh timer.

The resulting access token authenticates Raven as a Workload Principal.

Authentication of Raven does not make Raven:

-   a Human Principal;
-   an Agent Principal;
-   a source of accumulated Agent Trust;
-   a Trusted Domain authority;
-   the protected-operation execution authority.

Raven remains a service/orchestration boundary.

## 6. Agent Principals

Agent Principals represent AI Agents registered with M2Oath.

An Agent Principal may have:

-   canonical Agent identity;
-   external identity bindings;
-   cryptographic bindings;
-   registration provenance;
-   lifecycle state;
-   authentication evidence;
-   authorization/capability state;
-   usage and outcome evidence;
-   accumulated Agent Trust;
-   domain-specific trust evidence.

Agent identity and workload identity are not interchangeable.

A service may invoke M2Oath on behalf of, or in relation to, an Agent,
but the service's successful authentication does not cause the service
to inherit the Agent's identity or trust.

## 7. Trust Is Separate from Authentication

Authentication establishes identity evidence.

Authorization determines whether the authenticated principal has
authority to request an operation.

Trust evaluation determines whether relevant accumulated and
domain-specific evidence satisfies the policy governing a protected
operation.

These are separate stages:

``` text
Authentication
      |
      v
Canonical Identity Resolution
      |
      v
Authorization
      |
      v
Trust Evaluation
      |
      v
ALLOW / DENY
      |
      v
Trust Container Enforcement
```

A successful authentication result must never be interpreted as an
automatic trust grant.

Likewise, possession of trust evidence must not become an execution
capability.

## 8. Trust Container Enforcement Boundary

The Trust Container remains the protected-operation enforcement
authority.

Conceptually, the AI Agent is encapsulated by the Trust Container:

``` text
+------------------------------------------------------+
| M2Oath Trust Container                               |
|                                                      |
|   +--------------------+                             |
|   | AI Agent           |                             |
|   |                    |                             |
|   | requests operation |----+                        |
|   +--------------------+    |                        |
|                             v                        |
|                  +----------------------+            |
|                  | Trust Enforcement    |            |
|                  |                      |            |
|                  | Identity             |            |
|                  | Authorization        |            |
|                  | Agent Trust          |            |
|                  | Domain Trust         |            |
|                  | Policy               |            |
|                  +----------+-----------+            |
|                             |                        |
|                  DENY ------+------ ALLOW            |
|                    |                   |              |
|                    v                   v              |
|                 blocked       protected operation ---+---->
|                                                      |
+------------------------------------------------------+
```

Trust rules may be executable TypeScript objects and may make ALLOW/DENY
decisions, but they do not gain protected-operation execution authority.

`ProtectedOperationExecutor` / the Trust Container remains the
enforcement boundary.

## 9. Trusted Domains

Trusted Domain servers operate across an authenticated network boundary
and remain authoritative for their domain-specific evidence and
semantics.

Examples may include:

-   M2Oath Weather;
-   finance;
-   logistics;
-   energy;
-   other future domains.

Trusted Domains do not execute the protected operation.

M2Oath Trust remains domain-neutral and consumes domain evidence through
explicit provider/plugin interfaces. Adding a new Trusted Domain must
not require embedding domain-specific logic into M2Oath's core trust
model.

The relationship is:

``` text
Agent Trust State ------------------+
                                    |
                                    v
                              Trust Policy
                                    ^
                                    |
Trusted Domain Evidence ------------+
                                    |
                                    v
                              ALLOW / DENY
                                    |
                                    v
                         Trust Container Enforcement
```

## 10. Raven's Role

Raven is an orchestrator and service boundary.

Raven may:

-   authenticate as its own Workload Principal;
-   receive authenticated Developer requests;
-   call M2Oath Trust through authorized service interfaces;
-   call Trusted Domain services through authorized interfaces;
-   coordinate control-plane workflows;
-   expose appropriate Developer-facing APIs.

Raven must not become the authority for:

-   canonical Agent trust state;
-   Trusted Domain evidence;
-   protected-operation execution;
-   human identity merely because a human request passed through Raven;
-   Agent identity merely because an Agent-related request passed
    through Raven.

Raven's identity answers **who the calling service is**, not **which
Agent has earned trust**.

## 11. Current Raven Implementation

The current local and development architecture uses Auth0 as the trusted
external issuer for Raven.

The runtime path is:

``` text
Developer
    |
    | authenticated Developer request
    v
Developer Server
    |
    v
Raven
    |
    | OAuth 2.0 client_credentials
    v
Auth0
    |
    | Raven workload access token
    v
Raven
    |
    | Bearer workload credential
    v
M2Oath Trust
    |
    | authenticated + authorized simulation
    v
Trust Policy Workbench Result
```

This path has been runtime-validated after a full application-stack
restart and after credential rotation.

The previous local Identity-server mechanism and pre-generated
`raven-service.jwt` mechanism are obsolete and have been removed.

## 12. Credential Lifecycle

Different principal categories may require different OAuth/OIDC
credential lifecycles.

### Human / Developer

The Developer application may use:

-   Authorization Code / OIDC login;
-   user-delegated access tokens;
-   refresh tokens where configured and appropriate;
-   secure server-side session storage.

### Workload / Raven

Raven uses:

-   OAuth 2.0 Client Credentials;
-   its own client identity and client secret;
-   an explicit M2Oath Control Plane audience;
-   on-demand token acquisition;
-   expiration-aware in-memory caching;
-   renewal by performing another client-credentials exchange.

Raven does not use a human refresh token.

### Agent

Agent authentication is governed by M2Oath Agent identity and
authentication abstractions and may evolve independently of the Human
and Workload credential mechanisms.

## 13. Federation Strategy

The architecture must not depend permanently on Auth0.

Auth0 is the first trusted external issuer used by the current hosted
implementation, but the M2Oath identity model is provider-neutral.

Future federation may include:

### Human identity

-   enterprise OIDC providers;
-   Microsoft Entra ID;
-   Google identity;
-   organization-specific identity providers.

### Workload identity

-   AWS workload identity;
-   Azure workload identity;
-   GitHub OIDC;
-   Kubernetes/service-account identity;
-   other standards-based workload issuers.

### Agent identity

-   cross-organization Agent identity;
-   cryptographically bound Agent credentials;
-   signed Agent identity attestations;
-   federated Agent identity assertions.

External assertions must resolve through M2Oath's canonical identity and
authorization boundaries rather than replacing them.

## 14. Cross-Organization Identity

Federation should allow an externally authenticated principal to
participate in M2Oath without forcing all organizations to use the same
identity provider.

A future external binding may conceptually contain:

``` text
Canonical M2Oath Principal
    |
    +-- issuer: https://identity.example.com/
    +-- external subject: ...
    +-- principal category: workload | human | agent
    +-- binding provenance
    +-- binding lifecycle state
```

The issuer and external subject identify the external assertion. The
canonical M2Oath identifier identifies the principal inside M2Oath.

This distinction enables identity-provider migration and multi-provider
federation without changing the canonical M2Oath identity.

## 15. Security Invariants

The following invariants are architectural requirements:

1.  **Authentication does not imply authorization.**
2.  **Authorization does not imply accumulated trust.**
3.  **Trust evidence does not confer execution authority.**
4.  **External identity does not replace canonical M2Oath identity.**
5.  **A Workload Principal does not silently become an Agent
    Principal.**
6.  **A service caller does not inherit a human user's identity merely
    by forwarding a request.**
7.  **Raven remains an orchestrator, not the protected-operation
    enforcement authority.**
8.  **Trusted Domains remain authoritative for their own evidence, not
    for protected execution.**
9.  **The Trust Container remains the protected-operation enforcement
    boundary.**
10. **Secrets and bearer credentials must not be exposed to browser
    code, logs, source control, or trust evidence.**
11. **Domain evidence and Agent Trust are policy inputs, not
    capabilities.**
12. **New identity providers must integrate through explicit
    authentication/binding seams rather than changing core trust
    semantics.**

## 16. Blockchain Compatibility

M2Oath should preserve seams for future signed identity and trust
attestations without making blockchain a requirement.

Possible future uses include:

-   signed Agent identity attestations;
-   binding provenance;
-   evidence integrity;
-   third-party capability provenance;
-   cross-organization verification;
-   optional anchoring of attestations.

Blockchain must not become the trust calculator or protected-operation
execution authority.

Factual and private evidence should remain primarily off-chain.

## 17. Consequences

### Positive

This decision:

-   separates identity-provider concerns from M2Oath identity ownership;
-   supports humans, services, and Agents without conflating their
    authority;
-   removes the need for a custom local JWT minting lifecycle for Raven;
-   provides a standards-based workload-identity path;
-   preserves M2Oath's authority over Agent identity, authorization,
    trust, and enforcement;
-   creates a clean path toward enterprise and cross-organization
    federation;
-   keeps the Trust Container security boundary intact.

### Tradeoffs

The architecture requires explicit management of:

-   issuer trust configuration;
-   external-to-canonical identity bindings;
-   principal categories;
-   workload credential configuration;
-   authorization policies for service principals;
-   token expiration and renewal;
-   federation provenance and lifecycle.

This additional explicitness is intentional. Identity, authorization,
trust, and execution authority are security boundaries and should not be
collapsed for convenience.

## 18. Implementation Guidance

New M2Oath services should ask four separate questions:

1.  **Authentication:** What trusted evidence identifies the caller?
2.  **Canonical identity:** Which M2Oath principal does that evidence
    resolve to?
3.  **Authorization:** What is that principal permitted to request?
4.  **Trust/enforcement:** Does the relevant trust policy permit the
    protected operation to execute?

New integrations should preserve those questions as explicit
architectural stages.

Where a service needs its own identity, it should authenticate as a
Workload Principal rather than borrowing a Developer token or Agent
credential.

Where a request concerns an Agent, the Agent's canonical identity and
trust must remain explicit even when Raven or another service transports
the request.

## 19. Reference Implementation Checkpoint

As of this decision:

-   Developer authentication uses Auth0/OIDC.
-   Developer control-plane credentials support expiration-aware
    server-side renewal.
-   Raven authenticates to the M2Oath Control Plane using Auth0 OAuth
    2.0 Client Credentials.
-   Raven's workload token is acquired on demand and cached according to
    its lifetime.
-   M2Oath Trust authenticates the Raven workload principal through
    issuer/audience/JWKS verification.
-   Trust simulation access is separately authorized.
-   Raven's service identity does not confer protected-operation
    execution authority.
-   The obsolete local Identity server and file-based Raven JWT
    mechanism have been removed.
-   The end-to-end Trust Policy Workbench path has been runtime-proven
    after clean restart and credential rotation.

## 20. Summary

M2Oath treats **identity federation, canonical identity, authorization,
accumulated trust, and execution enforcement as related but separate
concerns**.

External providers authenticate.

M2Oath binds identities.

Authorization grants request authority.

Trust evaluates evidence.

The Trust Container enforces the final decision.

That separation is fundamental to M2Oath's security model and to its
ability to support humans, workloads, AI Agents, Trusted Domains, and
cross-organization federation without weakening the protected-operation
boundary.
