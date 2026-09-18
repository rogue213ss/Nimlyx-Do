// Copies pdfjs-dist's worker bundle, standard font data, and CMap data
// into public/pdfjs/ so they're all served as same-origin static assets
// (see the comment in src/lib/pdf-to-jpg/render.ts for why the worker
// bundle must NOT be bundled by webpack, and for why standard fonts and
// CMaps are required at all). Runs on every `npm install` so this stays
// in sync automatically after a pdfjs-dist version bump — no manual copy
// step to remember.
const fs = require("fs");
const path = require("path");

const pkgRoot = path.join(__dirname, "..", "node_modules", "pdfjs-dist");
const destRoot = path.join(__dirname, "..", "public", "pdfjs");

if (!fs.existsSync(pkgRoot)) {
  // pdfjs-dist isn't installed (e.g. a partial/dev install) — nothing to do.
  process.exit(0);
}

function copyFile(relSrc, relDest) {
  const src = path.join(pkgRoot, relSrc);
  const dest = path.join(destRoot, relDest);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function copyDir(relSrc, relDest) {
  const src = path.join(pkgRoot, relSrc);
  const dest = path.join(destRoot, relDest);
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (entry.isFile()) fs.copyFileSync(path.join(src, entry.name), path.join(dest, entry.name));
  }
}

copyFile("build/pdf.worker.min.mjs", "pdf.worker.min.mjs");

// Required so pages using the standard 14 PDF fonts (Helvetica, Times,
// etc. with no embedded font program) render with the correct glyph
// widths/shapes instead of pdfjs falling back to notdef/placeholder
// glyphs for anything outside a minimal built-in set.
copyDir("standard_fonts", "standard_fonts");

// Required for PDFs using certain embedded-font character encodings
// (common in PDFs produced by non-Latin-script documents, some CJK
// fonts, and various "symbolic" embedded fonts) — without these, pdfjs
// can't map character codes to glyphs at all and renders a placeholder
// character instead of the real glyph.
copyDir("cmaps", "cmaps");

console.log("Copied pdf.worker.min.mjs, standard_fonts/, and cmaps/ to public/pdfjs/");
