# mxGraph / draw.io XML Schema Reference

A `.drawio` file is plain XML. This is everything needed to read, write, merge, and edit
one by hand without draw.io itself.

## Top-level structure

```xml
<mxfile host="Electron" version="28.1.2">
  <diagram name="Generic" id="some-unique-id">
    <mxGraphModel dx="1543" dy="970" grid="1" gridSize="10" guides="1" tooltips="1"
                  connect="1" arrows="1" fold="1" page="1" pageScale="1"
                  pageWidth="1920" pageHeight="1200" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        <!-- all actual content cells go here, parent="1" or nested deeper -->
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

- `<mxfile>` can contain multiple `<diagram>` elements (multiple tabs/pages). Most SAP
  reference files have just one.
- `mxCell id="0"` and `id="1"` are always present and are the root/default layer — never
  remove or duplicate these IDs.
- Every other cell's `parent` attribute points to the cell that contains it (usually `"1"`
  for top-level items, or another cell's id for nested/grouped items).

## Vertex (box/shape) cells

```xml
<mxCell id="unique-id-1" value="Component Label" 
        style="rounded=1;whiteSpace=wrap;html=1;strokeColor=#475E75;fillColor=#F5F6F7;arcSize=24;absoluteArcSize=1;strokeWidth=1.5;fontSize=14;fontFamily=72 Brand;fontStyle=1"
        parent="1" vertex="1">
  <mxGeometry x="200" y="80" width="160" height="60" as="geometry" />
</mxCell>
```

- `vertex="1"` marks it as a shape (box), as opposed to an edge (line).
- `x`, `y` are relative to the parent's coordinate space, not the absolute canvas, when
  the cell is nested inside a group/container cell. If `parent="1"`, coordinates are
  absolute canvas coordinates.
- `value` holds the label text. Use `&lt;br&gt;` for line breaks inside labels (HTML
  entity-escaped), e.g. `value="SaaS&lt;br&gt;UI Component"`.
- `width`/`height` are in px; typical component boxes are roughly 120-200 wide, 40-80
  tall depending on label length.

## Edge (connector/arrow) cells

```xml
<mxCell id="edge-id-1" value="" 
        style="endArrow=blockThin;html=1;strokeColor=#475e75;bendable=1;rounded=0;endFill=1;endSize=4;strokeWidth=2;startSize=4;startArrow=none;startFill=0;exitX=1;exitY=0.5;exitDx=0;exitDy=0;entryX=0;entryY=0.5;entryDx=0;entryDy=0;edgeStyle=orthogonalEdgeStyle;"
        parent="1" source="box-id-1" target="box-id-2" edge="1">
  <mxGeometry relative="1" as="geometry" />
</mxCell>
```

- `edge="1"` marks it as a connector.
- `source` / `target` reference the `id` of the two boxes being connected. This is what
  makes the line "attached" — if either box moves, the line follows.
- `exitX/exitY` (on the source side) and `entryX/entryY` (on the target side) are
  fractional coordinates (0 to 1) specifying exactly where on the box the line attaches.
  `0.5` is the midpoint of that edge. E.g. `exitX=1;exitY=0.5` = middle of the right edge.
- An edge can have a `value` for a label (e.g. "OData call", "async event") which renders
  as text along the line.
- Edges without `source`/`target` can use explicit `<mxPoint as="sourcePoint">` /
  `<mxPoint as="targetPoint">` instead, but attaching to real box IDs is strongly
  preferred — it keeps the diagram editable and "alive" in draw.io.

## Grouping / containment

SAP reference diagrams nest boxes inside other boxes purely through the `parent`
attribute — there is no special "container" shape type required:

```xml
<mxCell id="group-1" value="" style="rounded=1;fillColor=#EBF8FF;strokeColor=#0070F2;arcSize=24;" parent="1" vertex="1">
  <mxGeometry x="200" y="80" width="600" height="400" as="geometry" />
</mxCell>
<mxCell id="child-1" value="Inner Component" style="rounded=1;fillColor=#F5F6F7;strokeColor=#475E75;" parent="group-1" vertex="1">
  <mxGeometry x="20" y="40" width="160" height="60" as="geometry" />
</mxCell>
```

- `child-1`'s `x`/`y` (20, 40) are relative to `group-1`'s top-left corner, NOT absolute.
- This is the single most common source of layout bugs when hand-editing: forgetting that
  nested coordinates are relative to the immediate parent, not the canvas.

## Practical workflow for create / merge / adapt tasks

1. **Parse with a real XML parser** (Python's `lxml` or `xml.etree.ElementTree`), never
   regex, when reading an existing file to extract or modify cells. Regex is fine only for
   quick read-only inspection/grep, not for programmatic edits.
2. **IDs must be unique within a file.** When merging two diagrams, IDs from the two
   source files will very likely collide. Prefix every cell id from each source file
   (e.g. `fileA-<originalid>`, `fileB-<originalid>`) and update all `parent`/`source`/
   `target` references to match the new prefixed ids before combining cells under one
   `<root>`.
3. **When merging, preserve only one `mxCell id="0"` and one `id="1"`.** Drop the
   duplicate root/layer cells from the second file and reparent its top-level cells
   (`parent="1"`) to the surviving `id="1"`.
4. **When adapting a single reference diagram** (renaming a box, swapping a system,
   adding a new integration), it's safe to edit in place: find the target `mxCell` by its
   `value` (label text) or by visual position, then change `value`, `style`, or
   `mxGeometry` attributes directly. Keep the existing `id` unchanged so any edges
   referencing it via `source`/`target` keep working automatically.

   **Label matching gotcha**: real SAP diagram labels are often NOT clean text. They can
   contain nested inline HTML with manual formatting, e.g.
   `value="<font size=\"1\" color=\"#1d2d3e\"><b style=\"font-size: 14px;\">SAP HANA<br></b></font><b ...>Cloud</b>"`
   instead of a simple `"SAP HANA<br>Cloud"`. Never match on exact raw `value` strings.
   Strip all tags first (`re.sub(r'<[^>]+>', ' ', value)`, then collapse whitespace) and
   match against that plain-text version to find the right cell. When actually editing
   the text, do a targeted substring replace inside the original formatted `value`
   (e.g. replace `"Cloud</b>"` with `"Cloud (Customer DB)</b>"`) rather than overwriting
   the whole attribute, so you preserve the original formatting instead of flattening it.
5. **Always validate the result is well-formed XML** before treating it as done — load it
   back with an XML parser and confirm no errors. A `.drawio` file that doesn't parse will
   fail to open in draw.io with an unhelpful error.
6. **Avoid orphaned references.** After any edit, grep for every `source="..."` and
   `target="..."` value and confirm a matching `id="..."` still exists somewhere in the
   file. Same for `parent="..."`.

## Multi-page files

If a merged/adapted diagram should keep source diagrams as separate tabs rather than
flattening them into one canvas, use multiple `<diagram>` elements under the same
`<mxfile>`, each with its own independent `<mxGraphModel><root>...</root></mxGraphModel>`
and its own non-colliding cell ids (ids only need to be unique within a single `<diagram>`,
not across the whole file, so this avoids step 2's prefixing entirely). This is the simpler
option when the user wants "all of these reference diagrams in one file" rather than truly
combined into a single landscape view — ask which they want if it's ambiguous.
