import { notFound } from "next/navigation";
import { getCategoryBySlug, getToolBySlug } from "@/lib/tool-registry";
import { buildFaqJsonLd, buildWebAppJsonLd } from "@/lib/seo/tool-metadata";
import Breadcrumbs from "@/components/Breadcrumbs";
import ImageCompressor from "@/components/ImageCompressor";
import type { OutputFormat } from "@/lib/image-compressor/types";

interface Props {
  slug: string;
  initialTargetKb?: number;
  initialFormat?: OutputFormat;
}

export default function ImageCompressorPage({ slug, initialTargetKb, initialFormat }: Props) {
  const tool = getToolBySlug(slug);
  if (!tool) return notFound();
  const category = getCategoryBySlug(tool.category);
  const path = `/${tool.slug}/`;

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
          { name: category?.name ?? "Image Tools", href: "/image-tools/" },
          { name: tool.name, href: path },
        ]}
      />

      <h1 className="font-display text-3xl sm:text-4xl text-ink mt-4">{tool.h1}</h1>
      <p className="mt-3 max-w-prose text-ink/70 text-lg">{tool.intro}</p>

      <div className="mt-6">
        <ImageCompressor initialTargetKb={initialTargetKb} initialFormat={initialFormat} />
      </div>

      <section className="mt-14 max-w-prose" aria-labelledby="how-it-works">
        <h2 id="how-it-works" className="font-display text-2xl text-ink">
          How it works
        </h2>
        <p className="mt-2 text-ink/70">
          Drop in a JPG, PNG, or WebP image, or select one from your device.
          The image is decoded and re-encoded right in your browser — nothing
          is uploaded. Pick a target file size, or leave it on the default
          balanced quality, and download the result when it&apos;s ready.
        </p>
      </section>

      <section className="mt-12 max-w-prose" aria-labelledby="target-size">
        <h2 id="target-size" className="font-display text-2xl text-ink">
          Compressing to a specific size
        </h2>
        <p className="mt-2 text-ink/70">
          Turn on &ldquo;Compress to a specific file size&rdquo; and enter a
          target in KB — useful when a form, upload limit, or email attachment
          caps how large a file can be. The tool searches for the highest
          quality that fits your target; if quality alone can&apos;t get there,
          it carefully reduces the image&apos;s dimensions rather than
          producing an unusably low-quality result. If a target genuinely
          can&apos;t be reached, you&apos;ll get the smallest practical result
          instead of a false promise.
        </p>
      </section>

      <section className="mt-12 max-w-prose" aria-labelledby="privacy">
        <h2 id="privacy" className="font-display text-2xl text-ink">
          Privacy
        </h2>
        <p className="mt-2 text-ink/70">
          Your images are processed entirely on your device. They never leave
          your browser — there&apos;s no upload, no server-side processing,
          and no copy kept anywhere. Closing or refreshing the tab clears
          everything.
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
