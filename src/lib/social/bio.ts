// Character-aware bio templates per platform. Each platform has a
// different conventional character limit — the generator fills a
// template and truncates cleanly at a word boundary if needed, rather
// than cutting mid-word or silently exceeding the limit.

import { titleCaseTopic } from "./keywords";

export type BioPlatform = "instagram" | "tiktok" | "x" | "linkedin";

export const BIO_PLATFORMS: { id: BioPlatform; label: string; limit: number }[] = [
  { id: "instagram", label: "Instagram", limit: 150 },
  { id: "tiktok", label: "TikTok", limit: 80 },
  { id: "x", label: "X", limit: 160 },
  { id: "linkedin", label: "LinkedIn (headline)", limit: 220 },
];

function getLimit(platform: BioPlatform): number {
  return BIO_PLATFORMS.find((p) => p.id === platform)!.limit;
}

const TEMPLATES: Record<BioPlatform, string[]> = {
  instagram: [
    "{topic} enthusiast ✨ sharing the journey, one post at a time",
    "here for the {topicLower} 📍 new posts weekly",
    "{topic} | creating + sharing what I love",
    "turning my {topicLower} passion into a page 🌱",
  ],
  tiktok: [
    "{topic} content daily ✨",
    "just here for {topicLower} 📍",
    "{topic} | new vids weekly",
    "obsessed with {topicLower} 🌱",
  ],
  x: [
    "Talking about {topicLower}, mostly. Occasionally other things.",
    "{topic} enthusiast. Sharing thoughts and the occasional hot take.",
    "Here for {topicLower} and good conversation.",
    "{topic} | thoughts are my own",
  ],
  linkedin: [
    "Passionate about {topicLower} | Helping others grow in this space",
    "{topic} professional focused on delivering real results",
    "Exploring {topicLower}, one project at a time | Open to connecting",
    "Building a career around {topicLower} | Always learning",
  ],
};

export interface BioResult {
  bio: string;
  length: number;
  limit: number;
  withinLimit: boolean;
}

/** Truncates text to fit within `limit` characters, cutting at the last
 * whole word rather than mid-word, and never leaving trailing
 * punctuation-less fragments. */
function truncateToLimit(text: string, limit: number): string {
  if (text.length <= limit) return text;
  const sliced = text.slice(0, limit);
  const lastSpace = sliced.lastIndexOf(" ");
  const cut = lastSpace > 0 ? sliced.slice(0, lastSpace) : sliced;
  return cut.trimEnd();
}

/** Generates bio variants for a topic on a given platform, each
 * truncated to fit that platform's conventional character limit. */
export function generateBios(topic: string, platform: BioPlatform): BioResult[] {
  const topicTitled = titleCaseTopic(topic);
  const topicLower = topic.trim().toLowerCase();
  const limit = getLimit(platform);

  return TEMPLATES[platform].map((template) => {
    const filled = template.replace(/\{topic\}/g, topicTitled).replace(/\{topicLower\}/g, topicLower);
    const bio = truncateToLimit(filled, limit);
    return { bio, length: bio.length, limit, withinLimit: bio.length <= limit };
  });
}
