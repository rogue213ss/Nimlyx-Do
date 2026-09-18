import type { Metadata } from "next";
import { getToolBySlug } from "@/lib/tool-registry";
import { buildToolMetadata } from "@/lib/seo/tool-metadata";
import ImageResizerPage from "@/components/tool-pages/ImageResizerPage";

const tool = getToolBySlug("image-resizer");

export const metadata: Metadata = tool ? buildToolMetadata(tool, "/image-resizer/") : {};

export default function Page() {
  return <ImageResizerPage />;
}
