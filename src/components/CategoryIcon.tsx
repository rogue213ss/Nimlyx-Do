// Small line icons, one per tool category. Deliberately hand-drawn and
// minimal (stroke-based, currentColor) rather than pulled from an icon
// library — five glyphs is a small enough surface that a dependency
// isn't worth it, and it keeps every visual element on the homepage
// traceable to this codebase rather than a generic kit.

import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Base({ children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

function PdfIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M6 3h8l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path d="M14 3v4h4" />
      <path d="M8.5 14.5v3M8.5 14.5h1.2a1.2 1.2 0 1 1 0 2.4H8.5M12 17.5v-3h1a1.5 1.5 0 0 1 0 3h-1ZM17 14.5h-1.8v3M15.2 16h1.5" />
    </Base>
  );
}

function ImageIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="1.5" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="m5 17 4.5-4.5a1.5 1.5 0 0 1 2.1 0L15 16M14 15l1.6-1.6a1.5 1.5 0 0 1 2.1 0L20 16" />
    </Base>
  );
}

function DeveloperIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="m9 8-4 4 4 4M15 8l4 4-4 4" />
    </Base>
  );
}

function CalculatorIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="5" y="3" width="14" height="18" rx="1.5" />
      <path d="M8 7h8" />
      <path d="M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01" />
    </Base>
  );
}

function TextIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M5 6h14M5 12h14M5 18h9" />
    </Base>
  );
}

const ICONS_BY_CATEGORY: Record<string, (props: IconProps) => React.JSX.Element> = {
  "pdf-tools": PdfIcon,
  "image-tools": ImageIcon,
  "developer-tools": DeveloperIcon,
  calculators: CalculatorIcon,
  "text-tools": TextIcon,
};

export default function CategoryIcon({ slug, ...props }: IconProps & { slug: string }) {
  const Icon = ICONS_BY_CATEGORY[slug];
  if (!Icon) return null;
  return <Icon {...props} />;
}
