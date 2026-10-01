# Onboarding note for Engagement Delivery Leads (P2)

A new Engagement Delivery Lead (EDL) — the RACI role in [README.md](README.md) accountable for
the delivery pipeline's stages 1 and 3 — needs three things before running a pilot, in this order.
This note is the packaged pointer; it does not duplicate the material it references.

## 1. Read the delivery process and RACI

[README.md](README.md) in this directory: the four pipeline stages, who's Responsible/Accountable
at each, the framework-ownership split, and the re-clone update policy. Know your own
Accountable stages (1 and 4) before touching anything.

## 2. Understand what the two existing onboarding skills are for — and aren't

Neither of these is the delivery pipeline this note covers. Don't substitute one for the other:

- **`skills/factory-onboard`** — a *consultant's* day-0 orientation once they're already working
  inside a delivered client project. Verifies tool path, captures engagement context, routes to a
  first delivery skill. Runs **after** stage 3 (Unpack & sign-off) has already produced that
  project.
- **`skills/onboarding-guide`** — a *new team member's* walkthrough of the nine knowledge buckets,
  ending in a "ready to take a ticket" checkpoint. Also runs **after** delivery, inside the
  client engagement, for any role joining it.

As EDL, you are the person who makes stage 3 happen so that either of the above has something to
onboard *into*. If you find yourself trying to use `factory-onboard` to onboard your own delivery
team to the pipeline itself, that's a sign this note or the README needs expanding — flag it back
to the Factory Platform Owner rather than working around the gap silently.

## 3. Know the current platform-track dependency chain

As of this writing, the pipeline you're accountable for isn't fully unblocked yet:

- P1 (repo structure), P3 (clone/filter pipeline), P5 (Unpack step) are still in progress or open.
- P6 (pilot smoke test) and P7 (client end-user onboarding guides) depend on P5.

Check the current status of P1/P3/P5/P6/P7 in Jira before committing to a pilot delivery date —
an EDL sign-off (stage 3) cannot happen before the Unpack Operator has a working P5 to run.
