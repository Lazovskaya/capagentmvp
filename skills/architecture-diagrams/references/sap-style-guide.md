# SAP draw.io Visual Style Guide

Derived from inspecting real `.drawio` files across the SAP Architecture Center catalog
(RA0001, RA0007, RA0015, RA0021, and others). Use these values so generated or edited
diagrams look native to SAP's reference architectures rather than generic draw.io output.

## Color palette

| Role | Fill | Stroke | Notes |
|---|---|---|---|
| Primary / BTP blue | `#EBF8FF` or `#ECF8FF` | `#0070F2` | Default box for BTP services, core components |
| Neutral / generic component | `#F5F6F7` | `#475E75` | Secondary boxes, runtime/tech labels (e.g. "Node.js") |
| White / emphasis box | `#FFFFFF` | `#475E75` or `#07838F` | Top-level app components, emphasized boxes |
| Teal accent | `#FFFFFF` or `#EBF8FF` | `#07838F` | Application-layer components |
| Security / identity (magenta) | `#FFF0FA` | `#CC00DC` | IAM, auth, identity services |
| Success / positive flow (green) | — | `#188918` | Occasionally used for status or validated flows |
| Edge / connector lines | n/a | `#475E75` or `#5B738B` | Default arrow color, not pure black |
| Non-SAP / 3rd-party system | `#FFFFFF` | `#475E75`, dashed (`dashed=1;dashPattern=8 4;`) | A legacy or 3rd-party system (a WMS, a bank, a non-SAP EDI gateway) — dashed stroke visually flags "not SAP," rather than reusing the solid neutral-gray style used for SAP's own generic/runtime components. Keep the same slate stroke color family so it still reads as part of the same diagram, not a different visual language. |

Stick to this palette. Avoid default draw.io colors (default blue `#dae8fc`, default
orange `#ffe6cc`, etc.) — they immediately look "non-SAP."

## Typography

- Primary font: `72 Brand` (SAP's actual brand typeface, available within draw.io if the
  SAP stencil library/font is loaded).
- Safe fallback when `72 Brand` isn't available: `Helvetica` or `Arial`.
- Box label font size: typically `14`.
- Emphasized / top-level box labels: `fontStyle=1` (bold).
- Style string fragment: `fontFamily=72 Brand;fontSize=14;fontStyle=1;`

## Shape conventions

- Boxes are rounded rectangles: `rounded=1;arcSize=24;absoluteArcSize=1;`
- Standard stroke width: `1.5` for secondary boxes, `2` to `2.5` for emphasized/grouping
  boxes.
- `whiteSpace=wrap;html=1;` should always be present so labels wrap inside the box.
- Larger "container" boxes (representing a subaccount, runtime, or logical grouping) are
  just bigger rounded rectangles with other boxes nested inside via `parent` references —
  SAP reference diagrams generally do NOT use draw.io's native `swimlane` shape style.
  Containment is achieved by parent/child `mxCell` relationships, not swimlane shapes.
- Example full style string for a standard component box:
  ```
  rounded=1;whiteSpace=wrap;html=1;strokeColor=#475E75;fillColor=#F5F6F7;arcSize=24;absoluteArcSize=1;strokeWidth=1.5;fontSize=14;fontFamily=72 Brand;fontStyle=1
  ```
- Example full style string for a primary/highlighted BTP box:
  ```
  rounded=1;whiteSpace=wrap;html=1;strokeColor=#0070F2;fillColor=#EBF8FF;arcSize=24;absoluteArcSize=1;strokeWidth=2.5;fontFamily=72 Brand
  ```

## Connectors / edges

- Standard arrow style fragment:
  ```
  endArrow=blockThin;html=1;strokeColor=#475e75;bendable=1;rounded=0;endFill=1;endSize=4;strokeWidth=2;startSize=4;startArrow=none;startFill=0;
  ```
- Most edges use `edgeStyle=entityRelationEdgeStyle` or simple orthogonal routing
  (`edgeStyle=orthogonalEdgeStyle`) rather than free-floating straight lines.
- Connect edges to specific anchor points using `exitX/exitY` and `entryX/entryY`
  (0 to 1 fractional coordinates on each box) rather than leaving them floating, so they
  look intentional rather than auto-routed.

## Icons and logos

- SAP product/service logos in these diagrams are embedded as base64-encoded SVGs inside
  `image=data:image/svg+xml,...` style attributes on `shape=image` cells — NOT external
  image links. This is why files can be 100KB+ even for modest diagrams.
- For new diagrams, prefer plain labeled rounded boxes over trying to source/recreate
  SAP's exact product icons — getting the layout, palette, and labeling right matters far
  more for "looking native" than pixel-perfect logos. If exact icons are needed, point the
  user to the official SAP BTP icon library for draw.io (community-maintained, referenced
  in `references/icon-libraries.md`) which they can load inside their own draw.io app.

## Layout conventions

- Canvas / page size is typically `1920 x 1200` (`pageWidth`/`pageHeight` on
  `mxGraphModel`), landscape, built for wide architecture diagrams.
- Outer grouping boxes commonly start around `x=200, y=80` with generous internal padding
  (~10-20px) before inner content starts.
- Left-to-right or top-to-bottom flow is standard: data sources / actors on the left or
  top, processing/integration in the middle, destination systems on the right or bottom.
- Group related components inside a shared bounding container (subaccount, runtime,
  network zone) rather than scattering them, mirroring how SAP diagrams visually chunk a
  landscape into zones.

## What NOT to do

- Don't use default draw.io shape styles or colors — they read as generic, not SAP.
- Don't use swimlanes for containment; use nested rounded rectangles instead.
- Don't make stroke colors pure black (`#000000`) — SAP diagrams consistently use the
  slate `#475E75` family even for "neutral" lines and borders.
- Don't skip `html=1;whiteSpace=wrap;` — labels will not wrap correctly without it and
  text will overflow the shape.
