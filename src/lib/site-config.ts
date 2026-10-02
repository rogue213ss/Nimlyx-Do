export const siteConfig = {
  name: "Nimlyx Do",
  shortName: "Nimlyx Do",
  description: "Fast, free tools for everyday calculations, conversions, and problems.",
  // Must match the live deployment exactly (two o's: nimlyx-doo). Every canonical,
  // sitemap URL, og:url and robots sitemap line is built from this value.
  // Override per environment with NEXT_PUBLIC_SITE_URL (no trailing slash).
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://nimlyx-doo.vercel.app").replace(/\/$/, ""),
  locale: "en_US",
  twitterHandle: "@nimlyxdo",
};

export function absoluteUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${siteConfig.url}${cleanPath}`;
}
