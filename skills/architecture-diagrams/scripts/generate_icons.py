#!/usr/bin/env python3
"""
Generate small, simple flat-style pictogram icons (as base64-encoded SVG data URIs)
to embed into mxGraph diagram cells via style="shape=image;image=data:image/svg+xml;base64,...".

These are original, simple icon glyphs in the visual spirit of SAP's flat icon style
(rounded/circular badge, two-tone color, minimal detail) -- NOT reproductions of SAP's
actual proprietary icon set, since that set isn't something this skill has rights to
copy. Good enough to make a diagram read as polished and icon-driven rather than
text-only boxes, without claiming to be official SAP iconography.
"""
import base64

ICON_BLUE = "#0070F2"
ICON_DARK = "#1A2733"
ICON_WHITE = "#FFFFFF"
ICON_GREEN = "#188918"
ICON_MAGENTA = "#CC00DC"
ICON_TEAL = "#07838F"

# Real brand colors, researched (not guessed), for use on brand wordmark badges --
# see SKILL.md "Brand badges and logos" section for the trademark policy these support.
SAP_BRAND_BLUE = "#1C64BE"
SERVICENOW_BRAND_GREEN = "#293E40"
SERVICENOW_ACCENT_GREEN = "#80B6A1"

def svg_to_data_uri(svg: str) -> str:
    b64 = base64.b64encode(svg.encode("utf-8")).decode("ascii")
    return f"data:image/svg+xml;base64,{b64}"


def badge(content: str, ring_color: str = ICON_BLUE, fill: str = "#FFFFFF") -> str:
    """Wrap icon content in a circular badge, matching SAP's circular icon-badge look."""
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
<circle cx="32" cy="32" r="30" fill="{fill}" stroke="{ring_color}" stroke-width="2.5"/>
{content}
</svg>'''


ICONS = {}

# Cloud ALM core: cloud outline with an abstract looping figure inside, echoing the
# visual concept of SAP Cloud ALM's real icon (cloud + person-like loop) -- original
# geometry, not a traced/copied reproduction of the trademarked icon.
ICONS["cloud_alm"] = badge('''
<path d="M19 36c-2.8 0-5-2.2-5-5 0-2.5 1.8-4.6 4.2-5 .9-4 4.5-7 8.8-7 4.3 0 7.9 3 8.8 7 3.4.3 6.2 3.1 6.2 6.6 0 3.6-3 6.4-6.6 6.4H19z"
fill="none" stroke="#0070F2" stroke-width="2.3" stroke-linejoin="round"/>
<path d="M28 21c-1.6 0-2.9 1.2-2.9 2.7 0 1.1.7 2.1 1.7 2.5-1.6.6-2.7 2-2.9 3.7M28 21c1.6 0 2.9 1.2 2.9 2.7 0 1.1-.7 2.1-1.7 2.5 1.6.6 2.7 2 2.9 3.7"
fill="none" stroke="#0070F2" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
''', ICON_BLUE)

# Monitoring / radar (pulse line)
ICONS["monitor"] = badge('''
<circle cx="32" cy="32" r="13" fill="none" stroke="#0070F2" stroke-width="2"/>
<path d="M20 32h6l3-8 4 16 3-8h8" fill="none" stroke="#0070F2" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>
''', ICON_BLUE)

# Alert / event situation (triangle exclamation)
ICONS["alert"] = badge('''
<path d="M32 18l13 23H19z" fill="none" stroke="#CC00DC" stroke-width="2.3" stroke-linejoin="round"/>
<line x1="32" y1="28" x2="32" y2="35" stroke="#CC00DC" stroke-width="2.3" stroke-linecap="round"/>
<circle cx="32" cy="39" r="1.6" fill="#CC00DC"/>
''', ICON_MAGENTA)

# API / webhook (plug + arrows)
ICONS["api"] = badge('''
<rect x="22" y="26" width="20" height="12" rx="3" fill="none" stroke="#0070F2" stroke-width="2.2"/>
<line x1="27" y1="22" x2="27" y2="26" stroke="#0070F2" stroke-width="2.2" stroke-linecap="round"/>
<line x1="37" y1="22" x2="37" y2="26" stroke="#0070F2" stroke-width="2.2" stroke-linecap="round"/>
<line x1="27" y1="38" x2="27" y2="42" stroke="#0070F2" stroke-width="2.2" stroke-linecap="round"/>
<line x1="37" y1="38" x2="37" y2="42" stroke="#0070F2" stroke-width="2.2" stroke-linecap="round"/>
''', ICON_BLUE)

# Mapping (two boxes + transform arrow)
ICONS["mapping"] = badge('''
<rect x="18" y="24" width="12" height="9" rx="2" fill="none" stroke="#475E75" stroke-width="2"/>
<rect x="34" y="31" width="12" height="9" rx="2" fill="none" stroke="#475E75" stroke-width="2"/>
<path d="M30 28h6M36 28v3" fill="none" stroke="#475E75" stroke-width="2" stroke-linecap="round"/>
<path d="M33 25l4 3-4 3" fill="none" stroke="#475E75" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
''', "#475E75")

# Destination / connectivity (link/chain)
ICONS["destination"] = badge('''
<rect x="18" y="27" width="14" height="10" rx="5" fill="none" stroke="#CC00DC" stroke-width="2.2" transform="rotate(-25 25 32)"/>
<rect x="32" y="27" width="14" height="10" rx="5" fill="none" stroke="#CC00DC" stroke-width="2.2" transform="rotate(-25 39 32)"/>
''', ICON_MAGENTA)

# Lock / auth user
ICONS["auth"] = badge('''
<rect x="23" y="30" width="18" height="14" rx="2.5" fill="none" stroke="#CC00DC" stroke-width="2.2"/>
<path d="M26 30v-4a6 6 0 0 1 12 0v4" fill="none" stroke="#CC00DC" stroke-width="2.2"/>
<circle cx="32" cy="37" r="2" fill="#CC00DC"/>
''', ICON_MAGENTA)

# Database / store
ICONS["store"] = badge('''
<ellipse cx="32" cy="22" rx="11" ry="4" fill="none" stroke="#475E75" stroke-width="2"/>
<path d="M21 22v18c0 2.2 4.9 4 11 4s11-1.8 11-4V22" fill="none" stroke="#475E75" stroke-width="2"/>
<path d="M21 30c0 2.2 4.9 4 11 4s11-1.8 11-4" fill="none" stroke="#475E75" stroke-width="2"/>
''', "#475E75")

# Person / user
ICONS["user"] = badge('''
<circle cx="32" cy="25" r="6" fill="none" stroke="#475E75" stroke-width="2.2"/>
<path d="M20 44c0-7 5.4-11 12-11s12 4 12 11" fill="none" stroke="#475E75" stroke-width="2.2" stroke-linecap="round"/>
''', "#475E75")

# Incident / ticket
ICONS["incident"] = badge('''
<rect x="19" y="22" width="26" height="20" rx="2" fill="none" stroke="#0070F2" stroke-width="2.2"/>
<line x1="24" y1="29" x2="40" y2="29" stroke="#0070F2" stroke-width="1.8" stroke-linecap="round"/>
<line x1="24" y1="34" x2="40" y2="34" stroke="#0070F2" stroke-width="1.8" stroke-linecap="round"/>
<line x1="24" y1="38" x2="33" y2="38" stroke="#0070F2" stroke-width="1.8" stroke-linecap="round"/>
''', ICON_BLUE)

# ServiceNow-style "N" wordmark badge (generic ITSM platform glyph, not the real logo)
ICONS["itsm_platform"] = badge('''
<rect x="20" y="20" width="24" height="24" rx="6" fill="none" stroke="#188918" stroke-width="2.3"/>
<path d="M26 36V28l12 8v-8" fill="none" stroke="#188918" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>
''', ICON_GREEN)

# Rules / business logic (gear)
ICONS["rules"] = badge('''
<circle cx="32" cy="32" r="6" fill="none" stroke="#475E75" stroke-width="2.2"/>
<g stroke="#475E75" stroke-width="2.2" stroke-linecap="round">
<line x1="32" y1="20" x2="32" y2="24"/>
<line x1="32" y1="40" x2="32" y2="44"/>
<line x1="20" y1="32" x2="24" y2="32"/>
<line x1="40" y1="32" x2="44" y2="32"/>
<line x1="23" y1="23" x2="26" y2="26"/>
<line x1="38" y1="38" x2="41" y2="41"/>
<line x1="41" y1="23" x2="38" y2="26"/>
<line x1="26" y1="38" x2="23" y2="41"/>
</g>
''', "#475E75")

# Status / callback arrow loop
ICONS["callback"] = badge('''
<path d="M22 28a10 10 0 0 1 18-6" fill="none" stroke="#188918" stroke-width="2.3" stroke-linecap="round"/>
<path d="M37 18l3 5-6 1" fill="none" stroke="#188918" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M42 36a10 10 0 0 1-18 6" fill="none" stroke="#188918" stroke-width="2.3" stroke-linecap="round"/>
<path d="M27 46l-3-5 6-1" fill="none" stroke="#188918" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>
''', ICON_GREEN)

# Agent / support headset
ICONS["agent"] = badge('''
<path d="M20 32a12 12 0 0 1 24 0" fill="none" stroke="#188918" stroke-width="2.2"/>
<rect x="18" y="30" width="6" height="9" rx="2" fill="none" stroke="#188918" stroke-width="2.2"/>
<rect x="40" y="30" width="6" height="9" rx="2" fill="none" stroke="#188918" stroke-width="2.2"/>
<path d="M24 39v2a6 6 0 0 0 6 4" fill="none" stroke="#188918" stroke-width="2.2" stroke-linecap="round"/>
''', ICON_GREEN)

if __name__ == "__main__":
    import json
    import os
    data_uris = {name: svg_to_data_uri(svg) for name, svg in ICONS.items()}
    out_dir = os.path.join(os.path.dirname(__file__), "..", "assets", "icons")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "icon_data_uris.json")
    with open(out_path, "w") as f:
        json.dump(data_uris, f, indent=2)
    print(f"Generated {len(data_uris)} icon data URIs -> {out_path}")
    for name in data_uris:
        print(" -", name)
