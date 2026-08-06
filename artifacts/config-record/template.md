# Config record — config-doc

This is the artifact the `realize→deploy` Q-gate checks alongside `transport-record`. The point is
recording *why*, not just *what* — a config change with no rationale is indistinguishable from an
accident the next time someone reviews it.

- **Client / engagement:**
- **Process area / module:**
- **Config change:** <transaction/IMG node, object, the actual setting changed>
- **Rationale:** <why — cite the fit-to-standard decision-log Row ID or design-record this
  implements; a config change with no upstream decision to point at is itself a finding, not
  something to silently document>
- **Config guideline check:** <does this conform to `knowledge/standards/config-guidelines.md`? If
  not, say so explicitly rather than letting the deviation pass unremarked>
- **Made by:**
- **Date:**
- **Transport(s) carrying this change:** <see `transport-record` — do not duplicate the transport ID
  here, reference it>

## Validity checklist before this record is considered complete

- [ ] Rationale cites an upstream Row ID / design-record, not just a restated description of the change
- [ ] Config-guideline conformance was actually checked, not assumed
- [ ] The transport carrying this change is referenced, not left implicit
