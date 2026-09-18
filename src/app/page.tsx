import type { Metadata } from "next";
import Link from "next/link";
import { categories, getIndexableTools, getToolsByCategory } from "@/lib/tool-registry";
import { siteConfig, absoluteUrl } from "@/lib/site-config";
import CategoryIcon from "@/components/CategoryIcon";

export const metadata: Metadata = {
  title: `${siteConfig.name} – Free tools for everyday problems`,
  description: siteConfig.description,
  alternates: { canonical: absoluteUrl("/") },
};

export default function HomePage() {
  const allTools = getIndexableTools();
  const categorySections = categories
    .map((category) => ({ category, tools: getToolsByCategory(category.slug).filter((t) => t.indexable) }))
    .filter((section) => section.tools.length > 0);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <h1 className="font-display text-4xl sm:text-5xl text-ink max-w-2xl">
        Free tools for everyday problems.
      </h1>
      <p className="mt-4 max-w-prose text-ink/70 text-lg">
        Fast, accurate calculators and utilities. No sign-up, no clutter — just the tool you need.
      </p>

      <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-4">
        <div>
          <dt className="text-sm text-ink/50">Tools available</dt>
          <dd className="font-mono text-2xl text-ink">{allTools.length}</dd>
        </div>
        <div>
          <dt className="text-sm text-ink/50">Categories</dt>
          <dd className="font-mono text-2xl text-ink">{categorySections.length}</dd>
        </div>
        <div>
          <dt className="text-sm text-ink/50">Files processed on our servers</dt>
          <dd className="font-mono text-2xl text-result">0</dd>
        </div>
      </dl>

      <nav aria-label="Jump to category" className="mt-10 flex flex-wrap gap-2">
        {categorySections.map(({ category, tools }) => (
          <a
            key={category.slug}
            href={`#${category.slug}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3.5 py-1.5 text-sm text-ink/80 hover:border-accent hover:text-ink transition-colors"
          >
            <CategoryIcon slug={category.slug} className="w-4 h-4 text-ink/50" />
            {category.name}
            <span className="text-ink/40 font-mono text-xs">{tools.length}</span>
          </a>
        ))}
      </nav>

      <div className="mt-14 space-y-14">
        {categorySections.map(({ category, tools }) => (
          <section key={category.slug} id={category.slug} aria-labelledby={`${category.slug}-heading`}>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line text-accent">
                <CategoryIcon slug={category.slug} className="w-5 h-5" />
              </span>
              <div>
                <h2 id={`${category.slug}-heading`} className="font-display text-2xl text-ink">
                  {category.name}
                </h2>
                <p className="mt-1 text-sm text-ink/60 max-w-prose">{category.description}</p>
              </div>
            </div>

            <ul className="mt-5 grid sm:grid-cols-2 gap-4">
              {tools.map((tool) => (
                <li key={tool.slug}>
                  <Link
                    href={`/${tool.slug}/`}
                    className="block rounded-lg border border-line p-5 hover:border-accent hover:bg-surface transition-colors"
                  >
                    <span className="font-display text-xl text-ink">{tool.name}</span>
                    <p className="mt-1 text-sm text-ink/60">{tool.intro}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <p className="mt-16 text-sm text-ink/50 max-w-prose">
        We&apos;re building this deliberately, one tool at a time, so every page is genuinely good
        before the next one starts. More are on the way.
      </p>
    </div>
  );
}
