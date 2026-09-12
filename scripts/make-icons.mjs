#!/usr/bin/env node
/**
 * Generate the PWA icons: a Growth Green tile with one hollow candle on it.
 *
 * Written as a raw PNG encoder rather than pulling in an image library - it is
 * 60 lines of zlib and CRC, and it keeps the dependency list honest. The mark is a
 * placeholder: the final bull logo is still one of three Stitch candidates awaiting
 * Guy's one-time pick (see specs/DECISIONS.md).
 */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, '../client/public/icons');

const BRAND = [0x10, 0xb9, 0x81];
const PAPER = [0xfa, 0xfa, 0xf7];
const INK = [0x0f, 0x2b, 0x46];

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData));
  return Buffer.concat([length, typeAndData, crc]);
}

function png(size, pixels) {
  const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // truecolour
  const raw = Buffer.alloc(size * (size * 3 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const [r, g, b] = pixels(x, y);
      const offset = y * (size * 3 + 1) + 1 + x * 3;
      raw[offset] = r;
      raw[offset + 1] = g;
      raw[offset + 2] = b;
    }
  }
  return Buffer.concat([
    header,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function draw(size) {
  const u = size / 32;
  const inRect = (x, y, left, top, width, height) =>
    x >= left * u && x < (left + width) * u && y >= top * u && y < (top + height) * u;

  return (x, y) => {
    // Hollow candle: ink border, paper interior, wick above and below.
    const bodyOuter = inRect(x, y, 11, 10, 10, 14);
    const bodyInner = inRect(x, y, 13, 12, 6, 10);
    const wick = inRect(x, y, 15, 5, 2, 22);
    if (bodyOuter && !bodyInner) return INK;
    if (bodyInner) return PAPER;
    if (wick) return INK;
    return BRAND;
  };
}

mkdirSync(outDir, { recursive: true });
for (const size of [192, 512]) {
  const file = resolve(outDir, `icon-${size}.png`);
  writeFileSync(file, png(size, draw(size)));
  console.log(`wrote ${file}`);
}
