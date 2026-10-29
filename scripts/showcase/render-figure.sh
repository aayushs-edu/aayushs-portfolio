#!/usr/bin/env bash
# Renders a showcase figure (SVG) to a 2x WebP with headless Chrome, so the
# system fonts are the ones it was laid out with.
#   scripts/showcase/render-figure.sh public/showcase/paintwise/pipeline.svg
set -euo pipefail

svg="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"
out="${svg%.svg}.webp"
chrome="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
size="$(sed -nE 's/^<svg[^>]* width="([0-9]+)" height="([0-9]+)".*/\1,\2/p' "$svg" | head -1)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

"$chrome" --headless=new --disable-gpu --hide-scrollbars --user-data-dir="$tmp/profile" \
  --force-device-scale-factor=2 --window-size="$size" --screenshot="$tmp/figure.png" "file://$svg" >/dev/null 2>&1
python3 -I -c 'import sys; from PIL import Image; Image.open(sys.argv[1]).convert("RGB").save(sys.argv[2], "WEBP", quality=90, method=6)' "$tmp/figure.png" "$out"
echo "wrote ${out#"$PWD/"}"
