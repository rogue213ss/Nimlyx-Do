// SEO validation for the tool registry. Run with: npx tsx scripts/validate-seo.ts
// Intended to run in CI so a page with a real SEO defect can't ship silently.
// This checks the *data* (registry), which is the single source of truth for
// every indexable page's metadata — catching the class of bug early is more
// valuable than crawling rendered HTML for this project's current size.

import { categories, tools, type ToolConfig } from "../src/lib/tool-registry";
import { siteConfig } from "../src/lib/site-config";

type Issue = { level: "error" | "warn"; message: string };

const issues: Issue[] = [];

function err(message: string) {
  issues.push({ level: "error", message });
}
function warn(message: string) {
  issues.push({ level: "warn", message });
}

const indexable = tools.filter((t) => t.indexable);
const slugs = new Set(tools.map((t) => t.slug));
const categorySlugs = new Set(categories.map((c) => c.slug));

const seenTitles = new Map<string, string>();
const seenDescriptions = new Map<string, string>();

for (const tool of tools) {
  const ctx = `[${tool.slug}]`;

  // Required fields
  if (!tool.title) err(`${ctx} missing title`);
  if (!tool.metaDescription) err(`${ctx} missing meta description`);
  if (!tool.h1) err(`${ctx} missing H1`);
  if (!tool.intro) err(`${ctx} missing intro`);

  // Length constraints. The root layout applies a `%s | ${siteConfig.name}`
  // title template to every page (see src/app/layout.tsx), so the *rendered*
  // <title> is always longer than the registry field alone — checking only
  // tool.title.length here missed 9 tools that were fine in isolation but
  // rendered past Google's ~60-char truncation point once the suffix was
  // appended (found via manual audit 2026-09-18; this check now catches it).
  const titleSuffix = ` | ${siteConfig.name}`;
  if (tool.title) {
    const renderedLength = tool.title.length + titleSuffix.length;
    if (renderedLength > 60) {
      warn(
        `${ctx} rendered title is ${renderedLength} chars incl. "${titleSuffix}" (recommended ≤60): "${tool.title}${titleSuffix}"`
      );
    }
  }
  if (tool.metaDescription) {
    const len = tool.metaDescription.length;
    if (len < 120 || len > 158) {
      warn(`${ctx} meta description is ${len} chars (recommended 120–158)`);
    }
  }

  // Duplicate detection
  if (tool.title) {
    const existing = seenTitles.get(tool.title);
    if (existing) err(`Duplicate title between [${existing}] and ${ctx}`);
    else seenTitles.set(tool.title, tool.slug);
  }
  if (tool.metaDescription) {
    const existing = seenDescriptions.get(tool.metaDescription);
    if (existing) err(`Duplicate meta description between [${existing}] and ${ctx}`);
    else seenDescriptions.set(tool.metaDescription, tool.slug);
  }

  // Category must exist
  if (!categorySlugs.has(tool.category)) {
    err(`${ctx} references unknown category "${tool.category}"`);
  }

  // Related tools must point to real, existing slugs (no dead internal links)
  for (const related of tool.relatedTools) {
    if (!slugs.has(related)) {
      err(`${ctx} relatedTools references unknown slug "${related}"`);
    }
  }

  // FAQPage schema should only exist alongside genuinely visible FAQ content
  if (tool.faq && tool.faq.length === 0) {
    warn(`${ctx} has an empty faq array — remove the field instead of leaving it empty`);
  }

  // Orphan check: every indexable tool should be reachable from its category
  // hub, which lists everything in getToolsByCategory — true by construction
  // here, but flagged for tools not indexable, which won't appear on the hub
  // or in the sitemap, so should be intentional.
  if (!tool.indexable) {
    warn(`${ctx} is marked non-indexable — confirm this is intentional`);
  }
}

if (indexable.length === 0) {
  warn("No indexable tools exist yet.");
}

// Report
const errors = issues.filter((i) => i.level === "error");
const warnings = issues.filter((i) => i.level === "warn");

for (const w of warnings) console.warn(`WARN  ${w.message}`);
for (const e of errors) console.error(`ERROR ${e.message}`);

console.log(
  `\nSEO validation: ${errors.length} error(s), ${warnings.length} warning(s) across ${tools.length} tool(s).`
);

if (errors.length > 0) {
  process.exit(1);
}
