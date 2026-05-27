"""
generate_icons.py
Generates icon-192.png and icon-512.png for the Flappy Bird PWA manifest.

The bird is drawn to match the canvas draw() function in bird.js as closely
as Pillow allows — same palette, same proportions, same composition.

Usage:
    python3 generate_icons.py

Output:
    flappy/static/assets/images/icon-192.png
    flappy/static/assets/images/icon-512.png
"""

import os
import math
from PIL import Image, ImageDraw

# ── Output config ─────────────────────────────────────────────────────────────
SIZES   = [192, 512]
OUT_DIR = "flappy/static/assets/images"

# ── Colours (matching bird.js exactly) ───────────────────────────────────────
SKY_TOP    = (77,  200, 232)   # #4dc8e8 — top of background gradient
SKY_BOT    = (184, 232, 248)   # #b8e8f8
BODY       = (245, 197,  24)   # #f5c518
WING       = (230, 168,   0)   # #e6a800
EYE_WHITE  = (255, 255, 255)
PUPIL      = ( 26,  26,  46)   # #1a1a2e
BEAK       = (255, 140,   0)   # #ff8c00


def lerp_color(c1, c2, t):
    return tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3))


def draw_icon(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # ── Background: sky gradient (approximate with bands) ────────────────────
    for row in range(size):
        t = row / size
        col = lerp_color(SKY_TOP, SKY_BOT, t)
        draw.line([(0, row), (size, row)], fill=col + (255,))

    # ── Scaling helper — everything is expressed as fractions of icon size ───
    # The bird in bird.js lives in a 34×24 logical-unit box inside 288×512.
    # Here we scale it to fill ~60% of the icon canvas with some padding.
    pad   = size * 0.18            # breathing room — extra right-side margin for beak
    bw    = size - pad * 2         # bird bounding-box width
    bh    = bw * (24 / 34)         # maintain 34:24 aspect ratio
    cx    = size / 2               # icon centre x
    cy    = size / 2               # icon centre y

    # Slight nose-up tilt to match the "just flapped" feel
    tilt_deg  = -15
    tilt_rad  = math.radians(tilt_deg)

    # ── Helper: rotate a point around (cx, cy) ───────────────────────────────
    def rot(px, py):
        dx, dy = px - cx, py - cy
        rx = dx * math.cos(tilt_rad) - dy * math.sin(tilt_rad)
        ry = dx * math.sin(tilt_rad) + dy * math.cos(tilt_rad)
        return cx + rx, cy + ry

    # ── Body (rounded rect → polygon approximation) ──────────────────────────
    # Pillow's rounded_rectangle doesn't support rotation, so we rasterise
    # onto a temp surface then composite it rotated.
    body_img  = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    body_draw = ImageDraw.Draw(body_img)
    r = size * 0.08  # corner radius
    body_draw.rounded_rectangle(
        [cx - bw/2, cy - bh/2, cx + bw/2, cy + bh/2],
        radius=r,
        fill=BODY + (255,)
    )
    body_rot = body_img.rotate(-tilt_deg, resample=Image.BICUBIC, center=(cx, cy))
    img.alpha_composite(body_rot)

    # ── Wing (ellipse, slightly below centre) ────────────────────────────────
    wing_img  = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    wing_draw = ImageDraw.Draw(wing_img)
    wx, wy  = cx, cy + bh * 0.15          # wing centre — slightly below bird centre
    wrx     = bw * 0.35                    # x-radius
    wry     = bh * 0.25                    # y-radius
    wing_draw.ellipse([wx - wrx, wy - wry, wx + wrx, wy + wry], fill=WING + (255,))
    wing_rot = wing_img.rotate(-tilt_deg, resample=Image.BICUBIC, center=(cx, cy))
    img.alpha_composite(wing_rot)

    # ── Eye (white sclera + dark pupil) ─────────────────────────────────────
    # In bird.js: arc(w*0.18, -h*0.1, ls(5)) relative to bird centre.
    # We convert those fractions to absolute icon coords, then rotate.
    def bird_to_icon(rel_x_frac, rel_y_frac):
        """Convert bird.js relative coords (fractions of bw/bh) to icon px."""
        px = cx + rel_x_frac * bw
        py = cy + rel_y_frac * bh
        return rot(px, py)

    eye_cx, eye_cy = bird_to_icon(0.18, -0.10)
    eye_r = size * 0.055

    draw.ellipse(
        [eye_cx - eye_r, eye_cy - eye_r, eye_cx + eye_r, eye_cy + eye_r],
        fill=EYE_WHITE + (255,)
    )

    pup_cx, pup_cy = bird_to_icon(0.22, -0.08)
    pup_r = eye_r * 0.50
    draw.ellipse(
        [pup_cx - pup_r, pup_cy - pup_r, pup_cx + pup_r, pup_cy + pup_r],
        fill=PUPIL + (255,)
    )

    # ── Beak (triangle) ──────────────────────────────────────────────────────
    # bird.js beak: moveTo(w*0.45, -h*0.05), lineTo(w*0.72, -h*0.12), lineTo(w*0.72, h*0.08)
    b1 = bird_to_icon( 0.45, -0.05)
    b2 = bird_to_icon( 0.72, -0.12)
    b3 = bird_to_icon( 0.72,  0.08)
    draw.polygon([b1, b2, b3], fill=BEAK + (255,))

    return img


def main():
    os.makedirs(OUT_DIR, exist_ok=True)

    for size in SIZES:
        img  = draw_icon(size)
        path = os.path.join(OUT_DIR, f"icon-{size}.png")
        img.save(path, "PNG", optimize=True)
        print(f"  ✓  {path}  ({size}×{size})")

    print("\nDone. Commit with:")
    print("  git add flappy/static/assets/images/")
    print('  git commit -m "feat: add PWA app icons (procedurally generated)"')


if __name__ == "__main__":
    main()
