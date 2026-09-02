## Technical SAD assembly

Compose whatever of the nine domain-strategy outputs (Solution Landscape, Release & Transport
Management, Security, Integration, Extensibility/Clean Core, Data, Output Management & UX,
Operations, Infrastructure & Toolchain) are available into a review-ready technical Solution
Architecture Document, flagging every missing or inconsistent domain explicitly rather than
composing a false-complete SAD.

**Owner:** Architect
**Engagement(s):** Greenfield / Brownfield conversion / Build and Extend
**Status:** Not started

## Uses

- **agent:** sad-assembly
- **artifact:** technical-sad
- **knowledge:** standards
- **q-gate:** realize→deploy

## Note

The nine domain-strategy agents this activity's `sad-assembly` composes (`EPMCSAPAI-275`,
`-281` through `-289`) are not yet built in this repo — see `agents/sad-assembly/agent.md`'s
own `## Status`. This activity exists so `sad-assembly` isn't orphaned while those upstream
agents are built one at a time; it will list them explicitly once they exist.
