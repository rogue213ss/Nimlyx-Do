export const siteConfig = {
  name: "Nimlyx Do",
  shortName: "Nimlyx Do",
  description: "Fast, free tools for everyday calculations, conversions, and problems.",
  url: "https://nimlyx-do.vercel.app",
  locale: "en_US",
  twitterHandle: "@nimlyxdo",
};

export function absoluteUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${siteConfig.url}${cleanPath}`;
}
