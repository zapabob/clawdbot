# Clawdbot .ico 生成スクリプト
# openclaw-logo-text.png → clawdbot.ico (256x256 + 64x64 + 32x32 + 16x16 multi-size)
# Py -3 で実行

import struct
import zlib
import os
from pathlib import Path

try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False
    print("Pillow not installed. Installing...")
    import subprocess, sys
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pillow", "-q"])
    from PIL import Image
    PIL_AVAILABLE = True

# Paths
REPO = Path(r"C:\Users\downl\Desktop\clawdbot-main3\clawdbot-main")
SRC_PNG = REPO / "docs" / "assets" / "openclaw-logo-text.png"
OUT_ICO = REPO / "assets" / "clawdbot.ico"
OUT_ICO2 = Path(r"C:\Users\downl\clawd\clawdbot.ico")

OUT_ICO.parent.mkdir(parents=True, exist_ok=True)

img = Image.open(SRC_PNG).convert("RGBA")

# Crop to square (crayfish character is on the left ~30% of image)
w, h = img.size
# Crop just the crayfish mascot part (left ~32% of width)
crop_w = int(w * 0.32)
cray = img.crop((0, 0, crop_w, h))

# Now make into ICO with multi-size
sizes = [256, 64, 32, 16]
icons = []
for s in sizes:
    resized = cray.resize((s, s), Image.LANCZOS)
    icons.append(resized)

# Save as ICO
icons[0].save(
    str(OUT_ICO),
    format="ICO",
    sizes=[(s, s) for s in sizes],
    append_images=icons[1:]
)
print(f"✓ ICO saved: {OUT_ICO}")

# Copy to clawd dir
import shutil
shutil.copy2(str(OUT_ICO), str(OUT_ICO2))
print(f"✓ ICO copied: {OUT_ICO2}")
