import type { Metadata } from "next";
import { Fraunces, Inter, IBM_Plex_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { siteConfig } from "@/lib/site-config";

// Self-hosted via next/font: no external request at runtime, no CLS from
// late-loading web fonts. One display family (Fraunces — a ledger/notebook
// serif with real personality) + one workhorse sans for body/UI + one mono
// for numbers, matching the "calculation" subject matter.
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["500"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} – Free everyday tools`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    locale: siteConfig.locale,
  },
  twitter: {
    card: "summary",
    site: siteConfig.twitterHandle,
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: siteConfig.name,
  url: siteConfig.url,
  description: siteConfig.description,
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: siteConfig.name,
  url: siteConfig.url,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable} ${plexMono.variable}`}>
      <body className="font-body min-h-screen flex flex-col">
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-accent focus:text-paper focus:px-4 focus:py-2 focus:rounded"
        >
          Skip to content
        </a>
        <header className="border-b border-line">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/" className="font-display text-xl text-ink tracking-tight shrink-0">
              {siteConfig.name}
            </Link>
            <nav
              aria-label="Primary"
              className="flex items-center gap-5 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:overflow-visible sm:flex-wrap sm:justify-end"
            >
              <Link
                href="/image-tools/"
                className="shrink-0 text-sm text-ink/80 hover:text-accent underline-offset-4 hover:underline"
              >
                Image Tools
              </Link>
              <Link
                href="/developer-tools/"
                className="shrink-0 text-sm text-ink/80 hover:text-accent underline-offset-4 hover:underline"
              >
                Developer Tools
              </Link>
              <Link
                href="/pdf-tools/"
                className="shrink-0 text-sm text-ink/80 hover:text-accent underline-offset-4 hover:underline"
              >
                PDF Tools
              </Link>
              <Link
                href="/calculators/"
                className="shrink-0 text-sm text-ink/80 hover:text-accent underline-offset-4 hover:underline"
              >
                Calculators
              </Link>
              <Link
                href="/text-tools/"
                className="shrink-0 text-sm text-ink/80 hover:text-accent underline-offset-4 hover:underline"
              >
                Text Tools
              </Link>
              <Link
                href="/social-media-tools/"
                className="shrink-0 text-sm text-ink/80 hover:text-accent underline-offset-4 hover:underline"
              >
                Social Media Tools
              </Link>
            </nav>
          </div>
        </header>
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <footer className="border-t border-line mt-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 text-sm text-ink/60">
            {/* About / Privacy / Terms links are intentionally omitted until
               those pages exist — linking to pages that don't exist yet
               would violate the site's own no-dead-links rule. Add them
               here as soon as they're built. */}
            <span>© {new Date().getFullYear()} {siteConfig.name}</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
