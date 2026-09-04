# Integration Blueprint Patterns Reference

A blueprint is a **decided, reusable reference architecture** for one integration use-case pattern — the
answer to "when we see this shape of integration again, here's how we build it, and here's why." The
Integration Strategy seeds one reference blueprint per in-scope integration style; the full library is
built iteratively in the EA tool as real interfaces are assessed. This file gives the ID scheme and one
worked example per style to copy the shape from.

## Blueprint ID scheme

```
<Domain>.<Style>.<Pattern>.<Class + 2-digit sequence>
```

- **Domain** — the ISA-M integration domain code: `O2O`, `O2C`, `C2C`, `H2C`, `C2O`, `B2B`, `B2G`.
- **Style** — `PI` (Process Integration), `DI` (Data Integration), `TI` (Thing Integration),
  `CU` (Cross-Use Case).
- **Pattern** — a short pattern token, e.g. `A2A`, `EDI`, `MDI`, `REPL`, `EVT`, `API`, `STREAM`, `VIRT`.
- **Class** — `S` = Standard (the default, recommended way), `L` = Limited (allowed but constrained, e.g.
  legacy-only or volume-capped), `E` = Exception (permitted only with explicit approval).
- **Sequence** — two digits, `01`, `02`, … within that Domain/Style/Pattern/Class.

Examples: `H2C.PI.A2A.S01` (standard hybrid A2A), `B2B.PI.EDI.L01` (limited legacy EDI blueprint),
`H2C.PI.EDI.E01` (exception EDI path), `C2C.CU.EVT.S01` (standard cloud event-based).

## What every blueprint records

1. **ID** and **title**.
2. **Integration domain / style / use-case pattern**.
3. **Class** (S/L/E) and a one-line reason for the class.
4. **Architecture description** — sender → middleware(s) → receiver, named components, sync vs. async,
   protocol(s), message/canonical format. Described in text; a diagram is rendered later if the output is
   PowerPoint.
5. **Decision criteria** — the conditions under which a new interface *matches* this blueprint: message
   type, processing type (real-time / batch / event), frequency/volume, entity reuse, delivery guarantee.
6. **Technology components** — the concrete products (e.g. SAP Integration Suite iFlow, Advanced Event
   Mesh topic, Confluent cluster, SEEBURGER mapping).
7. **Error handling & monitoring** — ret/reprocessing approach, idempotency, where errors surface (AIF,
   middleware monitor, Dynatrace/Cloud ALM).

## Worked example — Process Integration (Standard A2A)

- **ID:** `H2C.PI.A2A.S01` — Standard asynchronous A2A via SAP Integration Suite
- **Domain / Style / Pattern:** H2C / Process Integration / A2A
- **Class:** S — this is the default for internal application-to-application process messages in the target
  state.
- **Architecture:** S/4HANA emits a message (SOAP/OData/event) → SAP Integration Suite Cloud Integration
  iFlow (mapping, routing, canonical transform) → asynchronous queue → receiving application. Async, at
  least-once delivery, canonical message model in the middleware.
- **Decision criteria:** internal (non-partner) receiver; business document exchange; latency-tolerant;
  volume moderate-to-high → prefer async queue-based A2A over synchronous calls.
- **Technology:** SAP Integration Suite (Cloud Integration), JMS/queue, AIF on the S/4HANA side for
  inbound error handling.
- **Error handling:** idempotent processing via unique message IDs + duplicate check; source-side
  reprocessing; errors visible in AIF (SAP side) and the Integration Suite monitor.

## Worked example — B2B/EDI (Exception path)

- **ID:** `B2B.PI.EDI.E01` — EDI to a trading partner requiring a non-standard direct path
- **Class:** E — exception; only for partners that cannot use the standard B2B gateway, with approval.
- **Architecture:** S/4HANA IDoc/SOAP → B2B gateway (SEEBURGER / SAP IS B2B) → AS2/SFTP → trading partner;
  the exception adds a partner-specific mapping and a bypass of the standard canonical layer.
- **Decision criteria:** external trading partner; EDI/EDIFACT/X12 or partner-proprietary format; standard
  B2B blueprint (`B2B.PI.EDI.S01`) cannot accommodate the partner's constraints.
- **Technology:** SEEBURGER (Legacy) or SAP Integration Suite B2B (Target), AS2/SFTP adapters.

## Worked example — Data Integration (Standard replication)

- **ID:** `O2C.DI.REPL.S01` — Standard bulk/delta replication to a cloud data platform
- **Class:** S
- **Architecture:** S/4HANA tables/CDS → ODP/CDC → Azure Data Factory (self-hosted CDC connector) → cloud
  data lake / warehouse. Initial full load + scheduled delta.
- **Decision criteria:** data movement for analytics/consolidation (not a business transaction); bulk or
  scheduled; delta capture required.
- **Technology:** ODP/CDC, Azure Data Factory (or SAP Datasphere), self-hosted CDC connector.

## Worked example — Cross-Use Case (Standard event-based)

- **ID:** `C2C.CU.EVT.S01` — Standard event publication for cloud consumers
- **Class:** S
- **Architecture:** S/4HANA Business Event → SAP Advanced Event Mesh / Confluent topic → multiple cloud
  consumers subscribe; consumers use a loopback call to S/4HANA to retrieve the full object when the event
  payload is a notification rather than the full record.
- **Decision criteria:** one-to-many notification; consumers decoupled from the producer; near-real-time;
  no strong ordering requirement across partitions.
- **Technology:** SAP Business Events (Event Mesh / Advanced Event Mesh) or Confluent, AMQP/MQTT/Kafka
  protocol.

## Guidance when scoping blueprints for a client

- Produce **one reference blueprint per in-scope style** as the seed — don't try to enumerate the whole
  library in the strategy; that's built iteratively during delivery.
- Choose the **class** honestly: the recommended target-state path is `S`; a tolerated legacy path is `L`;
  anything requiring approval is `E`. This is how the strategy discourages point-to-point sprawl.
- Ground each blueprint in the client's **confirmed** technology (from the technology mapping). If a
  component is still In Discussion, either pick the standard SAP option and tag it
  `[⚠ IN DISCUSSION]`, or express the blueprint with the decision left open — don't silently assume.
