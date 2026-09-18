# Nimlyx Do

Foundation + flagship reference page (Percentage Calculator) for the
SEO-first utility tools platform. Built deliberately slow, one page at a
time — see the project's execution philosophy before adding a second tool.

## Setup

This was built without network access to npm, so `node_modules` is not
included. On a machine with normal internet access:

```bash
npm install
npm run dev        # http://localhost:3000
```

## Scripts

- `npm run dev` — local dev server
- `npm run build` — production build (also the best sanity check for
  hydration errors, type errors, and broken routes)
- `npm test` — run the percentage-calculator unit tests (Vitest)
- `npm run seo:check` — validate the tool registry against the SEO rules
  (duplicate titles/descriptions, missing fields, dead internal links,
  length limits) — wire this into CI
- `npm run lint` — ESLint (Next.js core-web-vitals ruleset)

## Image Compressor: environment notes

The Image Compressor's PNG path depends on `@jsquash/png` and
`@jsquash/oxipng` (WASM, lazily imported only when a PNG is queued), and
"Download All" lazily imports `jszip`. `next.config.js` adds an
`asyncWebAssembly` webpack experiment for this. **None of this has been
build-tested** — see `PROJECT_CONTEXT.md`'s "NOT verified" list for exactly
what to check first (`npm install && npm run build`, then a real EXIF-photo
test, then the manual QA pass).

## Structure

```
src/
  app/
    layout.tsx              root layout, fonts, WebSite/Organization schema
    page.tsx                homepage
    sitemap.ts              auto-generated from the tool registry
    robots.ts
    calculators/page.tsx    category hub
    percentage-calculator/page.tsx   the flagship tool page
  components/
    PercentageCalculator.tsx  the interactive widget (client component)
    Breadcrumbs.tsx           visible breadcrumbs + BreadcrumbList schema
  lib/
    tool-registry.ts        the data model — every tool's SEO metadata,
                             content, and relationships live here
    calculators/percentage.ts  pure calculation logic (framework-agnostic)
    site-config.ts          site name/URL/description constants
  tests/
    percentage.test.ts      unit tests for the calculation logic
scripts/
  validate-seo.ts           CI-style SEO validation against the registry
```

## Before deploying

- Replace `siteConfig.url` in `src/lib/site-config.ts` with the real domain
- Add an OG image and reference it in `layout.tsx` metadata
- Build About / Privacy / Terms pages before linking to them anywhere
  (the footer intentionally omits them until they exist — no dead links)
- Run `npm run build` and check the production output for hydration
  warnings or console errors
