import { describe, expect, it } from "vitest";
import {
  MAX_INPUT_LENGTH,
  formatJson,
  minifyJson,
  parseJson,
  validateJson,
} from "@/lib/json-formatter/format";

describe("parseJson — valid input", () => {
  it("parses an object", () => {
    const result = parseJson('{"a":1}');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual({ a: 1 });
  });

  it("parses an array", () => {
    const result = parseJson("[1,2,3]");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual([1, 2, 3]);
  });

  it("parses nested objects", () => {
    const result = parseJson('{"a":{"b":{"c":1}}}');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual({ a: { b: { c: 1 } } });
  });

  it("parses strings, numbers, booleans, and null", () => {
    const result = parseJson('{"s":"hi","n":42,"t":true,"f":false,"nil":null}');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ s: "hi", n: 42, t: true, f: false, nil: null });
    }
  });

  it("parses a bare top-level primitive", () => {
    expect(parseJson("42").ok).toBe(true);
    expect(parseJson('"hello"').ok).toBe(true);
    expect(parseJson("null").ok).toBe(true);
    expect(parseJson("true").ok).toBe(true);
  });
});

describe("parseJson — invalid input, friendly errors", () => {
  it("reports a missing comma", () => {
    const result = parseJson('{"a":1 "b":2}');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/^Invalid JSON —/);
  });

  it("reports a missing closing brace", () => {
    const result = parseJson('{"a":1');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/^Invalid JSON —/);
  });

  it("reports a malformed string", () => {
    const result = parseJson('{"a":"unterminated}');
    expect(result.ok).toBe(false);
  });

  it("reports a trailing comma", () => {
    const result = parseJson('{"a":1,}');
    expect(result.ok).toBe(false);
  });

  it("reports invalid primitive syntax", () => {
    const result = parseJson('{"a":undefined}');
    expect(result.ok).toBe(false);
  });

  it("never fabricates a line/column when the engine gives no position", () => {
    // V8's message for a fully empty/truncated input ("Unexpected end of
    // JSON input") does not include a position or line/column at all —
    // this must not invent one.
    const result = parseJson("");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.rawMessage).toMatch(/Unexpected end of JSON input/);
      expect(result.line).toBeUndefined();
      expect(result.column).toBeUndefined();
      expect(result.error).not.toMatch(/near line/);
    }
  });

  it("reports line 1 for a single-line invalid input when a position is available", () => {
    const result = parseJson('{"a":1 "b":2}');
    expect(result.ok).toBe(false);
    if (!result.ok && result.line !== undefined) {
      // Single physical line, so however the engine locates the error, it
      // can only be line 1 — this doesn't depend on the exact column.
      expect(result.line).toBe(1);
      expect(result.column).toBeGreaterThan(0);
    }
  });

  it("reports a line beyond 1 for a multi-line input with the error past the first line", () => {
    const input = ['{', '  "a": 1', '  "b": 2', "}"].join("\n");
    const result = parseJson(input);
    expect(result.ok).toBe(false);
    if (!result.ok && result.line !== undefined) {
      expect(result.line).toBeGreaterThan(1);
    }
  });
});

describe("formatJson", () => {
  it("pretty-prints with 2-space indentation by default", () => {
    const result = formatJson('{"a":1,"b":2}');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.output).toBe('{\n  "a": 1,\n  "b": 2\n}');
    }
  });

  it("preserves values through format", () => {
    const input = '{"s":"hi","n":42.5,"t":true,"f":false,"nil":null,"arr":[1,2,3]}';
    const result = formatJson(input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(JSON.parse(result.output)).toEqual(JSON.parse(input));
    }
  });

  it("preserves unicode characters", () => {
    const input = '{"greeting":"héllo 😀"}';
    const result = formatJson(input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.output).toContain("héllo 😀");
    }
  });

  it("preserves escaped characters through a round trip", () => {
    const input = String.raw`{"a":"line1\nline2\ttabbed"}`;
    const result = formatJson(input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(JSON.parse(result.output)).toEqual({ a: "line1\nline2\ttabbed" });
    }
  });

  it("fails on invalid JSON without producing output", () => {
    const result = formatJson('{"a":1 "b":2}');
    expect(result.ok).toBe(false);
  });

  it("rejects empty input with a clear message rather than an engine error", () => {
    const result = formatJson("");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/Enter some JSON/);
  });

  it("rejects whitespace-only input", () => {
    const result = formatJson("   \n\t  ");
    expect(result.ok).toBe(false);
  });

  it("handles deeply nested but reasonable JSON", () => {
    let value: unknown = { leaf: true };
    for (let i = 0; i < 50; i++) value = { nested: value };
    const input = JSON.stringify(value);
    const result = formatJson(input);
    expect(result.ok).toBe(true);
    if (result.ok) expect(JSON.parse(result.output)).toEqual(value);
  });

  it("rejects input over the maximum length", () => {
    const huge = `"${"a".repeat(MAX_INPUT_LENGTH + 1)}"`;
    const result = formatJson(huge);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/too large/);
  });
});

describe("minifyJson", () => {
  it("removes all insignificant whitespace", () => {
    const result = minifyJson('{\n  "a": 1,\n  "b": 2\n}');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.output).toBe('{"a":1,"b":2}');
  });

  it("preserves values through minify", () => {
    const input = '{"s":"hi","n":42.5,"t":true,"f":false,"nil":null,"arr":[1,2,3]}';
    const result = minifyJson(input);
    expect(result.ok).toBe(true);
    if (result.ok) expect(JSON.parse(result.output)).toEqual(JSON.parse(input));
  });

  it("fails on invalid JSON", () => {
    expect(minifyJson('{"a":1,}').ok).toBe(false);
  });

  it("rejects empty input", () => {
    const result = minifyJson("");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/Enter some JSON/);
  });
});

describe("validateJson", () => {
  it("reports valid JSON as valid", () => {
    const result = validateJson('{"a":1}');
    expect(result.ok).toBe(true);
    expect(result.message).toMatch(/Valid JSON/);
  });

  it("reports invalid JSON with a friendly message", () => {
    const result = validateJson('{"a":1,}');
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/^Invalid JSON —/);
  });

  it("rejects empty input", () => {
    const result = validateJson("");
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/Enter some JSON/);
  });

  it("rejects whitespace-only input", () => {
    const result = validateJson("   ");
    expect(result.ok).toBe(false);
  });
});
