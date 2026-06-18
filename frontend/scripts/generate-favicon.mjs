// Build-time generator for the favicon set. The brand mark is the F bullet, the
// persona's own line, true BDFM orange on a flat Tunnel field, the same object
// the OG card and the in app trophy lead with. Replaces the default emoji icon.
//
// Output: public/favicon.svg (crisp scalable), favicon-32.png, favicon-16.png,
// apple-touch-icon.png (180, on the black field so the home screen tile matches
// the dark brand). The .ico is composed by PIL in generate-icons.py afterward.
// Run: node scripts/generate-favicon.mjs
import { ImageResponse } from "@vercel/og";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const pub = join(here, "..", "public");

const BDFM = "#FF6319";
const TUNNEL = "#000000";

// Bundled Noto sans gives satori a clean bold glyph for the F.
const SANS = await readFile(
  join(here, "..", "node_modules", "@vercel", "og", "dist", "noto-sans-v27-latin-regular.ttf")
);

// The scalable SVG. The bullet nearly fills the tile so the F reads at 16px.
function svg(size, glyphPx) {
  const r = size / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${TUNNEL}"/>
  <circle cx="${r}" cy="${r}" r="${r * 0.92}" fill="${BDFM}"/>
  <text x="50%" y="53%" text-anchor="middle" dominant-baseline="central"
        font-family="Helvetica, Arial, sans-serif" font-weight="800" font-size="${glyphPx}"
        fill="#ffffff">F</text>
</svg>`;
}

async function pngAt(size) {
  const node = {
    type: "div",
    props: {
      style: {
        width: `${size}px`,
        height: `${size}px`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: TUNNEL,
      },
      children: {
        type: "div",
        props: {
          style: {
            width: `${Math.round(size * 0.92)}px`,
            height: `${Math.round(size * 0.92)}px`,
            borderRadius: "50%",
            backgroundColor: BDFM,
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: Math.round(size * 0.6),
            fontWeight: 800,
            fontFamily: "Sans",
          },
          children: "F",
        },
      },
    },
  };
  const resp = new ImageResponse(node, {
    width: size,
    height: size,
    fonts: [{ name: "Sans", data: SANS, weight: 700, style: "normal" }],
  });
  return Buffer.from(await resp.arrayBuffer());
}

await writeFile(join(pub, "favicon.svg"), svg(64, 42));
console.log("wrote favicon.svg");

for (const [name, size] of [
  ["favicon-16.png", 16],
  ["favicon-32.png", 32],
  ["apple-touch-icon.png", 180],
]) {
  const buf = await pngAt(size);
  await writeFile(join(pub, name), buf);
  console.log(`wrote ${name} (${buf.length} bytes)`);
}
