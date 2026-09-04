#!/usr/bin/env python3
"""
Merge multiple .drawio files into a single file, either as:
  - separate pages/tabs (--mode pages), preserving each source diagram untouched, or
  - one combined canvas (--mode canvas), flattening all cells into one page with
    prefixed IDs to avoid collisions, side by side (you will likely still want to
    manually adjust offsets/positions afterward for a clean layout).

Usage:
    python3 merge_drawio.py --mode pages out.drawio in1.drawio in2.drawio [in3.drawio ...]
    python3 merge_drawio.py --mode canvas out.drawio in1.drawio in2.drawio [in3.drawio ...]
"""
import sys
import argparse
import xml.etree.ElementTree as ET


def merge_as_pages(input_paths, output_path):
    """Combine each input file's <diagram> as a separate page in one <mxfile>."""
    mxfile = ET.Element("mxfile", {"host": "Electron"})
    for idx, path in enumerate(input_paths):
        tree = ET.parse(path)
        src_root = tree.getroot()
        diagrams = src_root.findall(".//diagram")
        for d in diagrams:
            # Ensure unique diagram id/name across the merged file
            d.set("id", f"page-{idx}-{d.get('id', '')}")
            if not d.get("name"):
                d.set("name", f"Diagram {idx+1}")
            mxfile.append(d)
    ET.ElementTree(mxfile).write(output_path, encoding="utf-8", xml_declaration=False)
    print(f"Wrote {output_path} with {len(input_paths)} page(s).")


def merge_as_canvas(input_paths, output_path, x_offset_step=2200):
    """Flatten all input diagrams' cells into a single page, prefixing every cell id
    (and every parent/source/target reference to it) per source file to avoid
    collisions, and shifting each subsequent file's top-level content to the right
    so they don't overlap on import. Manual re-layout afterward is expected."""
    mxfile = ET.Element("mxfile", {"host": "Electron"})
    diagram = ET.SubElement(mxfile, "diagram", {"name": "Merged", "id": "merged-diagram"})
    model = ET.SubElement(
        diagram,
        "mxGraphModel",
        {
            "dx": "1543", "dy": "970", "grid": "1", "gridSize": "10", "guides": "1",
            "tooltips": "1", "connect": "1", "arrows": "1", "fold": "1", "page": "1",
            "pageScale": "1", "pageWidth": str(x_offset_step * len(input_paths)),
            "pageHeight": "2400", "math": "0", "shadow": "0",
        },
    )
    root = ET.SubElement(model, "root")
    ET.SubElement(root, "mxCell", {"id": "0"})
    ET.SubElement(root, "mxCell", {"id": "1", "parent": "0"})

    for idx, path in enumerate(input_paths):
        prefix = f"f{idx}-"
        tree = ET.parse(path)
        src_root = tree.getroot()
        src_model = src_root.find(".//mxGraphModel")
        src_cells_root = src_model.find("root")
        x_offset = idx * x_offset_step

        # Find the minimum x/y among this file's own top-level cells (parent 0 or 1)
        # so we can normalize negative or arbitrary offsets back near (0,0) before
        # applying our lane offset. Without this, files whose original canvas used
        # negative coordinates (common after manual repositioning in draw.io) end up
        # rendering off-page in the merged file.
        min_x, min_y = 0.0, 0.0
        top_level_cells = [
            c for c in src_cells_root.findall("mxCell")
            if c.get("parent") in ("0", "1") and c.find("mxGeometry") is not None
        ]
        xs = [float(c.find("mxGeometry").get("x", 0)) for c in top_level_cells]
        ys = [float(c.find("mxGeometry").get("y", 0)) for c in top_level_cells]
        if xs:
            min_x = min(xs)
        if ys:
            min_y = min(ys)

        for cell in src_cells_root.findall("mxCell"):
            cid = cell.get("id")
            if cid in ("0", "1"):
                continue  # skip each source's own root/layer cells

            new_id = prefix + cid
            cell.set("id", new_id)

            parent = cell.get("parent")
            if parent in ("0", "1"):
                cell.set("parent", "1")  # reparent top-level cells to the shared root layer
            elif parent:
                cell.set("parent", prefix + parent)

            if cell.get("source"):
                cell.set("source", prefix + cell.get("source"))
            if cell.get("target"):
                cell.set("target", prefix + cell.get("target"))

            # Normalize this source file's own coordinate space back near (0,0),
            # then shift true top-level cells into their lane. Only top-level cells
            # carry meaningful absolute x/y here -- nested cells use parent-relative
            # coordinates and must NOT be touched, or layout will double-shift.
            geom = cell.find("mxGeometry")
            if geom is not None and cell.get("parent") == "1":
                if "x" in geom.attrib:
                    geom.set("x", str(float(geom.get("x", 0)) - min_x + x_offset))
                if "y" in geom.attrib:
                    geom.set("y", str(float(geom.get("y", 0)) - min_y))

            root.append(cell)

    ET.ElementTree(mxfile).write(output_path, encoding="utf-8", xml_declaration=False)
    print(f"Wrote {output_path} combining {len(input_paths)} file(s) onto one canvas.")
    print("NOTE: files are placed side-by-side with a fixed offset; review and adjust")
    print("positions/connections manually in draw.io for a clean final layout.")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--mode", choices=["pages", "canvas"], required=True)
    parser.add_argument("output", help="Output .drawio path")
    parser.add_argument("inputs", nargs="+", help="Input .drawio paths (2 or more)")
    args = parser.parse_args()

    if len(args.inputs) < 2:
        print("Need at least 2 input files to merge.")
        sys.exit(1)

    if args.mode == "pages":
        merge_as_pages(args.inputs, args.output)
    else:
        merge_as_canvas(args.inputs, args.output)


if __name__ == "__main__":
    main()
