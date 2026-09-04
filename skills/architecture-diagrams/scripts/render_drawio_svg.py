#!/usr/bin/env python3
"""
Render a .drawio (mxGraph XML) file to a standalone SVG preview.

This is a best-effort renderer for the common shapes used in SAP Architecture
Center diagrams: rounded/plain rectangles, nested groups, text labels, and
orthogonal/entity-relation edges with arrowheads. It does NOT attempt to
replicate every draw.io stencil or embedded base64 icon pixel-for-pixel --
the goal is a faithful, readable layout + color + label preview, not a
pixel-perfect clone. For pixel-perfect rendering the user should open the
.drawio file in draw.io / diagrams.net directly.

Usage:
    python3 render_drawio_svg.py input.drawio output.svg
"""
import sys
import re
import xml.etree.ElementTree as ET
from html import unescape


def parse_style(style_str):
    """Parse a draw.io style string like 'rounded=1;fillColor=#fff;...' into a dict."""
    props = {}
    if not style_str:
        return props
    parts = style_str.split(";")
    if parts and "=" not in parts[0]:
        props["_shape"] = parts[0]  # leading bare token is often shape name
        parts = parts[1:]
    for p in parts:
        if not p:
            continue
        if "=" in p:
            k, v = p.split("=", 1)
            props[k.strip()] = v.strip()
    return props


def normalize_color(value, fallback):
    """Resolve draw.io color values that aren't plain hex into something SVG can use.

    draw.io style strings can contain 'default' (theme default), 'none', or CSS
    light-dark(#light, #dark) functions for adaptive theming. SVG doesn't understand
    any of those directly, so fall back sensibly.
    """
    if not value:
        return fallback
    v = value.strip()
    if v.lower() == "none":
        return "none"
    if v.lower() == "default":
        return fallback
    m = re.match(r"light-dark\(\s*([^,]+)\s*,\s*([^)]+)\)", v, re.I)
    if m:
        return m.group(1).strip()  # prefer the light-mode color for the static preview
    if re.match(r"^#[0-9A-Fa-f]{3,8}$", v):
        return v
    # unrecognized format (named CSS color, etc.) - pass through, SVG may still handle it
    return v


def clean_label(value):
    """Convert draw.io's HTML-ish label value into plain text lines."""
    if not value:
        return []
    text = unescape(value)
    text = re.sub(r"<br\s*/?>", "\n", text, flags=re.I)
    text = re.sub(r"<div[^>]*>", "\n", text, flags=re.I)
    text = re.sub(r"</div>", "", text, flags=re.I)
    text = re.sub(r"<[^>]+>", "", text)  # strip remaining tags
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    return lines


def load_cells(drawio_path):
    """Load the first <diagram>'s cells into a dict keyed by id."""
    tree = ET.parse(drawio_path)
    root_el = tree.getroot()
    diagram = root_el.find(".//diagram")
    if diagram is None:
        raise ValueError("No <diagram> element found")
    model = diagram.find("mxGraphModel")
    if model is None:
        # some exports nest differently; fall back to searching anywhere
        model = root_el.find(".//mxGraphModel")
    root = model.find("root")
    cells = {}
    for cell in root.findall("mxCell"):
        cid = cell.get("id")
        geom = cell.find("mxGeometry")
        cells[cid] = {
            "id": cid,
            "value": cell.get("value", ""),
            "style": parse_style(cell.get("style", "")),
            "parent": cell.get("parent"),
            "vertex": cell.get("vertex") == "1",
            "edge": cell.get("edge") == "1",
            "source": cell.get("source"),
            "target": cell.get("target"),
            "geometry": geom.attrib if geom is not None else {},
        }
    page_w = float(model.get("pageWidth", 1920))
    page_h = float(model.get("pageHeight", 1200))
    return cells, page_w, page_h


def absolute_bbox(cells, cell_id, _cache=None):
    """Compute a cell's absolute (x, y, w, h) by walking up the parent chain."""
    if _cache is None:
        _cache = {}
    if cell_id in _cache:
        return _cache[cell_id]
    cell = cells.get(cell_id)
    if cell is None:
        return (0, 0, 0, 0)
    g = cell["geometry"]
    x = float(g.get("x", 0))
    y = float(g.get("y", 0))
    w = float(g.get("width", 0))
    h = float(g.get("height", 0))
    parent_id = cell["parent"]
    if parent_id and parent_id in cells and cells[parent_id]["vertex"]:
        px, py, pw, ph = absolute_bbox(cells, parent_id, _cache)
        x += px
        y += py
    result = (x, y, w, h)
    _cache[cell_id] = result
    return result


def render_svg(drawio_path, out_path):
    cells, page_w, page_h = load_cells(drawio_path)
    bbox_cache = {}

    vertices = [c for c in cells.values() if c["vertex"]]
    edges = [c for c in cells.values() if c["edge"]]

    # Sort vertices by area descending so larger "container" boxes draw first
    # (behind) and smaller boxes draw on top, matching visual nesting.
    def area(c):
        _, _, w, h = absolute_bbox(cells, c["id"], bbox_cache)
        return w * h

    vertices_sorted = sorted(vertices, key=area, reverse=True)

    svg_parts = []
    svg_parts.append(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {page_w} {page_h}" '
        f'font-family="Helvetica, Arial, sans-serif">'
    )
    svg_parts.append(f'<rect x="0" y="0" width="{page_w}" height="{page_h}" fill="white"/>')

    # Draw vertices
    for c in vertices_sorted:
        x, y, w, h = absolute_bbox(cells, c["id"], bbox_cache)
        if w == 0 or h == 0:
            continue
        style = c["style"]
        fill = normalize_color(style.get("fillColor"), "#FFFFFF")
        stroke = normalize_color(style.get("strokeColor"), "#475E75")
        stroke_width = style.get("strokeWidth", "1.5")
        rounded = style.get("rounded", "0") == "1"
        rx = 12 if rounded else 0
        is_image_shape = style.get("_shape") == "image" or "image=" in str(style)

        if fill == "none":
            fill_attr = "none"
        else:
            fill_attr = fill

        if is_image_shape:
            # Render as a soft placeholder box instead of attempting to decode
            # the embedded base64 icon -- keeps preview lightweight + readable.
            svg_parts.append(
                f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" '
                f'rx="{rx}" fill="#F5F6F7" stroke="#C2CCD6" stroke-width="1" stroke-dasharray="3,2"/>'
            )
        else:
            svg_parts.append(
                f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" '
                f'rx="{rx}" fill="{fill_attr}" stroke="{stroke}" stroke-width="{stroke_width}"/>'
            )

        lines = clean_label(c["value"])
        if lines:
            font_size = float(style.get("fontSize", 12))
            font_weight = "bold" if style.get("fontStyle") == "1" else "normal"
            text_color = style.get("fontColor", "#1A2733")
            line_h = font_size * 1.25
            total_h = line_h * len(lines)
            start_y = y + h / 2 - total_h / 2 + font_size
            for i, line in enumerate(lines):
                ly = start_y + i * line_h
                escaped = (
                    line.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                )
                svg_parts.append(
                    f'<text x="{x + w/2:.1f}" y="{ly:.1f}" font-size="{font_size}" '
                    f'font-weight="{font_weight}" fill="{text_color}" '
                    f'text-anchor="middle">{escaped}</text>'
                )

    # Draw edges
    for c in edges:
        style = c["style"]
        stroke = normalize_color(style.get("strokeColor"), "#475E75")
        stroke_width = style.get("strokeWidth", "1.5")
        src_id, tgt_id = c["source"], c["target"]
        if src_id in cells and tgt_id in cells:
            sx, sy, sw, sh = absolute_bbox(cells, src_id, bbox_cache)
            tx, ty, tw, th = absolute_bbox(cells, tgt_id, bbox_cache)
            ex_frac = float(style.get("exitX", 1.0)) if "exitX" in style else 1.0
            ey_frac = float(style.get("exitY", 0.5)) if "exitY" in style else 0.5
            en_frac = float(style.get("entryX", 0.0)) if "entryX" in style else 0.0
            eny_frac = float(style.get("entryY", 0.5)) if "entryY" in style else 0.5
            x1, y1 = sx + sw * ex_frac, sy + sh * ey_frac
            x2, y2 = tx + tw * en_frac, ty + th * eny_frac
        else:
            geom = c["geometry"]
            src_pt = geom.get("sourcePoint")
            # ElementTree geometry dict doesn't capture child mxPoint elements;
            # fall back to a short stub line if no real anchor is available.
            x1, y1, x2, y2 = 0, 0, 0, 0
            continue

        marker_id = "arrow-" + c["id"]
        svg_parts.append(
            f'<defs><marker id="{marker_id}" markerWidth="8" markerHeight="8" '
            f'refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="{stroke}"/></marker></defs>'
        )
        svg_parts.append(
            f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" '
            f'stroke="{stroke}" stroke-width="{stroke_width}" marker-end="url(#{marker_id})"/>'
        )
        label_lines = clean_label(c["value"])
        if label_lines:
            mx, my = (x1 + x2) / 2, (y1 + y2) / 2
            svg_parts.append(
                f'<rect x="{mx-40:.1f}" y="{my-10:.1f}" width="80" height="16" fill="white" opacity="0.85"/>'
            )
            svg_parts.append(
                f'<text x="{mx:.1f}" y="{my+4:.1f}" font-size="10" fill="#475E75" '
                f'text-anchor="middle">{label_lines[0]}</text>'
            )

    svg_parts.append("</svg>")
    svg_content = "\n".join(svg_parts)

    with open(out_path, "w", encoding="utf-8") as f:
        f.write(svg_content)
    return out_path


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python3 render_drawio_svg.py input.drawio output.svg")
        sys.exit(1)
    render_svg(sys.argv[1], sys.argv[2])
    print(f"Wrote {sys.argv[2]}")
