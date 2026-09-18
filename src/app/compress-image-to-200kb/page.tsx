import type { Metadata } from "next";
import { getToolBySlug } from "@/lib/tool-registry";
import { buildToolMetadata } from "@/lib/seo/tool-metadata";
import ImageCompressorPage from "@/components/tool-pages/ImageCompressorPage";

const tool = getToolBySlug("compress-image-to-200kb");

export const metadata: Metadata = tool ? buildToolMetadata(tool, "/compress-image-to-200kb/") : {};

export default function Page() {
  return <ImageCompressorPage slug="compress-image-to-200kb" initialTargetKb={200} />;
}
