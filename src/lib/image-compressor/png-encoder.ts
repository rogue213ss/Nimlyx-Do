// Lazy PNG compression.
//
// DECISION (see PROJECT_CONTEXT.md decision log): native OffscreenCanvas
// PNG encoding is lossless and silently ignores `quality` for PNG in every
// current browser. So "quality-based" PNG compression here means running a
// dedicated optimizer (palette/filter/DEFLATE re-optimization) over the
// rendered pixels, not a JPEG-style quality knob.
//
// CORRECTED 2026-09-13: this originally wrapped both `@jsquash/png`
// (encode) and `@jsquash/oxipng` (optimise), assuming `optimise` only
// accepted already-encoded PNG bytes. Having now actually fetched and read
// the real published package source (`@jsquash/oxipng@2.3.0`), that
// assumption was wrong on two counts:
//   1. `optimise(data: ArrayBuffer | ImageData, options) => Promise<ArrayBuffer>`
//      accepts raw `ImageData` directly (it PNG-encodes internally via
//      `optimise_raw` when given ImageData) — so `@jsquash/png` is not
//      needed at all. Removed as a dependency.
//   2. The return type is `ArrayBuffer`, not `Uint8Array`.
// This is a verified fix against the actual package source, not a re-guess
// — see the decision log.
//
// `@jsquash/oxipng` is a WASM build designed to run inside a Worker and
// supports dynamic `import()`, which is what makes lazy-loading possible:
// it is only pulled into the worker chunk, and only once a PNG is actually
// queued for compression — never into the initial page bundle.

export type PngOptimizeLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Maps our 0..1 "quality" concept onto oxipng's optimization level (0-6,
 * higher = smaller output but slower/more aggressive). We invert it:
 * higher requested "quality" -> lower level (closer to oxipng's own fast
 * default of 2), since oxipng's levels trade time for size, not fidelity
 * for size the way JPEG quality does — there's no lossy/visual tradeoff.
 */
export function mapQualityToPngLevel(quality: number): PngOptimizeLevel {
  const clamped = Math.min(1, Math.max(0, quality));
  // quality 0.9 (our max) -> level 2 (oxipng's default: fast, solid gains)
  // quality 0.1 (our min) -> level 6 (max effort, smallest output)
  const level = Math.round(6 - clamped * (6 - 2));
  return Math.min(6, Math.max(2, level)) as PngOptimizeLevel;
}

type OxipngOptimise = (
  data: ArrayBuffer | ImageData,
  options?: Partial<{ level: number; interlace: boolean; optimiseAlpha: boolean }>
) => Promise<ArrayBuffer>;

let optimiseModulePromise: Promise<OxipngOptimise> | null = null;

async function loadOptimise(): Promise<OxipngOptimise> {
  if (!optimiseModulePromise) {
    optimiseModulePromise = import("@jsquash/oxipng").then(
      (mod) => (mod as unknown as { optimise: OxipngOptimise }).optimise
    );
  }
  return optimiseModulePromise;
}

/**
 * Optimizes raw pixel data into a PNG. The WASM module is only fetched the
 * first time this is called (and cached for the life of the worker).
 */
export async function encodePng(imageData: ImageData, quality: number): Promise<ArrayBuffer> {
  const optimise = await loadOptimise();
  const level = mapQualityToPngLevel(quality);
  return optimise(imageData, { level, interlace: false, optimiseAlpha: false });
}
