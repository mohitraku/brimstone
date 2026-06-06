// Generate flame-themed PNG icons for PWA manifest.
// Uses only Node.js built-ins — no dependencies needed.
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

function createPNG(width, height, pixelFn) {
  // Build raw RGBA pixel data (each row: filter byte + RGBA pixels)
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixelFn(x, y, width, height);
      const offset = y * (width * 4 + 1) + 1 + x * 4;
      raw[offset] = r;
      raw[offset + 1] = g;
      raw[offset + 2] = b;
      raw[offset + 3] = a;
    }
  }

  const compressed = deflateSync(raw);

  // PNG signature
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // Simple CRC32
  function crc32(buf) {
    let c = 0xffffffff;
    for (const b of buf) {
      c ^= b;
      for (let i = 0; i < 8; i++) {
        c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
      }
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function chunk(type, data) {
    const lenB = Buffer.alloc(4);
    lenB.writeUInt32BE(data.length, 0);
    const typeB = Buffer.from(type, "ascii");
    const crcInput = Buffer.concat([typeB, data]);
    const crcB = Buffer.alloc(4);
    crcB.writeUInt32BE(crc32(crcInput), 0);
    return Buffer.concat([lenB, typeB, data, crcB]);
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// Flame pixel function — angular diamond layers matching PS1 retro aesthetic
function flamePixel(x, y, w, h) {
  const cx = w / 2;
  const cy = h * 0.52; // flame center, slightly above mid
  const scale = w * 0.38;

  // Background: near-black void (#0a0a0a)
  let r = 10, g = 10, b = 10, a = 255;

  const dx = (x - cx) / scale;
  const dy = (y - cy) / scale;
  const dist = Math.abs(dx) + Math.abs(dy); // diamond distance

  // Outer flame diamond (deep orange #8b3a0f)
  if (dist < 1.2) {
    const t = Math.max(0, Math.min(1, dist / 1.2));
    r = Math.round(10 + 129 * (1 - t));
    g = Math.round(10 + 48 * (1 - t));
    b = Math.round(10 + 5 * (1 - t));
  }

  // Mid flame diamond (rich orange #b8550f)
  if (dist < 0.82) {
    const t = Math.max(0, Math.min(1, dist / 0.82));
    r = Math.round(10 + 174 * (1 - t));
    g = Math.round(10 + 75 * (1 - t));
    b = Math.round(10 + 5 * (1 - t));
  }

  // Inner flame diamond (warm amber)
  if (dist < 0.50) {
    const t = Math.max(0, Math.min(1, dist / 0.50));
    r = Math.round(10 + 186 * (1 - t));
    g = Math.round(10 + 112 * (1 - t));
    b = Math.round(10 + 16 * (1 - t));
  }

  // Core (bright gold #c47a1a)
  if (dist < 0.25) {
    const t = Math.max(0, Math.min(1, dist / 0.25));
    r = Math.round(10 + 202 * (1 - t));
    g = Math.round(10 + 154 * (1 - t));
    b = Math.round(10 + 64 * (1 - t));
  }

  // Ember spark at very center
  if (dist < 0.08) {
    r = 220; g = 180; b = 90;
  }

  // Rock base — angular rectangles at bottom
  const rockTop = cy + scale * 0.75;
  if (y > rockTop && y < rockTop + scale * 0.4) {
    const rx = Math.abs(x - cx) / (scale * 0.55);
    if (rx < 1.0) {
      const rockDist = (y - rockTop) / (scale * 0.4);
      // Layered rock: darker at back, lighter at front
      if (rx < 1.0 && rockDist < 0.33) {
        r = 25; g = 20; b = 15; // back layer
      } else if (rx < 0.75) {
        r = 38; g = 30; b = 22; // mid layer
      }
      if (rx < 0.45 && rockDist > 0.15) {
        r = 55; g = 45; b = 32; // front layer
      }
    }
  }

  return [r, g, b, a];
}

// Ensure public dir exists
const publicDir = join(process.cwd(), "public");
mkdirSync(publicDir, { recursive: true });

// Generate icons
for (const size of [192, 512]) {
  console.log(`Generating icon-${size}.png...`);
  const png = createPNG(size, size, flamePixel);
  const path = join(publicDir, `icon-${size}.png`);
  writeFileSync(path, png);
  console.log(`  icon-${size}.png: ${png.length} bytes`);
}

console.log("Done.");
