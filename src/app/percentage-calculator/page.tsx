import type { Metadata } from "next";
import { getToolBySlug, getCategoryBySlug } from "@/lib/tool-registry";
import { absoluteUrl } from "@/lib/site-config";
import Breadcrumbs from "@/components/Breadcrumbs";
import PercentageCalculator from "@/components/PercentageCalculator";
import { notFound } from "next/navigation";

const tool = getToolBySlug("percentage-calculator");

export const metadata: Metadata = tool
  ? {
      title: tool.title,
      description: tool.metaDescription,
      alternates: {
        canonical: absoluteUrl("/percentage-calculator/"),
      },
      robots: tool.indexable
        ? { index: true, follow: true }
        : { index: false, follow: true },
      openGraph: {
        title: tool.title,
        description: tool.metaDescription,
        url: absoluteUrl("/percentage-calculator/"),
        type: "website",
      },
      twitter: {
        card: "summary",
        title: tool.title,
        description: tool.metaDescription,
      },
    }
  : {};

export default function PercentageCalculatorPage() {
  if (!tool) return notFound();
  const category = getCategoryBySlug(tool.category);

  const webAppJsonLd = {
    "@context": "https://schema.org",
    "@type": tool.schemaType,
    name: tool.name,
    url: absoluteUrl("/percentage-calculator/"),
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    dateModified: tool.lastUpdated,
  };

  const faqJsonLd =
    tool.faq && tool.faq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: tool.faq.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.answer,
            },
          })),
        }
      : null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}

      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: category?.name ?? "Calculators", href: "/calculators/" },
          { name: tool.name, href: "/percentage-calculator/" },
        ]}
      />

      <h1 className="font-display text-3xl sm:text-4xl text-ink mt-4">{tool.h1}</h1>
      <p className="mt-3 max-w-prose text-ink/70 text-lg">{tool.intro}</p>

      {/* The tool itself — visible immediately, no scroll needed on desktop.
         Constrained to max-w-2xl rather than the page's full width: a
         calculator that stretches edge-to-edge on a wide screen reads as a
         form, not a focused product. */}
      <div className="mt-6 max-w-2xl">
        <PercentageCalculator />
      </div>

      {/* How it works / formulas */}
      {tool.formula && (
        <section className="mt-14 max-w-prose" aria-labelledby="how-it-works">
          <h2 id="how-it-works" className="font-display text-2xl text-ink">
            How it works
          </h2>
          <p className="mt-2 text-ink/70">
            Each mode above uses a different formula. Here they are in full, so
            you can see exactly how a result was reached.
          </p>
          <dl className="mt-4 divide-y divide-line border-y border-line">
            {tool.formula.map((f) => (
              <div key={f.label} className="py-3 flex flex-col sm:flex-row sm:items-baseline sm:gap-4">
                <dt className="text-sm text-ink/60 sm:w-56 shrink-0">{f.label}</dt>
                <dd className="font-mono text-ink">{f.expression}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {/* Worked examples */}
      {tool.examples && (
        <section className="mt-12 max-w-prose" aria-labelledby="examples">
          <h2 id="examples" className="font-display text-2xl text-ink">
            Worked examples
          </h2>
          <ul className="mt-4 space-y-4">
            {tool.examples.map((ex) => (
              <li key={ex.label} className="rounded-md border border-line p-4">
                <p className="text-sm font-medium text-ink/60">{ex.label}</p>
                <p className="mt-1 font-mono text-ink">
                  {ex.input} → <span className="text-result">{ex.result}</span>
                </p>
                <p className="mt-1 text-sm text-ink/60">{ex.explanation}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Edge cases / notes */}
      {tool.edgeCaseNotes && (
        <section className="mt-12 max-w-prose" aria-labelledby="notes">
          <h2 id="notes" className="font-display text-2xl text-ink">
            Things to know
          </h2>
          <ul className="mt-4 space-y-2 list-disc pl-5 text-ink/70">
            {tool.edgeCaseNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </section>
      )}

      {/* FAQ — only rendered because genuine FAQ content exists in the registry */}
      {tool.faq && (
        <section className="mt-12 max-w-prose" aria-labelledby="faq">
          <h2 id="faq" className="font-display text-2xl text-ink">
            Frequently asked questions
          </h2>
          <div className="mt-4 divide-y divide-line border-y border-line">
            {tool.faq.map((item) => (
              <details key={item.question} className="group py-4">
                <summary className="cursor-pointer list-none font-medium text-ink marker:content-none flex justify-between items-center gap-4">
                  {item.question}
                  <span aria-hidden="true" className="text-ink/40 group-open:rotate-45 transition-transform text-xl leading-none">
                    +
                  </span>
                </summary>
                <p className="mt-2 text-ink/70">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
