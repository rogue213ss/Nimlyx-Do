import type { Metadata } from "next";
import { getToolBySlug } from "@/lib/tool-registry";
import { buildToolMetadata } from "@/lib/seo/tool-metadata";
import ImageCompressorPage from "@/components/tool-pages/ImageCompressorPage";

const tool = getToolBySlug("compress-png");

export const metadata: Metadata = tool ? buildToolMetadata(tool, "/compress-png/") : {};

export default function Page() {
  return <ImageCompressorPage slug="compress-png" initialFormat="image/png" />;
}
