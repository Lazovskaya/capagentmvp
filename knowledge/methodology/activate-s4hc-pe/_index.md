# SAP Activate Roadmaps — Index

Generated from SAP Roadmap Viewer XML exports. Source XMLs are gitignored (`workspace/roadmaps/`).
Regenerate with: `python3 tools/generate_activate_roadmap_markdown.py`

## Roadmaps

| File | Product / Scenario | Source | Tasks |
|---|---|---|---:|
| [s4hc-pe-3sl-2026.md](s4hc-pe-3sl-2026.md) | S/4HANA Cloud Public Edition — New Implementation (3SL) 2026 | MS Project | 325 |
| [s4hc-pe-2sl-2024.md](s4hc-pe-2sl-2024.md) | S/4HANA Cloud Public Edition — New Implementation (2SL) 2024 | MS Project | 248 |
| [s4hc-2sl-to-3sl.md](s4hc-2sl-to-3sl.md) | S/4HANA Cloud — Conversion 2SL → 3SL | MS Project | 101 |
| [s4h-op-24q3-solman.md](s4h-op-24q3-solman.md) | S/4HANA On-Premise — System Conversion / New Impl 2024 Q3 | SolMan | 418 |
| [s4h-cfin-op-solman.md](s4h-cfin-op-solman.md) | S/4HANA Central Finance (cFIN) — On-Premise | SolMan | 166 |
| [bw4hana-transition-msproject.md](bw4hana-transition-msproject.md) | BW/4HANA — Transition from BW | MS Project | 229 |
| [bw4hana-transition-solman.md](bw4hana-transition-solman.md) | BW/4HANA — Transition from BW | SolMan | 307 |

All roadmaps cover phases: Discover → Prepare → Explore → Realize → Deploy → Run  
(2SL→3SL conversion omits Explore)

## When to use which

| Situation | File |
|---|---|
| New S/4HANA Cloud PE project (current) | s4hc-pe-3sl-2026.md |
| Existing S/4HANA Cloud PE project (older 2SL) | s4hc-pe-2sl-2024.md |
| Customer migrating from 2SL to 3SL | s4hc-2sl-to-3sl.md |
| On-premise new implementation or system conversion | s4h-op-24q3-solman.md |
| Central Finance deployment | s4h-cfin-op-solman.md |
| BW to BW/4HANA migration | bw4hana-transition-msproject.md or bw4hana-transition-solman.md |

## Notes

- **MS Project** files contain Workstream and Tags metadata per task; **SolMan** files contain Role assignments per task.
- BW/4HANA has two exports of the same roadmap (different source formats); MS Project version is more complete for task metadata.
- PM.230 (S/4HANA Cloud Private Edition — 4 scenarios) is available only as `.mpp` binary — export to XML from MS Project to add.
