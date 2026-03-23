#!/usr/bin/env python3
"""
Generate app icons for "Oh Right!" at all required sizes.
Uses Pillow to create a gradient background with a brain/lightbulb symbol.
"""
import os
import struct
import zlib
from PIL import Image, ImageDraw, ImageFont
import math

ICON_DIR = os.path.join(os.path.dirname(__file__), '..', 'packages', 'desktop', 'src-tauri', 'icons')

def create_icon(size: int) -> Image.Image:
    """Create the app icon at the given size."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Rounded rectangle background with gradient
    margin = int(size * 0.08)
    radius = int(size * 0.21)

    # Draw gradient background
    for y in range(size):
        t = y / size
        r = int(99 + (139 - 99) * t)    # #6366f1 -> #8b5cf6
        g = int(102 + (92 - 102) * t)
        b = int(241 + (246 - 241) * t)
        draw.line([(margin, y), (size - margin, y)], fill=(r, g, b, 255))

    # Mask to rounded rect
    mask = Image.new('L', (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle([margin, margin, size - margin, size - margin], radius=radius, fill=255)
    img.putalpha(mask)

    # Redraw on clean canvas with mask
    final = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    # Gradient fill
    for y in range(margin, size - margin):
        t = (y - margin) / (size - 2 * margin)
        r = int(99 + (139 - 99) * t)
        g = int(102 + (92 - 102) * t)
        b = int(241 + (246 - 241) * t)
        for x in range(margin, size - margin):
            if mask.getpixel((x, y)) > 0:
                final.putpixel((x, y), (r, g, b, 255))

    draw = ImageDraw.Draw(final)

    # Draw a "?" question mark (what would I forget?) — clean and simple
    cx, cy = size // 2, int(size * 0.42)
    s = size / 512  # scale factor

    # Question mark - large
    try:
        font_size = int(220 * s)
        font = ImageFont.truetype("/System/Library/Fonts/SFNSRounded.ttf", font_size)
    except (OSError, IOError):
        try:
            font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", int(220 * s))
        except (OSError, IOError):
            font = ImageFont.load_default()

    draw.text((cx, cy), "?", fill=(255, 255, 255, 230), font=font, anchor="mm")

    # Small lightbulb glow circle at top
    glow_y = int(size * 0.16)
    glow_r = int(22 * s)
    draw.ellipse([cx - glow_r*2, glow_y - glow_r*2, cx + glow_r*2, glow_y + glow_r*2],
                 fill=(251, 191, 36, 50))
    draw.ellipse([cx - glow_r, glow_y - glow_r, cx + glow_r, glow_y + glow_r],
                 fill=(251, 191, 36, 200))

    # Checkmark at bottom
    check_y = int(size * 0.78)
    check_s = int(20 * s)
    check_points = [
        (cx - check_s, check_y),
        (cx - check_s//3, check_y + check_s * 2//3),
        (cx + check_s, check_y - check_s * 2//3),
    ]
    draw.line(check_points, fill=(255, 255, 255, 180), width=max(2, int(6 * s)), joint="curve")

    return final


def create_icns(icon_512: Image.Image, path: str):
    """Create macOS .icns file from a 512px image."""
    # Use iconutil via temporary iconset
    import tempfile, subprocess
    with tempfile.TemporaryDirectory() as tmpdir:
        iconset = os.path.join(tmpdir, 'icon.iconset')
        os.makedirs(iconset)
        sizes = [16, 32, 64, 128, 256, 512]
        for sz in sizes:
            icon_512.resize((sz, sz), Image.LANCZOS).save(os.path.join(iconset, f'icon_{sz}x{sz}.png'))
            if sz <= 256:
                icon_512.resize((sz*2, sz*2), Image.LANCZOS).save(os.path.join(iconset, f'icon_{sz}x{sz}@2x.png'))
        subprocess.run(['iconutil', '-c', 'icns', iconset, '-o', path], check=True)


def create_ico(icon_512: Image.Image, path: str):
    """Create Windows .ico file."""
    sizes = [16, 24, 32, 48, 64, 128, 256]
    imgs = [icon_512.resize((s, s), Image.LANCZOS) for s in sizes]
    imgs[0].save(path, format='ICO', sizes=[(s, s) for s in sizes], append_images=imgs[1:])


if __name__ == '__main__':
    print("Generating icons for 'Oh Right!'...")
    icon = create_icon(1024)

    # Standard Tauri icon sizes
    sizes = {
        'icon.png': 512,
        '32x32.png': 32,
        '64x64.png': 64,
        '128x128.png': 128,
        '128x128@2x.png': 256,
    }
    for name, sz in sizes.items():
        path = os.path.join(ICON_DIR, name)
        icon.resize((sz, sz), Image.LANCZOS).save(path)
        print(f"  {name} ({sz}x{sz})")

    # Windows Store logos
    windows_sizes = {
        'Square30x30Logo.png': 30,
        'Square44x44Logo.png': 44,
        'Square71x71Logo.png': 71,
        'Square89x89Logo.png': 89,
        'Square107x107Logo.png': 107,
        'Square142x142Logo.png': 142,
        'Square150x150Logo.png': 150,
        'Square284x284Logo.png': 284,
        'Square310x310Logo.png': 310,
        'StoreLogo.png': 50,
    }
    for name, sz in windows_sizes.items():
        path = os.path.join(ICON_DIR, name)
        icon.resize((sz, sz), Image.LANCZOS).save(path)
        print(f"  {name} ({sz}x{sz})")

    # macOS .icns
    try:
        icns_path = os.path.join(ICON_DIR, 'icon.icns')
        create_icns(icon, icns_path)
        print(f"  icon.icns (macOS)")
    except Exception as e:
        print(f"  icon.icns SKIPPED: {e}")

    # Windows .ico
    try:
        ico_path = os.path.join(ICON_DIR, 'icon.ico')
        create_ico(icon, ico_path)
        print(f"  icon.ico (Windows)")
    except Exception as e:
        print(f"  icon.ico SKIPPED: {e}")

    # Android icons
    android_dir = os.path.join(ICON_DIR, 'android')
    if os.path.exists(android_dir):
        android_sizes = {
            'mdpi': 48, 'hdpi': 72, 'xhdpi': 96,
            'xxhdpi': 144, 'xxxhdpi': 192,
        }
        for density, sz in android_sizes.items():
            dpi_dir = os.path.join(android_dir, f'mipmap-{density}')
            os.makedirs(dpi_dir, exist_ok=True)
            icon.resize((sz, sz), Image.LANCZOS).save(os.path.join(dpi_dir, 'ic_launcher.png'))
            # Round version
            round_icon = icon.resize((sz, sz), Image.LANCZOS)
            mask = Image.new('L', (sz, sz), 0)
            ImageDraw.Draw(mask).ellipse([0, 0, sz, sz], fill=255)
            round_icon.putalpha(mask)
            round_icon.save(os.path.join(dpi_dir, 'ic_launcher_round.png'))
            print(f"  android/mipmap-{density} ({sz}x{sz})")

    # iOS icons
    ios_dir = os.path.join(ICON_DIR, 'ios')
    if os.path.exists(ios_dir):
        ios_sizes = [20, 29, 40, 60, 76, 83.5, 1024]
        for sz in ios_sizes:
            px = int(sz)
            for scale in [1, 2, 3]:
                actual = int(sz * scale)
                name = f'AppIcon-{px}x{px}@{scale}x.png'
                icon.resize((actual, actual), Image.LANCZOS).save(os.path.join(ios_dir, name))
        print(f"  iOS icons generated")

    print("\nDone! All icons generated.")
