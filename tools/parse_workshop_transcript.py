#!/usr/bin/env python3
"""Parse TXT, WebVTT and SRT workshop transcripts into stable JSON segments."""

import argparse
import json
import re
from pathlib import Path


TIMING = re.compile(r"(?P<start>\d{2}:\d{2}:\d{2}[.,]\d{3})\s+-->\s+(?P<end>\d{2}:\d{2}:\d{2}[.,]\d{3})")


def parse_caption(text):
    blocks = re.split(r"\n\s*\n", text.strip())
    segments = []
    for block in blocks:
        lines = [line.strip() for line in block.splitlines() if line.strip()]
        if lines and lines[0].upper() == "WEBVTT":
            lines = lines[1:]
        timing_index = next((index for index, line in enumerate(lines) if TIMING.fullmatch(line)), None)
        if timing_index is None:
            continue
        match = TIMING.fullmatch(lines[timing_index])
        statement = " ".join(lines[timing_index + 1:])
        if statement:
            segments.append({"start": match["start"].replace(",", "."), "end": match["end"].replace(",", "."), "text": statement})
    return segments


def parse_txt(text):
    return [{"start": None, "end": None, "text": line.strip()} for line in text.splitlines() if line.strip()]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    suffix = args.input.suffix.lower()
    if suffix not in {".txt", ".vtt", ".srt"}:
        parser.error("input must be a .txt, .vtt or .srt file")
    text = args.input.read_text(encoding="utf-8-sig")
    raw_segments = parse_txt(text) if suffix == ".txt" else parse_caption(text)
    if not raw_segments:
        parser.error("no readable transcript segments found")
    payload = {
        "source_file": str(args.input),
        "format": suffix[1:],
        "segments": [
            {"segment_id": f"SEG-{index:04d}", **segment}
            for index, segment in enumerate(raw_segments, start=1)
        ],
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(payload, indent=2, ensure_ascii=True) + "\n", encoding="utf-8")
    print(f"Wrote {len(raw_segments)} segments to {args.output}")


if __name__ == "__main__":
    main()