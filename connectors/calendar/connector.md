# Connector: calendar

Finds real attendee availability and drafts (never sends) meeting invites. Microsoft 365 in the
ported version — this connector was missing from the data model even though `skills/fit-to-standard`
(the one component ported as "proven to work end to end") actually depends on it for its scheduling
step; this entry closes that gap.

**Used by:** `fit-to-standard` (workshop scheduling). Graceful degradation is already handled at the
skill level: if this connector isn't wired, the skill still produces the workshop pack and marks
scheduling "not connected, fill manually" rather than blocking.

**Status:** Progress. Live-tested as part of the ported `fit-to-standard` skill, not yet
independently re-verified inside this repo.
