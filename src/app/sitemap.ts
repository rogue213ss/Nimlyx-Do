import type { MetadataRoute } from "next";
import {
  categories,
  getCategoryLastUpdated,
  getIndexableTools,
  getSiteLastUpdated,
} from "@/lib/tool-registry";
import { absoluteUrl } from "@/lib/site-config";

export default function sitemap(): MetadataRoute.Sitemap {
  // `lastModified` here is derived from each tool's own hand-maintained
  // `lastUpdated` field (see getCategoryLastUpdated/getSiteLastUpdated in
  // tool-registry.ts), not a separately tracked date — so it can't drift
  // out of sync with what actually changed, and nobody has to remember to
  // bump a date here when a tool's content is edited.
  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: getSiteLastUpdated(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];

  const categoryEntries: MetadataRoute.Sitemap = categories.map((c) => ({
    url: absoluteUrl(`/${c.slug}/`),
    lastModified: getCategoryLastUpdated(c.slug),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const toolEntries: MetadataRoute.Sitemap = getIndexableTools().map((t) => ({
    url: absoluteUrl(`/${t.slug}/`),
    lastModified: t.lastUpdated,
    changeFrequency: "monthly",
    priority: 0.9,
  }));

  // Deliberately excluded: noindex pages, internal search results, and any
  // parameterized/duplicate states. Only canonical, indexable URLs belong here.
  return [...staticEntries, ...categoryEntries, ...toolEntries];
}
