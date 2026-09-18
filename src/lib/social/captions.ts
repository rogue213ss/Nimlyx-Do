// Caption template formulas. Deliberately template/formula-based, not
// generative — this project's tools run entirely client-side with no
// backend and no LLM call, so "caption generation" here means filling
// well-constructed sentence templates with the user's topic, not
// composing genuinely novel prose. This is stated plainly in each
// tool's FAQ rather than implied to be smarter than it is.

import { titleCaseTopic } from "./keywords";

export type CaptionTone = "casual" | "professional" | "funny" | "inspirational" | "minimal";

export const CAPTION_TONES: { id: CaptionTone; label: string }[] = [
  { id: "casual", label: "Casual" },
  { id: "professional", label: "Professional" },
  { id: "funny", label: "Funny" },
  { id: "inspirational", label: "Inspirational" },
  { id: "minimal", label: "Minimal" },
];

// {topic} is replaced with the title-cased topic; {topicLower} with the
// lowercase original wording — templates pick whichever reads naturally.
const TEMPLATES: Record<CaptionTone, string[]> = {
  casual: [
    "just another day with {topicLower} 🙂",
    "okay but can we talk about {topicLower} for a sec?",
    "{topic} kind of day",
    "not me getting way too into {topicLower} again",
    "living my best life, one {topicLower} at a time",
  ],
  professional: [
    "Excited to share this moment with {topicLower}.",
    "A closer look at {topicLower}.",
    "Grateful for the opportunity to explore {topicLower}.",
    "Here's what {topicLower} has taught me lately.",
    "Proud to showcase {topicLower} today.",
  ],
  funny: [
    "me: I'll just do {topicLower} for five minutes. also me, three hours later:",
    "{topic}? in this economy?",
    "no thoughts, just {topicLower}",
    "this is fine (it's about {topicLower})",
    "plot twist: it was {topicLower} all along",
  ],
  inspirational: [
    "Every step toward {topicLower} counts. Keep going.",
    "Trust the process — {topic} is a journey, not a destination.",
    "Small progress with {topicLower} is still progress.",
    "Chasing {topicLower} one day at a time.",
    "This is your reminder that {topicLower} is worth the effort.",
  ],
  minimal: [
    "{topic}.",
    "on {topicLower}",
    "{topic} — today.",
    "just {topicLower}",
    "{topic}, simply.",
  ],
};

export interface CaptionResult {
  caption: string;
}

/** Generates `count` distinct caption variants for a topic and tone. */
export function generateCaptions(topic: string, tone: CaptionTone, count = 3): CaptionResult[] {
  const topicTitled = titleCaseTopic(topic);
  const topicLower = topic.trim().toLowerCase();
  const templates = TEMPLATES[tone];

  return templates.slice(0, count).map((template) => ({
    caption: template.replace(/\{topic\}/g, topicTitled).replace(/\{topicLower\}/g, topicLower),
  }));
}
