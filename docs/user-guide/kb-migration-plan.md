# Migration plan: end-user docs from repo to kb.epam.com

> Companion document for EPMCSAPAI-297 (P7). Covers `onboarding.md` and
> `access-security-guide.md` specifically — not this factory's other Confluence-published
> artifact, the component map (`index.html`/`factory-data.json`, published via a different,
> already-working process documented in the root `README.md`'s "Where people actually view this
> page" — unrelated to this plan, don't conflate the two).

---

## 1. Why markdown-in-repo first, not KB-first

Both documents describe mechanics that are still actively changing (`tools/unpack.py` shipped in
this same work cycle; connector wiring has already changed twice this engagement — the jira
launcher's process-handoff bug). A doc that lives in the same repo as the code it describes, reviewed in the same pull
request as a mechanics change, is far less likely to silently drift out of date than one that
requires a separate manual KB edit to stay in sync. KB migration is deliberately the *last* step,
once the content itself has stopped changing weekly.

## 2. Trigger condition — not a calendar date

Migrate when **both** hold:

- The unpack/install mechanics these two docs describe (`tools/unpack.py`, the three per-tool
  adapters, the connector wiring pattern) have gone at least one full pilot engagement without a
  breaking change to the flow a reader would need re-explained.
- At least one real pilot has actually followed `onboarding.md` end-to-end without needing
  material correction (typos are fine; a wrong path, a missing step, or an inaccurate flag is
  not).

Don't migrate on a fixed date regardless of these — an accurate repo doc a KB page can't yet match
is strictly better than a stale KB page nobody maintains.

## 3. What actually moves, and how

1. **Copy, don't rewrite.** Paste each file's content into a new KB page under the same parent as
   this factory's existing design page (see root `README.md` for that page's URL) — same
   structure, same section order. Do not "improve" the content as part of migrating it; that's a
   separate editorial pass, and conflating the two makes the diff impossible to review.
2. **Two KB pages, matching the two files** — `onboarding.md` → one page, `access-security-guide.md`
   → a second, linked page. Keep them separate in KB exactly as they're separate here; don't merge
   them into one page for convenience.
3. **Leave the in-repo files in place after migration**, each with a one-line banner at the top
   pointing at the live KB page and stating the KB copy is now authoritative. Do not delete the
   repo copies — they're what a consultant reads when working offline or from a client-side clone
   that doesn't have KB access.
4. **Ownership after migration:** whoever owns the platform delivery-process work at the time of
   migration (see EPMCSAPAI-292's RACI, once defined) takes over keeping the KB copy in sync with
   any later change to the repo copy. Until 292 names that owner explicitly, the person who
   performs the migration is that owner by default.

## 4. What does not move

- The component map's own Confluence page and its `factory-data.json`-driven publishing flow —
  already established, already working, out of scope for this plan.

## 5. Status

Not yet triggered. Both documents are new as of EPMCSAPAI-297; the "at least one full pilot
engagement" condition in section 2 hasn't been met yet.
