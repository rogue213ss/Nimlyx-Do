// TikTok captions: same template approach as captions.ts, but shorter
// and more punchy per TikTok convention, and paired with a smaller
// hashtag count (TikTok captions conventionally use far fewer hashtags
// than Instagram — 3-6, not 20+).

import { titleCaseTopic } from "./keywords";
import { generateHashtags } from "./hashtags";

const TEMPLATES: string[] = [
  "wait for it… ({topicLower})",
  "tell me you're into {topicLower} without telling me",
  "{topic} hits different",
  "pov: you're obsessed with {topicLower} too",
  "rating my {topicLower} era",
  "the way I panicked over {topicLower} 💀",
];

export interface TiktokResult {
  caption: string;
  hashtags: string[];
}

/** Generates `count` short TikTok caption + hashtag pairs for a topic. */
export function generateTiktokCaptions(topic: string, count = 4): TiktokResult[] {
  const topicTitled = titleCaseTopic(topic);
  const topicLower = topic.trim().toLowerCase();
  const { hashtags } = generateHashtags(topic, 6);

  return TEMPLATES.slice(0, count).map((template) => ({
    caption: template.replace(/\{topic\}/g, topicTitled).replace(/\{topicLower\}/g, topicLower),
    hashtags,
  }));
}
