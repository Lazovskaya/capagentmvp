#!/usr/bin/env python3
"""
Mechanical helper for filling the EPAM SAP SAD .docx template.

The template (EPAM_SAP_SAD_Template.docx) already contains EPAM's best-practice
boilerplate text in every section. Project-specific gaps are marked with
square-bracket placeholders, e.g. "[Client Name — Programme Name]",
"[Fill in VM hostnames once provisioned by SAP ECS...]". This script never
decides *what* to write — that is the model's job, informed by the SKILL.md
playbook and the user's answers. It only does the mechanical, error-prone
part: finding every placeholder with enough context to write about, and
substituting text back in without corrupting the docx styles/formatting.

Usage:
    python3 docx_fill.py extract <template.docx> <placeholders.json>
    python3 docx_fill.py fill <template.docx> <replacements.json> <output.docx>

extract:
    Writes a JSON array of placeholder records to placeholders.json:
    [{"id": "p24", "kind": "paragraph", "heading": "1.2  Objective of this Document",
      "text": "[Briefly describe ...]"}, ...]
    [{"id": "t1r1c0", "kind": "table_cell", "heading": "Reviewers",
      "table_index": 1, "row_index": 1, "col_index": 0,
      "row_context": ["[Name]", "Solution Architect", "EPAM", "", ""],
      "text": "[Name]"}, ...]

fill:
    Reads replacements.json: {"p24": "new text...", "t1r1c0": "Jane Doe", ...}
    Any id from extract's output may be omitted (left as-is) or included.
    Writes output.docx with those placeholders replaced, preserving the
    surrounding run formatting (font, bold, color) of the first run in the
    paragraph/cell.
"""
import sys
import json
import re
import docx

PLACEHOLDER_RE = re.compile(r"\[[^\[\]]{1,300}\]")


def _nearest_heading(doc, para_index):
    for i in range(para_index, -1, -1):
        p = doc.paragraphs[i]
        if p.style.name.startswith("Heading"):
            return p.text
    return None


def _table_heading(doc, table):
    """Best-effort: find the heading of the paragraph immediately preceding this table in document order."""
    body = doc.element.body
    table_elm = table._tbl
    prev = table_elm.getprevious()
    seen_text = []
    while prev is not None:
        if prev.tag.endswith("}p"):
            from docx.text.paragraph import Paragraph
            p = Paragraph(prev, doc)
            if p.style.name.startswith("Heading"):
                return p.text
            if p.text.strip():
                seen_text.append(p.text.strip())
        prev = prev.getprevious()
    return seen_text[0] if seen_text else None


def extract(template_path, out_path):
    doc = docx.Document(template_path)
    records = []

    for i, p in enumerate(doc.paragraphs):
        if PLACEHOLDER_RE.search(p.text):
            records.append({
                "id": f"p{i}",
                "kind": "paragraph",
                "heading": _nearest_heading(doc, i),
                "text": p.text,
            })

    for ti, t in enumerate(doc.tables):
        heading = _table_heading(doc, t)
        header_row = [c.text for c in t.rows[0].cells] if t.rows else []
        for ri, row in enumerate(t.rows):
            row_texts = [c.text for c in row.cells]
            for ci, cell in enumerate(row.cells):
                if PLACEHOLDER_RE.search(cell.text):
                    records.append({
                        "id": f"t{ti}r{ri}c{ci}",
                        "kind": "table_cell",
                        "heading": heading,
                        "table_index": ti,
                        "row_index": ri,
                        "col_index": ci,
                        "header_row": header_row,
                        "row_context": row_texts,
                        "text": cell.text,
                    })

    with open(out_path, "w") as f:
        json.dump(records, f, indent=2, ensure_ascii=False)
    print(f"Wrote {len(records)} placeholder records to {out_path}")


def _set_text_preserve_formatting(paragraph_or_cell_paragraph, new_text):
    """Replace all run text in a paragraph with new_text, keeping the first run's
    formatting (font/bold/color/size) and removing extra runs."""
    p = paragraph_or_cell_paragraph
    if not p.runs:
        p.add_run(new_text)
        return
    p.runs[0].text = new_text
    for r in p.runs[1:]:
        r.text = ""


def fill(template_path, replacements_path, output_path):
    doc = docx.Document(template_path)
    with open(replacements_path) as f:
        replacements = json.load(f)

    applied = 0
    for i, p in enumerate(doc.paragraphs):
        key = f"p{i}"
        if key in replacements:
            _set_text_preserve_formatting(p, replacements[key])
            applied += 1

    for ti, t in enumerate(doc.tables):
        for ri, row in enumerate(t.rows):
            for ci, cell in enumerate(row.cells):
                key = f"t{ti}r{ri}c{ci}"
                if key in replacements:
                    if cell.paragraphs:
                        _set_text_preserve_formatting(cell.paragraphs[0], replacements[key])
                        for extra_p in cell.paragraphs[1:]:
                            for r in extra_p.runs:
                                r.text = ""
                    applied += 1

    doc.save(output_path)
    print(f"Applied {applied}/{len(replacements)} replacements. Saved to {output_path}")
    unused = [k for k in replacements if not (
        (k.startswith("p") and k[1:].isdigit()) or re.match(r"^t\d+r\d+c\d+$", k)
    )]
    if unused:
        print(f"Warning: {len(unused)} keys in replacements.json had an unrecognized id format: {unused}")


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    cmd = sys.argv[1]
    if cmd == "extract" and len(sys.argv) == 4:
        extract(sys.argv[2], sys.argv[3])
    elif cmd == "fill" and len(sys.argv) == 5:
        fill(sys.argv[2], sys.argv[3], sys.argv[4])
    else:
        print(__doc__)
        sys.exit(1)


if __name__ == "__main__":
    main()
