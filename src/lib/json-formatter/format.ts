// Pure JSON processing logic for the JSON Formatter & Validator.
// Deliberately uses only native JSON.parse/JSON.stringify — no parser
// dependency, per the build brief. No browser APIs, so fully unit-testable.

export const MAX_INPUT_LENGTH = 5_000_000; // ~5MB of text — a sensible
// client-side ceiling: large enough that no real-world JSON payload a
// person would paste into a browser tool gets rejected, small enough that
// JSON.parse/stringify stay comfortably fast on the main thread (this is
// why there's no worker here — formatting really is near-instant at this
// size, so a worker would only add complexity without a real benefit).

export interface JsonParseSuccess {
  ok: true;
  value: unknown;
}

export interface JsonParseFailure {
  ok: false;
  error: string;
  /** Only set when the underlying JS engine's error message contained a
   * character offset we could confidently map to a line/column. Never
   * fabricated when the engine doesn't provide one (e.g. "Unexpected end
   * of JSON input" from V8 has no position at all). */
  line?: number;
  column?: number;
  /** The raw, unmodified message from JSON.parse's thrown error, kept for
   * debugging/testing — not shown to the user directly. */
  rawMessage: string;
}

export type JsonParseResult = JsonParseSuccess | JsonParseFailure;

/**
 * Parses JSON and, on failure, extracts a human-readable error plus
 * line/column when the engine's error message makes that possible.
 *
 * Error message formats differ across JS engines and even across versions
 * of the same engine — this build's V8 (verified directly, see below)
 * already includes an explicit "(line X column Y)" in most messages, which
 * is more trustworthy than deriving it ourselves, so that's used first
 * when present. Where only a raw "position N" offset is given (older V8,
 * or other engines like JavaScriptCore/SpiderMonkey), line/column are
 * computed by counting newlines up to that offset. When NEITHER is present
 * (e.g. V8's "Unexpected end of JSON input" for a truncated/empty input),
 * no line/column is reported — never fabricated.
 */
export function parseJson(input: string): JsonParseResult {
  try {
    const value = JSON.parse(input);
    return { ok: true, value };
  } catch (err) {
    const rawMessage = err instanceof Error ? err.message : String(err);
    const description = describeError(rawMessage);
    const explicit = extractExplicitLineColumn(rawMessage);

    if (explicit) {
      return {
        ok: false,
        error: `Invalid JSON — ${description} (near line ${explicit.line}, column ${explicit.column}).`,
        line: explicit.line,
        column: explicit.column,
        rawMessage,
      };
    }

    const position = extractPosition(rawMessage);
    if (position !== null) {
      const { line, column } = positionToLineColumn(input, position);
      return {
        ok: false,
        error: `Invalid JSON — ${description} (near line ${line}, column ${column}).`,
        line,
        column,
        rawMessage,
      };
    }

    return {
      ok: false,
      error: `Invalid JSON — ${description}`,
      rawMessage,
    };
  }
}

function extractExplicitLineColumn(message: string): { line: number; column: number } | null {
  const match = message.match(/line (\d+) column (\d+)/i);
  if (!match || match[1] === undefined || match[2] === undefined) return null;
  const line = Number(match[1]);
  const column = Number(match[2]);
  if (!Number.isFinite(line) || !Number.isFinite(column)) return null;
  return { line, column };
}

function extractPosition(message: string): number | null {
  const match = message.match(/position (\d+)/i);
  if (!match || match[1] === undefined) return null;
  const n = Number(match[1]);
  return Number.isFinite(n) ? n : null;
}

function positionToLineColumn(input: string, position: number): { line: number; column: number } {
  const clamped = Math.max(0, Math.min(position, input.length));
  const before = input.slice(0, clamped);
  const lines = before.split("\n");
  const line = lines.length;
  const column = (lines[lines.length - 1]?.length ?? 0) + 1;
  return { line, column };
}

/** Strips the redundant "at position N (line X column Y)" suffix (reported
 * separately as line/column) and trims stray whitespace, without altering
 * the substance of the engine's own message. */
function describeError(rawMessage: string): string {
  return rawMessage
    .replace(/\s*at position \d+(\s*\(line \d+ column \d+\))?\s*$/i, "")
    .replace(/\s*\(line \d+ column \d+\)\s*$/i, "")
    .trim();
}

function sizeLimitError(input: string): string | null {
  if (input.length > MAX_INPUT_LENGTH) {
    return `Input is too large to process (${input.length.toLocaleString()} characters). The limit is ${MAX_INPUT_LENGTH.toLocaleString()} characters.`;
  }
  return null;
}

export interface FormatSuccess {
  ok: true;
  output: string;
}

export interface FormatFailure {
  ok: false;
  error: string;
}

export type FormatResult = FormatSuccess | FormatFailure;

export function formatJson(input: string, indent = 2): FormatResult {
  const sizeError = sizeLimitError(input);
  if (sizeError) return { ok: false, error: sizeError };
  if (input.trim() === "") return { ok: false, error: "Enter some JSON to format." };

  const parsed = parseJson(input);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  return { ok: true, output: JSON.stringify(parsed.value, null, indent) };
}

export function minifyJson(input: string): FormatResult {
  const sizeError = sizeLimitError(input);
  if (sizeError) return { ok: false, error: sizeError };
  if (input.trim() === "") return { ok: false, error: "Enter some JSON to minify." };

  const parsed = parseJson(input);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  return { ok: true, output: JSON.stringify(parsed.value) };
}

export interface ValidateResult {
  ok: boolean;
  message: string;
}

export function validateJson(input: string): ValidateResult {
  const sizeError = sizeLimitError(input);
  if (sizeError) return { ok: false, message: sizeError };
  if (input.trim() === "") return { ok: false, message: "Enter some JSON to validate." };

  const parsed = parseJson(input);
  if (!parsed.ok) return { ok: false, message: parsed.error };
  return { ok: true, message: "Valid JSON." };
}
