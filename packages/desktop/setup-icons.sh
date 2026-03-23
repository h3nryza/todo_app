#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/src-tauri"

# Create a 1024x1024 placeholder icon (indigo square) using Python3
# No external dependencies required — uses pure stdlib PNG generation
python3 -c "
import struct, zlib

def create_png(w, h, r, g, b):
    def chunk(ctype, data):
        c = ctype + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)
    raw = b''
    for _ in range(h):
        raw += b'\x00' + bytes([r, g, b, 255]) * w
    return (b'\x89PNG\r\n\x1a\n'
            + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0))
            + chunk(b'IDAT', zlib.compress(raw))
            + chunk(b'IEND', b''))

open('/tmp/ohright-icon.png', 'wb').write(create_png(1024, 1024, 99, 102, 241))
print('Created /tmp/ohright-icon.png (1024x1024 indigo placeholder)')
"

echo ""
echo "Now generate all required icon sizes by running:"
echo "  npx tauri icon /tmp/ohright-icon.png"
echo ""
echo "This will populate src-tauri/icons/ with all required sizes."
