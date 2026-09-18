import type { Metadata } from "next";
import { getToolBySlug } from "@/lib/tool-registry";
import { buildToolMetadata } from "@/lib/seo/tool-metadata";
import ImageCompressorPage from "@/components/tool-pages/ImageCompressorPage";

const tool = getToolBySlug("compress-jpeg");

export const metadata: Metadata = tool ? buildToolMetadata(tool, "/compress-jpeg/") : {};

export default function Page() {
  return <ImageCompressorPage slug="compress-jpeg" initialFormat="image/jpeg" />;
}
