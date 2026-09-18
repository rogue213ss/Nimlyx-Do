// Target-size compression search.
//
// Deliberately decoupled from any browser API: the caller supplies an
// `encode` function (quality, dimensionScale) => { size, data }. In
// production `data` is a real Blob produced by canvas encoding; in tests
// it's a plain object and `size` comes from a synthetic model. This is what
// lets the search algorithm itself be unit-tested without a DOM/canvas.
//
// Algorithm (see PROJECT_CONTEXT.md / build brief for the full spec):
//   1. Quality search at the current dimension scale: up to
//      `maxQualityIterations` binary-search steps between minQuality and
//      maxQuality, tracking the best candidate seen (closest to target,
//      preferring candidates at or under the target) rather than assuming
//      encoded size is perfectly monotonic in quality.
//   2. If quality alone can't reach the target even at minQuality, scale
//      dimensions down by `dimensionStep` and repeat, until the target is
//      reached, dimensions hit `minDimension`, or no more progress is
//      possible.
//   3. Always return the best candidate found, with `achieved` indicating
//      whether it actually met the target.

export interface EncodeAttempt<T> {
  size: number;
  data: T;
}

export type EncodeFn<T> = (
  quality: number,
  dimensionScale: number
) => Promise<EncodeAttempt<T>>;

export interface TargetSizeOptions {
  targetBytes: number;
  originalWidth: number;
  originalHeight: number;
  minQuality?: number; // default 0.1
  maxQuality?: number; // default 0.9
  maxQualityIterations?: number; // default 7
  dimensionStep?: number; // default 0.75
  minDimension?: number; // default 500
}

export interface TargetSizeResult<T> {
  achieved: boolean;
  size: number;
  data: T;
  quality: number;
  dimensionScale: number;
}

function roundQuality(q: number): number {
  return Math.round(q * 100) / 100;
}

export async function findTargetSize<T>(
  opts: TargetSizeOptions,
  encode: EncodeFn<T>
): Promise<TargetSizeResult<T>> {
  const minQuality = opts.minQuality ?? 0.1;
  const maxQuality = opts.maxQuality ?? 0.9;
  const maxIterations = opts.maxQualityIterations ?? 7;
  const dimensionStep = opts.dimensionStep ?? 0.75;
  const minDimension = opts.minDimension ?? 500;

  let bestUnderTarget: TargetSizeResult<T> | null = null;
  let bestOverall: TargetSizeResult<T> | null = null;

  function consider(size: number, data: T, quality: number, dimensionScale: number) {
    const candidate: TargetSizeResult<T> = {
      achieved: size <= opts.targetBytes,
      size,
      data,
      quality,
      dimensionScale,
    };
    if (!bestOverall || size < bestOverall.size) {
      bestOverall = candidate;
    }
    if (candidate.achieved) {
      // Among candidates that fit, prefer the largest (best visual quality)
      // — i.e. the one closest to, but not over, the target.
      if (!bestUnderTarget || size > bestUnderTarget.size) {
        bestUnderTarget = candidate;
      }
    }
  }

  let scale = 1;
  // Safety cap in case of unexpected floating point behavior — the real
  // loop always terminates via minDimension well before this.
  for (let scalePass = 0; scalePass < 20; scalePass++) {
    const width = opts.originalWidth * scale;
    const height = opts.originalHeight * scale;

    let lowQ = minQuality;
    let highQ = maxQuality;
    let reachedAtThisScale = false;

    for (let i = 0; i < maxIterations; i++) {
      const quality = roundQuality((lowQ + highQ) / 2);
      const { size, data } = await encode(quality, scale);
      consider(size, data, quality, scale);

      if (size > opts.targetBytes) {
        highQ = quality;
      } else {
        lowQ = quality;
        reachedAtThisScale = true;
      }
    }

    if (reachedAtThisScale) {
      // Good enough at this dimension scale — no need to shrink further.
      break;
    }

    const nextScale = scale * dimensionStep;
    const nextWidth = opts.originalWidth * nextScale;
    const nextHeight = opts.originalHeight * nextScale;
    if (Math.min(nextWidth, nextHeight) < minDimension) {
      // Can't shrink further without going below the safety floor.
      break;
    }
    scale = nextScale;
  }

  const result = bestUnderTarget ?? bestOverall;
  if (!result) {
    // Should be unreachable — encode() is always called at least once —
    // but keep TypeScript honest and fail loudly rather than silently.
    throw new Error("Target-size search produced no candidates.");
  }
  return result;
}
