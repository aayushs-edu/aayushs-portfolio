"""Paintwise's pipeline as a research-paper figure (SVG, self-contained).

Cuts the grapefruit still life's stages out of the pipeline grids in
public/images (paintwise-gallery-1: the six stages, paintwise-gallery-4: the
24 block-in / detail steps) and lays them out as an overview figure:
(a) scene understanding, (b) artistic ordering, (c) step synthesis,
(d) critique. Writes public/showcase/paintwise/pipeline.svg; render it to
pipeline.webp with scripts/showcase/render-figure.sh.

Run from the repo root:  python3 scripts/showcase/paintwise-figure.py
"""

import base64
import io
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public/showcase/paintwise/pipeline.svg"

sys.path.insert(0, str(Path(__file__).resolve().parent))
from grid import panels  # noqa: E402


def data_uri(im):
    buf = io.BytesIO()
    im.save(buf, "PNG", optimize=True)
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()


stages = panels(ROOT / "public/images/paintwise-gallery-1.png")
# Original, SAM masks, value block-in / PiDiNet edges, depth map, pencil sketch
ORIGINAL, MASKS, BLOCKIN, EDGES, DEPTH, SKETCH = (data_uri(p) for p in stages)
steps = panels(ROOT / "public/images/paintwise-gallery-4.png")
assert len(stages) == 6 and len(steps) == 24, (len(stages), len(steps))
# steps[0] is the original photo; steps[1..] are the steps in order:
# 1, 2, 3.1 … 3.18, 4.1 … 4.3 (labels 2 and 3.1 sit under the grid's title).
SHOWN_STEPS = [
    (1, "1 · background"),
    (2, "2"),
    (3, "3.1"),
    (8, "3.6 · fruit"),
    (20, "3.18 · apple"),
    (21, "4.1 · orange"),
    (23, "4.3 · fruit"),
]
REFERENCE_STEP = 20

# ---- drawing --------------------------------------------------------------------

W, H = 2000, 950
INK = "#262626"
MUTED = "#6b6b6b"
SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif"
SERIF = "'Times New Roman', Times, serif"

# Panel tints from the hero's pigments (blue, orange, green, pink).
PANEL = {
    "a": ("#eef3ff", "#cfdcfb", "#1f4fd1"),
    "b": ("#fff4e8", "#f5d7b5", "#b85f08"),
    "c": ("#eaf8f1", "#c3e8d6", "#0b7f5a"),
    "d": ("#fdeef4", "#f4c9db", "#b81c61"),
}

parts = []


def add(s):
    parts.append(s)


def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def text(x, y, s, size=18, weight=400, fill=INK, anchor="start", family=SANS, style="normal", raw=False):
    body = s if raw else esc(s)
    add(
        f'<text x="{x}" y="{y}" font-family="{family}" font-size="{size}" font-weight="{weight}" '
        f'font-style="{style}" fill="{fill}" text-anchor="{anchor}">{body}</text>'
    )


def m(s):
    """Inline maths: italic serif."""
    return f'<tspan font-family="{SERIF}" font-style="italic">{esc(s)}</tspan>'


def panel(key, x, y, w, h, title, subtitle=None):
    fill, stroke, accent = PANEL[key]
    add(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="14" fill="{fill}" stroke="{stroke}" stroke-width="1.5"/>')
    after = f'<tspan font-weight="400" font-size="17" fill="{MUTED}" dx="12">{esc(subtitle)}</tspan>' if subtitle else ""
    text(x + 22, y + 36, esc(title) + after, size=22, weight=700, fill=accent, raw=True)


def model(key, x, cy, w, name, role, h=64):
    accent = PANEL[key][2]
    add(f'<rect x="{x}" y="{cy - h / 2}" width="{w}" height="{h}" rx="9" fill="#fff" stroke="{accent}" stroke-width="1.8"/>')
    text(x + w / 2, cy - 3, name, size=19, weight=700, anchor="middle")
    text(x + w / 2, cy + 19, role, size=15, fill=MUTED, anchor="middle")


def thumb(uri, x, y, w, h, label=None, label_raw=False, size=16):
    add(f'<image href="{uri}" x="{x}" y="{y}" width="{w}" height="{h}" preserveAspectRatio="xMidYMid slice"/>')
    add(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="none" stroke="#3d3d3d" stroke-width="1"/>')
    if label:
        text(x + w / 2, y + h + 21, label, size=size, anchor="middle", raw=label_raw)


def arrow(points, dashed=False):
    d = "M" + " L".join(f"{x},{y}" for x, y in points)
    dash = ' stroke-dasharray="6 5"' if dashed else ""
    add(f'<path d="{d}" fill="none" stroke="{INK}" stroke-width="1.8"{dash} marker-end="url(#head)"/>')


def chip(x, y, w, label, n=None, accent=None, h=32):
    add(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{h / 2}" fill="#fff" stroke="#c8ccd4" stroke-width="1.2"/>')
    if n is None:
        text(x + w / 2, y + h / 2 + 6, label, size=15, anchor="middle")
        return
    add(f'<circle cx="{x + h / 2}" cy="{y + h / 2}" r="{h / 2 - 5}" fill="{accent}"/>')
    text(x + h / 2, y + h / 2 + 5, str(n), size=14, weight=700, fill="#fff", anchor="middle")
    text(x + h - 2, y + h / 2 + 5.5, label, size=15)


add(
    f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">'
    "<defs>"
    '<marker id="head" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">'
    f'<path d="M0,0 L10,5 L0,10 z" fill="{INK}"/></marker>'
    "</defs>"
    f'<rect width="{W}" height="{H}" fill="#fff"/>'
)

# ---- input -------------------------------------------------------------------------
ROWS = (215, 445, 675)
TW, TH = 180, 119
thumb(ORIGINAL, 30, ROWS[1] - TH / 2, TW, TH, f"reference image {m('I')}", label_raw=True, size=17)
trunk = 228
add(f'<path d="M{30 + TW + 2},{ROWS[1]} L{trunk},{ROWS[1]}" stroke="{INK}" stroke-width="1.8" fill="none"/>')
for cy in ROWS:
    arrow([(trunk, ROWS[1]), (trunk, cy), (268, cy)])

# ---- (a) scene understanding ---------------------------------------------------------
panel("a", 245, 30, 805, 780, "(a) Scene understanding", "pretrained vision models")
MX, MW = 270, 180
TX = 490
model("a", MX, ROWS[0], MW, "SAM 2.1", "segmentation")
model("a", MX, ROWS[1], MW, "Depth Anything V2", "monocular depth")
model("a", MX, ROWS[2], MW, "PiDiNet", "edge detection")
for cy in ROWS:
    arrow([(MX + MW + 2, cy), (TX - 3, cy)])
thumb(MASKS, TX, ROWS[0] - TH / 2, TW, TH, f"SAM masks {m('M')} (23)", label_raw=True)
thumb(DEPTH, TX, ROWS[1] - TH / 2, TW, TH, f"depth {m('D')}", label_raw=True)
thumb(EDGES, TX, ROWS[2] - TH / 2, TW, TH, f"edges {m('E')}", label_raw=True)

# CLIP labels the masks and merges their fragments.
CX, CW = 705, 160
arrow([(TX + TW + 2, ROWS[0]), (CX - 3, ROWS[0])])
model("a", CX, ROWS[0], CW, "CLIP", "semantics")
text(CX + CW / 2, ROWS[0] + 54, "label · merge fragments", size=14, fill=MUTED, anchor="middle")
LX = 897
arrow([(CX + CW + 2, ROWS[0]), (LX - 3, ROWS[0])])
text(LX + 69, ROWS[0] - 96, f"labels {m('ℓ')}", size=16, anchor="middle", raw=True)
for i, label in enumerate(["background", "orange", "banana", "leaves", "apple", "…"]):
    chip(LX, ROWS[0] - 85 + i * 30, 138, label, h=26)

# The sketch is drawn from the edges.
arrow([(TX + TW + 2, ROWS[2]), (CX - 3, ROWS[2])])
thumb(SKETCH, CX, ROWS[2] - TH / 2, TW, TH, f"pencil sketch {m('S')}", label_raw=True)

# ---- what (a) hands on ---------------------------------------------------------------
RX = 1120
arrow([(1052, 140), (RX - 3, 140)])
add(f'<text x="1085" y="127" font-family="{SERIF}" font-style="italic" font-size="17" fill="{INK}" text-anchor="middle">M, ℓ, D</text>')
arrow([(1052, 362), (RX - 3, 362)])
add(f'<text x="1085" y="349" font-family="{SERIF}" font-style="italic" font-size="17" fill="{INK}" text-anchor="middle">M, S</text>')

# ---- (b) artistic ordering -----------------------------------------------------------
panel("b", RX, 30, 850, 222, "(b) Artistic ordering")
accent_b = PANEL["b"][2]
add(f'<rect x="1145" y="84" width="380" height="148" rx="9" fill="#fff" stroke="{accent_b}" stroke-width="1.8"/>')
text(1335, 114, "Prominence score", size=19, weight=700, anchor="middle")
add(
    f'<text x="1335" y="150" font-family="{SERIF}" font-size="20" fill="{INK}" text-anchor="middle">'
    f'<tspan font-style="italic">s</tspan><tspan font-style="italic" font-size="14" dy="5">i</tspan>'
    f'<tspan dy="-5"> = </tspan><tspan font-style="italic">f</tspan>(size, semantics, centrality, occlusion)</text>'
)
text(1335, 182, "size over proximity · containers before contents", size=14, fill=MUTED, anchor="middle")
text(1335, 202, "centre before edges · occlusion-aware", size=14, fill=MUTED, anchor="middle")
text(1335, 222, "not back to front by depth", size=14, fill=MUTED, anchor="middle", style="italic")
arrow([(1527, 158), (1551, 158)])
add(f'<text x="1555" y="101" font-family="{SANS}" font-size="16" fill="{INK}">painting order {m("π")}</text>')
order = ["background", "table", "focal objects", "supporting", "small details", "refinements"]
for i, label in enumerate(order):
    chip(1555 + (i % 3) * 132, 116 + (i // 3) * 44, 122, label, n=i + 1, accent=accent_b, h=34)

# ---- (c) step synthesis --------------------------------------------------------------
panel("c", RX, 275, 850, 337, "(c) Step synthesis")
accent_c = PANEL["c"][2]
SW, SH = 120, 80
thumb(BLOCKIN, 1145, 322, SW, SH, f"value block-in {m('B')}", label_raw=True, size=15)
thumb(SKETCH, 1285, 322, SW, SH, f"sketch {m('S')}", label_raw=True, size=15)
arrow([(1407, 362), (1453, 362)])
add(f'<rect x="1455" y="327" width="280" height="70" rx="9" fill="#fff" stroke="{accent_c}" stroke-width="1.8"/>')
text(1595, 357, "Two-phase painter", size=19, weight=700, anchor="middle")
text(1595, 381, "block-in → detail matching", size=15, fill=MUTED, anchor="middle")
# π comes down from the ordering.
arrow([(1621, 196), (1621, 324)])
add(f'<text x="1633" y="268" font-family="{SERIF}" font-style="italic" font-size="19" fill="{INK}">π</text>')
arrow([(1595, 399), (1595, 448)])
FW, FH, GAP = 105, 70, 10
for k, (idx, label) in enumerate(SHOWN_STEPS):
    x = 1145 + k * (FW + GAP)
    thumb(data_uri(steps[idx]), x, 452, FW, FH, label, size=14)


def bracket(x0, x1, y, label):
    add(f'<path d="M{x0},{y} L{x0},{y + 8} L{x1},{y + 8} L{x1},{y}" fill="none" stroke="{accent_c}" stroke-width="1.8"/>')
    text((x0 + x1) / 2, y + 30, label, size=15, weight=700, fill=accent_c, anchor="middle")


bracket(1145, 1145 + 5 * (FW + GAP) - GAP, 552, "Phase 1 · block-in")
bracket(1145 + 5 * (FW + GAP), 1145 + 7 * (FW + GAP) - GAP, 552, "Phase 2 · detail matching")

# ---- (d) critique --------------------------------------------------------------------
panel("d", RX, 637, 850, 175, "(d) Critique")
accent_d = PANEL["d"][2]
add(f'<rect x="1145" y="700" width="100" height="68" fill="#fff" stroke="#8a8a8a" stroke-width="1.2" stroke-dasharray="5 4"/>')
text(1195, 730, "learner's", size=14, fill=MUTED, anchor="middle")
text(1195, 748, "drawing", size=14, fill=MUTED, anchor="middle")
text(1262, 740, "vs", size=15, fill=MUTED, anchor="middle", style="italic")
thumb(data_uri(steps[REFERENCE_STEP]), 1280, 700, 100, 68)
text(1262, 795, "attempt and reference at step k", size=14, fill=MUTED, anchor="middle")
# Each step is a reference for the learner.
arrow([(1330, 614), (1330, 697)])
add(f'<text x="1342" y="668" font-family="{SERIF}" font-style="italic" font-size="17" fill="{INK}">step k</text>')
arrow([(1382, 734), (1418, 734)])
add(f'<rect x="1420" y="692" width="270" height="84" rx="9" fill="#fff" stroke="{accent_d}" stroke-width="1.8"/>')
text(1555, 720, "Critique", size=19, weight=700, anchor="middle")
px = 1430
for label, w in (("proportions", 86), ("perspective", 86), ("lighting", 66)):
    add(f'<rect x="{px}" y="734" width="{w}" height="28" rx="14" fill="{PANEL["d"][0]}" stroke="{PANEL["d"][1]}"/>')
    text(px + w / 2, 753, label, size=14, anchor="middle")
    px += w + 8
arrow([(1692, 734), (1722, 734)])
add(f'<path d="M1736,684 h206 a8,8 0 0 1 8,8 v92 a8,8 0 0 1 -8,8 h-206 a8,8 0 0 1 -8,-8 v-34 l-8,-8 l8,-8 v-42 a8,8 0 0 1 8,-8 z" fill="#fff" stroke="#c8ccd4" stroke-width="1.2"/>')
add(
    f'<foreignObject x="1738" y="688" width="206" height="98"><div xmlns="http://www.w3.org/1999/xhtml" '
    f'style="font-family:{SERIF};font-style:italic;font-size:15.5px;line-height:1.28;color:{INK}">'
    "“Notice how the apple appears larger than the orange: in your reference, they’re similar sizes.”"
    f'<div style="font-family:{SANS};font-style:normal;font-size:13px;color:{MUTED};margin-top:4px">+ visual overlays</div>'
    "</div></foreignObject>"
)

# ---- caption ------------------------------------------------------------------------
add(
    f'<foreignObject x="30" y="838" width="1940" height="110"><div xmlns="http://www.w3.org/1999/xhtml" '
    f'style="font-family:{SERIF};font-size:21px;line-height:1.42;color:{INK};text-align:justify">'
    "<b>Figure 1.</b> Overview of Paintwise. <b>(a)</b> Pretrained vision models parse the reference image: SAM 2.1 segments it, "
    "CLIP labels each segment and merges fragments into the forms an artist would see, Depth Anything V2 estimates depth, "
    "and PiDiNet extracts edges, from which a pencil sketch is drawn. <b>(b)</b> A prominence score orders the regions the way an "
    "artist paints them, large anchoring forms first, rather than back to front by depth. <b>(c)</b> A two-phase painter turns the "
    "ordered regions into steps: a value block-in, then detail matching. <b>(d)</b> Each attempt is critiqued against its "
    "reference step on proportions, perspective and lighting, as guided observation."
    "</div></foreignObject>"
)

add("</svg>")
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text("\n".join(parts))
print(f"wrote {OUT.relative_to(ROOT)} ({OUT.stat().st_size // 1024} KB)")
