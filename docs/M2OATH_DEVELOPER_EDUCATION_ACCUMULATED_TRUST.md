# Understanding M2Oath Accumulated Trust and the AI Trust Container

> **Developer Education & Training Foundation**
>
> This document explains the architectural meaning of M2Oath accumulated
> trust, authoritative trust evaluation, policy decisions, Raven
> orchestration, Trusted Domain evidence, and AI Trust Container
> enforcement. It is intended to serve as a foundation for developer
> onboarding, architecture training, examples, and future product
> documentation.

------------------------------------------------------------------------

## 1. What the Trust Policy Workbench Is Showing

A M2Oath Trust Policy Workbench simulation can show multiple moments in
the life of the same Agent.

For example, the canonical **Normal Trust Growth** scenario
demonstrated:

``` text
Agent: agent-1
Operation: tool / weather.read
Server: weather-server

TIME #0
────────────────────────────────
Usage trust                 60
Behavioral trust            60
                            ──
Composite trust             60

Evidence observations        1

Policy decision          ALLOW


TIME #1
────────────────────────────────
Usage trust                 65
Behavioral trust            70
                            ────
Composite trust           67.5

Evidence observations        2

Policy decision          ALLOW
```

The important idea is not simply that **60 became 67.5**.

M2Oath is modeling trust as **state that develops from evidence about an
Agent's behavior over time**.

At the first point, the Agent has positive evidence. Later, additional
positive evidence has accumulated, and the resulting trust state is
different.

That is fundamentally different from ordinary authentication.

------------------------------------------------------------------------

## 2. Authentication Asks: "Who Are You?"

Suppose an AI Agent wants to invoke:

``` text
weather.read
```

Traditional security might begin with:

``` text
Agent
  │
  │ credential
  ▼
Authentication
  │
  ▼
Identity established
```

The Agent might present a JWT. The system verifies the credential and
resolves a canonical identity such as:

``` text
agentId = agent-1
```

Authentication is essential, but it answers only a limited question:

> Is this really the entity represented by this credential?

Authentication alone does not tell us:

-   whether the Agent has behaved reliably;
-   whether previous operations succeeded;
-   whether its evidence is diverse or suspiciously repetitive;
-   whether evidence is recent and relevant;
-   whether evidence comes from trustworthy authorities; or
-   whether the Agent should be trusted for the particular operation it
    is requesting.

M2Oath introduces a trust layer to address those questions.

------------------------------------------------------------------------

## 3. M2Oath Adds a Second Question

After establishing identity, M2Oath can ask:

> **Given what we know about this Agent, how much trust has it
> accumulated for what it is trying to do?**

Conceptually:

``` text
                  credential
Agent ─────────────────────────► Authentication
                                      │
                                      ▼
                                Canonical identity
                                      │
                                      ▼
                                  agent-1
                                      │
                                      │
             ┌────────────────────────┴────────────────────┐
             │                                             │
             ▼                                             ▼
       Trust evidence                              Requested operation
                                                        weather.read
             │                                             │
             └─────────────────────┬───────────────────────┘
                                   ▼
                              Trust Policy
                                   │
                             ┌─────┴─────┐
                             ▼           ▼
                           ALLOW        DENY
```

These responsibilities must remain distinct:

-   **Authentication establishes identity.**
-   **Trust evaluates accumulated evidence associated with that
    identity.**
-   **Policy determines what that trust state means for a protected
    operation.**
-   **The Trust Container enforces the resulting decision at the
    protected-operation boundary.**

------------------------------------------------------------------------

## 4. What "Accumulated Trust" Means

Imagine an Agent begins with little or no history. It performs an
operation, and M2Oath receives evidence about the outcome. Later,
another verified activity occurs, and then another.

Conceptually:

``` text
                         agent-1
                            │
          ┌─────────────────┼──────────────────┐
          │                 │                  │
          ▼                 ▼                  ▼
      Evidence A        Evidence B         Evidence C
          │                 │                  │
          └─────────────────┼──────────────────┘
                            ▼
                     Trust evaluation
                            │
                            ▼
                       Trust state
```

However, M2Oath must **not** reduce this to:

``` text
more events = more trust
```

Such a model would be dangerously easy to manipulate.

Evidence has properties that matter: provenance, relevance, recency,
diversity, duplication, authority, outcome, and potentially other
characteristics defined by the trust model.

Accumulated trust therefore means **trust derived from accumulated
evidence**, not merely accumulated event counts.

------------------------------------------------------------------------

## 5. Usage Trust

The Normal Trust Growth scenario showed:

``` text
Usage

#0    60     1 evidence
#1    65     2 evidence
```

Usage evidence represents evidence derived from the Agent's operational
history.

It can support questions such as:

-   Has this Agent actually performed relevant operations?
-   What happened when those operations were performed?
-   How much useful historical evidence exists?
-   Is that history relevant to the operation currently being requested?

The simulation moves from one evidence observation and a usage trust
score of 60 to two evidence observations and a usage trust score of 65.

Notice what does **not** happen:

``` text
1 evidence → score 60
2 evidence → score 65
```

does not become:

``` text
60 → 120
```

Evidence is not simply being counted as points. That distinction is
critical to resisting trust farming.

------------------------------------------------------------------------

## 6. Behavioral Trust

The second source in the simulation is:

``` text
Behavioral

#0    60     1 evidence
#1    70     2 evidence
```

Behavioral evidence represents another dimension of the Agent's history.

Instead of merely asking whether the Agent has been used, behavioral
evidence can support questions closer to:

> What do verified observations tell us about how this Agent behaves?

This is also where **Trusted Domains** become especially important.

A domain authority can understand evidence that generic M2Oath Trust
should not need to understand.

For example:

``` text
                  M2Oath Trust
                       ▲
                       │
        behavioral/domain evidence
                       │
                M2Oath Weather
```

A Weather authority can understand concepts such as:

-   forecast accuracy;
-   observation matching;
-   temperature error;
-   precipitation calibration; and
-   model performance.

M2Oath Trust does not need to become a weather forecasting system.

Instead:

``` text
Weather domain
    │
    │ authoritative domain evidence
    ▼
M2Oath Trust
    │
    │ incorporates evidence into policy
    ▼
Trust decision
```

The domain server remains authoritative for its domain-specific evidence
and semantics. M2Oath remains authoritative for the resulting
trust/policy decision used by the Trust Container.

------------------------------------------------------------------------

## 7. Composite Trust

At the first Normal Trust Growth point:

``` text
Usage       60
Behavioral  60
Composite   60
```

At the second:

``` text
Usage       65
Behavioral  70
Composite   67.5
```

For this canonical simulation, the composite value is consistent with:

``` text
(65 + 70) / 2 = 67.5
```

But developers must not infer that the UI or an intermediary service
should implement that formula.

**The Developer portal did not calculate 67.5. Raven did not calculate
67.5. M2Oath Trust returned 67.5 as authoritative output.**

That distinction matters because an authoritative trust model may
incorporate factors such as:

-   weights;
-   recency;
-   decay;
-   diversity;
-   confidence;
-   provenance;
-   operation relevance;
-   authority strength;
-   anti-farming penalties;
-   evidence deduplication; and
-   diminishing returns.

The Workbench therefore displays the result returned by M2Oath Trust
rather than recreating the model.

This is why the Workbench explicitly communicates:

> **Authoritative simulation:** Trust scores, evidence diagnostics, and
> policy decisions shown here are returned by M2Oath Trust. The
> Developer portal does not recalculate trust.

------------------------------------------------------------------------

## 8. A Trust Score Is Not Permission

The Normal Trust Growth simulation returned:

``` text
#0   ALLOW
#1   ALLOW
```

A trust score is **not itself permission**.

The relationship is:

``` text
Evidence
   │
   ▼
Trust evaluation
   │
   ▼
Trust state
   │
   ├── Usage
   ├── Behavioral
   └── Composite
   │
   ▼
Policy
   │
   ▼
ALLOW / DENY
```

Policy interprets trust in the context of an operation.

M2Oath must not mean:

``` text
score = 67.5
therefore Agent may do everything
```

Instead, the architecture supports a model such as:

``` text
Agent:       agent-1
Operation:   weather.read
Trust state: {...}

             │
             ▼

Executable trust policy

             │
             ▼

ALLOW
```

Different operations can require different trust conditions.
Conceptually:

``` text
weather.read             one policy
weather.publish          stronger policy
weather.override         stronger still
```

The exact rules are defined by policy. The architectural point is that
**trust is an input to authorization, not a universal permission
token**.

------------------------------------------------------------------------

## 9. Why the Operation Appears in the Timeline

The Workbench does not merely display:

``` text
Agent trust = 67.5
```

It preserves the operation context:

``` text
Operation
tool / weather.read
weather-server
```

That is deliberate.

Trust can be **operation-aware**.

An Agent with extensive successful history performing `weather.read`
should not automatically inherit equivalent trust for unrelated or more
sensitive operations.

For example:

``` text
10,000 successful weather.read operations
                │
                X
                │
                ▼
        delete.account
```

M2Oath therefore preserves the relationship among:

``` text
Agent
   +
Operation
   +
Evidence
   +
Trust state
   +
Policy
```

rather than reducing an identity to one universal reputation number.

------------------------------------------------------------------------

## 10. Why Canonical Agent Identity Matters

Both timeline points in the example belong to:

``` text
Agent
agent-1
```

That represents a canonical Agent identity.

Trust history can therefore conceptually follow:

``` text
Credential A ─┐
Credential B ─┼──► Canonical Agent identity ───► Trust history
Credential C ─┘
```

rather than treating a credential itself as the Agent.

This is why identity registration, external identity bindings,
cryptographic bindings, rotation, lifecycle state, and canonical
identity are foundational to accumulated trust.

A credential can change. The Agent identity and its properly governed
history must not accidentally disappear merely because credentials
rotate.

------------------------------------------------------------------------

## 11. Why the Timeline Matters More Than a Single Score

A system that displayed only:

``` text
Trust score: 67.5
```

would provide very little explanatory value.

The Workbench instead exposes progression:

``` text
TIME ───────────────────────────────────────►

#0                                      #1

Evidence: 1                             Evidence: 2

Usage: 60                               Usage: 65
Behavioral: 60                          Behavioral: 70
Composite: 60                           Composite: 67.5

ALLOW                                   ALLOW
```

This starts making trust **inspectable**.

A developer can ask:

-   Why is this Agent trusted?
-   What changed?
-   What evidence contributed?
-   Did its trust improve or decline?
-   Which trust source changed?
-   What policy decision resulted?

A richer future explanation can expose provenance and diagnostics while
preserving the same authority boundary:

``` text
             Trust
               ▲
               │
      ┌────────┼────────┐
      │        │        │
    usage   behavior   domain
      │        │        │
      └────────┼────────┘
               │
        evidence provenance
               │
               ▼
       policy explanation
```

This is why the product is a **Trust Policy Workbench**, not merely a
score viewer.

------------------------------------------------------------------------

## 12. What "Authoritative" Means

Three major components participate in the current Workbench path:

``` text
Developer Portal
Raven
M2Oath Trust
```

They intentionally have different responsibilities.

The Developer portal asks, effectively:

> Show me what happened.

Raven says:

> I will securely orchestrate the request.

M2Oath Trust says:

> I own the authoritative trust model and policy evaluation.

Therefore:

``` text
Developer Portal
    │
    │ DOES NOT calculate trust
    ▼
Raven
    │
    │ DOES NOT calculate trust
    ▼
M2Oath Trust
    │
    ├── evaluates evidence
    ├── computes trust state
    └── evaluates trust policy
```

If all three independently calculated trust, they could eventually
disagree:

``` text
Browser says: 67.5
Raven says:   65
Trust says:   70
```

The architecture avoids this ambiguity by establishing a single trust
authority.

------------------------------------------------------------------------

## 13. Raven Is an Orchestrator, Not the Trust Authority

Raven sits between the Developer application and M2Oath Trust:

``` text
Developer
    │
    ▼
  Raven
    │
    ▼
 M2Oath Trust
```

Raven's role for this workflow is approximately:

1.  authenticate the Developer;
2.  resolve the Developer account;
3.  accept the simulation request;
4.  authenticate Raven to M2Oath Trust;
5.  ask Trust to execute the simulation; and
6.  return Trust's authoritative result.

Raven does **not** recalculate whether M2Oath Trust was correct.

Raven also does not gain protected-operation execution authority merely
because it made the service request.

This preserves an important architectural rule:

> **Orchestration authority is not execution authority, and service
> identity is not trust authority.**

------------------------------------------------------------------------

## 14. Two Different Authentication Relationships

The live Workbench exercise uses two distinct authentication
relationships.

First:

``` text
Developer
    │
    │ Auth0 JWT
    ▼
Raven
```

This identifies the individual Developer making the request.

Second:

``` text
Raven
    │
    │ raven-service JWT
    ▼
M2Oath Trust
```

This identifies the trusted service calling M2Oath Trust.

These identities are deliberately different:

``` text
Developer
      │
      │ Auth0 identity
      ▼
    Raven
      │
      │ service identity
      ▼
 M2Oath Trust
```

Raven does not simply pass its own authority from the Developer, nor
does it pretend to be the Developer when authenticating as the Raven
service.

Authentication identifies callers. It must not silently create
authorization or protected-operation authority.

------------------------------------------------------------------------

## 15. Signing Authority Remains Separate

In the local development architecture, the Identity/JWKS service
generates the Raven service credential.

Conceptually:

``` text
Identity Authority
       │
       ├──────── public key ─────────► Trust
       │
       └──────── signed JWT ─────────► Raven
```

Raven receives a signed credential.

Trust receives public verification material.

The private signing key remains with the identity authority.

Therefore:

``` text
Raven ≠ signing authority
Trust ≠ signing authority
Developer browser ≠ service credential holder
```

This is stronger than allowing each service to manufacture its own
trusted identity.

------------------------------------------------------------------------

## 16. Where the AI Trust Container Fits

The Workbench simulates the trust and policy side of the larger M2Oath
architecture.

The operational model is:

``` text
┌──────────────────────────────────────────────┐
│              AI Trust Container              │
│                                              │
│          ┌──────────────────────┐            │
│          │       AI Agent       │            │
│          │                      │            │
│          │ wants to execute     │            │
│          │ weather.read         │            │
│          └──────────┬───────────┘            │
│                     │                        │
│                     ▼                        │
│              Protected operation             │
│                     │                        │
│                     ▼                        │
│              Trust enforcement               │
│                     │                        │
│                ┌────┴────┐                   │
│                ▼         ▼                   │
│              ALLOW      DENY                 │
│                │                             │
│                ▼                             │
│             execute                          │
│                                              │
└──────────────────────────────────────────────┘
```

The Agent does **not** decide whether it is trustworthy enough to
execute.

The enforcement boundary does.

An Agent cannot simply reason:

``` text
“My trust is 67.5, therefore I am allowed.”
```

Instead:

``` text
Agent requests operation
          │
          ▼
Trust Container
          │
          ├── obtains authoritative trust
          ├── evaluates/applies policy
          │
          ▼
      ALLOW / DENY
          │
          ▼
ProtectedOperationExecutor
```

This is where the word **container** becomes meaningful.

------------------------------------------------------------------------

## 17. The Agent Is Inside the Enforcement Boundary

The intended model is not:

``` text
Agent ──────────────► tool
  │
  └── optional trust check
```

It is closer to:

``` text
             M2Oath Trust Container
┌───────────────────────────────────────────┐
│                                           │
│               AI Agent                    │
│                   │                       │
│                   │ request               │
│                   ▼                       │
│            Trust enforcement              │
│                   │                       │
│             ┌─────┴─────┐                 │
│             │           │                 │
│           DENY        ALLOW               │
│                         │                 │
└─────────────────────────┼─────────────────┘
                          │
                          ▼
                   Protected resource
```

When the architecture is used as the protected-operation execution
boundary, trust is not merely advisory. The Trust Container controls
whether the operation is permitted to cross the boundary.

The protected Agent does not gain the ability to bypass the trust
decision simply because it initiated the request.

------------------------------------------------------------------------

## 18. Why Trust Farming Matters

Normal Trust Growth demonstrates:

``` text
good evidence
     +
additional good evidence
     ↓
increasing trust
```

But a naive reputation model creates an obvious attack.

Suppose an Agent discovers that every successful operation increases its
trust. It could repeatedly invoke a cheap or harmless operation:

``` text
weather.read
weather.read
weather.read
weather.read
weather.read
...
```

If trust were merely a counter:

``` text
1 event      → 10 trust
10 events    → 100 trust
1,000 events → extremely trusted
```

the system would become a trust-farming machine.

A robust trust model can instead consider:

``` text
raw evidence count
        │
        ├── repetition?
        ├── diversity?
        ├── recency?
        ├── duplicates?
        ├── provenance?
        ├── authority?
        ├── operation relevance?
        └── diminishing returns?
                │
                ▼
          effective evidence
                │
                ▼
            trust state
```

Quantity alone must not automatically equal trust.

------------------------------------------------------------------------

## 19. Adversarial Trust Scenarios

The Trust Policy Workbench includes scenarios such as:

-   `normal-trust-growth`
-   `repetition-farming`
-   `failure-laundering`
-   `cold-start`
-   `fake-diversity`
-   `cross-operation-farming`
-   `authority-concentration`
-   `stale-reputation`
-   `replay-attack`
-   `combined-farming-attack`
-   `trusted-domain-composition`

These scenarios can be understood as tests against naive trust and
reputation systems.

### Repetition Farming

``` text
repeat same behavior
        ↓
lots of evidence
        ↓
must NOT automatically mean lots of trust
```

### Cross-Operation Farming

``` text
be trustworthy at operation A
        ↓
attempt operation B
        ↓
trust should not automatically transfer
```

### Stale Reputation

``` text
excellent historical behavior
        ↓
little or no recent evidence
        ↓
should old trust retain its full value forever?
```

### Replay Attack

``` text
one legitimate evidence item
        ↓
replay it repeatedly
        ↓
must not manufacture additional trust
```

### Fake Diversity

``` text
many apparently different evidence records
        ↓
same underlying source or control
        ↓
must not masquerade as independent corroboration
```

### Authority Concentration

``` text
many observations
        ↓
all controlled by one authority
        ↓
not equivalent to many independent authorities
```

Collectively, these scenarios ask:

> **Can an Agent manipulate the evidence system into appearing more
> trustworthy than its actual evidence justifies?**

That question is central to M2Oath's accumulated-trust model.

------------------------------------------------------------------------

## 20. Trust Is Evidence, Not Belief

A useful way to think about M2Oath is to avoid unexplained assertions
such as:

``` text
“We trust Agent X.”
```

Instead, M2Oath aims toward an evidence-based chain:

``` text
Agent X

has this canonical identity
     │
has this evidence
     │
from these sources
     │
for these operations
     │
at these times
     │
with this provenance
     │
evaluated by this trust model
     │
under this policy
     │
therefore
     ▼
ALLOW or DENY this particular operation
```

This makes trust more inspectable, explainable, and auditable.

------------------------------------------------------------------------

## 21. Trust Decision Provenance

The Workbench exposes model provenance such as:

``` text
Model:          m2oath-workbench
Version:        1
Configuration:  canonical-day-10
```

This information matters because a future audit should be able to ask:

> Why did M2Oath make this decision?

A useful decision record can identify:

``` text
Model ID
    +
Model Version
    +
Configuration
    +
Evidence
    +
Policy
    +
Decision
```

A score alone is insufficient.

Model and configuration identity provide the beginning of
reproducibility and trust-decision provenance.

------------------------------------------------------------------------

## 22. Toward Explainable Trust Decisions

A production system that returns only:

``` text
DENY
```

is difficult to operate.

The evidence architecture can support richer explanations such as:

``` text
DENY weather.publish

Agent:
    agent-27

Composite trust:
    58

Required:
    75

Contributing factors:
    + strong recent usage history
    + verified domain evidence
    - insufficient authority diversity
    - repeated evidence discounted
    - historical evidence decayed
```

The Trust Container remains the enforcement authority.

The explanation does not become the authority. It is an observability
mechanism that helps developers and operators understand the
authoritative decision.

The Workbench is the beginning of that developer-facing observability
surface.

------------------------------------------------------------------------

## 23. Why M2Oath Is More Than Agent Authentication

If M2Oath were only an Agent identity system, the architecture could
largely stop at:

``` text
JWT
  ↓
authenticate
  ↓
agent-1
```

M2Oath's broader model is:

``` text
                    M2Oath

Identity ──────┐
               │
Authentication ┤
               │
Usage evidence ┤
               │
Behavior ──────┤
               │
Domain evidence┤
               │
Provenance ────┤
               │
Trust model ───┤
               │
Policy ────────┤
               ▼
        Trust Container
               │
          ┌────┴────┐
          ▼         ▼
        ALLOW      DENY
```

The objective is not merely to know which Agent is calling.

The objective is to establish identity, evaluate relevant evidence,
determine trust under executable policy, and enforce the resulting
decision at the protected-operation boundary.

------------------------------------------------------------------------

## 24. The Live End-to-End Architecture

The first live Normal Trust Growth Workbench verification demonstrated
this chain:

``` text
Auth0
  │
  ▼
Authenticated Developer
  │
  ▼
Developer Portal
  │
  ▼
Nuxt server API
  │
  │ Developer access token
  ▼
Raven
  │
  │ raven-service credential
  ▼
M2Oath Trust
  │
  ▼
Canonical simulation
  │
  ├── usage evidence
  ├── behavioral evidence
  ├── composite trust
  └── policy decision
  │
  ▼
Authoritative result
  │
  ▼
Raven → Nuxt → Workbench
```

The canonical Normal Trust Growth values survived that complete chain:

``` text
Timeline #0
Usage       60
Behavioral  60
Composite   60
Decision    ALLOW

Timeline #1
Usage       65
Behavioral  70
Composite   67.5
Decision    ALLOW
```

This verifies more than the rendering of a web page.

It demonstrates the separation of:

-   Developer authentication;
-   Developer account resolution;
-   service-to-service authentication;
-   Raven orchestration;
-   authoritative trust evaluation;
-   policy decision;
-   result transport; and
-   developer observability.

------------------------------------------------------------------------

## 25. Core Developer Rules

Developers extending M2Oath should preserve these invariants:

1.  **Do not equate authentication with trust.** Authentication
    establishes identity; trust evaluates evidence.

2.  **Do not equate trust with universal permission.** Trust is
    interpreted by policy for a particular protected operation.

3.  **Do not recalculate authoritative trust in clients or orchestration
    services.** The Developer portal and Raven consume authoritative
    Trust results.

4.  **Do not make Raven the trust or execution authority.** Raven
    orchestrates service interactions.

5.  **Do not let Trusted Domains become protected-operation execution
    authorities.** They remain authoritative for domain-specific
    evidence and semantics.

6.  **Do not let an Agent self-authorize.** The Trust
    Container/ProtectedOperationExecutor remains the enforcement
    boundary.

7.  **Do not treat evidence count as trust.** Repetition, provenance,
    diversity, recency, relevance, authority, and other trust-model
    properties matter.

8.  **Preserve operation context.** Trust accumulated for one operation
    must not silently become authority for unrelated operations.

9.  **Preserve canonical Agent identity across credential lifecycle
    changes.** Credentials and Agent identity are not the same thing.

10. **Preserve provenance.** Model identity, model version,
    configuration, evidence, policy, and decision context are important
    for auditability.

11. **Treat trust explanations as observability, not authority.**
    Explanations help humans understand decisions; they do not replace
    the enforcement decision.

12. **Keep trust rules programmable without moving execution authority
    into the rules.** Executable TypeScript trust rules decide; the
    Trust Container enforces.

------------------------------------------------------------------------

## 26. A Mental Model for New M2Oath Developers

When working on M2Oath, ask these questions in order:

``` text
1. WHO is requesting the operation?
             │
             ▼
       Canonical identity

2. WHAT operation is being requested?
             │
             ▼
       Operation context

3. WHAT evidence exists?
             │
             ▼
    Usage / behavioral /
       domain evidence

4. WHERE did the evidence come from?
             │
             ▼
          Provenance

5. WHAT does the authoritative trust model
   conclude from that evidence?
             │
             ▼
          Trust state

6. WHAT does executable policy decide
   for this operation?
             │
             ▼
        ALLOW / DENY

7. WHO enforces that decision?
             │
             ▼
       Trust Container /
 ProtectedOperationExecutor
```

If a new component begins answering a question that belongs to another
layer, examine the boundary carefully.

------------------------------------------------------------------------

## 27. Final Perspective

The central M2Oath idea can be summarized as:

> **An Agent should not receive authority merely because it can
> authenticate, nor should it gain unlimited authority merely because it
> has accumulated activity. Protected execution should depend on
> authoritative, evidence-based, operation-aware trust evaluated under
> policy and enforced outside the Agent itself.**

The Trust Policy Workbench makes that architecture visible.

Normal Trust Growth demonstrates the positive case: credible additional
evidence can produce a stronger trust state.

The adversarial scenarios test the harder question: whether the system
resists attempts to manufacture trust through repetition, replay, stale
reputation, fake diversity, cross-operation activity, concentrated
authorities, or combinations of those techniques.

The final architecture is therefore not:

``` text
Agent authenticated
       ↓
Agent trusted
       ↓
Agent executes
```

It is:

``` text
Agent authenticated
       │
       ▼
Canonical identity
       │
       ▼
Relevant evidence + provenance
       │
       ▼
Authoritative trust evaluation
       │
       ▼
Executable policy decision
       │
       ▼
Trust Container enforcement
       │
   ┌───┴───┐
   ▼       ▼
 ALLOW    DENY
   │
   ▼
Protected operation
```

That separation---**identity, evidence, trust, policy, and
enforcement**---is the foundation developers should preserve as M2Oath
grows.

------------------------------------------------------------------------

## Training Takeaway

When reviewing any M2Oath feature, ask:

> **Does this component identify, provide evidence, calculate trust,
> decide policy, orchestrate, observe, or enforce?**

A component can participate in more than one carefully designed
responsibility, but those responsibilities must never be allowed to
collapse accidentally into unbounded execution authority.

That question is one of the simplest ways to protect the M2Oath
architecture.
