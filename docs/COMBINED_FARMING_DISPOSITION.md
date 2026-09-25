# Combined Farming Attack --- Disposition

## Status

**OPEN / DEFERRED TO MODEL ANALYSIS**

Combined Farming remains an unresolved finding in
`farming-resistance-v1`. It is not currently treated as a failed
implementation, and the trust model should not be tuned as part of the
present validation checkpoint.

## Validated Behavior

The model successfully applies the intended farming defenses
independently:

-   Agent Trust score: `65`
-   Agent evidence count: `2`
-   Agent effective evidence weight: `1.5`
-   Agent diversity count: `1`
-   Domain Trust score: `65`
-   Domain evidence count: `2`
-   Domain effective evidence weight: `1.5`
-   Domain diversity count: `1`
-   Composite Trust score: `65`
-   Policy decision: `ALLOW`

The second same-operation Agent evidence item receives diminished
weight, and the second same-authority Domain evidence item receives
diminished weight.

Therefore:

-   operation diminishing is functioning;
-   authority diminishing is functioning;
-   the remaining finding is at the composition/policy layer.

Two individually constrained trust streams can still reinforce one
another sufficiently to reach the current authorization threshold.

## Disposition

Freeze the current `farming-resistance-v1` result without changing the
model.

Do **not** change the trust threshold, composition formula, or farming
controls merely to make the Combined Farming scenario return `DENY`.

Carry the finding forward into population-scale testing and subsequent
trust-model analysis.

Day 11 population testing should help determine whether this behavior is
primarily a synthetic adversarial edge case or represents a broader
structural characteristic of the model.

Day 12 model analysis can then evaluate possible remedies against both
adversarial and legitimate trust behavior. Candidate areas for analysis
include:

-   correlated-evidence handling;
-   composition damping;
-   minimum independent diversity requirements;
-   policy-specific evidence requirements;
-   other composition-level controls.

No particular remediation is selected by this validation record.

## Rationale

The current evidence establishes that the individual anti-farming
mechanisms work. It does not yet establish which composition-level
change would improve resistance to combined farming without
unnecessarily damaging legitimate Agent Trust and Trusted Domain
composition.

The Combined Farming finding should therefore remain visible and
reproducible while the current model is held stable for further
measurement.

## Validation Classification

**Combined Farming Attack: FINDING --- mitigation works at the
individual evidence-stream level, but combined composition remains
permissive.**
