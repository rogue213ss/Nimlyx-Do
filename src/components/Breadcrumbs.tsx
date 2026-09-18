import Link from "next/link";
import { absoluteUrl } from "@/lib/site-config";

export type Crumb = {
  name: string;
  href: string; // relative, e.g. "/calculators/"
};

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.href),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav aria-label="Breadcrumb" className="text-sm text-ink/60">
        <ol className="flex flex-wrap items-center gap-1">
          {items.map((item, i) => {
            const isLast = i === items.length - 1;
            return (
              <li key={item.href} className="flex items-center gap-1">
                {isLast ? (
                  <span aria-current="page" className="text-ink/80">
                    {item.name}
                  </span>
                ) : (
                  <>
                    <Link href={item.href} className="hover:text-accent hover:underline">
                      {item.name}
                    </Link>
                    <span aria-hidden="true" className="text-ink/30">
                      /
                    </span>
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
