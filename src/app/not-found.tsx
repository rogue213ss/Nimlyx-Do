import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

export default function NotFound() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
      <p className="font-mono text-sm text-accent">404</p>
      <h1 className="mt-3 font-display text-3xl sm:text-4xl text-ink">
        We couldn&apos;t find that page.
      </h1>
      <p className="mt-3 text-ink/70 max-w-prose mx-auto">
        The page you&apos;re looking for doesn&apos;t exist on {siteConfig.name}, or it may have moved.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex min-h-[44px] items-center px-5 rounded-lg bg-accent text-paper font-semibold text-sm hover:bg-accent-dark
          focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
      >
        Browse all tools
      </Link>
    </div>
  );
}
