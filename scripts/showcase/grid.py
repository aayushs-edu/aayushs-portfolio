"""Cutting the image panels out of matplotlib result grids.

Paintwise's pipeline results (public/images/paintwise-gallery-*.png) are
matplotlib figures: rows of image panels with thin titles. A panel is a run
of mostly non-white rows and columns; title text is too thin to count.
"""

import numpy as np
from PIL import Image


def _spans(profile, thresh, minlen):
    out, start = [], None
    for i, v in enumerate(list(profile) + [0]):
        if v > thresh and start is None:
            start = i
        if v <= thresh and start is not None:
            if i - start >= minlen:
                out.append((start, i))
            start = None
    return out


def panels(path):
    """Every image panel in a grid, in reading order."""
    im = Image.open(path).convert("RGB")
    a = np.asarray(im).astype(int)
    ink = np.abs(a - 255).sum(axis=2) > 30
    found = []
    for r0, r1 in _spans(ink.mean(axis=1), 0.25, 40):
        for c0, c1 in _spans(ink[r0:r1].mean(axis=0), 0.5, 40):
            found.append(im.crop((c0 + 1, r0 + 1, c1 - 1, r1 - 1)))
    return found
