"""Prepare logo assets for the Paper Light theme.

Source logo_clean.png is a 669x483 ARGB raster with an OPAQUE WHITE
background and the full lockup (artwork + "BlueFlutex" wordmark +
"Code with Harmony" tagline) baked together at 278 KB.

For a warm off-white theme (#FAF8F4) that opaque white reads as a visible
rectangle, and the whole lockup is illegible below ~120px. This script:

  1. knocks out the white background via edge-connected flood fill, so
     interior highlights inside the artwork survive (a naive luminance
     threshold would punch holes through the pale gradients)
  2. emits a compact "mark" crop (artwork only, no wordmark) for the nav
  3. emits a full transparent "lockup" for larger placements
  4. emits square favicons on an opaque paper-coloured plate, because
     apple-touch-icon and maskable icons cannot use transparency

Run:  python tools/optimize-assets.py
"""
import os
from collections import deque

from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = os.path.join(ROOT, "assets", "img")

PAPER = (250, 248, 244, 255)  # must match --paper in site.css
WHITE_CUTOFF = 243  # >= this on all channels counts as "background white"
FEATHER = 6  # feather the knockout edge so lines don't get chewed


def knockout_white(img: Image.Image) -> Image.Image:
    """Make edge-connected near-white transparent; keep interior light pixels.

    A plain luminance threshold would also erase the pale cyan gradients and
    the pale wordmark fill. Restricting the erase to pixels reachable from the
    image border via 4-connectivity preserves every interior highlight.
    """
    img = img.convert("RGBA")
    w, h = img.size
    px = img.load()

    def is_white(x, y):
        r, g, b, _ = px[x, y]
        return r >= WHITE_CUTOFF and g >= WHITE_CUTOFF and b >= WHITE_CUTOFF

    # BFS over the border-connected white region
    seen = bytearray(w * h)
    queue = deque()
    for x in range(w):
        for y in (0, h - 1):
            if is_white(x, y) and not seen[y * w + x]:
                seen[y * w + x] = 1
                queue.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if is_white(x, y) and not seen[y * w + x]:
                seen[y * w + x] = 1
                queue.append((x, y))

    while queue:
        x, y = queue.popleft()
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h and not seen[ny * w + nx] and is_white(nx, ny):
                seen[ny * w + nx] = 1
                queue.append((nx, ny))

    # feather: any opaque pixel touching a knocked-out pixel becomes partial
    out = img.copy()
    opx = out.load()
    for y in range(h):
        for x in range(w):
            i = y * w + x
            if seen[i]:
                opx[x, y] = (*px[x, y][:3], 0)
            elif not seen[i] and px[x, y][3] > 0:
                touching = 0
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if 0 <= nx < w and 0 <= ny < h and seen[ny * w + nx]:
                        touching += 1
                if touching:
                    opx[x, y] = (*px[x, y][:3], max(0, 255 - touching * FEATHER * 40))
    return out


def trim(img: Image.Image) -> Image.Image:
    bbox = img.getchannel("A").getbbox()
    return img.crop(bbox) if bbox else img


def write(img: Image.Image, stem: str, width: int | None = None) -> None:
    out = img
    if width and img.width != width:
        ratio = width / img.width
        out = img.resize((width, max(1, round(img.height * ratio))), Image.LANCZOS)

    webp = os.path.join(IMG, f"{stem}.webp")
    out.save(webp, "WEBP", quality=90, method=6)
    png = os.path.join(IMG, f"{stem}.png")
    out.save(png, "PNG", optimize=True)
    print(
        f"  {stem:<20} {out.width}x{out.height:<5} "
        f"webp {os.path.getsize(webp)/1024:6.1f} KB  png {os.path.getsize(png)/1024:6.1f} KB"
    )


def square_plate(mark: Image.Image, px: int) -> Image.Image:
    """Centre the mark on an opaque paper square (favicons can't be alpha)."""
    canvas = Image.new("RGBA", (px, px), PAPER)
    inner = int(px * 0.78)
    m = mark.copy()
    m.thumbnail((inner, inner), Image.LANCZOS)
    canvas.paste(m, ((px - m.width) // 2, (px - m.height) // 2), m)
    return canvas


def write_png(img: Image.Image, stem: str, width: int | None = None) -> None:
    """PNG only -- for favicons, where webp is not reliably honoured."""
    out = img
    if width and img.width != width:
        ratio = width / img.width
        out = img.resize((width, max(1, round(img.height * ratio))), Image.LANCZOS)
    dest = os.path.join(IMG, f"{stem}.png")
    out.save(dest, "PNG", optimize=True)
    print(f"  {stem:<20} {out.width}x{out.height:<5} png {os.path.getsize(dest)/1024:6.1f} KB")


def main() -> None:
    os.makedirs(IMG, exist_ok=True)
    src = os.path.join(ROOT, "logo_clean.png")
    if not os.path.exists(src):
        raise SystemExit(f"missing source: {src}")

    full = Image.open(src)
    print(f"source {full.width}x{full.height}")
    cut = knockout_white(full)
    lockup = trim(cut)
    print(f"knockout -> {lockup.width}x{lockup.height}")
    write(lockup, "lockup", 760)

    # Artwork only: the wordmark + tagline occupy the lower ~40% of the plate.
    # Crop on the ORIGINAL coordinates so this stays stable if the source
    # changes, then trim the remainder.
    h = full.height
    art = trim(cut.crop((0, 0, full.width, int(h * 0.63))))
    print(f"mark crop -> {art.width}x{art.height}")
    write(art, "mark", 320)   # 320px mark is the input to make-og-card.py
    write(art, "mark-sm", 96)

    # Compact square crop of the feather eye -- the one motif that still
    # resolves at favicon scale, where the full 2:1 artwork turns to mush.
    eye = trim(cut.crop((int(full.width * 0.70), 0, full.width, int(h * 0.40))))
    write_png(square_plate(eye, 180), "apple-touch-icon")
    write_png(square_plate(eye, 32), "favicon-32")
    write_png(square_plate(eye, 512), "icon-512")

    # outputs superseded by the crops above (name+ext, not stem)
    for stale in ("logo.webp", "logo.png", "mark.png", "icon-512.webp", "favicon-32.webp", "apple-touch-icon.webp"):
        q = os.path.join(IMG, stale)
        if os.path.exists(q):
            os.remove(q)


if __name__ == "__main__":
    main()