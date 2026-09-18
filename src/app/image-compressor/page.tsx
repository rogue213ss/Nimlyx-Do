import type { Metadata } from "next";
import { getToolBySlug } from "@/lib/tool-registry";
import { buildToolMetadata } from "@/lib/seo/tool-metadata";
import ImageCompressorPage from "@/components/tool-pages/ImageCompressorPage";

const tool = getToolBySlug("image-compressor");

export const metadata: Metadata = tool ? buildToolMetadata(tool, "/image-compressor/") : {};

export default function Page() {
  return <ImageCompressorPage slug="image-compressor" />;
}
