"""Downscale + convert case-study screenshots to webp, drop the png originals."""
import os

from PIL import Image

IMG = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets", "img")

for name in ("work-cleaner-scan", "work-cleaner-live"):
    path = os.path.join(IMG, f"{name}.png")
    if not os.path.exists(path):
        print(f"skip {name}")
        continue
    img = Image.open(path).convert("RGB")
    img.thumbnail((1200, 1200), Image.LANCZOS)
    webp = path.replace(".png", ".webp")
    img.save(webp, "WEBP", quality=88, method=6)
    os.remove(path)
    print(f"{name}: {img.width}x{img.height}  webp {os.path.getsize(webp)/1024:.1f} KB")