import Link from "next/link";
import { getToolBySlug, type ToolConfig } from "@/lib/tool-registry";

/**
 * Renders the "Related tools" section on a tool page from that tool's
 * `relatedTools` registry field. This closes a gap the registry already
 * anticipated: every tool has had a hand-authored `relatedTools` array
 * since the schema was designed, but nothing ever rendered it, so every
 * tool page was a linking dead end (header nav or back to Google — no
 * path to the next relevant tool).
 *
 * Resolves slugs to full ToolConfig entries at render time rather than
 * trusting the array directly, and filters to `indexable` tools only, so:
 * - a typo'd or removed slug in the registry silently drops instead of
 *   rendering a broken link or a 404
 * - a tool that's deliberately set `indexable: false` (e.g. mid-build,
 *   not yet quality-gated) never gets linked to from elsewhere, which
 *   would otherwise undermine the reason it was marked non-indexable
 *
 * Renders nothing if the tool has no related tools — same
 * only-render-if-real-content convention as the FAQ/formula/examples
 * sections on these pages (see percentage-calculator/page.tsx).
 */
export default function RelatedTools({ tool }: { tool: ToolConfig }) {
  const related = tool.relatedTools
    .map((slug) => getToolBySlug(slug))
    .filter((t): t is ToolConfig => Boolean(t) && t!.indexable);

  if (related.length === 0) return null;

  return (
    <section className="mt-12 max-w-prose" aria-labelledby="related-tools">
      <h2 id="related-tools" className="font-display text-2xl text-ink">
        Related tools
      </h2>
      <ul className="mt-4 grid sm:grid-cols-2 gap-4">
        {related.map((t) => (
          <li key={t.slug}>
            <Link
              href={`/${t.slug}/`}
              className="block rounded-lg border border-line p-5 hover:border-accent hover:bg-surface transition-colors
                focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
            >
              <span className="font-display text-xl text-ink">{t.name}</span>
              <p className="mt-1 text-sm text-ink/60">{t.intro}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
