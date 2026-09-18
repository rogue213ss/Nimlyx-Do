import type { Metadata } from "next";
import Link from "next/link";
import { getCategoryBySlug, getToolsByCategory } from "@/lib/tool-registry";
import { buildCategoryMetadata } from "@/lib/seo/tool-metadata";
import Breadcrumbs from "@/components/Breadcrumbs";

const category = getCategoryBySlug("calculators");

export const metadata: Metadata = category
  ? buildCategoryMetadata(category, "/calculators/")
  : {};

export default function CalculatorsHubPage() {
  if (!category) return null;
  const tools = getToolsByCategory(category.slug).filter((t) => t.indexable);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: category.name, href: "/calculators/" },
        ]}
      />
      <h1 className="font-display text-3xl sm:text-4xl text-ink mt-4">{category.name}</h1>
      <p className="mt-3 max-w-prose text-ink/70 text-lg">{category.description}</p>

      <ul className="mt-8 grid sm:grid-cols-2 gap-4">
        {tools.map((tool) => (
          <li key={tool.slug}>
            <Link
              href={`/${tool.slug}/`}
              className="block rounded-lg border border-line p-5 hover:border-accent hover:bg-paper transition-colors"
            >
              <span className="font-display text-xl text-ink">{tool.name}</span>
              <p className="mt-1 text-sm text-ink/60">{tool.intro}</p>
            </Link>
          </li>
        ))}
      </ul>

      {tools.length === 1 && (
        <p className="mt-8 text-sm text-ink/50 max-w-prose">
          This category is just getting started — more calculators are added
          once each one meets our quality bar.
        </p>
      )}
    </div>
  );
}
