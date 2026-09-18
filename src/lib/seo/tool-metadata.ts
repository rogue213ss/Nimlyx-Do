import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site-config";
import type { ToolConfig, Category } from "@/lib/tool-registry";

/** Builds Next.js Metadata for a registry tool, matching the shape already
 * established by the percentage-calculator page. Shared here so the image
 * tool family (one page per SEO intent, same underlying component) doesn't
 * duplicate this block six times. */
export function buildToolMetadata(tool: ToolConfig, path: string): Metadata {
  const url = absoluteUrl(path);
  return {
    title: tool.title,
    description: tool.metaDescription,
    alternates: { canonical: url },
    robots: tool.indexable ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      title: tool.title,
      description: tool.metaDescription,
      url,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: tool.title,
      description: tool.metaDescription,
    },
  };
}

/** Builds Next.js Metadata for a category hub page. Every hub page
 * (calculators, image-tools, developer-tools, pdf-tools, text-tools,
 * social-media-tools) previously set only title/description/canonical and
 * fell through to the root layout's generic sitewide openGraph/twitter
 * defaults — meaning every hub's social-share preview looked identical
 * (same title, same description) instead of reflecting that category.
 * Shared here, matching buildToolMetadata's shape, so the fix applies
 * once rather than being duplicated six times across hub pages. */
export function buildCategoryMetadata(category: Category, path: string): Metadata {
  const url = absoluteUrl(path);
  return {
    title: category.name,
    description: category.description,
    alternates: { canonical: url },
    openGraph: {
      title: category.name,
      description: category.description,
      url,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: category.name,
      description: category.description,
    },
  };
}

export function buildWebAppJsonLd(tool: ToolConfig, path: string) {
  return {
    "@context": "https://schema.org",
    "@type": tool.schemaType,
    name: tool.name,
    url: absoluteUrl(path),
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    dateModified: tool.lastUpdated,
  };
}

export function buildFaqJsonLd(tool: ToolConfig) {
  if (!tool.faq || tool.faq.length === 0) return null;
  return {
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
  };
}
