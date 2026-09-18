// Formats a topic + a list of key points into a conventional YouTube
// description structure: intro line, bulleted key points, optional
// hashtags, closing CTA. Template-based, same discipline as the other
// social lib files.

import { titleCaseTopic } from "./keywords";
import { generateHashtags } from "./hashtags";

export interface DescriptionOptions {
  topic: string;
  keyPoints: string[]; // already split into individual lines by the caller
  includeHashtags: boolean;
  includeSubscribeCta: boolean;
}

/** Builds a formatted YouTube description. `keyPoints` should already be
 * trimmed, non-empty lines (the UI is responsible for splitting the raw
 * textarea input into lines before calling this). */
export function generateDescription(options: DescriptionOptions): string {
  const { topic, keyPoints, includeHashtags, includeSubscribeCta } = options;
  const topicTitled = titleCaseTopic(topic);
  const lines: string[] = [];

  lines.push(`In this video, we're diving into ${topic.trim().toLowerCase()}.`);
  lines.push("");

  if (keyPoints.length > 0) {
    lines.push("What you'll learn:");
    for (const point of keyPoints) lines.push(`• ${point}`);
    lines.push("");
  }

  if (includeSubscribeCta) {
    lines.push(`If you found this helpful, consider subscribing for more videos on ${topicTitled.toLowerCase()} and beyond.`);
    lines.push("");
  }

  if (includeHashtags) {
    const { hashtags } = generateHashtags(topic, 8);
    if (hashtags.length > 0) {
      lines.push(hashtags.map((h) => `#${h}`).join(" "));
    }
  }

  // Trim any trailing blank line for a clean copy/paste result.
  while (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();

  return lines.join("\n");
}
