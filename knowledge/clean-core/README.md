# Knowledge: clean-core

SAP's clean-core rules: in-app versus side-by-side, released APIs, upgrade safety. SAP publishes
it; we apply it as an always-on guardrail.

**Posture:** adopt, ported from SAP's own published guidance, not authored by us.

## Ported from sap-ai-framework

`knowledge/standards/clean-core.md` in sap-ai-framework existed as a stub, not real content:

> Clean-core principles applied across custom development and configuration decisions.
> TODO: fill in. Keep it tool-blind so it can travel into any client environment (including a
> locked-down tenant) and be repackaged by any adapter.

Carrying that stub forward honestly rather than inventing content it never had. What actually
needs to go here: in-app versus side-by-side extensibility criteria, the released-API list (or a
pointer to SAP's current one, since it changes), and upgrade-safety checks that `modern-abap`
(see `skills/index.yaml`'s `abap-dev` entry) and the `extensibility-assessor` agent should both
apply.

**Status:** In progress. The bucket exists and is wired in as a guardrail; the content itself is
still TODO.
