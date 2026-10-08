"""Generate the 1200x630 Open Graph card.

Social platforms render no CSS and often no custom fonts, so this is composed
raster-by-raster rather than screenshotted. Text uses the self-hosted
Instrument Serif / Inter woff2 via PIL's FreeType bindings, with a system
fallback if FreeType is unavailable.
"""
import os

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = os.path.join(ROOT, "assets", "img")
FONTS = os.path.join(ROOT, "assets", "fonts")

W, H = 1200, 630
PAPER = (250, 248, 244)
INK = (20, 17, 15)
MUTED = (107, 101, 96)
TEAL = (15, 92, 86)
RULE = (222, 216, 207)

SANS = os.path.join(FONTS, "Inter-normal-100-900-latin.woff2")
SERIF = os.path.join(FONTS, "InstrumentSerif-normal-400-latin.woff2")
SANS_ITALIC = os.path.join(FONTS, "InstrumentSerif-italic-400-latin.woff2")


def load(path, size):
    """PIL reads woff2 through FreeType 2.10+; fall back to DejaVu if it cannot."""
    try:
        return ImageFont.truetype(path, size)
    except OSError:
        for alt in (
            "C:/Windows/Fonts/georgia.ttf",
            "C:/Windows/Fonts/segoeui.ttf",
        ):
            if os.path.exists(alt):
                return ImageFont.truetype(alt, size)
        return ImageFont.load_default()


def main() -> None:
    img = Image.new("RGB", (W, H), PAPER)
    d = ImageDraw.Draw(img)

    serif_big = load(SERIF, 132)
    serif_it = load(SANS_ITALIC, 132)
    sans_sm = load(SANS, 25)
    sans_md = load(SANS, 34)

    # hairline frame, inset like a print plate
    d.rectangle([40, 40, W - 41, H - 41], outline=RULE, width=2)

    # mark sits to the left of the wordmark, on one optical baseline
    mark_path = os.path.join(IMG, "mark.webp")
    mark_w = 176
    if os.path.exists(mark_path):
        mark = Image.open(mark_path).convert("RGBA")
        mark.thumbnail((mark_w, mark_w), Image.LANCZOS)
        # paste at the vertical centre of the wordmark's cap height
        img.paste(mark, (96, 150 - mark.height // 2), mark)

    # wordmark
    wx = 96 + mark_w + 26
    d.text((wx, 150), "BlueFlute", font=sans_md, fill=INK)
    wm = d.textlength("BlueFlute", font=sans_md)
    d.text((wx + wm + 6, 150), "X", font=sans_md, fill=TEAL)

    # headline — "harmony" in the italic serif, matching the site
    d.text((96, 300), "Code with", font=serif_big, fill=INK)
    w1 = d.textlength("Code with", font=serif_big)
    d.text((96 + w1 + 18, 300), "harmony.", font=serif_it, fill=TEAL)

    # footer line
    d.line([96, 512, W - 96, 512], fill=RULE, width=2)
    d.text((96, 538), "Software studio · Pune, India", font=sans_sm, fill=MUTED)

    out = os.path.join(IMG, "og-card.png")
    img.save(out, "PNG", optimize=True)
    print(f"og-card.png  {img.width}x{img.height}  {os.path.getsize(out)/1024:.1f} KB")


if __name__ == "__main__":
    main()