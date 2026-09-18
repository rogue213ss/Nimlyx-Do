import type { MetadataRoute } from "next";
import { categories, getIndexableTools } from "@/lib/tool-registry";
import { absoluteUrl } from "@/lib/site-config";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];

  const categoryEntries: MetadataRoute.Sitemap = categories.map((c) => ({
    url: absoluteUrl(`/${c.slug}/`),
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
