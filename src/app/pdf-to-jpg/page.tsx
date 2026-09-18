import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoryBySlug, getToolBySlug } from "@/lib/tool-registry";
import { buildFaqJsonLd, buildToolMetadata, buildWebAppJsonLd } from "@/lib/seo/tool-metadata";
import Breadcrumbs from "@/components/Breadcrumbs";
import PdfToJpg from "@/components/PdfToJpg";

const tool = getToolBySlug("pdf-to-jpg");

export const metadata: Metadata = tool ? buildToolMetadata(tool, "/pdf-to-jpg/") : {};

export default function PdfToJpgPage() {
  if (!tool) return notFound();
  const category = getCategoryBySlug(tool.category);
  const path = "/pdf-to-jpg/";

  const webAppJsonLd = buildWebAppJsonLd(tool, path);
  const faqJsonLd = buildFaqJsonLd(tool);

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
          { name: category?.name ?? "PDF Tools", href: "/pdf-tools/" },
          { name: tool.name, href: path },
        ]}
      />

      <h1 className="font-display text-3xl sm:text-4xl text-ink mt-4">{tool.h1}</h1>
      <p className="mt-3 max-w-prose text-ink/70 text-lg">{tool.intro}</p>

      <div className="mt-6">
        <PdfToJpg />
      </div>

      <section className="mt-14 max-w-prose" aria-labelledby="how-it-works">
        <h2 id="how-it-works" className="font-display text-2xl text-ink">
          How it works
        </h2>
        <p className="mt-2 text-ink/70">
          Select or drop in a PDF, choose a JPG quality and resolution, and convert. Each page
          becomes its own JPG image that you can preview and download individually, or all at
          once as a ZIP file. Multi-page PDFs are converted page by page, so you always know
          exactly what&apos;s happening.
        </p>
      </section>

      <section className="mt-12 max-w-prose" aria-labelledby="privacy">
        <h2 id="privacy" className="font-display text-2xl text-ink">
          Privacy
        </h2>
        <p className="mt-2 text-ink/70">
          Your PDF is processed entirely on your device. It never leaves your browser — there&apos;s
          no upload, no server-side processing, and no copy kept anywhere.
        </p>
      </section>

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
                  <span
                    aria-hidden="true"
                    className="text-ink/40 group-open:rotate-45 transition-transform text-xl leading-none"
                  >
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
