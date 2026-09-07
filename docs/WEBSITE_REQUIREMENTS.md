# M2Oath Website Requirements

**Document Type:** Product, Information Architecture, and Developer
Experience Requirements\
**Status:** Draft V0.3 — Authoritative Website Source of Truth\
**Date:** 2026-09-07\
**Primary Product:** M2Oath Machine Authority Platform\
**Related Ecosystem:** SaaSKamp\
**Proposed Web Stack:** Nuxt + VitePress

------------------------------------------------------------------------

## 1. Purpose

The M2Oath website must explain, demonstrate, document, and provide
developer access to the M2Oath Machine Authority ecosystem.

The website must serve several distinct audiences without blurring their
roles:

-   executives and enterprise decision-makers;
-   AI and software developers;
-   security architects;
-   researchers and standards participants;
-   domain experts;
-   open-source contributors;
-   SaaSKamp participants;
-   prospective pilot sponsors;
-   ecosystem partners.

The site must make the M2Oath architecture understandable before
requiring visitors to understand its implementation details.

The central product message is:

> **Trust before execution.**

M2Oath surrounds an AI agent with an **AI Trust Container** that
controls access to protected operations using identity, authorization,
accumulated behavioral trust, trusted domain evidence, provenance,
lifecycle state, and programmable policy.

------------------------------------------------------------------------

## 2. Core Product Story

The website must clearly communicate that ordinary authentication alone
is insufficient authority for consequential autonomous execution.

The conceptual execution path is:

``` text
AI Agent
    │
    ▼
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
Agent Trust     Trusted Domains
    │               │
    └───────┬───────┘
            ▼
     M2Oath Policy
            │
       ALLOW / DENY
            │
      only if ALLOW
            ▼
 Protected Operation
```

The website must distinguish:

1.  **Identity** --- Which agent is this?
2.  **Authorization** --- Is this agent permitted to request this class
    of operation?
3.  **Agent Trust** --- Has this agent accumulated sufficient behavioral
    evidence for this operation?
4.  **Trusted Domain Evidence** --- Is relevant external/domain evidence
    sufficient and trustworthy?
5.  **Policy** --- Do the applicable executable trust rules permit
    execution?
6.  **Enforcement** --- The Trust Container controls whether protected
    execution occurs.

Trust rules decide. They do not receive protected-operation execution
authority.

The Trust Container / protected-operation execution boundary remains
authoritative.

------------------------------------------------------------------------

## 3. Primary Website Properties

This document is the single authoritative source for M2Oath website and
web-application architecture. Implementation workplans may define temporary
phases, but they must not override the property boundaries defined here.

The M2Oath web presence consists of four coordinated properties:

``` text
m2oath.com
    Public product, ecosystem, research, and marketing site

developer.m2oath.com
    Developer experience: developer identity/account, SDK/API access,
    credentials, integrations, onboarding, and agent registration

agent.m2oath.com
    Agent and Trust operations: canonical agent identity, lifecycle,
    cryptographic bindings, accumulated trust, evidence, KPIs, usage,
    policy decisions, Trusted Domain evidence, and future Trust Laboratory

developer.m2oath.com/docs
    Technical documentation experience
```

### 3.1 `m2oath.com`

Primary framework:

**Nuxt**

Responsibilities:

-   product explanation;
-   Trust Container visualization;
-   Trusted Domains;
-   solutions/use cases;
-   developer entry points;
-   SaaSKamp;
-   research;
-   enterprise/pilot information;
-   links into Developer, Agent, documentation, GitHub, and pilot paths.

### 3.2 `developer.m2oath.com`

Primary framework:

**Nuxt**

Responsibilities:

-   developer authentication and identity;
-   developer onboarding;
-   SDK/API access;
-   credentials and integrations;
-   agent registration;
-   future organization/team administration;
-   handoff to the Agent application after canonical registration.

Developer identity remains distinct from agent identity. Developer credentials
must never substitute for agent runtime credentials.

### 3.3 `agent.m2oath.com`

Primary framework:

**Nuxt**

Responsibilities:

-   registered agent list and canonical identity;
-   lifecycle state and lifecycle actions;
-   cryptographic bindings;
-   registration provenance;
-   accumulated trust and evidence history;
-   operation-specific trust and KPIs;
-   usage/outcomes and policy decisions;
-   Trusted Domain evidence;
-   Live Agent Trust;
-   future Trust Laboratory.

The Agent application is the durable operational landing place for a registered
agent. It consumes authoritative M2Oath services and must not independently issue
identity, calculate authoritative trust, promote client claims into authority,
or bypass Trust Container enforcement.

### 3.4 `developer.m2oath.com/docs`

Primary framework:

**VitePress**

Responsibilities:

-   getting started;
-   concepts;
-   architecture;
-   SDK documentation;
-   CLI documentation;
-   API reference;
-   security model;
-   Trusted Domain development;
-   examples;
-   integration guides;
-   research/benchmark technical material.

The VitePress application remains a separate build from the Developer Nuxt
application even when both are routed under `developer.m2oath.com`.

------------------------------------------------------------------------

## 4. Repository and Hosted Platform Structure

The M2Oath hosted web platform is maintained in a repository that is intentionally separate from the open-source M2Oath framework.

``` text
m2oath-agent/
    Open-source M2Oath framework
    npm packages and reusable integrations

m2oath-web/
    M2Oath-operated hosted web platform
```

This separation is an architectural requirement. An outside developer must be able to use `m2oath-agent` without requiring any M2Oath hosted website code. The hosted platform should consume stable public M2Oath packages, APIs, and service boundaries rather than reach into framework internals or duplicate core identity, authorization, trust, or protected-execution logic.

The current `m2oath-web` structure is:

``` text
m2oath-web/
├── apps/
│   ├── web/
│   │   └── Nuxt public website (`m2oath.com`)
│   ├── developer/
│   │   └── Nuxt Developer application (`developer.m2oath.com`)
│   ├── agent/
│   │   └── Nuxt Agent application (`agent.m2oath.com`)
│   ├── control-plane/
│   │   └── shared server/control-plane API
│   └── docs/
│       └── VitePress public developer documentation
│
├── packages/
│   └── control-plane-client/
│       └── typed client used by hosted applications
│
├── docs/
│   └── internal repository architecture, requirements, and engineering documentation
│
└── examples or additional shared packages as justified by real reuse
```

The `apps/docs` directory is the publishable VitePress documentation application. The top-level `docs/` directory contains repository and engineering documentation and is not automatically published.

The Developer and Agent applications are separate Nuxt applications but must observe the same authoritative M2Oath state through a shared control-plane boundary:

``` text
Developer Nuxt / Agent Nuxt
          │
          ▼
@m2oath/control-plane-client
          │
          ▼
Shared Control-Plane API
          │
          ▼
Authoritative M2Oath Services / Stores
```

The current Day 3 implementation proves this boundary with a shared control-plane service and temporary in-memory store. The temporary store and temporary sequential Agent ID issuance are scaffolding only. Production registration must delegate canonical identity issuance, enrollment, lifecycle, authentication, authorization, and trust responsibilities to authoritative M2Oath service/package boundaries.

Application-specific UI should remain inside its owning application until reuse is real. Shared UI or brand packages should be introduced only when justified. During the architecture phase, use Nuxt UI defaults and defer custom branding, color, typography, and design-system work so that future visual changes can be centralized without coupling the applications.

------------------------------------------------------------------------

## 5. Top-Level Public Information Architecture

Recommended primary navigation:

``` text
Platform
Trusted Domains
Solutions
Developers
Resources
SaaSKamp
Company
Request a Pilot
GitHub
```

The navigation should support a simple commercial journey:

``` text
Understand the category
        ↓
Recognize the problem
        ↓
See domain proof
        ↓
Evaluate technically
        ↓
Request a pilot
```

`Platform` explains the horizontal M2Oath trust method. `Trusted Domains`
explains how vertical/domain systems contribute evidence without becoming the
final execution authority. Weather should remain the first concrete domain
proof. Developer and Agent application entry points may be presented as
authenticated utility navigation rather than as primary marketing categories.

Depending on final visual design, SaaSKamp may appear under Developers while
also receiving a prominent direct entry point.

------------------------------------------------------------------------

# 6. Homepage Requirements

## 6.1 Hero

The homepage must communicate the M2Oath thesis within seconds.

Recommended headline:

> # Trust before execution.

Recommended supporting copy:

> **M2Oath surrounds AI agents with a Trust Container that controls
> access to protected operations using identity, authorization,
> accumulated behavioral trust, trusted domain evidence, and
> programmable policy.**

Primary calls to action should include:

-   Get Started
-   Read the Docs
-   Explore the Trust Container
-   View GitHub

A secondary CTA may lead to SaaSKamp.

------------------------------------------------------------------------

## 6.2 Trust Container Hero Visualization

The homepage should visually show the AI agent **inside** the Trust
Container.

``` text
┌──────────────────────────────────────────────┐
│            M2Oath AI Trust Container        │
│                                              │
│                 AI AGENT                     │
│                    │                         │
│            requested operation               │
│                    │                         │
│                    ▼                         │
│             Authentication                   │
│                    ↓                         │
│             Canonical Identity               │
│                    ↓                         │
│              Authorization                   │
│                    ↓                         │
│          ┌─────────┴─────────┐               │
│          ▼                   ▼               │
│     AGENT TRUST        TRUSTED DOMAINS       │
│          │                   │               │
│          └─────────┬─────────┘               │
│                    ▼                         │
│              Trust Policy                    │
│                    │                         │
│               ALLOW / DENY                   │
└────────────────────┼─────────────────────────┘
                     │
                only if ALLOW
                     ▼
             Protected Operation
```

The visual must not imply that the AI agent itself decides whether it
may execute.

------------------------------------------------------------------------

## 6.3 Three Core Concepts

The homepage should prominently present:

### AI Trust Container

Controls the protected execution boundary around an AI agent.

### Accumulated Agent Trust

Agents earn trust from factual behavioral evidence accumulated over
time.

### Trusted Domains

Independent domain systems contribute trustworthy external evidence
relevant to an execution decision.

------------------------------------------------------------------------

## 6.4 Product Flow

A concise product flow should be shown:

``` text
Authenticate
    ↓
Resolve Identity
    ↓
Authorize
    ↓
Evaluate Agent Trust
    +
Evaluate Trusted Domain Evidence
    ↓
Execute Programmable Trust Policy
    ↓
ALLOW / DENY
    ↓
Protected Execution
```

------------------------------------------------------------------------

# 7. AI Trust Container Requirements

The Trust Container must be treated as a primary product concept.

A dedicated page should explain:

-   the agent is encapsulated by the Trust Container;
-   the agent does not directly own protected-operation authority;
-   authentication does not automatically grant execution authority;
-   authorization and trust are separate;
-   behavioral and external/domain trust paths converge at policy;
-   programmable trust rules make decisions;
-   protected execution remains behind the enforcement boundary;
-   policy cannot directly execute protected operations.

The page should include both executive-level and technical architecture
views.

------------------------------------------------------------------------

# 8. Accumulated Agent Trust Requirements

A dedicated section should explain that trust is accumulated from
factual evidence over time.

It should distinguish:

``` text
Usage / Outcomes / Verification
            │
            ▼
       Factual Evidence
            │
            ▼
    Aggregation / Weighting
            │
            ▼
      AgentTrustState
            │
            ▼
        Trust Policy
```

The website should explain, at a high level:

-   evidence count;
-   evidence weight;
-   outcome history;
-   constraint compliance;
-   authorization compliance;
-   independent verification;
-   recency;
-   decay;
-   diversity;
-   operation-aware evidence;
-   provisional trust;
-   anti-trust-farming protections.

The public site should not expose unnecessary implementation detail;
VitePress should provide the technical treatment.

------------------------------------------------------------------------

# 9. Trusted Domains

Trusted Domains must be a first-class M2Oath concept.

The site must explain:

> **M2Oath does not only ask whether the agent is trustworthy. It can
> also ask whether the external evidence required for a particular
> operation is trustworthy.**

The architecture is:

``` text
             TRUSTED DOMAINS

 Weather      Agronomy      Finance      Other
    │             │            │           │
    ▼             ▼            ▼           ▼
 Evidence      Evidence     Evidence     Evidence
    │             │            │           │
    └─────────────┴─────┬──────┴───────────┘
                        ▼
               M2Oath Trust Policy
                        │
                   ALLOW / DENY
```

Domain providers remain authoritative for the evidence they produce.

M2Oath remains authoritative for the final protected execution decision.

------------------------------------------------------------------------

# 10. Weather Trust --- Flagship Trusted Domain

Weather should be presented as the first concrete Trusted
Domain/reference implementation.

Recommended URL:

``` text
/trusted-domains/weather
```

Recommended positioning:

> # Weather Trust
>
> **Don't just ask for the forecast. Ask whether the forecast has earned
> your trust.**

The page should show the difference between a conventional forecast
pipeline and the M2Oath approach.

Conventional:

``` text
Weather API
    ↓
Forecast
    ↓
AI Agent
    ↓
Decision
```

Trusted Weather:

``` text
Forecast
    │
Observation
    │
Verification
    │
Historical Accuracy
    │
Weather Trust Evidence
    │
    ▼
M2Oath Trust Container
    │
    ├── Agent Trust
    ├── Weather Trust
    └── Policy
          │
      ALLOW / DENY
```

------------------------------------------------------------------------

## 10.1 Weather Evidence

The website may explain that weather evidence can include metrics such
as:

``` text
Temperature
    MAE
    Bias
    RMSE

Relative Humidity
    MAE
    Bias
    RMSE

Wind
    forecast error metrics

Precipitation
    amount accuracy
    probability calibration

Evidence Context
    location
    provider
    model
    forecast lead time
    sample count
    evidence sufficiency
```

The page should emphasize that meteorological systems remain responsible
for producing domain evidence.

M2Oath consumes that evidence under policy.

------------------------------------------------------------------------

# 11. Center-Pivot Irrigation Demonstration

The center-pivot irrigation use case should be a flagship demonstration
of agent trust + trusted domain evidence + protected physical execution.

``` text
                    CENTER PIVOT
                         ▲
                         │
                  physical action
                         │
              only after M2Oath ALLOW
                         │
        ┌────────────────────────────────┐
        │      AI TRUST CONTAINER        │
        │                                │
        │       Irrigation Agent         │
        │               │                │
        │      irrigation.execute        │
        │               │                │
        │      ┌────────┴─────────┐      │
        │      ▼                  ▼      │
        │  AGENT TRUST       WEATHER TRUST
        │      │                  │      │
        │      └────────┬─────────┘      │
        │               ▼                │
        │         M2Oath Policy           │
        │          /         \            │
        │       DENY         ALLOW        │
        └──────────────────────┬─────────┘
                               │
                               ▼
                       Pivot Controller
```

A demonstration should make the interaction between evidence sources
obvious.

Example:

  Agent Trust    Weather Trust   Result
  -------------- --------------- -----------------
  Sufficient     Sufficient      Potential ALLOW
  Sufficient     Insufficient    DENY
  Insufficient   Sufficient      DENY
  Insufficient   Insufficient    DENY

Use **Potential ALLOW** because authentication, authorization,
provenance, lifecycle, policy, and other requirements may still prevent
execution.

------------------------------------------------------------------------

# 12. Future Trusted Domains

The public site may illustrate additional potential domains, while
clearly distinguishing implemented/reference domains from future
possibilities.

Potential domains include:

-   agronomy;
-   robotics;
-   manufacturing;
-   industrial control;
-   autonomous commerce;
-   payments;
-   logistics;
-   cybersecurity;
-   energy;
-   supply chain;
-   identity/provenance;
-   transportation.

Do not represent future architectural possibilities as deployed M2Oath
products.

------------------------------------------------------------------------

# 13. Solutions

The site should connect M2Oath architecture to consequential autonomous
operations.

Initial solution categories may include:

``` text
Agriculture
Robotics
Manufacturing / Industrial
Autonomous Commerce
Enterprise Agents
Cross-Organization Machine Authority
```

Each solution should answer:

1.  What consequential operation is being protected?
2.  Which agent requests it?
3.  What authority is required?
4.  What behavioral evidence matters?
5.  Which Trusted Domains matter?
6.  What does M2Oath protect?
7.  What happens on DENY?

------------------------------------------------------------------------

# 14. Developer Section

The developer experience should have four major areas.

``` text
Developers
│
├── Get Started
├── Build
├── Trusted Domains
└── SaaSKamp
```

------------------------------------------------------------------------

## 14.1 Get Started

Required content:

-   Introduction
-   Installation
-   5-Minute Quickstart
-   Create Your First Agent
-   Create Your First Trust Container
-   Run a Protected Operation

------------------------------------------------------------------------

## 14.2 Build

Required resources:

-   SDK
-   CLI
-   Examples
-   API Reference
-   GitHub
-   MCP integration
-   authentication integrations
-   persistence integrations

------------------------------------------------------------------------

## 14.3 Build a Trusted Domain

Developers should be able to learn how to create a domain-specific
evidence provider without modifying M2Oath core.

Conceptual model:

``` text
Your Domain
    │
    ▼
Domain Data
    │
    ▼
Domain Verification
    │
    ▼
Domain Trust Evidence
    │
    ▼
ExternalTrustEvidenceProvider<T>
    │
    ▼
M2Oath Trust Policy
    │
    ▼
ALLOW / DENY
```

The documentation must preserve the domain-neutral M2Oath boundary.

------------------------------------------------------------------------

# 15. SaaSKamp

SaaSKamp should be presented as a major M2Oath ecosystem resource while
remaining conceptually distinct from M2Oath itself.

The relationship is:

``` text
M2Oath
Machine Authority Platform

        +

SaaSKamp
Contributor + Pilot +
Entrepreneurial Ecosystem

        =

M2Oath Ecosystem Growth
```

M2Oath is the horizontal Machine Authority infrastructure.

SaaSKamp provides the people, teams, learning, contributor, paid-pilot,
and entrepreneurial pathway around it.

------------------------------------------------------------------------

## 15.1 SaaSKamp Landing Page

Recommended URL:

``` text
/saaskamp
```

Recommended headline:

> # Learn. Build. Prove. Launch.

Supporting concept:

> **SaaSKamp connects developers, students, researchers, domain experts,
> and entrepreneurs with M2Oath open-source projects, real industry
> problems, paid pilots, and validated venture opportunities.**

------------------------------------------------------------------------

## 15.2 SaaSKamp Journey

The website should visualize:

``` text
JOIN
 │
 ▼
LEARN
M2Oath
 │
 ▼
BUILD
Open Source
 │
 ▼
VALIDATE
Industry Pilot
 │
 ▼
FOUND
NewCo
 │
 ▼
FUND
Separate Venture Capital
```

The site must make clear that:

-   contribution does not automatically create equity;
-   participation does not guarantee venture formation;
-   venture eligibility depends on independent commercial validation;
-   investment and securities activity is separate from open-source
    contribution and pilot compensation.

------------------------------------------------------------------------

## 15.3 SaaSKamp Developer Resources

SaaSKamp content may include:

``` text
Learn M2Oath
Join the Community
Contributor Tracks
M2Oath Open Source Kamp
Opportunity Lab
Paid Pilots
Contributor Passport
Maintainer Path
Employment Opportunities
Founder / Venture Path
```

------------------------------------------------------------------------

# 16. M2Oath Open Source Kamp

The website should describe the planned guided M2Oath Open Source Kamp.

Illustrative progression:

``` text
Week 1–2     Machine Authority + Trust Container
Week 3       Choose Problem / Form Team
Week 4–5     Architecture
Week 6–8     Build
Week 9       Security / Adversarial Testing
Week 10      Interoperability
Week 11      Industry Validation
Week 12      Demo + Plugfest
```

The Open Source Kamp should be positioned as a structured way to move
from learning M2Oath to producing useful ecosystem work.

------------------------------------------------------------------------

# 17. Opportunity Lab

The Opportunity Lab should connect real industry problems with
contributors and M2Oath architecture.

``` text
Industry
    │
    ▼
Consequential Problem
    │
    ▼
Opportunity Lab
    │
    ▼
Verified Customer Discovery
    │
    ▼
SaaSKamp Team
    │
    ▼
Pilot
```

Problems should be consequential and specific rather than generic
startup ideas.

Examples may include:

-   autonomous irrigation;
-   bounded equipment control;
-   autonomous procurement;
-   robotics capability authority;
-   cross-company machine-authority verification.

------------------------------------------------------------------------

# 18. Paid Pilots

Paid Pilots should receive a dedicated SaaSKamp section.

The conceptual model is:

``` text
INDUSTRY / SPONSOR
       │
       │ real problem + pilot funding
       ▼
    SaaSKamp
       │
       │ assemble + administer
       ▼
   PILOT TEAM
       │
       ├── M2Oath architecture
       ├── software development
       ├── domain expertise
       ├── controls / embedded
       ├── security
       ├── documentation / DX
       └── project leadership
       │
       ▼
   BUILD + TEST
       │
       ▼
   M2Oath Proof
       │
       ├── Production Deployment
       ├── Open Source
       ├── Core Platform Capability
       └── Venture Gate
```

The website must distinguish:

-   payment for completed pilot work;
-   contributor reputation;
-   employment;
-   grants/bounties;
-   later founder equity;
-   later investment.

These are separate economic relationships.

------------------------------------------------------------------------

# 19. Contributor Passport

The Contributor Passport should be described as a factual professional
contribution record rather than a financial instrument or speculative
token.

Potential evidence includes:

-   accepted contributions;
-   technical specialties;
-   completed pilots;
-   interoperability work;
-   security findings;
-   documentation;
-   mentoring;
-   project leadership;
-   domain expertise.

A useful conceptual parallel may be shown:

``` text
AI AGENT                       HUMAN CONTRIBUTOR

Behavioral Evidence            Contribution Evidence
       │                              │
       ▼                              ▼
Persistent History             Contributor Passport
       │                              │
       ▼                              ▼
Earned Authority               Earned Opportunity
```

The systems must remain distinct.

Agent trust is machine execution authority.

Contributor history supports human professional and ecosystem
opportunity.

------------------------------------------------------------------------

# 20. Research Section

M2Oath should have a serious research presence.

Potential structure:

``` text
Research
├── Accumulated Trust
├── Behavioral Evidence
├── Trust Farming
├── Simulation
├── MATB Benchmark
├── Policy Calibration
├── Performance
├── Papers / White Papers
└── Standards
```

Research pages should distinguish:

-   implemented results;
-   active experiments;
-   hypotheses;
-   planned research;
-   standards proposals.

------------------------------------------------------------------------

# 21. VitePress Documentation Architecture

Recommended documentation hierarchy:

``` text
Getting Started
├── Introduction
├── Installation
├── 5-Minute Quickstart
├── Create Your First Agent
└── Your First Trust Container

Core Concepts
├── AI Trust Container
├── Machine Authority
├── Agent Identity
├── Authentication
├── Authorization
├── Accumulated Trust
├── Behavioral Evidence
├── External Trust Evidence
└── Protected Execution

Trust Architecture
├── AgentTrustState
├── Trust Policies
├── Executable TypeScript Rules
├── Operation-Aware Trust
├── Evidence Weighting
├── Evidence Diversity
├── Recency and Decay
└── Anti-Trust-Farming

Identity
├── Canonical Agent Identity
├── Enrollment
├── JWT / OIDC
├── Cryptographic Bindings
├── Credential Rotation
├── Revocation
└── Agent Lifecycle

Trusted Domains
├── Overview
├── External Trust Evidence
├── Building a Trusted Domain
├── Weather
│   ├── Architecture
│   ├── Forecast Verification
│   ├── Trust Metrics
│   ├── Evidence Sufficiency
│   └── M2Oath Integration
├── Agronomy
│   └── Center-Pivot Reference
└── Create Your Own Domain

Integrations
├── MCP
├── LangChain
├── JWT / OIDC
├── Persistence
└── Weather Trust

Examples
├── Agent Identity
├── Scope Authorization
├── Protected Operation
├── Usage History
├── Hello World
├── Trust-Gated MCP Agent
├── MySQL Trust-Gated Agent
├── Center-Pivot Irrigation
└── CLI Trust Container Bootstrap

Security
├── Security Model
├── Trust Container Boundary
├── Threat Model
├── Trust Farming
├── Identity Reset
├── Capability Provenance
└── Security Invariants

Research
├── Simulation
├── MATB
├── Evidence Model
└── Publications

API Reference
├── @m2oath/agent
├── @m2oath/mcp
├── @m2oath/auth-jwt
├── @m2oath/persistence
├── @m2oath/weather-trust
└── @m2oath/cli
```

------------------------------------------------------------------------

# 22. Documentation Publishing Rules

The public VitePress documentation must be curated product
documentation.

Internal project-management artifacts should not automatically be
published.

Examples of internal material that should remain repository/internal
unless deliberately converted:

``` text
workplans
day-by-day implementation plans
temporary architecture issue notes
internal TODO lists
historical checkpoint documents
```

These should be distilled into stable public documentation.

Avoid exposing version-history filenames such as:

``` text
*_STEP8_FINAL.md
*_STEP10_DAY1.md
```

as the permanent public information architecture.

Public documentation should use durable names such as:

``` text
trust-container.md
agent-identity.md
authentication.md
authorization.md
trusted-domains.md
weather-trust.md
```

------------------------------------------------------------------------

# 23. Developer and Agent Application Requirements

The authenticated product experience is intentionally split between two durable
applications:

``` text
developer.m2oath.com
    Build, authenticate, integrate, and register

agent.m2oath.com
    Observe and manage registered machine identities, lifecycle, evidence,
    trust, policy outcomes, and authority
```

The permanent product boundary is:

> **Developer is where you build and register. Agent is where registered agents
> land and where their identity, lifecycle, behavior, evidence, trust, KPIs,
> policy outcomes, and authority are observed and managed.**

------------------------------------------------------------------------

## 23.1 Developer Authentication

The Developer application should support:

-   OIDC sign-in;
-   canonical developer identity;
-   short-lived credentials;
-   explicit capability/authorization mapping;
-   expiration visibility;
-   refresh/re-authentication;
-   fail-closed authorization.

OIDC/JWT claims must not automatically become M2Oath execution authority.

Developer JWT and Agent Runtime JWT remain separate:

``` text
Developer JWT
    authenticates developer

Agent Runtime JWT
    authenticates agent runtime
```

------------------------------------------------------------------------

## 23.2 Agent Registration

The Developer application should support the registration lifecycle:

``` text
Developer
    │
    ▼
Authenticate
    │
    ▼
Authorize agent.create
    │
    ▼
Register Agent
    │
    ├── M2Oath issues canonical agentId
    ├── creator lineage recorded
    ├── public key bound
    └── lifecycle state established
    │
    ▼
agent.m2oath.com/agents/:agentId
```

The browser must not be able to self-assert canonical Agent ID, authoritative
trust, authoritative capabilities, or private agent key material. Registration
does not create behavioral trust.

------------------------------------------------------------------------

## 23.3 Agent Management

The Agent application should provide:

-   registered agent list;
-   canonical Agent ID;
-   display name and lifecycle state;
-   cryptographic bindings;
-   registration provenance;
-   rotate-key workflow;
-   disable-agent workflow;
-   stable future locations for Trust, Evidence, KPIs, Operations, Policy,
    Trusted Domains, and Usage.

Future operations may include configure, recover, delete/decommission, runtime
deployment management, and Trust Container configuration.

Disable must not imply deletion of canonical identity or erasure of historical
trust/evidence. Key rotation must not create a new canonical Agent ID.

------------------------------------------------------------------------

## 23.4 Shared Control-Plane / API Boundary

The Developer and Agent applications must observe the same authoritative agent
state. They must not create separate browser-side or application-local identity
models that diverge from one another.

Preferred separation:

``` text
Developer Nuxt / Agent Nuxt
          │
          ▼
Typed M2Oath API Client
          │
          ▼
Shared Server / Control-Plane API Boundary
          │
          ▼
M2Oath Application Services
          │
          ▼
Identity / Registration / Lifecycle / Trust Stores
```

Initial operations may include:

``` text
List agents
Get agent
Create agent
Rotate agent key
Disable agent
```

The exact production transport may evolve, but this authority boundary should be
preserved. An agent registered through the Developer application must be
retrievable through the Agent application using the same server-issued canonical
Agent ID.

Current hosted implementation uses `@m2oath/control-plane-client` as the typed
client contract and `@m2oath/control-plane` as the shared API process. Browser
requests are mediated through Nuxt server routes; the browser does not directly
issue canonical identity or become the authority for agent state. Route parameters
such as `/agents/:agentId` are untrusted lookup input, and displayed canonical
identity must come from the authoritative control-plane response.

------------------------------------------------------------------------

# 24. Interactive Trust Demonstration

The public site should eventually include an interactive demonstration.

Example state:

``` text
Agent: agt_123
Operation: irrigation.execute

IDENTITY
✓ Authenticated
✓ Canonical identity resolved

AUTHORIZATION
✓ irrigation.execute

AGENT TRUST
Evidence Count          4,817
Verified Outcomes       3,902
Constraint Compliance   99.94%
Evidence Diversity      HIGH

WEATHER TRUST
Forecast Evidence       SUFFICIENT
Historical Reliability ACCEPTABLE

POLICY
ALLOW

PROTECTED OPERATION
EXECUTED
```

The visitor should be able to change a condition such as weather
evidence quality and observe the decision change:

``` text
Weather Trust
SUFFICIENT → INSUFFICIENT

          ↓

M2Oath Policy
ALLOW → DENY

          ↓

Protected Operation
EXECUTED → BLOCKED
```

The demonstration should reinforce that policy and the Trust Container,
not the agent, determine execution.

------------------------------------------------------------------------

# 25. Trust Laboratory

A future Trust Laboratory may provide a richer interactive demonstration
of:

-   accumulated trust;
-   evidence history;
-   operation-specific trust;
-   malicious agent behavior;
-   trust farming;
-   evidence decay;
-   diversity;
-   policy comparison;
-   false ALLOW;
-   false DENY;
-   convergence;
-   external/domain evidence changes.

The Trust Laboratory should be useful for executives, developers,
researchers, and prospective customers.

------------------------------------------------------------------------

# 26. Design and Branding Requirements

The public site, Developer application, Agent application, and docs should share:

-   M2Oath logo;
-   typography;
-   design tokens;
-   iconography;
-   spacing system;
-   diagram style;
-   code presentation;
-   navigation conventions.

Shared visual assets should not create inappropriate runtime coupling
between applications.

The master brand should remain horizontal: M2Oath is the trust/authority
method, while verticals contribute domain-specific evidence. The preferred brand
architecture is one M2Oath master brand with endorsed domain descriptors (for
example, M2Oath Weather) rather than unrelated product identities.

A useful shorthand is:

> **The evidence is vertical. The method of trust is horizontal.**

The visual identity should reinforce:

-   security;
-   authority;
-   containment;
-   machine execution;
-   evidence;
-   trust;
-   industrial/technical credibility.

Avoid generic AI imagery as the primary visual language.

Prefer architecture, boundaries, evidence paths, machines, networks, and
consequential operations.

------------------------------------------------------------------------

# 27. Accessibility

All public and authenticated properties should target modern
accessibility practices.

Requirements include:

-   semantic HTML;
-   keyboard navigation;
-   sufficient contrast;
-   visible focus states;
-   descriptive labels;
-   alt text for meaningful graphics;
-   reduced-motion support for animated Trust Container demonstrations;
-   diagrams accompanied by textual explanations;
-   responsive layouts.

------------------------------------------------------------------------

# 28. Responsive Design

All properties must support:

-   desktop;
-   laptop;
-   tablet;
-   mobile.

Complex architecture diagrams may simplify progressively on smaller
screens rather than merely shrinking unreadably.

------------------------------------------------------------------------

# 29. Performance

The public site should favor static generation or server-side rendering
where appropriate.

Requirements:

-   fast initial content rendering;
-   optimized images;
-   lazy-loaded heavy demonstrations;
-   minimal unnecessary client JavaScript;
-   documentation pages optimized for reading and search;
-   interactive Trust Laboratory code loaded only when required.

------------------------------------------------------------------------

# 30. Search

VitePress documentation should provide documentation search.

Future search may include:

-   concepts;
-   APIs;
-   examples;
-   CLI commands;
-   packages;
-   Trusted Domains;
-   security topics.

Search should not expose private authenticated-application or internal project content.

------------------------------------------------------------------------

# 31. Security

The website must preserve the same security philosophy as M2Oath itself.

Requirements include:

-   no long-lived copied bearer token as the preferred production
    developer experience;
-   secure OIDC flows;
-   short-lived credentials;
-   CSRF protection where applicable;
-   secure cookies where applicable;
-   strict origin handling;
-   content security policy;
-   secret isolation;
-   no private agent key transmission in the preferred enrollment flow;
-   no trust calculations in presentation code that are treated as
    authoritative;
-   no authorization based solely on client-supplied scopes;
-   no client-issued canonical Agent IDs;
-   no web-application bypass of Trust Container enforcement.

------------------------------------------------------------------------

# 32. Privacy and Data Boundaries

The website and authenticated applications should minimize exposure of:

-   developer identity data;
-   organization data;
-   agent credential metadata;
-   usage records;
-   trust evidence;
-   private/domain evidence;
-   pilot sponsor information.

Public demonstrations should use synthetic or intentionally public
evidence unless explicit authorization exists.

SaaSKamp participant privacy should be designed separately from public
contribution attribution.

------------------------------------------------------------------------

# 33. GitHub / Open Source

The developer site should provide prominent navigation to the M2Oath
open-source repository.

Relevant pages should link to:

-   source;
-   issues;
-   examples;
-   contribution guide;
-   security reporting process;
-   releases.

The website should distinguish open-source M2Oath interfaces from future
hosted/commercial services.

------------------------------------------------------------------------

# 34. Executive Content

Executives should have a path that does not require reading API
documentation.

Executive content should answer:

-   Why authentication alone is insufficient for autonomous agents.
-   What a Trust Container does.
-   Why accumulated behavioral trust matters.
-   Why Trusted Domains matter.
-   How M2Oath controls consequential actions.
-   How M2Oath integrates rather than replaces domain systems.
-   How pilots can prove the architecture.
-   How M2Oath applies across vertical markets.

White papers and architecture briefs should be available from the
Research or Resources area.

------------------------------------------------------------------------

# 35. Enterprise / Pilot Path

The website should eventually provide a clear path for organizations
that want to test M2Oath.

Possible flow:

``` text
Enterprise Problem
      │
      ▼
Consequential Operation Identified
      │
      ▼
Architecture Review
      │
      ▼
M2Oath + Trusted Domain Design
      │
      ▼
Pilot
      │
      ▼
Measured Outcome
      │
      ├── Production
      ├── Open Integration
      └── SaaSKamp / Venture Opportunity
```

Pilot and SaaSKamp participation should remain appropriately separated
from securities/investment activity.

------------------------------------------------------------------------

# 36. Initial Implementation Phases

## Phase 1 --- Public Foundation

Build:

-   Nuxt application shell;
-   M2Oath branding;
-   global navigation;
-   homepage;
-   Trust Container page;
-   Developers landing page;
-   Trusted Domains landing page;
-   Weather Trust page;
-   SaaSKamp landing page;
-   Docs and GitHub navigation.

## Phase 2 --- Documentation

Build:

-   VitePress application;
-   information architecture;
-   Getting Started;
-   Trust Container concepts;
-   identity/authentication/authorization;
-   Trusted Domains;
-   Weather Trust;
-   security;
-   examples;
-   package/API documentation.

## Phase 3 --- Developer Registration and Agent Operations Foundation

Build:

-   `apps/developer` Nuxt application;
-   `apps/agent` Nuxt application;
-   OIDC developer login direction and explicit local/test adapter if needed;
-   developer identity;
-   `agent.create` authority;
-   agent registration UI;
-   canonical Agent ID display;
-   cryptographic binding display;
-   registration provenance display;
-   registered-agent list/detail views;
-   disable/rotate-key lifecycle operations;
-   shared control-plane/API boundary used by both applications;
-   Developer → Agent handoff after registration.

This phase must consume authoritative M2Oath registration/lifecycle services
rather than inventing a separate web identity system. An agent registered in the
Developer application must resolve in the Agent application under the same
server-issued canonical Agent ID.

The initial Day 3 vertical slice has proven the hosted application boundary using
`@m2oath/control-plane-client` and the shared `@m2oath/control-plane` service:
Developer registration can create a server-issued agent record and the separate
Agent application can retrieve that same authoritative record. The current
in-memory store and sequential development Agent IDs are temporary scaffolding;
they do not replace M2Oath's authoritative enrollment and identity services.
Production authentication is not yet implied by this scaffold.

## Phase 4 --- Interactive Demonstration

Build:

-   Trust Container visualization;
-   agent trust state;
-   weather trust state;
-   policy result;
-   ALLOW/DENY transition;
-   center-pivot demonstration.

## Phase 5 --- SaaSKamp Experience

Build:

-   join/orientation;
-   Open Source Kamp;
-   contributor tracks;
-   Opportunity Lab;
-   Paid Pilots;
-   Contributor Passport;
-   venture-path explanation.

## Phase 6 --- Trust Laboratory

Build the larger simulation/research demonstration after the Step 10
trust simulation and benchmark work is sufficiently stable.

------------------------------------------------------------------------

# 37. Initial Homepage Sitemap

``` text
HOME

Hero
"Trust before execution."

        ↓

What is M2Oath?
Machine Authority + AI Trust Container

        ↓

How It Works
Identity → Authorization → Trust → Policy → Execution

        ↓

Three Core Ideas
Trust Container | Accumulated Trust | Trusted Domains

        ↓

Weather Trust
First Trusted Domain

        ↓

Center-Pivot Demo
Agent Trust + Weather Trust → Protected Action

        ↓

Developers
SDK | CLI | Examples | Docs | GitHub

        ↓

SaaSKamp
Learn | Build | Paid Pilots | Venture Path

        ↓

Research
Simulation | MATB | Papers | Standards

        ↓

Enterprise
Pilot M2Oath on a consequential operation
```

------------------------------------------------------------------------

# 38. Key Terminology

The website should use terminology consistently.

### Machine Authority

The broader problem of determining whether a machine/agent is authorized
and sufficiently trusted to perform a consequential operation.

### AI Trust Container

The M2Oath execution boundary that encapsulates the AI agent and governs
access to protected operations.

### Canonical Agent Identity

The stable M2Oath identity to which usage, evidence, lifecycle, and
trust history attach.

### Agent Trust

M2Oath's interpretation of accumulated behavioral evidence under
applicable policy.

### Trusted Domain

An external/domain system that produces evidence relevant to an
execution decision while remaining separate from final M2Oath execution
authority.

### Trusted Action

A consequential operation permitted through the M2Oath authority/trust
process.

### Protected Operation

An operation whose execution is controlled by the M2Oath enforcement
boundary.

### SaaSKamp

The contributor, learning, pilot, workforce, and entrepreneurial
ecosystem surrounding M2Oath.

------------------------------------------------------------------------

# 39. Architectural Invariants

The website, documentation, demos, Developer application, and Agent application must never contradict
these principles:

``` text
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

M2Oath != SaaSKamp
```

These distinctions are central to both the technical architecture and
the product story.

------------------------------------------------------------------------

# 40. Initial Success Criteria

The initial website should be considered successful when a new visitor
can answer the following after a short visit:

1.  What is M2Oath?
2.  What is Machine Authority?
3.  What is an AI Trust Container?
4.  Why is authentication alone insufficient?
5.  How does an agent accumulate trust?
6.  What is a Trusted Domain?
7.  How does Weather Trust demonstrate the concept?
8.  Why does M2Oath retain final ALLOW/DENY authority?
9.  How can a developer start building?
10. How can a developer build a new Trusted Domain?
11. What is SaaSKamp?
12. How can someone learn, contribute, or participate in a paid pilot?
13. Where are the technical docs?
14. Where is the open-source code?
15. How can an enterprise explore a consequential M2Oath pilot?

------------------------------------------------------------------------

# 41. Guiding Website Principle

The website should continually reinforce one simple idea:

> **An AI agent should not gain consequential authority merely because
> it can authenticate or request an operation. It should operate inside
> a controlled authority boundary where identity, authorization,
> accumulated behavioral evidence, trusted domain evidence, and
> programmable policy determine whether execution is allowed.**

The public site explains that idea.

The documentation teaches developers how to build it.

The Developer application lets developers build and register. The Agent application is where registered agents are observed and managed.

Trusted Domains bring reliable real-world evidence into it.

SaaSKamp gives people a pathway to learn it, build it, prove it against
real industry problems, and create the ecosystem around it.
