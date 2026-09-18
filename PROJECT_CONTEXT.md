# PROJECT_CONTEXT.md

Single source of truth for this project's context, strategy, and current state.
Read this before making significant changes. Update it whenever a meaningful
decision, milestone, or status change happens. Do not let this file drift
from the actual code — verify claims against the source before writing them
here.

---

## 1. Project Overview

Nimlyx Do is a web utility platform. It is not a calculator website and not a
coding portfolio project — it is a utility **business**.

**Problem it solves:** people need to actually *do* something (compress an
image, convert a file, calculate a percentage) and currently either dig
through cluttered ad-farm utility sites or ask an AI chatbot for an answer
that doesn't actually produce the artifact they need.

**Who it's for:** anyone who lands from a search query with a concrete task
in mind — not people browsing for content.

**Why a dedicated tool over asking ChatGPT:** the filter for every tool
decision is —

> If a user can get the exact same result more conveniently by asking
> ChatGPT one sentence, the tool probably isn't strong enough.

Tools should provide something a chat interface fundamentally can't as
conveniently: real file processing, downloadable output, previews, batch
operations, or a persistent interactive interface.

**Business goal:** attract substantial organic search traffic and generate
sustainable revenue. Every technical and product decision is evaluated
against two questions:

1. Does this provide real utility a user would prefer over asking an AI chatbot?
2. Does this create a realistic opportunity for organic traffic and revenue?

Do not optimize for tool count. Optimize for usefulness, search demand,
retention, performance, and revenue potential.

---

## 2. Product Thesis

```
Real utility → excellent UX → strong SEO → organic traffic → revenue → sustainable growth
```

Strong categories (in no particular priority order until individually
evaluated):

- File / image / PDF utilities
- Video utilities for permitted public content only (no DRM/paywall/auth bypass)
- Generators (QR, password, etc.)
- Converters
- Developer utilities
- Text utilities
- Calculators — supporting category, not the platform's identity
- AI-assisted utilities where AI provides genuine specialized value (e.g. a
  text "humanizer" — positioned as making text sound more natural, never as
  an AI-detector bypass)

**Input → Process → Output** is the product shape, not **Question → Answer**.

---

## 3. Business / Revenue Objective

Revenue is a legitimate, explicit product requirement — not an afterthought.

Potential channels (future, not implemented):

- Advertising — design layouts with sensible ad slots in mind; never
  implement intrusive ads prematurely; never let the site feel like an ad farm.
- Premium features — batch processing, larger file limits, higher usage
  limits, advanced export, history, faster processing, API access. Never add
  artificial limitations purely to force payment.
- Affiliate — only where genuinely relevant to user intent.
- Future: API products, pro accounts, usage-based/business features — not
  V1 scope.

V1's job is to prove people search, arrive, use the tool, and get value —
not to build the monetization infrastructure itself.

---

## 4. SEO Strategy

SEO is a core product feature, designed alongside each tool from the start —
never bolted on afterward.

Per tool, consider: primary search intent, long-tail intent, search demand,
competition, SERP intent, title, meta description, H1, semantic H2/H3
structure, search-friendly URL, helpful explanatory content, examples, FAQs
(only when genuinely useful), canonical URL, structured data, Open Graph,
Twitter/social metadata, sitemap inclusion, robots/indexability, mobile
performance, Core Web Vitals, accessibility, image optimization, page speed.

Hard rules:

- No keyword stuffing.
- No meaningless/generic filler paragraphs.
- No fake FAQs.
- No schema that misrepresents the page.
- No pages created purely because a keyword exists.
- Never sacrifice UX for rankings; never slow the site for SEO gimmicks.
- Never create near-duplicate pages to farm long-tail keywords.

The registry (`tool-registry.ts`) is the single source of truth for tool
metadata and indexability, and entries are **hand-authored**, not templated
from the tool name — this is the mechanism that prevents the site from
becoming a content farm as it scales.

---

## 5. UX / Design Philosophy

The site must feel like a refined, trustworthy product, not a pile of
developer demos. Every element should have a purpose — avoid visual noise,
gimmicks, and animation/UI added because it "looks cool."

Core flow: **Discover → Understand → Use → Get result → Download/copy → Done.**
A first-time visitor should understand what to do within seconds, with
minimal clicks and sensible defaults.

Attend to: spacing, typography, visual hierarchy, hover/focus/loading/empty/
error/success states, input validation, drag-and-drop behavior, progress
indicators, purposeful micro-interactions, responsive behavior.

Handle real-world behavior, not just the happy path: empty input, invalid
input, huge files, unsupported formats, duplicate files, cancelled
operations, slow devices, long filenames, special characters, rapid
double-clicks, refresh mid-operation, clipboard/download failures. Error
messages must be human-readable, never raw stack traces.

---

## 6. Mobile-First Requirement

Every tool must work comfortably on phone, tablet, laptop, and desktop.
Particular attention: touch targets, upload controls, drag/drop fallbacks,
input sizing, result visibility, download buttons, sticky elements,
keyboard behavior, horizontal overflow. A tool isn't finished until it's
been checked on mobile.

---

## 7. Accessibility

Semantic HTML first; ARIA supplements it, never replaces it. Maintain:
proper labels, full keyboard navigation, visible focus states, logical tab
order, `aria-live` for dynamic results, sufficient contrast,
screen-reader-friendly controls.

---

## 8. Performance

Prefer minimal JS, minimal dependencies, server rendering where sensible,
small bundles, optimized assets, lazy loading, fast initial render. For
file/image/PDF tools, investigate whether processing can happen entirely
client-side — prefer it when viable (privacy, cost, speed, scalability), but
don't force it if it creates unacceptable limitations.

**Privacy claims must be true.** Only state "processed in your browser,
never uploaded" when the implementation actually guarantees it.

---

## 9. Development Discipline — ONE TOOL AT A TIME (non-negotiable)

Do not build multiple tools in parallel. No placeholder tools, no
"polish later," no batch-generated scaffolding.

Per-tool loop:

```
Choose ONE tool
→ Research (search intent, demand, competition, feasibility)
→ Design
→ Implement
→ Test (unit + edge cases)
→ Refine UX
→ Refine SEO
→ Mobile review
→ Accessibility review
→ Performance review
→ Monetization opportunity review
→ Quality gate
→ Only then choose the next tool
```

A single excellent tool beats ten mediocre ones.

---

## 10. Tool Selection Criteria

Before starting a tool, score it against:

- **Utility** — would someone prefer this over asking a chatbot?
- **Search demand** — are people actually searching for this?
- **Competition** — can a small/new site realistically rank?
- **Monetization** — realistic revenue potential?
- **Repeat usage** — would users come back?
- **Cluster potential** — does it open a path to related tools?
- **Technical feasibility** — buildable well with the current architecture?

Only proceed if the overall case is strong across these dimensions.

---

## 11. Quality Gate (required before moving to the next tool)

**Functional:** core logic, edge cases, error handling, download/copy all work.
**UX:** obvious first action, clear feedback, good empty/loading/success/error states, minimal friction.
**Visual:** consistent with the design system, clean spacing/typography, no layout bugs.
**Responsive:** verified on mobile, tablet, desktop.
**Accessibility:** keyboard, focus, labels, screen readers, contrast.
**Performance:** fast initial load, reasonable bundle, efficient processing.
**SEO:** metadata, canonical, structured data, content, internal links, sitemap, robots, indexability.
**Business:** search intent validated, monetization angle understood, related-tool opportunities identified.

The standard is not "does it work" — it's: *would I confidently send this to
a stranger and expect them to immediately understand it, use it, trust it,
and want to come back?* If no, keep refining before starting the next tool.

---

## 12. V1 vs V2 Discipline

Constantly ask: **"Does this make V1 better, or is this a V2 feature?"**

Avoid building prematurely: authentication, user accounts, dashboards,
payments, subscriptions, complex databases, APIs, admin panels, large
registries, heavy backend infrastructure. Build only what's needed to prove
the loop: search → arrive → use → value → traffic → revenue potential.

---

## 13. Current Tech Stack (verified against source, 2026-09-13)

- Next.js `^14.2.5`, App Router
- React `^18.3.1`
- TypeScript, `strict: true`, `noUncheckedIndexedAccess: true`
- Tailwind CSS `^3.4.4`
- Vitest `^1.6.0` for unit tests
- ESLint (`next/core-web-vitals`)
- Custom `scripts/validate-seo.ts` (run via `tsx`), intended for CI
- `pdfjs-dist` `^4.6.82` (added 2026-09-14, PDF to JPG only) — the
  project's one real PDF rasterizer; its worker bundle, standard font
  data, and CMap data are all copied into `public/pdfjs/` by
  `scripts/copy-pdf-worker.js` (a `postinstall` hook), not bundled by
  webpack — see the 2026-09-14 and 2026-09-15 decision log entries.
- **No backend, no database.** `node_modules` intentionally excluded from
  the delivered ZIP (built without network access) — run `npm install`
  before working locally.

---

## 14. Current Architecture (reference pattern for every future tool)

```
tool-registry.ts entry
  → pure logic module (framework-agnostic, unit-tested)
  → client-side tool UI (React client component)
  → server-rendered page (metadata, canonical, structured data, breadcrumbs, content)
  → sitemap.ts (auto-derived from registry)
  → robots.ts
  → scripts/validate-seo.ts (validates the registry)
```

**`src/lib/tool-registry.ts`** — single source of truth per tool: slug,
category, title/metaDescription/h1/intro, search intents, formulas,
examples, FAQ, edge-case notes, related tools, schema type, `indexable`
flag, `lastUpdated`. Hand-authored per entry by design — adding tool #51
still requires someone to actually write real content for it.

**`src/lib/calculators/percentage.ts`** — example of a pure logic module:
no React, no DOM, fully unit-testable, reusable from a future API if ever
needed. Follow this shape for future tool logic (e.g.
`lib/image/compress.ts`).

**`src/components/PercentageCalculator.tsx`** — example client-component
shape: mode/tab switching, controlled inputs, `useMemo`'d derived result,
`aria-live` result region, copy-to-clipboard with graceful failure,
reset/copy actions with visible focus states.

**`src/app/percentage-calculator/page.tsx`** — example server-page shape:
pulls the tool from the registry, builds `Metadata` (title, description,
canonical, OG, Twitter), builds `WebApplication`/`FAQPage` JSON-LD from
registry data, renders `Breadcrumbs`, renders the client tool near the top
(no scroll needed on desktop), then conditionally renders formula/examples/
edge-case/FAQ sections **only if the registry actually has that content**.

**`src/app/sitemap.ts`** — built from `categories` + `getIndexableTools()`.
Adding a tool to the registry with `indexable: true` sitemaps it
automatically; nothing to hand-maintain.

**`src/app/robots.ts`** — static rules, points at `/sitemap.xml`.

**`scripts/validate-seo.ts`** — checks the registry for missing
title/description/H1/intro, title/description length bounds, and duplicate
titles/descriptions across tools. Meant to run in CI so a page with an SEO
defect can't ship silently.

Preserve this pattern for new tools unless there's a concrete technical
reason to change it. Do not duplicate SEO configuration across unrelated
files.

---

## 15. Current Design System

**Visual direction: Midnight + Coral.** Dark, sophisticated utility
interface. Explicitly NOT: generic white/ivory SaaS, cyberpunk, gamer/neon,
excessive glassmorphism, gradient-heavy, or overly flashy.

Semantic Tailwind color tokens (`tailwind.config.ts`) — always use these,
never raw hex in components:

| token | value | purpose |
|---|---|---|
| `ink` | `#EEF2FF` | primary text |
| `paper` | `#121A2B` | primary surface / on-accent text |
| `surface` | `#182238` | elevated surface (e.g. calculator card) |
| `line` | `#29354C` | borders |
| `accent` | `#FF795B` | interactive/selected states only |
| `accent-dark` | `#E85E40` | accent hover |
| `result` | `#6EE7B7` | reserved for calculation/output results only — deliberately a different hue from `accent` so "answer" is never visually confused with "action" |
| `error` | `#FF5C5C` | errors |

Typography, self-hosted via `next/font` (no runtime external font requests):

- **Fraunces** (`--font-display`) — headings, notebook/ledger-serif personality
- **Inter** (`--font-body`) — body/UI workhorse
- **IBM Plex Mono** (`--font-mono`) — numbers/data, matches the "calculation" subject matter

The Percentage Calculator page is the **reference implementation** for
visual quality, UX, responsive behavior, accessibility, input/result
hierarchy, content structure, SEO, and structured data — but it is not the
identity of the whole site, and it should not be redesigned without a
specific reason. New tools should draw from the same token system and
typography rather than inventing new styles.

---

## 16. Current Project Status

### Completed (verified in code as of 2026-09-13)

- Next.js App Router project structure, TypeScript strict mode, Tailwind
- Design token system (Midnight + Coral)
- Tool registry architecture (`tool-registry.ts`)
- Percentage Calculator: pure logic (`percentOf`, `percentageChange`,
  `whatPercent`, `percentageDifference`), fully unit-tested
  (`src/tests/percentage.test.ts`, 245 lines)
- Percentage Calculator client UI (4 modes, copy-to-clipboard, reset,
  `aria-live` result, visible focus states)
- Server-rendered tool page with metadata, canonical, `WebApplication` +
  `FAQPage` JSON-LD, breadcrumbs (with `BreadcrumbList` JSON-LD), formula/
  examples/edge-case/FAQ content sections
- Homepage and `/calculators/` category hub, both driven by the registry
- Sitemap (`sitemap.ts`) and robots (`robots.ts`), both registry-derived
- SEO validation script (`scripts/validate-seo.ts`)
- Root layout: skip-to-content link, `WebSite`/`Organization` JSON-LD,
  self-hosted fonts, reduced-motion handling

- Image Compressor V1 (see below) — logic, worker, UI, and 6 registry-driven
  pages (main tool + `/compress-image-to-{50,100,200}kb/` +
  `/compress-jpeg/` + `/compress-png/`), plus `/image-tools/` category hub
  and a header nav link to it.
- Image Resizer V1 (see below) — logic, worker, UI, and one registry-driven
  page (`/image-resizer/`).
- JSON Formatter & Validator V1 (see below) — logic and UI, one
  registry-driven page (`/json-formatter/`), new `developer-tools`
  category + `/developer-tools/` hub, and a third header nav link.
- PDF Merger V1 (see below) — logic, worker, UI, one registry-driven page
  (`/pdf-merger/`), new `pdf-tools` category + `/pdf-tools/` hub, and a
  fourth header nav link.
- PDF Compressor V1 (see below) — logic, worker, UI, one registry-driven
  page (`/pdf-compressor/`), reuses the existing `pdf-tools` category.
  **Built as a 100% client-side tool despite the build brief requesting a
  server-side pipeline — see the prominent decision log entry below.**

### Image Compressor V1 — what's actually implemented (2026-09-13)

Code exists for:

- `src/lib/image-compressor/types.ts` — shared worker message / queue types
- `src/lib/image-compressor/validation.ts` — file/batch/target-size
  validation, dimension safety clamping, byte formatting — **unit tested**
  (`src/tests/image-compressor-validation.test.ts`)
- `src/lib/image-compressor/target-size.ts` — the quality-search +
  dimension-fallback algorithm, decoupled from any browser API via an
  injected `encode` function — **unit tested**
  (`src/tests/target-size.test.ts`) against a synthetic (non-monotonic)
  encoder model
- `src/lib/image-compressor/png-encoder.ts` — lazy PNG optimization wrapper
- `src/workers/image-compressor.worker.ts` — decode → safety pre-scale →
  encode (JPEG/WebP native, PNG via lazy WASM) → target-size search, all
  off the main thread
- `src/components/ImageCompressor.tsx` — dropzone, file picker, batch
  queue, per-item progress/result/error, target-size toggle, output format
  picker, Download All (lazy JSZip), object-URL lifecycle management
- `src/components/tool-pages/ImageCompressorPage.tsx` +
  `src/lib/seo/tool-metadata.ts` — shared server-page shell and metadata/
  JSON-LD builders reused by all 6 route files, so the SEO preset pages
  don't duplicate the percentage-calculator page's markup pattern by hand
- Registry: `image-tools` category + 6 tool entries in `tool-registry.ts`
  (`image-compressor`, `compress-image-to-50kb`, `-100kb`, `-200kb`,
  `compress-jpeg`, `compress-png`), each with distinct title/description/
  FAQ reflecting its specific search intent, per the build brief's
  programmatic-SEO constraint (no arbitrary numeric route farming)

### VERIFIED 2026-09-13 (later session) — actually ran, not reasoned through

`npm install`, `npm test`, `npm run build`, `npm run lint`, and
`npm run seo:check` were all actually run against this codebase (this
sandbox does have working network access to npmjs.org — the earlier "no
network" assumption was itself wrong and is corrected here):

- `npm install` — succeeds, 468 packages, no install-time errors
- `npm test` — **77/77 tests pass**, including the new
  `target-size.test.ts` and `image-compressor-validation.test.ts`
- `npm run build` — **succeeds**, all 15 routes (including all 6 image
  tool pages) generate as static pages. This required two fixes, both made
  today (see the decision log below):
  1. `png-encoder.ts` was rewritten after actually fetching and reading the
     real `@jsquash/oxipng@2.3.0` source: the original assumption (a
     separate `@jsquash/png` encode step feeding pre-encoded bytes into
     `oxipng.optimise()`) was **wrong**. The real `optimise()` accepts
     `ImageData` directly and returns `ArrayBuffer`, not `Uint8Array`.
     `@jsquash/png` is not needed at all and has been removed as a
     dependency.
  2. A **pre-existing, unrelated** lint error in `src/app/page.tsx` (an
     unescaped apostrophe) was blocking `next build` for the whole site,
     not just the new pages. Fixed with a one-character change
     (`react/no-unescaped-entities`) since it blocked verifying anything
     — this is the only edit made outside the Image Compressor's own files.
  - Note: this build environment cannot reach `fonts.googleapis.com` (not
    on the sandbox's network allowlist), so `next/font/google` fails here
    regardless of any Image Compressor change. The build above was run
    with the font loaders temporarily stubbed out purely to get past that
    unrelated network wall; `layout.tsx` was restored to its real
    `next/font/google` calls immediately after. **A real dev/CI machine
    with normal internet access must still confirm the font-enabled build
    succeeds** — there's no reason to expect it won't (nothing about the
    Image Compressor touches fonts), but it has not been directly observed.
- `npm run lint` — clean, 0 errors
- `npm run seo:check` — clean, **0 errors, 0 warnings across 7 tools**
- Build output confirms the lazy-loading requirement actually holds: every
  image-tool route is ~100KB First Load JS (vs. 96.3KB baseline for a
  plain page), meaning `@jsquash/oxipng` and `jszip` are genuinely absent
  from the initial bundle and only load inside the worker / on-demand.
- One non-fatal build warning was observed both times: `Circular
  dependency between chunks with runtime (121, webpack, 794)`. Not
  investigated further — it didn't fail the build or break output, and
  tracking down its exact source would be a speculative architectural
  change outside this task's scope. Worth keeping an eye on if bundle
  behavior ever looks wrong.

### NOT verified — still requires a real browser/device

Code-level correctness is now confirmed by the build above, but nothing
about actual runtime behavior in a browser has been observed. This sandbox
has no browser:

1. **EXIF orientation normalization** — `createImageBitmap(file, {
   imageOrientation: "from-image" })` compiles and type-checks, but whether
   it actually keeps a real phone photo upright must be checked with a real
   EXIF-rotated test image (build brief §13).
2. **PNG "quality" mapping to oxipng optimization level** — the level
   mapping in `png-encoder.ts` (`mapQualityToPngLevel`) is a reasonable
   first guess, not tuned against real output sizes, now that the
   underlying API call itself is confirmed correct.
3. **Real compression behavior** — actual output file sizes, actual
   target-size accuracy, actual visual quality at various quality/level
   settings, on real images.
4. **Real memory/performance behavior**, especially the 25MB / 8000×6000
   stress case (build brief §29) and low-end mobile devices.
5. **Real Network-tab verification** that no image bytes ever leave the
   browser — the source-level check (no `fetch`/`XHR`/analytics calls
   anywhere in the image-compressor code, confirmed by grep) is done, but
   an actual DevTools Network-tab observation during a real compression run
   has not been performed.
6. **Cross-browser/mobile manual QA** (build brief §28), including at
   320–430px widths, real touch interaction, and Safari specifically.

Do not describe any of the six items above as confirmed working — they
need an actual browser. Everything else (does the code compile, type-check,
lint, pass its unit tests, and produce a working production build with the
correct bundle-splitting behavior) is now confirmed, not assumed.

### Image Resizer V1 — what's actually implemented (2026-09-13)

Code exists for:

- `src/lib/image-resizer/dimensions.ts` — pure aspect-ratio/dimension
  resolution logic (locked vs. unlocked ratio, blank-field handling,
  min/max dimension bounds) — **unit tested**
  (`src/tests/image-resizer-dimensions.test.ts`, 23 tests)
- `src/lib/image-resizer/types.ts` — worker message types; reuses
  `OutputFormat` from `image-compressor/types.ts` by import rather than
  redefining it
- `src/workers/image-resizer.worker.ts` — decode → 4096px safety pre-scale
  (reuses `computeSafeDimensions`) → draw at requested size → encode
  (native JPEG/WebP, or `encodePng` reused from the Compressor for PNG).
  Neither reused function was modified — both were already generic.
- `src/components/ImageResizer.tsx` — single-image select, main-thread
  dimension read (cheap, not worth a worker round-trip), width/height
  fields with live locked-ratio feedback, explicit "Resize image" action
  (not auto-resize-on-keystroke), format picker, result + Download,
  `aria-live` stage announcements, object-URL cleanup on
  replace/unmount/new-file-select (three paths, all grep-confirmed)
- `src/components/tool-pages/ImageResizerPage.tsx` — reuses the same
  `buildToolMetadata`/`buildWebAppJsonLd`/`buildFaqJsonLd` helpers the
  Compressor family already uses (`lib/seo/tool-metadata.ts` was not
  modified — already generic)
- Registry: one new entry, `image-resizer`, appended to `tool-registry.ts`
  under the existing `image-tools` category — **no existing tool entries
  were modified**, including the Compressor's; internal linking to it is
  one-directional (`image-resizer.relatedTools` points at
  `image-compressor`, not the reverse)
- **Deliberately not built** (per the brief's explicit scope control): no
  crop/filters/rotation UI, no batch processing, no target-file-size mode,
  no metadata editor, no AI features — this is a single-image, exact-
  dimensions tool only

### VERIFIED 2026-09-13 (same real commands as the Compressor's verification pass)

- `npm install` — succeeds
- `npm test` — **100/100 tests pass** (77 previous + 23 new resizer tests)
- `npm run build` — succeeds, **16 routes** (15 previous + `/image-resizer/`).
  Same font-fetch sandbox limitation as before (network allowlist blocks
  `fonts.googleapis.com`, unrelated to this tool) — verified with the same
  temporary font-stub-then-restore approach used for the Compressor's
  verification; `layout.tsx` was restored to its real `next/font/google`
  calls immediately after.
- `npm run lint` — clean
- `npm run seo:check` — clean, **0 errors, 0 warnings across 8 tools**
- `/image-resizer/` builds to ~100KB First Load JS — same profile as the
  Compressor pages, confirming `@jsquash/oxipng` stays lazy-loaded here too
  (reusing `encodePng` didn't accidentally pull PNG WASM into this page's
  initial bundle)
- Security/privacy grep pass: no `fetch`/`XHR`/analytics calls anywhere in
  the resizer code; `dangerouslySetInnerHTML` usage is the same
  hand-authored-JSON-LD-only pattern already used elsewhere; object URL
  lifecycle confirmed on all three paths (result replacement, unmount, new
  file selected)

### NOT verified — still requires a real browser/device

Same category of gap as the Compressor, for the same reason (no browser in
this sandbox):

1. **Real resize output** — actual visual correctness at various
   dimensions, actual upscale quality, actual PNG optimization behavior.
2. **EXIF orientation** — uses the same `imageOrientation: "from-image"`
   approach as the Compressor; not independently confirmed with a real
   photo here.
3. **Live locked-ratio field feedback** — the width↔height auto-update
   while typing is logically tested (`deriveLockedDimension`), but the
   actual typing experience (does it feel laggy, does the cursor jump,
   etc.) needs a real browser.
4. **Mobile layout and touch interaction** at narrow widths.
5. **Large/stress source images** going through the reused
   `computeSafeDimensions` pre-scale path in this specific worker.

### JSON Formatter & Validator V1 — what's actually implemented (2026-09-13)

The first `developer-tools` category tool, and structurally simpler than
the image tools: no worker, no new dependency, no browser-only APIs beyond
`navigator.clipboard` and `Blob`/object URLs for download — native
`JSON.parse`/`JSON.stringify` do all the real work synchronously on the
main thread, which is correct here since formatting genuinely is
near-instant at the ~5MB input ceiling this tool enforces.

Code exists for:

- `src/lib/json-formatter/format.ts` — `parseJson` (friendly error
  extraction with real, verified line/column handling — see below),
  `formatJson`, `minifyJson`, `validateJson` — **unit tested**
  (`src/tests/json-formatter.test.ts`, 30 tests)
- `src/components/JsonFormatter.tsx` — input/output textareas, Format/
  Minify/Validate actions, Ctrl/Cmd+Enter shortcut for Format, Copy
  (clipboard, fails silently rather than alarmingly if unavailable),
  Download (`formatted.json`/`minified.json` via Blob + object URL,
  created and revoked within the same synchronous action — no long-lived
  reference, so no leak surface), `aria-live` status message, Copy/Download
  only enabled once there's real output
- `src/app/json-formatter/page.tsx` — self-contained page (metadata +
  JSON-LD + content sections all in one file), matching the original
  Percentage Calculator's pattern rather than the multi-page "shell"
  pattern used for the image tool family — appropriate here since there's
  only one page, not several sharing one implementation. Reuses
  `buildToolMetadata`/`buildWebAppJsonLd`/`buildFaqJsonLd` from
  `lib/seo/tool-metadata.ts`, unmodified.
- New `developer-tools` category (appended to `categories`) +
  `/developer-tools/` hub page, mirroring `/image-tools/`
- One registry entry, `json-formatter`, appended to `tool-registry.ts` — no
  existing entries modified
- A third header nav link ("Developer Tools")

**A real bug was caught and fixed by actually running the tests** (not
just written and assumed correct): the original line/column extraction
logic assumed `JSON.parse("{")` (an unterminated object) would produce a
position-free message like `"Unexpected end of JSON input"`. Running the
test suite against this environment's actual Node/V8
(`node -e 'try{JSON.parse("{")}catch(e){console.log(e.message)}'`) showed
that assumption was wrong: this V8 version reports `"Expected property
name or '}' in JSON at position 1 (line 1 column 2)"` — it already
includes an explicit line/column. The truly position-free case is a fully
empty/truncated input (`JSON.parse("")` → `"Unexpected end of JSON
input"`, verified the same way). Two things were fixed as a result:
1. The extraction logic now prefers V8's own explicit `(line X column Y)`
   when present (more trustworthy than our derived version), falling back
   to computing it from a raw `position N` offset only when no explicit
   line/column is given — which is what engines without V8's exact message
   format will hit.
2. The test itself was corrected to use `""` as the true no-position case,
   not `"{"`.

### VERIFIED 2026-09-13 (real commands, same as the other two tools)

- `npm install` — succeeds
- `npm test` — **130/130 tests pass** (100 previous + 30 new, after fixing
  the real failure described above)
- `npm run build` — succeeds, **18 routes** (16 previous + `/json-formatter/`
  + `/developer-tools/`). Same font-fetch sandbox limitation as the other
  two tools' verification passes (unrelated network restriction, not a
  code issue) — verified with the same temporary stub-then-restore
  approach; `layout.tsx` was restored to its real `next/font/google` calls
  immediately after.
- `npm run lint` — clean
- `npm run seo:check` — caught a real, genuine issue: the initial meta
  description was 174 characters (16 over the 158 recommended max).
  Trimmed; now **0 errors, 0 warnings across 9 tools**.
- `/json-formatter/` builds to 98.3KB First Load JS — essentially the same
  footprint as the Percentage Calculator (98.4KB), confirming no
  unnecessary dependency was pulled in, as required.
- Security/privacy grep pass: no `eval`/`new Function`/`fetch`/`XHR`/
  analytics anywhere in the tool's code; the only `dangerouslySetInnerHTML`
  is the same pre-existing hand-authored-JSON-LD-only pattern used
  elsewhere — user JSON itself is only ever bound via React's `value={}` on
  a `<textarea>`, never rendered as HTML; no `location`/`searchParams`/
  `history` usage anywhere, so JSON is never reflected into a URL; object
  URL created and revoked within one synchronous download action.

### NOT verified — still requires a real browser/device

1. **Actual clipboard behavior** — `navigator.clipboard.writeText` is
   used correctly per its documented API, but real permission prompts,
   insecure-context fallback behavior, and the "Copied" label's real
   timing feel need a real browser.
2. **Actual download behavior** — the Blob/object-URL/anchor-click pattern
   is the same one already used (and specified) elsewhere in this project,
   but hasn't been confirmed to actually trigger a download in a real
   browser from this specific component.
3. **Real mobile layout** — the two-column `sm:grid-cols-2` input/output
   layout collapses to stacked below the `sm` breakpoint in the code, but
   hasn't been seen on an actual narrow viewport.
4. **Ctrl/Cmd+Enter behavior** across real operating systems/browsers
   (e.g. whether any browser intercepts that combination first).
5. **Error message quality on browsers other than this environment's V8** —
   the line/column logic is written to gracefully degrade on
   JavaScriptCore/SpiderMonkey (fall back to the `position N` path, or omit
   line/column entirely if neither is present), but that fallback path
   itself has only been exercised by a synthetic-message test, not a real
   Safari or Firefox.

### PDF Merger V1 — what's actually implemented (2026-09-13)

First `pdf-tools` category tool. Uses `pdf-lib` for structural PDF
manipulation (pages are copied from source documents, never rasterized to
images and reassembled) — chosen because it's the standard, actively
maintained library for this in the JS ecosystem, and no existing project
dependency could do it, so a new one was justified per the brief.

Code exists for:

- `src/lib/pdf-merger/validation.ts` — file/batch metadata validation
  (type/size/count), real content validation via PDF magic-header check
  (`looksLikePdfContent`, not just trusting MIME type or extension), and
  pure reorder logic (`moveItem`/`moveUp`/`moveDown`) — **unit tested**
- `src/lib/pdf-merger/merge.ts` — the actual merge algorithm via pdf-lib,
  deliberately environment-agnostic (bytes in, bytes out, no DOM) so it
  runs identically in the worker and in tests
- `src/lib/pdf-merger/types.ts` — worker message types
- `src/workers/pdf-merger.worker.ts` — thin message-passing shell around
  `mergePdfs`, transfers the output buffer back rather than copying it
- `src/components/PdfMerger.tsx` — dropzone, per-file page-count reading
  (lazy-loaded `pdf-lib` on the main thread — see the bundle-size fix
  below), up/down reorder buttons (keyboard-accessible; drag-and-drop was
  **not** implemented, since the brief only required reordering not be
  drag-only, not that drag also exist), Add more PDFs, Merge PDFs, truthful
  per-file progress stages from the worker, Download (fixed `merged.pdf`
  filename, never derived from user input), Start over, object URL
  lifecycle covered on all four paths (grep-confirmed)
- `src/app/pdf-merger/page.tsx` — self-contained, same pattern as JSON
  Formatter's page
- New `pdf-tools` category + `/pdf-tools/` hub + one registry entry — no
  existing entries modified
- Fourth header nav link ("PDF Tools")

**Real integration tests, not mocks**: `src/tests/pdf-merger.test.ts`
generates genuine valid PDFs with pdf-lib itself (`PDFDocument.create()` +
`addPage()`), then feeds them through the actual `mergePdfs` function and
asserts on real output — page counts, page order (verified via
distinguishable page widths, e.g. confirming a 200pt-then-400pt input
order produces exactly that page order in the merged output, and that
reversing the input reverses the output), a real corrupt-file failure path,
and that the real progress callback fires with truthful per-file
events. This is genuine execution of the merge algorithm, not asserted
behavior on a mock — the caveat is still that it exercises pdf-lib in
Node, not a real browser's Worker + File API plumbing end-to-end.

**A real bundle-size bug was caught and fixed by actually running the
build** (not assumed correct): the initial version imported `pdf-lib` at
the top of the client component for main-thread page-count reading, which
pulled the ~19.5MB package into `/pdf-merger`'s initial JS bundle —
275KB First Load JS versus ~100KB for every other page. Switched to a
dynamic `import("pdf-lib")` inside the one function that needs it on the
main thread; rebuilding confirmed this brought the page back to 100KB,
in line with the rest of the site. The worker still loads its own copy of
pdf-lib independently when a merge actually runs.

### VERIFIED 2026-09-13 (real commands, same as the other three tools)

- `npm install` — succeeds (pdf-lib added as a genuinely new dependency —
  no existing package could do PDF merging)
- `npm test` — **158/158 tests pass** (130 previous + 28 new, including
  the real pdf-lib integration tests described above)
- `npm run build` — succeeds, **20 routes** (18 previous + `/pdf-merger/`
  + `/pdf-tools/`). Same font-fetch sandbox limitation as the other three
  tools' verification passes (unrelated network restriction) — verified
  with the same temporary stub-then-restore approach; `layout.tsx` was
  restored to its real `next/font/google` calls immediately after.
  **Caught and fixed a real bundle-size regression** (see above) before
  calling this verified — the first build attempt "passed" in the sense of
  not erroring, but the bundle-size output itself revealed the problem.
- `npm run lint` — clean
- `npm run seo:check` — clean, **0 errors, 0 warnings across 10 tools**
- Security/privacy grep pass: no `eval`/`new Function`/`fetch`/`XHR`/
  analytics anywhere in the tool's code; no `FileReader.readAsDataURL`
  anywhere (uses `file.arrayBuffer()` throughout, per the project's
  established no-unnecessary-base64 pattern); the only
  `dangerouslySetInnerHTML` is the same pre-existing hand-authored-JSON-LD
  pattern used elsewhere; filenames are always rendered via React text
  interpolation, never as HTML; the download filename is a fixed constant
  (`"merged.pdf"`), never derived from any source file's name; object URL
  lifecycle confirmed on all four paths (new result replacing an old one,
  unmount, a new batch of files added while a result existed, explicit
  Start over).

### NOT verified — still requires a real browser/device

1. **Real drag-and-drop, file picker, and Worker + File API plumbing
   end-to-end** — the merge algorithm itself is genuinely tested (see
   above), but the full path from a real browser drop event through
   `file.arrayBuffer()`, structured-clone transfer into the worker, and
   back has not been observed running.
2. **Real corrupt/password-protected PDF handling** — the corrupt-file
   test uses a plain text buffer, which is a real test of the failure
   path, but a genuinely password-protected real-world PDF hasn't been
   tried.
3. **Large PDF / memory behavior** — no stress test with genuinely large
   (near the 100MB) or many (near the 30-file) real PDFs has been run.
4. **Reorder UX feel** — the up/down button logic is unit-tested
   (`moveUp`/`moveDown`), but how it feels to actually use on a long list,
   especially on mobile, hasn't been observed.
5. **Real mobile layout and touch interaction** at narrow widths.
6. **Real download behavior** — same Blob/object-URL/anchor-click pattern
   used elsewhere, not independently reconfirmed with a real browser here.

### PDF Compressor V1 — what's actually implemented (2026-09-13)

**⚠ ARCHITECTURE DEVIATION FROM ITS OWN BUILD BRIEF — read this first.**
The brief for this tool asked for a server-side pipeline (Ghostscript/
qpdf/pikepdf, a `POST /api/pdf/compress` route, file uploads). That
directly conflicts with this project's core, repeatedly-security-audited
architecture: every existing tool makes an explicit promise that user
files never leave the browser, and there is no backend, no API routes, and
no server infrastructure anywhere in this project to run a system binary
like Ghostscript reliably or safely across deployment targets (verified —
`next.config.js` has no `output` override, but zero `app/api/` routes
exist anywhere in the codebase; this was confirmed by inspection before
starting, not assumed). Per this project's own "identify the exact blocker
instead of faking the functionality" principle, and per explicit follow-up
instruction ("if possible client side, go client side; only go server side
if not possible"), this was implemented **100% client-side instead**. See
the decision log below for the full reasoning and what this means for
compression strength versus a true Ghostscript-class pipeline.

**What it actually does (real compression, not a renamed copy):**

- Finds every image XObject in the PDF encoded as plain JPEG (`Filter =
  DCTDecode`) — for those, the stream's stored bytes ARE a literal JPEG
  codestream, decodable directly by the browser's native
  `createImageBitmap`, then re-encoded at a level-dependent quality via
  `OffscreenCanvas.convertToBlob`. This is genuine lossy recompression,
  not a trick, and is where most of a real-world image-heavy PDF's size
  usually lives.
- Re-saves the whole document through `pdf-lib` (`useObjectStreams:
  true`), which rebuilds the object graph from what's actually reachable
  and applies object-stream compression — a real, if modest, structural
  optimization independent of images.
- **Never replaces an image with an equal-or-larger one**, and if the
  whole document doesn't end up smaller than the original, the ORIGINAL
  bytes are returned and the UI honestly shows "already well optimized"
  rather than presenting a same-size-or-larger file as a successful
  compression — this was an explicit brief requirement and is
  unit-tested, not just claimed.

**Deliberately NOT attempted (documented, not silently skipped):** images
using other encodings — CCITT Group 4 fax, JBIG2, JPEG2000 (`JPXDecode`),
or raw/Flate-encoded bitmaps — are left completely untouched. Writing a
safe, correct decoder for each of those client-side in the time available
was judged too risky (a bug there could corrupt the PDF, which is worse
than a smaller compression win) versus the payoff. A PDF made entirely of
non-JPEG images may see little or no reduction from this tool. This is the
direct, honest consequence of the architecture deviation above: a real
Ghostscript pipeline would handle all of these; this client-side approach
deliberately doesn't attempt what it can't do safely.

Code exists for:

- `src/lib/pdf-compressor/compress.ts` — the core algorithm described
  above, environment-agnostic (like the Merger's `mergePdfs`) via an
  injected `JpegReencoder` function, low-level `pdf-lib` object
  manipulation (`PDFRawStream`/`PDFDict`/`PDFName`/`PDFContext`) verified
  against the actual installed package source before writing any code —
  **unit tested** (`src/tests/pdf-compressor.test.ts`, 11 tests)
- `src/lib/pdf-compressor/jpeg-reencoder.ts` — the real browser
  implementation of `JpegReencoder` (`createImageBitmap` +
  `OffscreenCanvas`), isolated in its own file so `compress.ts` stays
  Node-testable
- `src/lib/pdf-compressor/types.ts` — worker message types
- `src/workers/pdf-compressor.worker.ts` — thin shell wiring the real
  re-encoder into `compressPdf`, off the main thread
- `src/components/PdfCompressor.tsx` — upload (drag/drop + picker),
  content-level PDF validation (reuses `validateFileMeta`/
  `looksLikePdfContent` from `lib/pdf-merger/validation.ts` — imported,
  not duplicated), three-level picker (Extreme/Recommended/Low), truthful
  per-stage progress ("Analyzing PDF…" → "Optimizing images (N of
  M)…" → "Finalizing file…" — no fake percentage), a distinct
  "already well optimized" success state (not styled as an error, not
  styled as a normal success — its own honest state), Download
  (`compressed.pdf`, fixed filename), Compress Another PDF
- `src/app/pdf-compressor/page.tsx` — self-contained, same pattern as the
  Merger/Formatter pages
- One registry entry appended (reuses the existing `pdf-tools` category —
  no new category or hub needed since one already exists from the Merger)

**Real integration tests, not mocks**: `src/tests/pdf-compressor.test.ts`
embeds a genuine minimal JPEG and a genuine minimal PNG into real
documents via `pdf-lib`'s own `embedJpg`/`embedPng`, then runs the actual
`compressPdf` function against them — verifying the JPEG-only image
actually gets found and (with a synthetic shrinking re-encoder) actually
recompressed, that the PNG-derived image is never even attempted (proven
via a re-encoder that throws if called), that an equal-or-larger
re-encoded result is rejected, and that the "not beneficial" fallback
returns byte-for-byte the original file. All 11 tests passed on the first
real run — the low-level `pdf-lib` API assumptions (verified against the
actual package source before writing the code, same discipline as the
Merger's) held up in practice, not just in theory.

**A real bundle-size bug was avoided by reusing the fix pattern already
learned from the Merger**: `pdf-lib` is only ever loaded inside the
worker (via `compress.ts`/`jpeg-reencoder.ts`), never imported into the
client component — build output confirms `/pdf-compressor` at 100KB First
Load JS, matching `/pdf-merger`, not the 275KB regression that had to be
fixed there.

**A real TypeScript strict-mode error was caught and fixed by actually
running the build** (not assumed correct): `new Blob([jpegBytes], ...)`
failed to compile because this TS/lib version types `Uint8Array.buffer` as
`ArrayBufferLike` (which includes `SharedArrayBuffer`, not assignable to
`BlobPart`). Fixed with the same `.slice(...) as ArrayBuffer` pattern
already used elsewhere in the project for the same underlying reason.

### VERIFIED 2026-09-13 (real commands, same discipline as the other four tools)

- `npm install` — succeeds (no new dependency — reuses `pdf-lib`, already
  added for the Merger)
- `npm test` — **169/169 tests pass** (158 previous + 11 new), confirming
  no regression to PDF Merger or any other tool
- `npm run build` — succeeds, **21 routes** (20 previous + `/pdf-compressor/`).
  Same font-fetch sandbox limitation as every prior verification pass
  (unrelated network restriction) — same temporary stub-then-restore
  approach; `layout.tsx` restored to its real `next/font/google` calls
  immediately after. Caught and fixed a real TS compile error (above)
  before this passed.
- `npm run lint` — clean
- `npm run seo:check` — clean, **0 errors, 0 warnings across 11 tools**
- Security/privacy grep pass: no `eval`/`new Function`/`fetch`/`XHR`/
  analytics anywhere in the tool's code; no `FileReader.readAsDataURL`;
  the only `dangerouslySetInnerHTML` is the same pre-existing
  hand-authored-JSON-LD pattern; download filename is a fixed constant
  (`"compressed.pdf"`); object URL lifecycle confirmed on all four paths
  (new result replacing old, unmount, new file selected while a result
  existed, explicit reset); error messages never interpolate
  `err.message`/stack into what's shown to the user — confirmed by a
  passing test assertion, not just inspection.

### NOT verified — still requires a real browser/device

1. **Real-world compression ratios** — the algorithm is genuinely
   exercised in tests, but actual size reduction on real photos/scans at
   each of the three levels hasn't been measured.
2. **Real password-protected and encrypted PDF handling** — `{
   ignoreEncryption: false }` is used deliberately (per the brief: don't
   attempt to compress what wasn't decryptable), but a genuine
   password-protected real-world PDF hasn't been tried.
3. **CMYK and other browser-unfriendly JPEG variants inside a real PDF** —
   `jpeg-reencoder.ts` is written to return `null` (leave untouched) if
   `createImageBitmap` rejects a given embedded JPEG, but this fallback
   path itself hasn't been exercised against a real such file.
4. **Large PDF / memory behavior** — no stress test with a genuinely large
   (tens of MB) real-world image-heavy PDF has been run.
5. **Real mobile layout and touch interaction** at narrow widths,
   including the three-level picker's `grid-cols-3` collapsing behavior.
6. **Existing PDF Merger and JSON Formatter regression-free in a real
   browser** — confirmed at the test-suite level (169/169 still pass,
   nothing in either tool's files was touched), but not reconfirmed by
   actually using either tool in a browser after this change.

### PDF to JPG V1 — what's actually implemented (2026-09-14)

- New tool at `/pdf-to-jpg/`, registered in `tool-registry.ts` under the
  `pdf-tools` category, third tool in that category after PDF Merger and
  PDF Compressor.
- **New dependency: `pdfjs-dist`.** This is the first tool in the project
  that rasterizes a PDF page to pixels — `pdf-lib` (used by PDF Merger and
  PDF Compressor) only manipulates PDF structure and has no renderer at
  all, so there was no existing capability being duplicated. See the
  decision log (Section 19) for the full reasoning.
- Architecture mirrors PDF Merger/PDF Compressor: main thread does file
  validation (`looksLikePdfContent`/`validateFileMeta`, reused directly
  from `lib/pdf-merger/validation.ts`) and a quick `pdf-lib` page-count
  read; the actual conversion runs in a dedicated Worker
  (`src/workers/pdf-to-jpg.worker.ts`).
- `src/lib/pdf-to-jpg/`:
  - `types.ts` — worker message protocol, quality/resolution enums and
    their internal encoder values.
  - `validation.ts` — page-range parsing (`"1-3, 5, 8"` syntax), safe
    output-filename derivation, and the file-validation re-export from
    `pdf-merger`.
  - `convert.ts` — environment-agnostic orchestration (page selection,
    progress sequencing, per-page streaming via an `onPage` callback,
    error handling). Takes an injected `PdfOpener` so it has no
    dependency on any browser API and can be unit-tested with a
    synthetic fake renderer.
  - `render.ts` — the real renderer: `pdfjs-dist` + `OffscreenCanvas`
    inside the worker, JPEG-encoded via `canvas.convertToBlob`. Not
    unit-tested (requires a real canvas/renderer); covered by manual QA
    instead.
- `pdfjs-dist`'s worker bundle (`pdf.worker.min.mjs`) is copied into
  `public/pdfjs/` by a new `postinstall` script
  (`scripts/copy-pdf-worker.js`) and referenced by a plain same-origin
  path (`/pdfjs/pdf.worker.min.mjs`), rather than bundled by webpack via
  `new URL(..., import.meta.url)` — that pattern made webpack try to
  parse the worker file as a module and fail the build (it's a
  self-contained bundle with an embedded WASM JPX/OpenJPEG decoder, not
  meant to be re-parsed by another bundler). Static-asset serving keeps
  everything same-origin (no CDN, no network call) while avoiding that
  failure.
- UI (`src/components/PdfToJpg.tsx`): upload → filename/size/page-count →
  Quality (High/Recommended/Small) and Resolution (Standard/High/Very
  High) pickers → optional page selection (All pages, or a page-range
  input) → Convert → staged progress text (`Reading PDF…` →
  `Preparing pages…` → `Converting page N of M…` → `Preparing
  downloads…`) → results grid with per-page previews, individual
  downloads, and a "Download All JPGs" ZIP (via the same lazy-loaded
  `jszip` pattern as Image Compressor) → "Convert another PDF".
- Pages are streamed to the UI one at a time as the worker finishes them
  (not held until the whole document completes), and each page's
  `ArrayBuffer` is transferred (zero-copy) out of the worker, so a large
  multi-page document doesn't require holding every page's JPEG bytes in
  the worker simultaneously.
- Output filenames follow the brief's convention exactly:
  `document-page-1.jpg`, `document-page-2.jpg`, etc. — derived through
  `safeBaseName`, which strips path-like segments and disallowed
  characters before use (defense in depth; browsers don't expose a real
  path via `File.name`, but nothing here trusts it regardless).
- Page-range parsing (`parsePageRange`) only accepts simple comma-separated
  single pages and `start-end` ranges, validated against the document's
  real page count, capped at 300 pages per conversion — anything else is
  a clear validation error rather than an attempt at fancier parsing, per
  the brief's explicit instruction not to let this delay or destabilize
  the "all pages" path.
- Transparent regions are filled white before rendering (JPEG has no
  alpha channel; an unpainted canvas defaults to transparent black, which
  would otherwise encode as solid black).
- Errors are worded for people, not developers, throughout (`"Couldn't
  read this PDF. It may be corrupt, password-protected, or
  unsupported."`, `"This page is too large to render at the selected
  resolution. Try a lower resolution."`, etc.) — no raw stack traces or
  library error text reaches the UI.

### VERIFIED 2026-09-14 (real commands, same discipline as the other tools)

- `npm install` — succeeded; `postinstall` correctly copied
  `pdf.worker.min.mjs` into `public/pdfjs/`.
- `npx vitest run` — **198/198 tests pass** (169 existing + 29 new for
  `pdf-to-jpg`), including the pre-existing PDF Merger, PDF Compressor,
  JSON Formatter, Image Compressor/Resizer, and Percentage Calculator
  suites — confirmed regression-free.
- `npx tsc --noEmit` — clean.
- `npx eslint .` — 0 errors, 0 warnings (the `<img>`-for-a-blob-URL
  preview is suppressed with the same justified inline exception already
  used by Image Compressor).
- `npx tsx scripts/validate-seo.ts` — 0 errors, 0 warnings across all 13
  tools.
- `npx next build` — **succeeds**, `/pdf-to-jpg` route generated
  statically (5.1 kB page, 101 kB First Load JS — in line with the other
  PDF tools). Fonts were temporarily stubbed to work around this
  sandbox's lack of network access to `fonts.googleapis.com` (documented
  sandbox limitation, see the 2026-09-13 verification session entry
  below) and restored immediately after — `layout.tsx` is unchanged from
  before this session. The pre-existing, already-documented "Circular
  dependency between chunks with runtime" warning still appears and is
  unrelated to this change (see Section 19).

### NOT verified — still requires a real browser/device

1. **Actual rendering fidelity** — `render.ts` is the one file in this
   feature with no automated test coverage (needs a real
   `OffscreenCanvas` + `pdfjs-dist` render pipeline). Needs manual
   verification against: text PDFs, image-heavy PDFs, vector-graphics
   PDFs, scanned PDFs, mixed portrait/landscape pages, and multi-page
   documents — confirming aspect ratio is preserved (no cropping or
   stretching) and output JPGs open correctly outside the browser.
   **(Updated 2026-09-15)** This specifically includes confirming the
   `standardFontDataUrl`/`cMapUrl` fix for the reported
   text-replaced-by-a-symbol bug actually resolves it in a real browser
   — this file has no automated coverage, so manual confirmation is the
   only verification available for that fix.
2. **Quality/Resolution settings producing visibly sensible differences**
   across all three levels of each.
3. **Page-range input UX** in a real browser (e.g. `"1-3, 5, 8"`).
4. **Large/multi-page PDF memory and responsiveness** — no stress test
   with a genuinely large (100+ page or scanned, tens-of-MB) real-world
   PDF has been run; the streaming-per-page design is reasoned through,
   not measured.
5. **Download All ZIP correctness** with real generated JPGs, and
   individual downloads, on both desktop and mobile browsers.
6. **Real mobile layout and touch interaction**, including the results
   grid's responsive column collapsing.
7. **Network verification that the PDF is never uploaded** (brief asks
   for this to be manually confirmed via browser/network inspection).
8. **Existing PDF Merger, PDF Compressor, JSON Formatter, Image
   Compressor/Resizer, and Percentage Calculator regression-free in a
   real browser** — confirmed at the test-suite level (198/198 pass,
   none of their files were touched), not reconfirmed by hand.

### PDF Splitter V1 — what's actually implemented (2026-09-15)

- New tool at `/pdf-splitter/`, registered in `tool-registry.ts` under
  `pdf-tools`, fourth tool in that category.
- No new dependency — reuses `pdf-lib` exactly as PDF Merger does, via
  `copyPages` structural copying (not rasterization), so output pages
  keep their original text selectability, fonts, and links.
- Two modes: **Individual pages** (one output PDF per page — the
  default) and **Custom ranges** (user-defined comma-separated groups,
  e.g. `"1-3, 4-6, 10"`, where each group becomes its own output file —
  three groups here means three files, not one 7-page file).
- `src/lib/pdf-splitter/`:
  - `types.ts` — worker message protocol.
  - `validation.ts` — range-group parsing (`parseSplitRanges`, deliberately
    the same simple grammar as PDF to JPG's page-range parser, but each
    token becomes a *separate output* rather than a flattened combined
    list), safe filename derivation (kept identical to PDF to JPG's
    `safeBaseName` rule, not re-derived differently).
  - `split.ts` — the actual split logic, environment-agnostic (no DOM, no
    File/Blob), mirroring `pdf-merger/merge.ts`'s pattern exactly, so it
    runs identically in the Worker and directly in Vitest under Node.
- UI (`src/components/PdfSplitter.tsx`) follows the same shape as PDF to
  JPG: upload → filename/size/page-count → mode picker → optional
  range input → Split → staged progress text → results list with
  per-file download links and a "Download All PDFs" ZIP (same lazy
  `jszip` pattern) → "Split another PDF".
- A one-page PDF is explicitly rejected with a clear message ("nothing to
  split") rather than silently producing one identical output file.
- Output filenames: `document-page-3.pdf` for individual pages,
  `document-pages-4-6.pdf` (or `document-pages-10.pdf` for a single-page
  group) for custom ranges — self-explanatory without opening the file.

### VERIFIED 2026-09-15 (real commands, same discipline as every prior tool)

- `npm install` — succeeded.
- `npx vitest run` — **225/225 tests pass** (27 new for `pdf-splitter`,
  including real `pdf-lib`-generated PDF fixtures verifying actual page
  identity/order after splitting — not mocked — plus all 198 existing
  tests, confirming no regressions).
- `npx tsc --noEmit` — clean.
- `npx eslint .` — 0 errors, 0 warnings.
- `npx tsx scripts/validate-seo.ts` — 0 errors, 0 warnings, 13 tools.
- `npx next build` — succeeds; `/pdf-splitter` generated statically
  (4.75 kB page, 101 kB First Load JS — in line with the other PDF
  tools). Fonts stubbed only for this sandbox's lack of network access to
  `fonts.googleapis.com`, then restored and diff-confirmed unchanged. The
  pre-existing "Circular dependency between chunks" warning still appears
  and is unrelated (documented since 2026-09-13).

### NOT verified — still requires a real browser/device

1. **Real mobile layout and touch interaction**, including the results
   list and mode picker at narrow widths.
2. **Download All ZIP correctness** with real split outputs, and
   individual downloads, on desktop and mobile browsers.
3. **Large/many-page PDF behavior** — no stress test with a genuinely
   large real-world PDF (e.g. splitting into 100+ individual pages) has
   been run in an actual browser.
4. **Network verification that the PDF is never uploaded** (should be
   manually confirmed via browser/network inspection, same as every
   other tool here).
5. **Custom-range input UX** in a real browser (e.g. typing `"1-3, 4-6,
   10"`, correcting a mistake, seeing the live error).
6. **Existing PDF Merger, PDF Compressor, PDF to JPG, JSON Formatter,
   Image Compressor/Resizer, and Percentage Calculator regression-free in
   a real browser** — confirmed at the test-suite level (225/225 pass,
   none of their files were touched), not reconfirmed by hand.

### JPG to PDF V1 — what's actually implemented (2026-09-15)

- New tool at `/jpg-to-pdf/`, registered in `tool-registry.ts` under
  `pdf-tools`, fifth tool in that category — closes the PDF cluster loop
  (compress / merge / split / convert both directions).
- No new dependency — uses `pdf-lib`'s `embedJpg`/`embedPng` only, the
  same dependency PDF Merger and PDF Splitter already use. Images are
  embedded using their original encoded data (not re-rendered or
  re-compressed), so quality is preserved exactly aside from any scaling
  applied for a standard page size.
- Multi-file queue UI directly modeled on PDF Merger's: add images (drag
  or picker), reorder with ▲/▼ (reusing `moveUp`/`moveDown` from
  `pdf-merger/validation.ts` unchanged), remove individual images, "Add
  more images", per-item thumbnail preview (`URL.createObjectURL`, revoked
  on removal/reset/unmount).
- Real content validation: `detectImageKind` checks actual JPEG/PNG magic
  bytes (`0xFFD8FF` / the 8-byte PNG signature) rather than trusting
  file extension or browser-reported MIME type — same discipline as
  every other tool's `looksLikePdfContent`/content-sniffing.
- Three page-size modes:
  - **Fit to image** (default) — the output page exactly matches each
    image's own pixel dimensions (treated 1:1 as PDF points), full-bleed,
    no scaling. Simplest, least surprising default.
  - **A4** / **Letter** — standard sizes in PDF points, image scaled down
    (never up — avoids visibly blurring a small image stretched to fill
    a page) to fit within a fixed margin while preserving aspect ratio,
    and centered. Page orientation follows each image individually (a
    landscape photo gets a landscape page), so a mixed batch produces
    mixed page orientations — this is intentional, not a bug.
- `src/lib/jpg-to-pdf/`:
  - `types.ts` — worker message protocol, `PageSizeMode`/`ImageKind`
    enums.
  - `validation.ts` — file/batch validation and real image-content
    detection; re-exports `MAX_FILE_COUNT`/`moveUp`/`moveDown` directly
    from `pdf-merger/validation.ts` since queue reordering is identical
    logic, not re-implemented.
  - `convert.ts` — the actual embedding logic, environment-agnostic (no
    DOM/File/Blob), mirroring `pdf-merger/merge.ts` and
    `pdf-splitter/split.ts`'s pattern exactly.
- Errors name the specific failing file (`Couldn't read "broken.jpg". It
  may be corrupt or an unsupported image variant.`) and stop the batch
  there, consistent with PDF Merger's own per-file error reporting — not
  silently skipped or attempted for the rest.
- Output filename: the single image's own name (e.g. `photo.pdf`) for a
  one-image conversion, or `images.pdf` for a multi-image batch.

### VERIFIED 2026-09-15 (real commands, same discipline as every prior tool)

- `npm install` — succeeded.
- `npx vitest run` — **247/247 tests pass** (22 new for `jpg-to-pdf`,
  including real `pdf-lib` embed round-trips against genuine minimal
  JPEG/PNG fixtures — not mocked — plus all 225 existing tests,
  confirming no regressions).
- `npx tsc --noEmit` — clean.
- `npx eslint .` — 0 errors, 0 warnings.
- `npx tsx scripts/validate-seo.ts` — 0 errors, 0 warnings, 14 tools.
- `npx next build` — succeeds; `/jpg-to-pdf` generated statically
  (4.72 kB page, 101 kB First Load JS — in line with the other PDF
  tools). Fonts stubbed only for this sandbox's lack of network access to
  `fonts.googleapis.com`, then restored and diff-confirmed unchanged. The
  pre-existing "Circular dependency between chunks" warning still appears
  and is unrelated (documented since 2026-09-13).

### NOT verified — still requires a real browser/device

1. **Real rendering of the A4/Letter scaling and centering** — the math
   is unit-tested against a 1x1 pixel fixture (confirming page
   dimensions), but visual correctness with real, differently-sized
   photos (including a mix of portrait and landscape in one batch) needs
   a real browser.
2. **Real mobile layout and touch interaction**, including the
   thumbnail-preview queue and reorder buttons at narrow widths.
3. **Drag-and-drop and multi-select file picker behavior** with real
   images on desktop and mobile.
4. **Large-batch behavior** — no stress test with a genuinely large
   number of full-resolution real photos (memory, responsiveness,
   conversion time) has been run in an actual browser.
5. **Network verification that images are never uploaded** (should be
   manually confirmed via browser/network inspection, same as every
   other tool here).
6. **Output PDF quality/fidelity** — confirming embedded JPEGs/PNGs open
   correctly and look correct (no color shift, no corruption) in a real
   PDF viewer, for real-world photos and scans (not just the 1x1 test
   fixtures used in automated tests).
7. **Existing PDF Merger, PDF Compressor, PDF to JPG, PDF Splitter, JSON
   Formatter, Image Compressor/Resizer, and Percentage Calculator
   regression-free in a real browser** — confirmed at the test-suite
   level (247/247 pass, none of their files were touched), not
   reconfirmed by hand.

### Word Counter V1 — what's actually implemented (2026-09-15)

- New tool at `/word-counter/`, first tool in a **new `text-tools`
  category** (see decision log for why a new category was added). New
  `/text-tools/` hub page created, mirroring `developer-tools`'s hub
  exactly. A "Text Tools" nav link was added to `layout.tsx` — the one
  deliberate exception to every prior tool's "don't touch shared files"
  discipline, because a genuinely new top-level category needs a nav
  entry to be reachable; no other part of `layout.tsx` was touched.
- No new dependency, no worker — pure synchronous string logic
  (`src/lib/word-counter/stats.ts`), computed live via `useMemo` on every
  keystroke. This is a deliberate departure from every PDF/image tool's
  worker-based architecture: counting words in even multi-page text is a
  handful of regex passes, cheap enough that a worker would add
  complexity without a real performance benefit — see decision log.
- Live stats shown: words, characters (with spaces), characters (without
  spaces), sentences, paragraphs, estimated reading time (~200 wpm), and
  estimated speaking time (~130 wpm).
- Sentence counting was improved (2026-09-15, same day) beyond a blind
  punctuation split: it now recognizes common abbreviations ("Mr.",
  "Dr.", "Inc.", "etc.", months/days, and more) via a curated list, plus
  a general "initials" pattern (single letters separated by periods —
  "U.S.", "e.g.", "J.K.") that catches many two-letter abbreviations
  without needing each one individually listed. Paragraph counting
  remains a simple blank-line split. Neither is real natural-language
  processing — deliberately, not an oversight; see the code comments,
  FAQ, and edge-case notes, all of which say so plainly, including the
  specific remaining tradeoff (a sentence that genuinely ends in a
  recognized abbreviation is undercounted, since the algorithm can't
  distinguish that case from the far more common "abbreviation
  mid-sentence" case).
- No file upload at all in this tool — text is typed or pasted directly
  — so there's no file-validation surface, batch handling, or worker
  message protocol to speak of, unlike every prior tool.

### VERIFIED 2026-09-15 (real commands, same discipline as every prior tool)

- `npm install` — succeeded.
- `npx vitest run` — **264/264 tests pass** (17 new for `word-counter`,
  covering the sentence/paragraph heuristics' documented edge cases —
  trailing fragments, no terminal punctuation, multiple blank lines,
  hyphenated words — plus all 247 existing tests, confirming no
  regressions).
- `npx tsc --noEmit` — clean.
- `npx eslint .` — 0 errors, 0 warnings.
- `npx tsx scripts/validate-seo.ts` — 0 errors, 0 warnings, 15 tools.
- `npx next build` — succeeds; `/word-counter` (1.13 kB page, 97.4 kB
  First Load JS — smaller than every PDF tool, as expected with no
  worker/pdf-lib) and `/text-tools` both generated statically. Fonts
  stubbed only for this sandbox's lack of network access to
  `fonts.googleapis.com`, then restored — confirmed the restored file
  still contains the real font imports AND the new nav link (not
  accidentally reverted along with the stub). The pre-existing "Circular
  dependency between chunks" warning still appears and is unrelated
  (documented since 2026-09-13).

### VERIFIED 2026-09-15, second pass (sentence-counting improvement)

- `npx vitest run` — **273/273 tests pass** (9 new tests added for the
  abbreviation/initials heuristic — titles, e.g./i.e., a.m./p.m.,
  multi-letter initials, U.S.-style initialisms, decimals, and the
  documented undercounting tradeoff itself — plus all 264 prior tests).
- `npx tsc --noEmit` — clean.
- `npx eslint .` — 0 errors, 0 warnings.
- `npx tsx scripts/validate-seo.ts` — 0 errors, 0 warnings, 15 tools.
- `npx next build` — succeeds; `/word-counter` now 1.48 kB / 97.8 kB
  First Load JS (up slightly from the abbreviation list, still far
  smaller than any PDF tool). Fonts stubbed/restored the same way as
  every prior build verification in this project; confirmed unchanged
  afterward.


### NOT verified — still requires a real browser/device

1. **Real typing/paste responsiveness** — the "no worker needed"
   decision is reasoned through and unit-tested for correctness, but
   actual UI responsiveness while typing/pasting very large blocks of
   text (multi-megabyte pastes) hasn't been measured in a real browser.
2. **Real mobile layout and touch interaction**, including the stats
   grid's responsive column collapsing at narrow widths.
3. **Textarea behavior across browsers** (autocapitalize/autocorrect
   interference on mobile, IME composition for non-Latin scripts, etc.).
4. **New nav link and `/text-tools/` hub page** — confirmed to build and
   type-check, not confirmed by clicking through a real browser.
5. **Existing PDF Merger, PDF Compressor, PDF to JPG, PDF Splitter, JPG
   to PDF, JSON Formatter, Image Compressor/Resizer, and Percentage
   Calculator regression-free in a real browser** — confirmed at the
   test-suite level (264/264 pass, none of their files were touched
   except the single additive nav-link line in `layout.tsx`), not
   reconfirmed by hand.

### Social Media Tools cluster — built but previously undocumented here (audited 2026-09-18)

**This entire cluster was live in the registry and shipped, but this file
never got a status entry for it — found and corrected during an SEO audit
pass.** Do not treat its prior absence from this section as evidence it
wasn't built; the registry and `src/app/` were the source of truth, and
this file had drifted from them.

New `social-media-tools` category, six tools, all `indexable: true`,
template-based generation (curated sentence/hashtag templates filled from
the user's own topic — no LLM, no backend, no API call, consistent with
this project's zero-backend architecture):

- `instagram-hashtag-generator` — `/instagram-hashtag-generator/`
- `instagram-caption-generator` — `/instagram-caption-generator/`
- `youtube-title-generator` — `/youtube-title-generator/`
- `youtube-description-generator` — `/youtube-description-generator/`
- `tiktok-caption-generator` — `/tiktok-caption-generator/`
- `social-media-bio-generator` — `/social-media-bio-generator/`

Plus a `/social-media-tools/` category hub, mirroring the other hub pages.

Corresponding logic modules exist under `src/lib/social/` (`hashtags.ts`,
`captions.ts`, `titles.ts`, `youtube-description.ts`, `tiktok.ts`,
`bio.ts`, `keywords.ts`) and components under `src/components/`
(`InstagramHashtagGenerator.tsx`, `InstagramCaptionGenerator.tsx`,
`YoutubeTitleGenerator.tsx`, `YoutubeDescriptionGenerator.tsx`,
`TiktokCaptionGenerator.tsx`, `SocialBioGenerator.tsx`), with test files
present (`social-hashtags.test.ts`, `social-captions.test.ts`,
`social-titles.test.ts`, `social-youtube-description.test.ts`,
`social-tiktok.test.ts`, `social-bio.test.ts`).

**Total registry count is 21 tools** (not 15 — the count this file's Word
Counter section left as the last documented figure), confirmed by
counting `slug:` entries directly in `src/lib/tool-registry.ts`.

**Not confirmed by this audit (no network/browser access in the auditing
sandbox):** `npm test`/`npm run build`/`npm run seo:check` were not
re-run, so pass/fail counts for this cluster specifically cannot be
restated here — re-run those commands locally and update this section
with real output before calling the cluster verified, per this file's own
Section 22 discipline (don't record a status without checking the source
first). This section itself only reflects static inspection: files exist,
the registry entry exists, `indexable: true` is set, and internal linking
among the six tools was present and reasonable at read-time (see the
Internal Linking Audit entry below for the one gap found in this pass).

### Internal Linking Audit (2026-09-18)

Audited every tool's `relatedTools` array against the brief's step-14
priority ("go hard" on internal linking, no dead-end pages). Found one
real one-directional gap: **PDF Merger had `relatedTools: []`** despite
every other PDF-cluster tool (PDF Compressor, PDF to JPG, PDF Splitter,
JPG to PDF) already linking to it. Fixed by adding
`["pdf-splitter", "pdf-compressor", "jpg-to-pdf", "pdf-to-jpg"]` to PDF
Merger's `relatedTools` — a metadata-only change (no new page, no
fabricated content, only connecting existing indexed tools to each
other), so it doesn't conflict with Section 9's one-tool-at-a-time
discipline. `pdf-merger.relatedTools` was the only empty array among
tools that have real sibling tools available to link to; `percentage-
calculator`, `json-formatter`, and `word-counter` remain intentionally
`[]` since each is currently the only tool in its category — not a bug,
just nothing to link to yet.

**Verification note:** `npm run seo:check` should be re-run after this
change to confirm no dead-slug regression was introduced (the added
slugs — `pdf-splitter`, `pdf-compressor`, `jpg-to-pdf`, `pdf-to-jpg` — were
manually cross-checked against existing registry `slug:` entries during
this audit and all four exist, but the validator itself was not run in
this sandbox).

### Known issues / TODOs (do not treat as done)

1. **Resolved 2026-09-16** (previously: `site-config.ts` had a
   placeholder domain, `https://www.example-utilsite.com`, and the whole
   project still carried "Utilsite" branding from before the Nimlyx Do
   rename). Fixed as part of the production rebrand + launch-readiness
   pass: `site-config.ts` now points at the real live deployment,
   `https://nimlyx-do.vercel.app`, and `name`/`shortName`/`twitterHandle`
   all say Nimlyx Do. `package.json`'s `name` field and this file's own
   Section 1 identity line were updated too. See the 2026-09-16 decision
   log entry and change log for the full rebrand scope and what remains
   a known limitation (the domain is the Vercel preview URL, not a
   custom domain — a custom domain, if one is ever bought, will need
   this same file updated again).
2. Footer has no About/Privacy/Terms links — intentional for now (comment
   in `layout.tsx` explicitly avoids linking to pages that don't exist
   yet), but must be addressed before serious public launch/monetization.
3. No OG image configured yet (for the site generally or any tool page).
4. No backend/API, no database, no accounts, no ads, no premium tier —
   none of this exists, and none of it is planned for V1. This includes
   an explicit, documented decision that PDF Compressor and PDF to JPG
   both stay entirely client-side rather than gaining a backend — see
   the decision log.
5. Per the user's explicit 2026-09-15 confirmation, the first five tools
   (Percentage Calculator, Image Compressor, Image Resizer, JSON
   Formatter, PDF Merger) have passed manual QA. PDF Compressor V1, PDF
   to JPG V1, PDF Splitter V1, JPG to PDF V1, and Word Counter V1 have
   **not** been separately confirmed by the user and should not be
   described as QA'd until they are — all five pass their automated
   quality gate (build/tests/lint/SEO all green) but that is not the
   same thing. See each tool's "NOT verified" list above.
6. PDF to JPG has no per-page fault tolerance — if any single selected
   page fails to render, the whole conversion is reported as failed
   rather than returning the pages that did succeed. Documented as a
   first-version limitation, not an oversight.
7. `pdfjs-dist`'s worker bundle, standard font data, and CMap data
   (`public/pdfjs/{pdf.worker.min.mjs,standard_fonts/,cmaps/}`) are all
   generated/copied files (via the `postinstall` script) — if a future
   `pdfjs-dist` version bump changes any of these paths within the
   package, `scripts/copy-pdf-worker.js` will need updating too.
8. PDF Splitter's custom-range parser only accepts simple single
   pages/ranges (no open-ended ranges, no reordering within a range) —
   same deliberate simplicity as PDF to JPG's page-range parser.
9. JPG to PDF has no per-image fault tolerance either — one bad image
   fails the whole batch, same documented tradeoff as PDF to JPG and PDF
   Splitter, for the same reason (simpler, honest failure mode over
   partial-success complexity in V1).
10. The PDF tool cluster (Compressor/Merger/Splitter/PDF↔JPG conversion
    both directions) is now feature-complete per Section 18's original
    list — any further PDF tool would be a new addition beyond that
    original scope, not a gap-fill.
11. Word Counter's sentence-counting heuristic now recognizes common
    abbreviations and initials (see the 2026-09-15 decision log entry),
    so the earlier over-counting on things like "Dr. Smith" is fixed.
    The remaining, documented tradeoff is the opposite case: a sentence
    that genuinely ends in a recognized abbreviation (e.g. "...at 9
    a.m. Everyone left.") is undercounted, since the algorithm can't
    distinguish that from the far more common "abbreviation
    mid-sentence" case. Not a bug to silently fix later without
    reconsidering the whole approach (true sentence-boundary detection is
    a much bigger scope than this V1) — documented in the FAQ.

Do not describe anything above as "done" until the code actually reflects it.

---

## 17. Current Next Step

**User-confirmed manual QA (2026-09-15):** the user confirmed the first
five tools (Percentage Calculator, Image Compressor, Image Resizer, JSON
Formatter, PDF Merger) passed manual QA successfully, and explicitly
authorized starting a new tool without waiting on further confirmation
for PDF Compressor V1 / PDF to JPG V1 specifically. Recorded here and in
the decision log rather than silently overriding Section 9's "one tool at
a time" rule — this is the user's explicit call, not an assumption.

**Now building: PDF Splitter** (see Section 19 decision log for why this
tool was chosen). Per Section 9, this is the one tool in flight — no
further new tool should start until PDF Splitter clears its own quality
gate.

**PDF Splitter V1 now built, verified (build/tests/lint/SEO all green,
225/225 tests passing), and complete per its own scope.** Per Section 9,
**do not start an eighth tool until PDF Splitter has been through manual
QA** (checklist below) or the user gives explicit authorization to
proceed, the same way they did for the first five tools.

**JPG to PDF V1 now built, verified (build/tests/lint/SEO all green,
247/247 tests passing), and complete per its own scope.** This closes
the PDF cluster loop (compress/merge/split/convert both directions). Per
Section 9, **do not start a ninth tool until JPG to PDF has been through
manual QA**, or the user gives explicit authorization the same way they
did to start this one.

**Word Counter V1 now built, verified (build/tests/lint/SEO all green,
264/264 tests passing), and complete per its own scope.** This is the
first tool in a new `text-tools` category (see Section 19 decision log).
Per Section 9, **do not start a tenth tool until Word Counter has been
through manual QA**, or the user gives explicit authorization the same
way they did to start this one.


**PDF Compressor specifically also needs a product-level decision from the
user, not just QA**: it was built 100% client-side instead of the
server-side (Ghostscript-class) pipeline its build brief originally
requested, because this project has no backend and every other tool
promises files never leave the browser — see the decision log. This
client-side approach only recompresses plain-JPEG (`DCTDecode`) images and
does real but comparatively modest structural optimization; it won't
achieve the size reductions a true Ghostscript pipeline would on PDFs
dominated by other image encodings or heavy font embedding. If the real
compression ratios seen during manual QA aren't strong enough, revisiting
whether this project should introduce a backend at all is a deliberate
architecture call for the user to make explicitly — not something to
silently work around in a future tool brief.

Image Compressor QA — in priority order:

1. Upload a real EXIF-rotated phone photo (e.g. an iPhone portrait shot) —
   confirm it comes out upright, not rotated.
2. Compress a real JPEG and a real PNG with target-size ON at 50KB — check
   DevTools Network tab shows zero requests carrying image data.
3. Try the 25MB / 8000×6000-ish stress case if a large test image is
   available — confirm no crash/freeze, confirm it pre-scales as expected.
4. Try an intentionally impossible target (e.g. 1KB on a busy photo) —
   confirm it returns a "couldn't reach target" result rather than lying
   about the size.
5. Test on a real mobile browser at a narrow width — dropzone, buttons,
   Download all usable with touch.
6. Try PNG specifically — confirm the WASM optimizer actually runs (not
   silently falling back to something else) and produces a real size
   reduction.
7. Drop an unsupported file (e.g. a `.gif`) and a 0-byte file — confirm the
   friendly per-file error shows and the rest of a mixed batch still
   processes.

Image Resizer QA — in priority order:

1. Upload a real EXIF-rotated phone photo — confirm it resizes upright.
2. Type in the width field with aspect ratio locked — confirm the height
   field updates smoothly and lands on the same value
   `resolveTargetDimensions` would compute (spot-check a couple of values).
3. Unlock the aspect ratio, set width and height independently to values
   that don't match the original proportions — confirm the output is
   visibly stretched (this is expected/correct, not a bug) and that
   locking again re-syncs the fields sensibly.
4. Try an upscale (e.g. resize a 400×300 image to 2000×1500) — confirm it
   completes and looks like an upscale (soft, not corrupted).
5. Try PNG output specifically — confirm oxipng actually runs.
6. Try a corrupt/0-byte/unsupported file — confirm the friendly error
   shows, not a stack trace.
7. Mobile at a narrow width — Select Image button, width/height fields,
   the lock toggle, and Download are all usable with touch.

JSON Formatter & Validator QA — in priority order:

1. Paste genuinely invalid JSON (missing comma, trailing comma, unterminated
   string) in a real browser and confirm the line/column shown actually
   points at the right spot — not just that a number is shown.
2. Try the same invalid-JSON cases in Safari and/or Firefox specifically —
   confirm the "no line/column when the engine doesn't provide one"
   fallback behaves correctly there too, since their error message formats
   differ from this environment's V8.
3. Click Copy — confirm the clipboard actually receives the result and the
   "Copied" label appears/reverts correctly.
4. Click Download after Format and after Minify — confirm the file actually
   downloads as `formatted.json` / `minified.json` with correct content.
5. Test Ctrl/Cmd+Enter in the input textarea — confirm it triggers Format
   and doesn't get intercepted by the browser/OS first.
6. Paste a large but realistic JSON payload (a few hundred KB to a couple
   MB) — confirm formatting still feels instant, no jank.
7. Mobile at a narrow width — confirm the input/output textareas stack
   sensibly and all buttons are usable with touch.

PDF Merger QA — in priority order:

1. Merge 3+ real PDFs of different page counts — confirm the final page
   count and order match what was set in the UI (the underlying algorithm
   is genuinely tested, but the full browser-to-worker path isn't).
2. Reorder with the up/down buttons, including on a real mobile touch
   screen — confirm it's usable and the merged output reflects the final
   order shown.
3. Try a genuinely corrupt file and a non-PDF file (e.g. rename a .txt to
   .pdf) — confirm a specific, friendly per-file error, and that removing
   it lets the rest of the batch still merge.
4. Try a real password-protected PDF — confirm it fails gracefully with a
   clear message rather than hanging or crashing.
5. Try a large PDF (tens of MB) and/or a full 30-file batch — confirm the
   page stays responsive (worker should keep the UI from freezing) and
   check DevTools Network tab shows zero requests carrying PDF data.
6. Confirm Download actually produces a valid `merged.pdf` that opens
   correctly in a real PDF viewer, with pages in the expected order.
7. Test Add more PDFs after an initial batch, and Start over — confirm
   state resets cleanly with no leftover object URLs (check DevTools memory
   /Network for stale blob: URLs).

PDF Compressor QA — in priority order:

1. Try each of the 14 cases the build brief listed: normal text PDF,
   image-heavy PDF, large PDF, very small PDF, already-compressed PDF,
   password-protected PDF, corrupted PDF, non-PDF renamed to `.pdf`, empty
   upload, oversized file, a PDF where compression doesn't help (confirm
   the "already well optimized" state, not a fake success), multiple
   compression attempts in a row, mobile layout, and — critically — that
   PDF Merger and JSON Formatter both still work with no regressions.
2. Confirm actual compression ratios at all three levels on a real
   image-heavy PDF (e.g. a scanned document or a PDF with several photos)
   — this is the main open question: is client-side JPEG recompression
   alone achieving a meaningful reduction, or does the real-world result
   suggest the backend question in Section 17's note above needs revisiting?
3. Open the downloaded `compressed.pdf` in a real PDF viewer and confirm
   it renders correctly — pages, text, and images all intact, nothing
   corrupted by the low-level object manipulation.
4. Check DevTools Network tab during a real compression run — confirm
   zero requests carrying PDF data, matching the client-side promise shown
   in the UI.
5. Try a PDF with non-JPEG images (e.g. one saved with PNG-sourced or
   scanned/fax-style images) — confirm those images are left untouched
   rather than the tool failing, and that the UI's messaging about partial
   compression makes sense in that case.
6. Mobile at a narrow width — confirm the three-level picker
   (`grid-cols-3`) doesn't feel cramped, and Compress/Download are usable
   with touch.

PDF to JPG QA — in priority order:

Basic
1. Upload a valid multi-page PDF — confirm filename, size, and page count
   display correctly.
2. Convert a one-page PDF and a multi-page PDF — confirm every page
   appears, in correct order, with real (non-placeholder) previews.
3. Download an individual page's JPG and confirm it opens correctly
   outside the app.
4. With multiple pages, use Download All JPGs — confirm the ZIP contains
   every page, correctly named (`document-page-1.jpg`, etc.), and each
   opens correctly.
5. Use Convert Another PDF and confirm state resets cleanly, with no
   leftover object URLs.

Rendering
6. Test a portrait PDF and a landscape PDF — confirm orientation and
   aspect ratio are preserved (no cropping, no stretching).
7. Test mixed page sizes/orientations in one document, if available.
8. Test a text-heavy PDF, an image-heavy PDF, a PDF with vector graphics,
   and a scanned PDF — confirm all produce real, correct-looking JPGs.
9. **(Added 2026-09-15, fixing a reported bug)** Test a PDF using plain,
   non-embedded standard fonts (e.g. a simple text document exported
   from a word processor using Helvetica/Times/Arial) — confirm all text
   renders as actual readable characters, not a placeholder/notdef
   symbol. This was broken before the `standardFontDataUrl`/`cMapUrl`
   fix; confirm it's genuinely fixed, not just no-longer-obviously-broken
   on the specific file used to diagnose it.
10. Test a PDF with non-Latin text or unusual embedded font encodings, if
    available — confirm characters render correctly rather than as
    placeholder symbols (this exercises the CMap data specifically).

Settings
11. Try High, Recommended, and Small JPG quality — confirm visibly sensible
    differences in file size/artifacting.
12. Try Standard, High, and Very High resolution — confirm visibly
    sensible differences in sharpness/dimensions.
13. Try a page-range selection (e.g. "1-3, 5, 8") — confirm only those
    pages convert, in the order given.

Privacy
14. Use DevTools Network tab during a real conversion — confirm zero
    requests carrying PDF or image data (this is an important product
    promise and should be manually verified, not assumed).

Mobile
15. Test the full workflow — upload, convert, preview, individual
    download, Download All, scrolling through results — on a real mobile
    browser.

Large files
16. Test a reasonably large/many-page PDF — observe memory usage,
    responsiveness (should stay unfrozen), conversion time, and confirm
    downloads still succeed.

Errors
17. Try a non-PDF file renamed to `.pdf`, an empty file, and (if available)
    a corrupted or password-protected PDF — confirm clear, friendly error
    messages rather than a crash or a raw stack trace.
18. Confirm PDF Merger, PDF Compressor, and JSON Formatter all still work
    with no regressions.

PDF Splitter QA — in priority order:

Basic
1. Upload a valid multi-page PDF — confirm filename, size, and page count
   display correctly.
2. Upload a one-page PDF — confirm the "nothing to split" message shows
   and no split can be attempted.
3. Split with "Individual pages" — confirm one file per page is
   produced, correctly named, in order.
4. Split with "Custom ranges" (e.g. "1-3, 4-6, 10") — confirm exactly
   three output files are produced with the right pages in each.
5. Download an individual output file and confirm it opens correctly and
   contains the expected page(s).
6. With multiple outputs, use Download All PDFs — confirm the ZIP
   contains every file, correctly named, and each opens correctly.
7. Use Split another PDF and confirm state resets cleanly, with no
   leftover object URLs.

Quality
8. Open a split output in a real PDF viewer and confirm the page(s)
   render correctly — text selectable, fonts/links/images intact,
   nothing corrupted by the structural copy.

Privacy
9. Use DevTools Network tab during a real split — confirm zero requests
   carrying PDF data.

Mobile
10. Test the full workflow — upload, mode selection, split, download,
    Download All — on a real mobile browser.

Large files
11. Test a PDF with many pages (e.g. splitting into 50+ individual
    pages) — observe responsiveness and confirm all downloads succeed.

Errors
12. Try a non-PDF file renamed to `.pdf`, an empty file, and (if
    available) a corrupted or password-protected PDF — confirm clear,
    friendly error messages.
13. Try an invalid custom range (e.g. a page beyond the document's last
    page, or garbage text) — confirm a clear inline error rather than a
    crash.
14. Confirm PDF Merger, PDF Compressor, PDF to JPG, and JSON Formatter
    all still work with no regressions.

JPG to PDF QA — in priority order:

Basic
1. Upload a single JPG and convert — confirm the output PDF opens
   correctly with that image on one page.
2. Upload multiple images (mix of JPG and PNG) — confirm they combine
   into one PDF, one image per page, in upload order.
3. Reorder images with ▲/▼ before converting — confirm the output page
   order matches the reordered queue, not the original upload order.
4. Remove an image from the queue before converting — confirm it's
   excluded from the output.
5. Download the resulting PDF and confirm it opens correctly outside the
   app.
6. Use Start over and confirm state resets cleanly, with no leftover
   object URLs (including thumbnail previews).

Page size
7. Try "Fit to image" — confirm each page exactly matches its image's
   own proportions, no unexpected cropping or letterboxing.
8. Try "A4" and "Letter" with a portrait photo and a landscape photo in
   the same batch — confirm each gets a correctly-oriented page, image
   centered, aspect ratio preserved, not stretched.
9. Try a very small image with "A4"/"Letter" — confirm it is not
   upscaled blurrily to fill the page.

Privacy
10. Use DevTools Network tab during a real conversion — confirm zero
    requests carrying image data.

Mobile
11. Test the full workflow — including drag-and-drop or multi-select
    from a phone's photo library, reordering, and download — on a real
    mobile browser.

Large batches
12. Test converting 20+ full-resolution real photos — observe
    responsiveness, conversion time, and confirm the download succeeds.

Errors
13. Try a non-image file renamed to `.jpg`, an empty file, and a
    corrupted image — confirm clear, friendly, file-specific error
    messages rather than a crash or a raw stack trace.
14. Confirm PDF Merger, PDF Compressor, PDF to JPG, PDF Splitter, and
    JSON Formatter all still work with no regressions.

Word Counter QA — in priority order:

Basic
1. Type a short sentence and confirm word/character/sentence/paragraph
   counts match manual counting.
2. Paste a large multi-paragraph block of real text (e.g. a news
   article) — confirm the UI stays responsive and counts look sensible.
3. Clear the text and confirm all stats reset to zero without lingering
   values.

Edge cases
4. Test text with multiple consecutive spaces/tabs between words —
   confirm word count doesn't over-count.
5. Test text with no ending punctuation — confirm sentence count is
   still sensible (should count as at least one sentence).
6. Test text with common abbreviations ("Dr. Smith", "Acme Inc.", "e.g.
   chips", "9 a.m.", "U.S. economy") — confirm they're correctly NOT
   split into extra sentences, and separately confirm the one remaining
   known tradeoff: a sentence that genuinely ends with one of these
   abbreviations may be undercounted (matches the FAQ).
7. Test multiple blank lines between paragraphs — confirm they don't
   inflate the paragraph count.

Privacy
8. Use DevTools Network tab while typing — confirm zero requests
   carrying any typed text.

Mobile
9. Test typing and pasting on a real mobile browser/keyboard, including
   autocorrect/autocapitalize behavior and the stats grid's layout at
   narrow widths.

Navigation
10. Confirm the new "Text Tools" nav link works and the `/text-tools/`
    hub page lists Word Counter correctly.
11. Confirm PDF Merger, PDF Compressor, PDF to JPG, PDF Splitter, JPG to
    PDF, and JSON Formatter all still work with no regressions.

---

## 18. Future Tool Clusters (not implementation targets — reference only)

- **Images:** Compressor, Resizer, Converter, Cropper, Optimizer, JPG↔PNG, WebP Converter
- **PDF:** Compressor, Merger, Splitter, PDF→JPG, JPG→PDF
- **Developer:** JSON Formatter/Validator, Base64 Encoder/Decoder, UUID Generator, Timestamp Converter, Regex utilities
- **Text:** cleanup, case conversion, word/character counting, Humanizer
- **General:** additional converters, generators, calculators

These are possibilities to evaluate later, not queued work.

---

## 19. Important Decisions Log

| Date | Decision | Reason | Alternatives considered | Consequences |
|---|---|---|---|---|
| 2026-09 (pre-existing) | Palette C — Midnight + Coral | Won a palette shootout (see tailwind.config.ts comment) for a dark, sophisticated utility feel | Ink+Electric, Deep Slate+Acid (both rejected) | All future tools should reuse these tokens rather than introduce new palettes |
| 2026-09-13 | PROJECT_CONTEXT.md created | Needed a durable, version-controlled source of truth so a new session/developer doesn't need the original conversation history | — | Must be kept current; treat as living documentation |
| 2026-09-13 | Image Compressor selected as next-tool candidate (not yet started) | Best score against the tool-selection criteria in Section 10 among the candidates considered | PDF Merger/Compressor (higher technical risk client-side), QR/Password Generator (weaker moat vs. chatbots, weaker cluster potential) | No image tooling exists yet; next work should begin with research/validation, not code |
| 2026-09-13 | Image Compressor V1 implemented per the strict build brief | Full scope: JPEG/PNG/WebP in and out, client-side worker pipeline, target-size search with dimension fallback, batch queue, Download All, 6 registry pages for distinct search intent | — | Code is written but **unverified** — no `npm install`/`npm test`/`next build`/browser access in this sandbox. See Section 16's "NOT verified" list. Treat as unshipped until that list is cleared |
| 2026-09-13 | PNG compression uses `@jsquash/png` (encode) + `@jsquash/oxipng` (optimize), lazily imported inside the worker | Native canvas PNG encoding is lossless and ignores `quality` entirely — a real optimizer was needed to make PNG "quality"/target-size compression meaningful, per build brief §8 | A single all-in-one WASM PNG codec (rejected: less commonly maintained); server-side PNG processing (rejected: violates the client-side-only privacy requirement) | Package export shapes are assumed, not confirmed (flagged in Section 16). If wrong, only `src/lib/image-compressor/png-encoder.ts` needs to change |
| 2026-09-13 | PNG compression uses `@jsquash/oxipng` alone (not `@jsquash/png` + `@jsquash/oxipng`) | After actually installing and reading the real package source, discovered `oxipng.optimise()` accepts `ImageData` directly and returns `ArrayBuffer` — the originally assumed two-package pipeline was based on a wrong guess about the API shape | Original two-package approach (removed: unnecessary once the real API was read) | `png-encoder.ts` rewritten; `@jsquash/png` removed from `package.json`; this is a verified fix, confirmed by a passing `npm run build` |
| 2026-09-13 | JPEG/WebP use native `OffscreenCanvas.convertToBlob`, no WASM codec | Build brief §7 explicitly requires zero WASM payload for the common-path formats | A unified WASM codec for all three formats (rejected: unnecessary bundle weight for JPEG/WebP, which browsers already encode natively) | Keeps the worker's non-PNG path dependency-free; only the PNG path pulls in WASM, and only when a PNG is actually queued — confirmed by build output showing image-tool pages at ~100KB First Load JS with no WASM in the initial bundle |
| 2026-09-13 | Fixed a pre-existing unrelated lint error in `src/app/page.tsx` (unescaped apostrophe) | It blocked `next build` for the entire site, not just the new pages — couldn't verify anything without it | Leaving it (rejected: would mean never actually confirming `next build` succeeds) | One-line, one-character change; unrelated to Image Compressor scope, noted here so it isn't mistaken for scope creep |
| 2026-09-13 | Image Resizer V1 built as a second, separate image tool | Small, well-scoped V1 per the build brief: exact-dimensions resize is a genuinely different job from the Compressor's "get under a file size", even though both are image tools | Folding resize into the Compressor as another mode (rejected: brief explicitly scoped this as its own tool; would also complicate the Compressor's batch/target-size UI for no benefit) | New `image-resizer` registry entry, route, worker, component; Compressor's own files were not modified, only imported from |
| 2026-09-13 | Image Resizer reuses `computeSafeDimensions` and `encodePng` from the Compressor's lib, unmodified | Both were already generic (not Compressor-specific); reimplementing them would be pure duplication the build brief explicitly warned against | Writing a second PNG encoder / dimension-safety check for the Resizer (rejected: no reason both tools shouldn't share this, and it keeps `@jsquash/oxipng`'s correctness fix from Section 16 automatically benefiting both tools) | Confirmed by build output: `/image-resizer/` bundles to the same ~100KB First Load JS profile as the Compressor pages, i.e. PNG WASM stays lazy here too |
| 2026-09-13 | Resize is an explicit action ("Resize image" button), not auto-triggered on every keystroke | Matches the build brief's discrete stage list (Reading → Calculating → Resizing → Encoding → Ready) more naturally than continuous re-resizing, and avoids wasted worker calls while the user is still typing | Auto-resize on input change with debounce (rejected: not requested, adds complexity/jank risk for no clearly stated benefit — kept the tool intentionally small per the brief's scope control) | Live UI feedback for the *locked-ratio derived field* still happens instantly (pure client-side math); only the actual resize+encode work is gated behind the explicit action |
| 2026-09-13 | JSON Formatter runs entirely synchronously on the main thread, no worker | `JSON.parse`/`JSON.stringify` at the enforced ~5MB input ceiling are genuinely near-instant; a worker would add message-passing complexity and latency for no real benefit, and the build brief explicitly said not to fake loading states | A worker matching the image-tools pattern (rejected: no expensive/blocking work exists here to move off the main thread) | Simplest possible implementation for this tool; if a much higher input ceiling is ever wanted later, revisit |
| 2026-09-13 | Line/column extraction prefers V8's own explicit `(line X column Y)` in the error message, falling back to computing it from a raw `position N` offset | Running the actual test suite against this environment's real Node/V8 showed the original assumption (only `position N` is ever given, needing manual line-counting) was incomplete — this V8 version already includes an explicit, more trustworthy line/column for most JSON syntax errors | Always deriving line/column manually from `position N` (rejected once it was clear V8 already computes this itself, more accurately, in many cases) | `format.ts` rewritten; a genuinely wrong test (`parseJson("{")` assumed to have no position) was also fixed to use the actual no-position case, `parseJson("")` — both confirmed by running `npm test`, not assumed |
| 2026-09-13 | New `developer-tools` category + `/developer-tools/` hub created for JSON Formatter | Matches the existing category/hub pattern (`calculators`, `image-tools`) rather than inventing a one-off structure for a single tool | Putting JSON Formatter in an existing category (rejected: it doesn't fit `calculators` or `image-tools` conceptually, and the registry architecture is designed around categories scaling to more tools later, e.g. Base64/UUID/JWT tools mentioned in Section 18) | One new category entry appended, one new hub page, one new nav link — no existing categories or nav entries modified |
| 2026-09-13 | PDF Merger uses `pdf-lib` for structural page copying, not rasterization | The build brief explicitly required preserving original PDF pages (not converting to images and reassembling) — `pdf-lib`'s `copyPages` does exactly this, and it's the standard, actively maintained library for client-side PDF manipulation in JS; no existing project dependency could do this | A raster-based approach via canvas/PDF.js rendering (rejected: brief explicitly forbade it — would lose text selectability and degrade quality) | New dependency justified and added; real page-order preservation confirmed by tests that generate real PDFs with distinguishable page widths and verify the merged output's actual page order |
| 2026-09-13 | Merge algorithm (`mergePdfs`) is environment-agnostic — no DOM, no File/Blob, bytes in/bytes out | Lets the exact same function run inside the Worker (production) and directly in Vitest under Node (tests) with no mocking, since `pdf-lib` itself works in both environments | Testing only the surrounding UI/worker glue with a mocked merge function (rejected: would mean never actually exercising the real merge logic in tests, which the brief explicitly warned against — "do not write fake browser tests claiming the actual PDF merger works if it hasn't been executed") | `src/tests/pdf-merger.test.ts` generates genuine PDFs with pdf-lib and performs real merges, verifying real page counts and real page order, not mocked behavior |
| 2026-09-13 | PDF reordering uses up/down buttons only, no drag-and-drop | The brief required reordering not be drag-*only* — it didn't require drag-and-drop to exist at all. Buttons are simpler, fully keyboard-accessible by default, and have no risk of a half-working DnD implementation | Implementing real drag-and-drop as well (rejected for V1: meaningfully more complexity/risk for a redundant interaction path once an accessible one already exists; can be added later if real user feedback asks for it) | Satisfies the brief's actual requirement (keyboard-usable reordering) without the added surface area of a DnD library or hand-rolled drag logic |
| 2026-09-13 | `pdf-lib` is dynamically imported (`await import("pdf-lib")`) in the client component rather than statically imported at the top | The first build revealed a real regression: a static top-level import pulled the ~19.5MB package into `/pdf-merger`'s initial bundle (275KB First Load JS vs. ~100KB for every other page) | Leaving the static import (rejected once the actual build output showed the cost); moving page-count reading into the worker instead (rejected: would mean spinning up the worker just to inspect a file, adding latency/complexity for a purely informational display) | Rebuilding after the fix confirmed `/pdf-merger` back to 100KB First Load JS, matching the rest of the site — this was caught by actually reading build output, not assumed to be fine |
| 2026-09-13 | **PDF Compressor built 100% client-side, deliberately deviating from its own build brief's server-side (Ghostscript/qpdf/pikepdf + API route) request** | The brief's approach would (a) contradict this project's core, repeatedly-audited privacy architecture — every tool so far explicitly promises files never leave the browser — (b) require introducing a backend and system-binary dependency that don't exist anywhere in this project and aren't deployment-friendly for a static/serverless-leaning site, and (c) the user's explicit follow-up instruction was "if possible client side, go client side; only go server side if not possible." A real client-side approach (JPEG recompression + object-graph optimization via `pdf-lib`) turned out to be genuinely possible, just weaker than Ghostscript on non-JPEG-heavy PDFs | Building the requested server-side pipeline anyway (rejected: would be the first tool in the site to break its own privacy promise, without an explicit go-ahead for that architecture change); building a fake UI that claims compression without doing it (rejected outright — brief explicitly forbade this and it would be dishonest) | Real, tested, working compression for the common case (JPEG-heavy PDFs); honestly weaker than a true Ghostscript pipeline for PDFs dominated by other image encodings. Section 17 flags this as needing the user's explicit product-level judgment call after seeing real-world compression ratios during manual QA — not something to silently "fix" by adding a backend in a later tool brief |
| 2026-09-13 | Only JPEG (`DCTDecode`-filtered) embedded images are recompressed; other image encodings (CCITT fax, JBIG2, JPX, raw/Flate bitmaps) are left untouched | `DCTDecode`-filtered PDF image streams ARE literal, complete JPEG codestreams — decodable and re-encodable safely via the browser's own `createImageBitmap`/`OffscreenCanvas`, no custom decoder needed. Every other encoding would require writing and trusting a bespoke decoder client-side; a bug there risks corrupting the user's PDF, which is a worse outcome than a smaller compression win | Attempting to handle all image encodings (rejected: real correctness/safety risk without a mature decoder library for each format, and no existing project dependency provides one) | Documented honestly in the UI copy, FAQ, and registry `edgeCaseNotes` — not silently no-op'd. A PDF made entirely of non-JPEG images may see little or no reduction |
| 2026-09-13 | Low-level `pdf-lib` object manipulation (`PDFRawStream`/`PDFDict`/`PDFName`/`PDFContext.enumerateIndirectObjects`/`.assign`) verified against the actual installed package source before writing `compress.ts` | Same discipline that caught the `@jsquash/oxipng` API mistake earlier in this project — assuming an undocumented low-level API shape without checking the source would be a much higher-risk mistake here, since it manipulates raw PDF object structure directly | Guessing the API from general pdf-lib familiarity (rejected: this project has already been burned once by an unverified library-API assumption) | All 11 `pdf-compressor.test.ts` tests — including real embedded-JPEG and embedded-PNG fixtures built with `pdf-lib`'s own `embedJpg`/`embedPng` — passed on the first real run, confirming the verified API usage was correct in practice |
| 2026-09-14 | **PDF to JPG adds `pdfjs-dist` as a new dependency** | Converting a PDF page to an actual JPG image requires real rasterization — `pdf-lib` (used by every other PDF tool here) only manipulates PDF structure and has no renderer at all, so there was no existing capability being duplicated. `pdfjs-dist` (Mozilla's PDF.js) renders entirely client-side via `OffscreenCanvas`, preserving the same privacy guarantee as everything else | Screenshotting the rendered UI or using an external conversion API/service (both explicitly forbidden by the brief, and neither is genuinely client-side); building a custom PDF rasterizer (rejected: infeasible, massively out of scope) | First tool in the project with a real rasterization pipeline; `render.ts` is the one file in this feature without unit-test coverage (needs a real canvas/renderer) and is flagged for manual QA instead |
| 2026-09-14 | `pdfjs-dist`'s worker bundle (`pdf.worker.min.mjs`) is served as a static asset from `public/pdfjs/`, copied there by a `postinstall` script, rather than bundled by webpack via `new URL(..., import.meta.url)` | The `new URL(...)` pattern made webpack try to statically parse the worker file as a module and the production build failed — that file is a self-contained bundle (with an embedded WASM JPX/OpenJPEG decoder) that isn't meant to be re-parsed by another bundler. This was caught by actually running `next build`, not assumed to work | Leaving the `new URL(...)` bundling approach and trying to work around the parse failure (rejected once the actual build output showed it was a fundamental incompatibility, not a config tweak); loading the worker from a CDN (rejected outright — would introduce a real network call, breaking the privacy promise) | Verified fix: `next build` now succeeds with `/pdf-to-jpg` generated statically. The copied file is same-origin, so there's still no network call for a user, and no CDN dependency. `scripts/copy-pdf-worker.js` runs on every `npm install` so a future `pdfjs-dist` version bump doesn't silently go stale |
| 2026-09-14 | Orchestration logic (`convert.ts`) is environment-agnostic — takes an injected `PdfOpener`, no dependency on `pdfjs-dist`/`OffscreenCanvas`/any browser API | Same "environment-agnostic core, real integration where it matters" pattern as PDF Merger's `merge.ts` — lets page-selection, progress sequencing, per-page streaming, and error handling all be genuinely unit-tested (with a synthetic fake renderer) without needing a real browser | Only testing the surrounding UI/worker glue and leaving all conversion logic unverified until manual QA (rejected: the brief explicitly warned against claiming untested functionality works) | `src/tests/pdf-to-jpg.test.ts` — 29 tests covering page-range parsing, filename generation, page-selection/ordering, per-page error handling, and progress-event sequencing, all against real logic, not mocks of it |
| 2026-09-14 | Conversion stops and reports an error on the first page that fails to render, rather than returning a partial result | A partially-converted "success" would be confusing and inconsistent with the rest of the site's error-handling discipline; per-page fault tolerance adds real complexity for a first version | Returning whatever pages succeeded plus a warning about the rest (rejected for V1: meaningfully more complexity — noted in Known Issues as a documented limitation, not silently dropped) | Simpler, honest failure mode: if page 3 of 10 can't render, the user sees a clear error rather than a results grid missing an unexplained page |
| 2026-09-15 | User confirmed manual QA passed for the first five tools (Percentage Calculator, Image Compressor, Image Resizer, JSON Formatter, PDF Merger) and explicitly authorized starting a new tool | Direct user instruction — an explicit override of the "do not start a new tool until QA clears" state noted in Section 17, not an assumption or something inferred from silence | Waiting for the user to separately confirm PDF Compressor V1 / PDF to JPG V1 QA before proceeding (not required — the user's authorization was explicit and general) | Recorded here verbatim rather than silently updating every tool's "NOT verified" list to say "verified" without the user having said so tool-by-tool |
| 2026-09-15 | PDF Splitter selected as the next tool | Natural complement to PDF Merger (inverse operation, same `pdf-lib` structural page-copy approach — no rasterization, low technical risk) and closes out the PDF cluster (Compressor/Merger/Splitter/PDF→JPG) listed in Section 18 | JPG→PDF (rejected for now: would duplicate PDF→JPG's rasterization-adjacent complexity going the other direction); a developer-tools pick like Base64/UUID (rejected for now: PDF Splitter is a smaller, better-scoped V1 and reuses more existing code) | New `pdf-splitter` tool, reusing `pdf-merger`'s validation and structural-copy patterns directly |
| 2026-09-15 | PDF Splitter's custom-range parser treats each comma-separated token as its own *output file* (unlike PDF to JPG's page-range parser, which flattens everything into one combined list) | The two tools have genuinely different semantics: PDF to JPG selects *which pages to convert* (one flat list); PDF Splitter's whole purpose is *grouping pages into separate files* — flattening would lose the grouping the user is asking for | Reusing PDF to JPG's `parsePageRange` unchanged (rejected: would silently produce the wrong output — one file with all selected pages, not one file per group — for the exact feature this tool exists to provide) | `parseSplitRanges` is a distinct function with its own tests (`src/tests/pdf-splitter.test.ts`), not a shared import, precisely because the two parsers must behave differently despite looking similar |
| 2026-09-15 | A one-page PDF is explicitly rejected rather than allowed to "split" into one identical output file | Producing a single output identical to the input isn't actually splitting anything — silently allowing it would be confusing and pointless, and the clear error is more honest than a no-op success | Allowing it silently (rejected: no real user benefit, and would look like a bug — "why did splitting my PDF do nothing?") | UI shows a specific message ("only has one page, so there's nothing to split") the moment such a file is inspected, before any split is attempted |
| 2026-09-15 | User picked "JPG to PDF" from a shortlisted set of "big in demand" candidates (JPG to PDF, Base64 encode/decode, word/char counter, QR code generator) I proposed with reasoning | Direct user instruction after I gave a ranked recommendation — not something I decided unilaterally | Base64/word-counter/QR (all noted as reasonable alternatives, but not chosen) | New `jpg-to-pdf` tool |
| 2026-09-15 | JPG to PDF supports both JPG and PNG input (not JPG-only, despite the tool's name) | `pdf-lib` natively supports embedding both via `embedJpg`/`embedPng` at no extra cost, and real-world "image to pdf" usage overwhelmingly includes PNG screenshots/scans alongside JPEGs — restricting to JPG-only would be needlessly narrow for the same implementation effort | Strictly JPG-only per the literal tool name (rejected: would make the tool less useful for a near-zero cost savings, and "jpg to pdf" is the dominant search term for this whole category regardless of format supported) | FAQ and edge-case notes explicitly describe PNG support so this isn't a silent scope expansion |
| 2026-09-15 | "Fit to image" (no scaling, page = image's own pixel size) is the default page-size mode, rather than defaulting to A4/Letter | Least surprising default for a tool whose main promise is "turn my images into a PDF, unchanged" — scaling/cropping to a fixed page size is an opinionated transformation some users won't want applied by default | Defaulting to A4 (rejected: would silently alter every image's presentation by default, which is a bigger behavioral assumption than the reverse) | Standard page sizes are still offered as an explicit, clearly-labeled choice for users who do want them |
| 2026-09-15 | User asked for "Word counter" by name — built directly, no shortlist needed this time | Direct, unambiguous user instruction | — | New `word-counter` tool |
| 2026-09-15 | A new `text-tools` category was added (not folded into `developer-tools`) | Word Counter is a general writing tool, not a developer utility — Section 18's own future-clusters list already separates "Text" from "Developer tools" as distinct clusters, so this follows the project's existing taxonomy rather than inventing one | Filing it under `developer-tools` (rejected: would misclassify the tool for the exact audience most likely to want it — writers, students, editors — not developers) | New `/text-tools/` hub page (mirroring `developer-tools`'s hub exactly) and a new nav link in `layout.tsx` |
| 2026-09-15 | Word Counter runs entirely on the main thread with no Worker, unlike every PDF/image tool so far | Counting words/characters/sentences in even multi-page pasted text is a handful of regex passes over a string — genuinely cheap, unlike PDF parsing/image rasterization/embedding. Adding a worker (with its message-passing overhead and added code surface) would be complexity without a real performance benefit here | Using a worker for consistency with other tools (rejected: consistency isn't a reason to add unneeded complexity — the architecture should match what the actual computation requires, not what the last few tools happened to need) | `computeTextStats` is a pure synchronous function called directly via `useMemo`, with no message-passing code at all |
| 2026-09-15 | Sentence/paragraph counting use simple, explicitly-documented heuristics (punctuation-split, blank-line-split) rather than real NLP-based sentence detection | True sentence boundary detection is a genuinely hard, large-scope NLP problem (handling abbreviations, decimals, ellipses, quoted speech, etc.) — wildly disproportionate to what a free word-counter utility needs, and no existing project dependency provides it | Adding an NLP library or bespoke sentence-boundary logic (rejected: large scope increase for marginal accuracy gain in the common case; every mainstream simple word-counter tool makes the same tradeoff) | Documented plainly in code comments, the FAQ ("Mr. Smith" example), and `edgeCaseNotes` — not silently presented as more accurate than it is |
| 2026-09-15 | User asked, same day, whether the abbreviation-over-counting limitation could be improved — added a curated abbreviation list plus a general "initials" pattern (single letters separated by periods, e.g. "U.S.", "e.g.", "J.K.") rather than leaving the original naive punctuation split in place | The original limitation wasn't fundamental — a bounded, explainable heuristic improvement (not full NLP) meaningfully reduces the most common real-world failure case ("Mr. Smith", "Inc.", "U.S.", "e.g.", "a.m./p.m.") at a small, reviewable code cost | (a) Leaving it as-is (rejected: the user directly asked whether it could be fixed, and it genuinely could be, at reasonable cost); (b) adding a full NLP sentence-tokenizer dependency (rejected: same reasoning as the original decision — disproportionate scope for a free utility, and no existing project dependency provides one) | 9 new tests added covering the fix; one test (`"Dr. Smith arrived at 9 a.m. Everyone was ready."`) documents the improvement's own remaining honest limit — an abbreviation that genuinely ends a sentence is now undercounted instead of the old over-counting, a tradeoff made explicit in code comments, the test itself, and the FAQ, not hidden |
| 2026-09-15 | PDF to JPG: user reported real, reproducible bad output — text replaced by a placeholder symbol in converted JPGs. Root-caused to `getDocument()` never being given `standardFontDataUrl`/`cMapUrl`, so pdfjs-dist had no way to render non-embedded standard fonts or certain embedded-font character encodings correctly, and fell back to notdef/placeholder glyphs | This was a real correctness bug affecting actual output quality, not a cosmetic issue or a matter of taste — pdfjs-dist's own documentation requires these for correct rendering, and they were simply never wired up when the tool was first built | Leaving it as a known limitation (rejected: this isn't a rare edge case — it affects any PDF using a standard, non-embedded font or an affected character encoding, which is extremely common); switching PDF renderers (rejected: pdfjs-dist is correct, it just needed to be configured properly) | `scripts/copy-pdf-worker.js` now also copies `standard_fonts/` and `cmaps/` from the installed `pdfjs-dist` package into `public/pdfjs/` (same same-origin, no-CDN pattern as the worker bundle); `render.ts`'s `getDocument()` call now passes `standardFontDataUrl`, `cMapUrl`, and `cMapPacked: true`. Verified: `next build` still succeeds, `/pdf-to-jpg` bundle size unchanged (these are static assets, not bundled code); actual rendering correctness requires manual QA with a real PDF containing standard-font text (`render.ts` has no automated coverage — see its own file header) |

Update this table whenever a decision with lasting consequences is made.

---

## 20. Do Not Assume

Future AI agents or developers must NOT assume, without checking the actual
code:

- A feature exists because it's mentioned as a future possibility in this doc
- A V2 idea has quietly become part of V1
- A planned tool has already been built
- Any monetization system exists
- Any backend/API/database exists
- Any authentication exists
- A stated privacy claim ("processed in your browser") is actually true in the current implementation

Always inspect the real source before making claims about implementation status.

---

## 21. Change Log

### 2026-09-15 (PDF to JPG — real rendering bug fixed: missing standard fonts / CMaps)

**Bug reported by user**: converted JPGs showed text replaced by a
placeholder symbol instead of the real characters.

**Root cause**: `pdfjs-dist`'s `getDocument()` call in
`src/lib/pdf-to-jpg/render.ts` never set `standardFontDataUrl` or
`cMapUrl`. Without these, pdfjs-dist can't correctly render pages using
the standard 14 PDF fonts (no embedded font program) or certain
embedded-font character encodings, and falls back to placeholder
("notdef") glyphs — this is documented, expected pdfjs-dist behavior
when those options are omitted, not a pdfjs-dist bug.

**Changed**
- `scripts/copy-pdf-worker.js` — now also copies `standard_fonts/` and
  `cmaps/` from the installed `pdfjs-dist` package into
  `public/pdfjs/standard_fonts/` and `public/pdfjs/cmaps/` (same
  same-origin static-asset pattern already used for the worker bundle,
  for the same reason: no CDN, no network call).
- `src/lib/pdf-to-jpg/render.ts` — `getDocument()` now passes
  `standardFontDataUrl: "/pdfjs/standard_fonts/"`,
  `cMapUrl: "/pdfjs/cmaps/"`, and `cMapPacked: true`.

**Dependencies**
- None new — uses data already bundled inside the existing `pdfjs-dist`
  package, just not previously wired up.

**Verified (real commands, this session)**
- `node scripts/copy-pdf-worker.js` — confirmed `public/pdfjs/` now
  contains `standard_fonts/` (16 files) and `cmaps/` (169 files), ~3.8MB
  total.
- `npx tsc --noEmit` — clean.
- `npx eslint .` — 0 errors, 0 warnings.
- `npx vitest run` — 273/273 tests pass, unchanged (this fix is entirely
  inside `render.ts`, which has no automated coverage by design — see
  its file header — so this count is expected to be unaffected).
- `npx tsx scripts/validate-seo.ts` — 0 errors, 0 warnings, 15 tools.
- `npx next build` — succeeds; `/pdf-to-jpg` bundle size unchanged
  (5.1 kB / 101 kB First Load JS) since the font/CMap data are static
  assets, not bundled JS; confirmed present under `.next`'s served
  `public/` output.

**Not done / explicitly deferred**
- Manual QA with a real PDF containing standard-font text, to visually
  confirm the fix — this file has no automated test coverage by design
  (requires a real canvas/pdfjs render pipeline), so manual confirmation
  is the only verification path available for the actual visual fix.
  Added explicitly to the PDF to JPG manual QA checklist below.

---

### 2026-09-15 (Word Counter — sentence-counting heuristic improved, same session)

**Changed**
- `src/lib/word-counter/stats.ts` — replaced the naive `.split(/[.!?]+/)`
  sentence count with a token-scanning approach that recognizes a
  curated list of common abbreviations (titles, business suffixes,
  months/days, Latin abbreviations) plus a general "initials" pattern
  (single letters separated by periods — covers "U.S.", "e.g.", "i.e.",
  "a.m.", "J.K.", etc. without listing each individually).
- `src/lib/tool-registry.ts` — updated the Word Counter FAQ answer and
  `edgeCaseNotes` to accurately describe the improved behavior and its
  remaining honest limitation (previously described the old, worse
  behavior).

**Added**
- 9 new tests in `src/tests/word-counter.test.ts` covering titles,
  multiple abbreviations in one sentence, e.g./i.e., a.m./p.m., personal
  initials, country initialisms (U.S.), mid-sentence vs. sentence-ending
  decimals, and — explicitly — the remaining known tradeoff (a sentence
  that truly ends in a recognized abbreviation is now undercounted
  rather than the old over-counting).

**Dependencies**
- None new — still zero dependencies for this tool.

**Verified (real commands, this session)**
- `npx vitest run` — 273/273 tests pass (264 prior + 9 new).
- `npx tsc --noEmit` — clean.
- `npx eslint .` — 0 errors, 0 warnings.
- `npx tsx scripts/validate-seo.ts` — 0 errors, 0 warnings, 15 tools.
- `npx next build` — succeeds; `/word-counter` now 1.48 kB / 97.8 kB
  First Load JS.

**Known limitation (unchanged in kind, changed in direction)**
- The old failure mode (over-counting abbreviation-heavy text) is fixed
  for common cases. The new, opposite, much rarer failure mode
  (undercounting when a sentence genuinely ends in a recognized
  abbreviation) is documented in code, tests, and the FAQ — not silently
  introduced.

**Process note**
- Direct response to the user asking "Can we overcome this limitation?"
  right after the original Word Counter build. Not a spontaneous rewrite
  — see the 2026-09-15 decision log entry.

---

### 2026-09-15 (Word Counter V1 — new tool, new category)

**Added**
- `src/lib/word-counter/stats.ts`
- `src/components/WordCounter.tsx`
- `src/app/word-counter/page.tsx`
- `src/app/text-tools/page.tsx` (new category hub page)
- `src/tests/word-counter.test.ts` (17 tests)
- New `text-tools` category and `word-counter` tool entry in
  `tool-registry.ts`

**Dependencies**
- None new.

**Changed**
- `src/app/layout.tsx` — added one "Text Tools" nav link, mirroring the
  existing hardcoded category-link pattern exactly. This is the one
  deliberate exception across this whole project to "don't touch shared
  files": a genuinely new top-level category needs a nav entry to be
  reachable at all. Nothing else in `layout.tsx` was touched — confirmed
  by restoring the pre-edit backup's font portion after the sandbox
  font-stub workaround and diff-checking that both the nav edit and the
  original font code were intact afterward.

**Verified (real commands, this session)**
- `npm install` — succeeded.
- `npx vitest run` — 264/264 tests pass (247 existing + 17 new).
- `npx tsc --noEmit` — clean.
- `npx eslint .` — 0 errors, 0 warnings.
- `npx tsx scripts/validate-seo.ts` — 0 errors, 0 warnings, 15 tools.
- `npx next build` — succeeds; `/word-counter` (1.13 kB / 97.4 kB First
  Load JS) and `/text-tools` both generated statically.

**Known limitations (see Section 16 for full detail)**
- Sentence counting is a punctuation-based heuristic, not real NLP —
  over-counts abbreviations.
- No worker (architecturally deliberate — see decision log).

**Not done / explicitly deferred**
- Manual browser QA (checklist appended below) — not run in this
  sandbox, including real typing responsiveness on very large pastes.

**Process note**
- The user asked for "Word counter" directly, by name — no shortlist or
  recommendation step needed this time (unlike JPG to PDF).

---

### 2026-09-15 (JPG to PDF V1 — new tool)

**Added**
- `src/lib/jpg-to-pdf/{types,validation,convert}.ts`
- `src/workers/jpg-to-pdf.worker.ts`
- `src/components/JpgToPdf.tsx`
- `src/app/jpg-to-pdf/page.tsx`
- `src/tests/jpg-to-pdf.test.ts` (22 tests)
- New `jpg-to-pdf` entry in `tool-registry.ts` (`pdf-tools` category)

**Dependencies**
- None new — reuses the existing `pdf-lib` dependency exactly as PDF
  Merger and PDF Splitter do (`embedJpg`/`embedPng`).

**Changed**
- No existing tool's files were modified.

**Verified (real commands, this session)**
- `npm install` — succeeded.
- `npx vitest run` — 247/247 tests pass (225 existing + 22 new),
  including real `pdf-lib` embed round-trips against genuine minimal
  JPEG/PNG fixtures.
- `npx tsc --noEmit` — clean.
- `npx eslint .` — 0 errors, 0 warnings.
- `npx tsx scripts/validate-seo.ts` — 0 errors, 0 warnings, 14 tools.
- `npx next build` — succeeds; `/jpg-to-pdf` generated statically
  (4.72 kB page / 101 kB First Load JS).

**Known limitations (see Section 16 for full detail)**
- No per-image fault tolerance: one bad image fails the whole batch.
- Supports JPG and PNG input (not JPG-only) — a deliberate scope choice,
  see decision log.

**Not done / explicitly deferred**
- Manual browser QA (checklist appended below) — not run in this
  sandbox, including real A4/Letter scaling with real (non-1x1) photos.

**Process note**
- The user asked for a recommendation on "something that's big in
  demand"; I proposed JPG to PDF with reasoning against three
  alternatives, and the user confirmed. See the 2026-09-15 decision log
  entries.

---

### 2026-09-15 (PDF Splitter V1 — new tool)

**Added**
- `src/lib/pdf-splitter/{types,validation,split}.ts`
- `src/workers/pdf-splitter.worker.ts`
- `src/components/PdfSplitter.tsx`
- `src/app/pdf-splitter/page.tsx`
- `src/tests/pdf-splitter.test.ts` (27 tests)
- New `pdf-splitter` entry in `tool-registry.ts` (`pdf-tools` category)

**Dependencies**
- None new — reuses the existing `pdf-lib` dependency exactly as PDF
  Merger does.

**Changed**
- No existing tool's files were modified.

**Verified (real commands, this session)**
- `npm install` — succeeded.
- `npx vitest run` — 225/225 tests pass (198 existing + 27 new).
- `npx tsc --noEmit` — clean.
- `npx eslint .` — 0 errors, 0 warnings.
- `npx tsx scripts/validate-seo.ts` — 0 errors, 0 warnings, 13 tools.
- `npx next build` — succeeds; `/pdf-splitter` generated statically
  (4.75 kB page / 101 kB First Load JS).

**Known limitations (see Section 16 for full detail)**
- Range parser only supports simple single pages/ranges per group, no
  open-ended ranges.

**Not done / explicitly deferred**
- Manual browser QA (checklist appended below) — not run in this
  sandbox.

**Process note**
- The user explicitly confirmed manual QA passed for the first five
  tools and authorized starting this (the "7th") tool without requiring
  separate confirmation for PDF Compressor V1 / PDF to JPG V1 first. See
  Section 17 and the 2026-09-15 decision log entry.

---

### 2026-09-14 (PDF to JPG V1 — new tool)

**Added**
- `src/lib/pdf-to-jpg/{types,validation,convert,render}.ts`
- `src/workers/pdf-to-jpg.worker.ts`
- `src/components/PdfToJpg.tsx`
- `src/app/pdf-to-jpg/page.tsx`
- `src/tests/pdf-to-jpg.test.ts` (29 tests)
- `scripts/copy-pdf-worker.js` (new `postinstall` script)
- `public/pdfjs/pdf.worker.min.mjs` (generated/copied, not hand-written)
- New `pdf-to-jpg` entry in `tool-registry.ts` (`pdf-tools` category)

**Dependencies**
- Added `pdfjs-dist` (^4.6.82). See decision log for why this is
  necessary and not a duplicate of any existing capability.

**Changed**
- `package.json` — added `pdfjs-dist` dependency and a `postinstall`
  script.
- No existing tool's files were modified.

**Not changed / explicitly out of scope**
- PDF Merger, PDF Compressor, JSON Formatter, Image Compressor, Image
  Resizer, Percentage Calculator — untouched. Regression confirmed by
  their existing test suites still passing unmodified (198/198 total).
- `layout.tsx` — briefly stubbed locally to work around this sandbox's
  lack of network access to `fonts.googleapis.com` for build
  verification, then restored to its exact prior content (diffed against
  a backup to confirm no residual change).

**Verified (real commands, this session)**
- `npm install` — succeeded (`postinstall` copied the worker file
  correctly).
- `npx vitest run` — 198/198 tests pass.
- `npx tsc --noEmit` — clean.
- `npx eslint .` — 0 errors, 0 warnings.
- `npx tsx scripts/validate-seo.ts` — 0 errors, 0 warnings, 13 tools.
- `npx next build` — succeeds; `/pdf-to-jpg` generated statically
  (5.1 kB page / 101 kB First Load JS, in line with the other PDF
  tools).

**Known limitations (see Section 16 for full detail)**
- `render.ts` (the actual pdfjs-dist/OffscreenCanvas rendering) has no
  automated test coverage — needs manual QA in a real browser.
- No per-page fault tolerance: one failing page fails the whole
  conversion.
- Page selection only supports simple comma-separated pages/ranges,
  capped at 300 pages.

**Not done / explicitly deferred**
- Manual browser QA (upload/convert/preview/download flows, rendering
  fidelity across PDF types, mobile, large-file memory behavior, and
  network-tab confirmation that nothing is uploaded) — appended as a
  checklist below, not run in this sandbox.

---

### 2026-09-13 (PDF Compressor V1 — new tool, architecture deviation)

**Added**
- `src/lib/pdf-compressor/{compress,jpeg-reencoder,types}.ts`
- `src/workers/pdf-compressor.worker.ts`
- `src/components/PdfCompressor.tsx`
- `src/app/pdf-compressor/page.tsx` (self-contained, reuses
  `lib/seo/tool-metadata.ts` — not modified)
- One registry entry (`pdf-compressor`) appended to `tool-registry.ts`,
  reusing the existing `pdf-tools` category (no new category/hub needed)
- `src/tests/pdf-compressor.test.ts` (11 tests, real `pdf-lib` fixtures
  with genuinely embedded JPEG/PNG images — not mocks)
- No new dependency (reuses `pdf-lib`, already present for the Merger)

**Deviated from the build brief, deliberately and documented**: the brief
requested a server-side pipeline (Ghostscript/qpdf/pikepdf, an API route).
Built 100% client-side instead, per explicit follow-up instruction and
this project's own architecture. Full reasoning in Section 19's decision
log — this is the single most important entry in that table so far and
should be read before any future PDF-tooling work.

**Fixed (via actually running tests/build, not assumption)**
- `jpeg-reencoder.ts` failed `next build`'s type-check (`Uint8Array.buffer`
  typed as `ArrayBufferLike`, not assignable to `BlobPart`); fixed with the
  same `.slice(...) as ArrayBuffer` pattern already used elsewhere.
- Low-level `pdf-lib` API (`PDFRawStream`, `PDFDict`, `PDFName`,
  `PDFContext.enumerateIndirectObjects`/`.assign`/`.obj`) was verified
  against the actual installed package source before writing any code —
  all 11 tests passed on the first real run, no API-mismatch surprises
  this time (unlike the earlier `@jsquash/oxipng` incident).

**Verified for real**: `npm install`, `npm test` (169/169 pass, including
11 new — real merges of real pdf-lib-generated PDFs with real embedded
images, confirming actual image detection, actual recompression behavior,
and the "never present a larger file as compressed" fallback), `npm run
build` (succeeds, 21 routes, `/pdf-compressor` at 100KB First Load JS —
no bundle regression this time, the Merger's earlier lesson was applied
from the start), `npm run lint` (clean), `npm run seo:check` (0 errors/0
warnings across 11 tools). Security/privacy grep pass: no network calls,
no `readAsDataURL`, no unsafe HTML, fixed download filename, object URL
lifecycle confirmed on all four paths, error messages never leak
`err.message`/stack traces (confirmed by a passing test assertion).

**Not touched**: Image Compressor, Image Resizer, JSON Formatter, PDF
Merger (confirmed no regression — 169/169 including all of PDF Merger's
own 28 tests), any existing registry entry, design tokens, Tailwind
config.

**Not verified** (needs a real browser): real-world compression ratios,
a genuine password-protected PDF, CMYK/unusual JPEG variants inside a real
PDF, large-file memory behavior, real mobile layout, and reconfirming PDF
Merger/JSON Formatter work in an actual browser after this change (only
confirmed at the test-suite level so far). See Section 16.

**Current focus**
- Handing off to the user for manual QA on all five tools now built, PLUS
  an explicit product decision on the PDF Compressor's client-side
  architecture once real compression ratios are seen (Section 17). No
  further code changes expected until either surfaces something.

**Next**
- User performs manual QA on all five tools, including measuring real PDF
  Compressor compression ratios
- User decides whether the client-side-only approach is sufficient or
  whether a backend architecture conversation is warranted — this is a
  deliberate call for the user to make, not something to be decided
  unilaterally in a future tool brief
- Only after that: choose the next tool

### 2026-09-13 (PDF Merger V1 — new tool)

**Added**
- `src/lib/pdf-merger/{validation,merge,types}.ts`
- `src/workers/pdf-merger.worker.ts`
- `src/components/PdfMerger.tsx`
- `src/app/pdf-merger/page.tsx` (self-contained, reuses
  `lib/seo/tool-metadata.ts` — not modified)
- `src/app/pdf-tools/page.tsx` (new category hub)
- New `pdf-tools` category + one registry entry (`pdf-merger`) appended to
  `tool-registry.ts` — no existing entries modified
- Fourth nav link ("PDF Tools") in `layout.tsx`
- `pdf-lib` added as a new dependency
- `src/tests/pdf-merger.test.ts` (28 tests, including real pdf-lib
  integration tests against generated fixture PDFs — not mocks)

**Fixed (via actually running the build, not assumption)**
- `PdfMerger.tsx` originally statically imported `pdf-lib` at the top of
  the file for main-thread page-count reading. The first `npm run build`
  showed this pulled the ~19.5MB package into the page's initial bundle —
  275KB First Load JS vs. ~100KB for every other page. Switched to a
  dynamic `import("pdf-lib")` inside the one function that needs it;
  rebuilding confirmed the fix (100KB, matching the rest of the site).

**Verified for real**: `npm install`, `npm test` (158/158 pass, including
28 new — real merges of real pdf-lib-generated PDFs, verifying actual page
counts and actual page order), `npm run build` (succeeds, 20 routes,
bundle-size regression caught and fixed as above), `npm run lint` (clean),
`npm run seo:check` (0 errors/0 warnings across 10 tools). Security/privacy
grep pass: no network calls, no `FileReader.readAsDataURL`, no unsafe HTML,
filenames always React-text-bound, download filename is a fixed constant
never derived from user input, object URL lifecycle confirmed on all four
paths (new result, unmount, new batch added, Start over).

**Not touched**: Image Compressor, Image Resizer, JSON Formatter, any
existing registry entry, design tokens, Tailwind config.

**Not verified** (needs a real browser): the full drag-drop → worker →
download path end-to-end, a real password-protected PDF, large/many-file
stress behavior, reorder UX feel on real mobile touch, and confirming the
downloaded file opens correctly in a real PDF viewer. See Section 16.

**Current focus**
- Handing off to the user for manual QA on all four tools now built (Image
  Compressor, Image Resizer, JSON Formatter, PDF Merger) — Section 17 has
  a checklist for each. No further code changes expected until that
  surfaces something.

**Next**
- User performs manual QA on all four tools
- Only after all four clear the Section 11 quality gate: choose the next
  tool

### 2026-09-13 (JSON Formatter & Validator V1 — new tool)

**Added**
- `src/lib/json-formatter/format.ts`
- `src/components/JsonFormatter.tsx`
- `src/app/json-formatter/page.tsx` (self-contained, reuses
  `lib/seo/tool-metadata.ts` — not modified)
- `src/app/developer-tools/page.tsx` (new category hub)
- New `developer-tools` category + one registry entry (`json-formatter`)
  appended to `tool-registry.ts` — no existing entries modified
- Third nav link ("Developer Tools") in `layout.tsx`
- `src/tests/json-formatter.test.ts` (30 tests)

**Fixed (via actually running the tests, not assumption)**
- `format.ts`'s line/column extraction was wrong about what V8 provides —
  rewritten to prefer V8's own explicit `(line X column Y)` when present.
  See the decision log entry above for the full explanation.
- The test that exercised the "no position given" case used the wrong
  example input; corrected.
- SEO validator caught a genuinely too-long meta description (174 chars);
  trimmed to fit.

**Verified for real**: `npm install`, `npm test` (130/130 pass, after
fixing the real failure above), `npm run build` (succeeds, 18 routes,
`/json-formatter/` at 98.3KB — essentially the Percentage Calculator's own
footprint, confirming no new dependency weight), `npm run lint` (clean),
`npm run seo:check` (0 errors/0 warnings across 9 tools, after the meta
description fix). Security/privacy grep pass: no eval/Function/network
calls anywhere in the tool's code; JSON is only ever bound via React
`value={}`, never rendered as HTML; never reflected into a URL; object URL
created and revoked within one synchronous download action.

**Not touched**: Image Compressor, Image Resizer, any existing registry
entry, design tokens, Tailwind config.

**Not verified** (needs a real browser): actual line/column accuracy as
seen by a user, cross-browser error-message fallback behavior (Safari/
Firefox), real clipboard/download behavior, Ctrl/Cmd+Enter across real
OS/browser combos, real mobile layout. See Section 16.

**Current focus**
- Handing off to the user for manual QA on all three tools now built
  (Image Compressor, Image Resizer, JSON Formatter) — Section 17 has a
  checklist for each. No further code changes expected until that surfaces
  something.

**Next**
- User performs manual QA on all three tools
- Only after all three clear the Section 11 quality gate: choose the next
  tool

### 2026-09-13 (Image Resizer V1 — new tool)

**Added**
- `src/lib/image-resizer/{dimensions,types}.ts`
- `src/workers/image-resizer.worker.ts` (reuses `computeSafeDimensions` and
  `encodePng` from `image-compressor` lib — neither file modified)
- `src/components/ImageResizer.tsx`
- `src/components/tool-pages/ImageResizerPage.tsx` (reuses
  `lib/seo/tool-metadata.ts` — not modified)
- `/image-resizer/` route
- One new registry entry (`image-resizer`) appended to `tool-registry.ts`
  — no existing entries modified, including the Compressor's
- `src/tests/image-resizer-dimensions.test.ts` (23 tests)

**Verified for real**: `npm install`, `npm test` (100/100 pass, including
the 23 new resizer tests), `npm run build` (succeeds, 16 routes total,
`/image-resizer/` at ~100KB First Load JS matching the Compressor's
lazy-loading profile), `npm run lint` (clean), `npm run seo:check` (0
errors/warnings across 8 tools). Security/privacy grep pass: no network
calls, safe JSON-LD-only `dangerouslySetInnerHTML`, object URL lifecycle
confirmed on all three paths.

**Not touched**: Image Compressor's own files (worker, component, registry
entries, page), design tokens, Tailwind config, any other existing tool.

**Not verified** (needs a real browser): actual resize/upscale visual
quality, EXIF behavior, live locked-ratio typing feel, mobile/touch,
large-source stress path through the reused safety clamp. See Section 16.

**Current focus**
- Handing off to the user for manual QA on both Image Compressor and Image
  Resizer (Section 17's two checklists) — no further code changes expected
  until that surfaces something.

**Next**
- User performs manual QA on both tools
- Only after both clear the Section 11 quality gate: choose the next tool

### 2026-09-13 (verification session — inspect, install, build, fix)

**Verified for real** (see Section 16's "VERIFIED" block): `npm install`,
`npm test` (77/77 pass), `npm run build` (succeeds, all 15 routes), `npm
run lint` (clean), `npm run seo:check` (0 errors/warnings across 7 tools).

**Fixed**
- `src/lib/image-compressor/png-encoder.ts` — rewritten against the real
  `@jsquash/oxipng@2.3.0` source (fetched and read directly, not guessed).
  The original two-package assumption was wrong; `optimise()` takes
  `ImageData` directly. `@jsquash/png` removed from `package.json`.
- `src/app/page.tsx` — pre-existing unrelated lint error (unescaped
  apostrophe) fixed; it blocked `next build` for the whole site.

**Inspected, no issue found**
- No `fetch`/`XHR`/analytics calls anywhere in the image-compressor code
  (grep-verified) — the "image bytes never leave the browser" requirement
  holds at the source level.
- `dangerouslySetInnerHTML` usage (JSON-LD only) follows the same safe,
  pre-existing pattern as the percentage-calculator page — hand-authored
  registry content, not user input.
- Object URL lifecycle, worker termination on unmount, and per-file error
  isolation in the batch queue all checked out on inspection.
- No stray `@jsquash/png` references remain anywhere in the repo.

**Not fixed / not touched**
- The `Circular dependency between chunks with runtime` build warning —
  noted, not investigated, since chasing it would be a speculative
  architectural change outside this task's scope and it doesn't fail the
  build.
- Everything requiring an actual browser (EXIF, real compression output,
  memory/stress behavior, mobile, Network-tab observation) — listed in
  Section 16, handed off to the user for manual QA.

**Current focus**
- Handing off to the user for manual browser/device QA (see Section 17's
  numbered list) — no further code changes expected until that surfaces
  something.

**Next**
- User performs manual QA per Section 17
- Only after that: decide whether Image Compressor V1 passes the Section 11
  quality gate, then choose the next tool

### 2026-09-13 (later same day — Image Compressor V1 implementation)

**Added**
- `src/lib/image-compressor/{types,validation,target-size,png-encoder}.ts`
- `src/workers/image-compressor.worker.ts`
- `src/components/ImageCompressor.tsx`
- `src/components/tool-pages/ImageCompressorPage.tsx` +
  `src/lib/seo/tool-metadata.ts` (shared page shell / metadata builders)
- 6 new routes: `/image-compressor/`, `/compress-image-to-50kb/`,
  `/compress-image-to-100kb/`, `/compress-image-to-200kb/`,
  `/compress-jpeg/`, `/compress-png/`, plus `/image-tools/` hub
- `image-tools` category and 6 tool entries in `tool-registry.ts`
- `src/tests/target-size.test.ts`,
  `src/tests/image-compressor-validation.test.ts`
- `@jsquash/png`, `@jsquash/oxipng`, `jszip` added to `package.json`
- `asyncWebAssembly` webpack experiment added to `next.config.js`
- One nav link ("Image Tools") added to the header in `layout.tsx`

**Not touched** (per the build brief's explicit "do not refactor unrelated
code" instruction): percentage calculator, global design tokens, Tailwind
config, Next.js version, registry architecture shape, existing pages.

**Current focus**
- Verify the Image Compressor actually builds and runs (see Section 16's
  "NOT verified" list) — this has not been done in this sandbox
- Clear the Section 11 quality gate before considering V1 done

**Next**
- `npm install && npm run build` in a real environment; fix whatever surfaces
- Confirm the `@jsquash/*` package API shapes match `png-encoder.ts`
- Run `npm test`; add the still-missing PNG-path and memory-lifecycle tests
- Manual QA per build brief §28–29 (browsers, EXIF photo, stress test, mobile widths)
- Only then: choose the next tool

### 2026-09-13 (earlier same day)

**Added**
- Initial `PROJECT_CONTEXT.md`
- Full product/SEO/UX/monetization/architecture direction documented from
  the founding conversation
- Verified and recorded actual current codebase state (Section 16)

---

## 22. AI Agent Instructions

Any agent (human or AI) working on this project must:

1. Read this file before making significant changes.
2. Inspect the actual existing code before proposing architectural changes — never assume from this doc alone.
3. Preserve existing working functionality.
4. Never build more than one tool at a time.
5. Never implement V2 features prematurely (Section 12).
6. Never invent or claim completed functionality that isn't in the code.
7. Never fabricate SEO data, FAQs, or structured data that don't reflect the real page.
8. Preserve the existing design system (Section 15) — don't introduce new palettes/fonts without a strong reason.
9. Prioritize UX quality and mobile usability.
10. Test edge cases, accessibility, and performance before calling a tool done.
11. Run `npm test` and `npm run seo:check` after changes that touch logic or the registry.
12. Update this file whenever a meaningful decision or status change occurs — including the Change Log and Decisions Log.
13. Do not start the next tool until the current one has passed the Section 11 quality gate.

---

## 23. North Star

```
Search demand
  ↓
Excellent SEO landing page
  ↓
User discovers a useful tool
  ↓
Fast, polished experience
  ↓
User gets a real result
  ↓
User trusts the site
  ↓
User discovers related tools
  ↓
User returns
  ↓
Organic traffic compounds
  ↓
Revenue grows
  ↓
Revenue funds better tools
```

Quality over quantity. Real utility over SEO spam. User experience over
feature count. Organic traffic + revenue over vanity metrics. One excellent
tool at a time.
