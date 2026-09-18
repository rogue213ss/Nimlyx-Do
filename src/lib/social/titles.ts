// YouTube title formulas — same template-based approach as captions.ts,
// not generative. See that file's header comment for the reasoning.

import { titleCaseTopic } from "./keywords";

export type TitleCategory = "howto" | "listicle" | "story" | "review" | "challenge";

export const TITLE_CATEGORIES: { id: TitleCategory; label: string }[] = [
  { id: "howto", label: "How-to / tutorial" },
  { id: "listicle", label: "List" },
  { id: "story", label: "Story / vlog" },
  { id: "review", label: "Review / opinion" },
  { id: "challenge", label: "Challenge" },
];

const TEMPLATES: Record<TitleCategory, string[]> = {
  howto: [
    "How to {topicLower} (Step by Step)",
    "The Beginner's Guide to {topic}",
    "{topic}: Everything You Need to Know",
    "How I Finally Figured Out {topicLower}",
    "{topic} Explained in 5 Minutes",
  ],
  listicle: [
    "5 Things Nobody Tells You About {topic}",
    "10 {topic} Mistakes to Avoid",
    "7 Tips for Better {topic}",
    "3 {topic} Hacks That Actually Work",
    "Top 5 {topic} Lessons I Wish I Knew Sooner",
  ],
  story: [
    "I Tried {topicLower} for 30 Days — Here's What Happened",
    "My Honest {topic} Journey So Far",
    "What {topic} Taught Me This Year",
    "A Day in My Life: {topic} Edition",
    "The Truth About {topicLower} No One Talks About",
  ],
  review: [
    "{topic}: Is It Actually Worth It?",
    "My Honest Review of {topic}",
    "{topic} — What Nobody Tells You Before You Start",
    "Rating {topic} After 30 Days",
    "{topic}: The Good, the Bad, and the Ugly",
  ],
  challenge: [
    "I Tried {topicLower} So You Don't Have To",
    "The {topic} Challenge (30 Days Later)",
    "Can I Actually {topicLower} in a Week?",
    "{topic}: The Ultimate Challenge",
    "I Attempted {topicLower} — Here's How It Went",
  ],
};

/** Generates `count` distinct title variants for a topic and category. */
export function generateTitles(topic: string, category: TitleCategory, count = 5): string[] {
  const topicTitled = titleCaseTopic(topic);
  const topicLower = topic.trim().toLowerCase();
  return TEMPLATES[category]
    .slice(0, count)
    .map((template) => template.replace(/\{topic\}/g, topicTitled).replace(/\{topicLower\}/g, topicLower));
}
