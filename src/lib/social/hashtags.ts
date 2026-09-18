// Curated hashtag bank + generation logic.
//
// IMPORTANT SCOPE NOTE: this is not "AI hashtag research" — there's no
// live data source (no API, no backend, per this project's client-side
// architecture), so relevance comes from two deterministic sources only:
// (1) hashtags derived directly from the user's own topic words, and
// (2) a small curated bank matched by keyword overlap with the topic.
// Both are documented in the tool's FAQ/edge-case notes so the "how
// relevant can this really be" question is answered honestly rather than
// implied to be smarter than it is.
//
// "Avoid spammy/random output" is handled by: never inventing hashtags
// unrelated to the input, capping the generic-fallback bucket to a small
// minority of the result, deduping, and capping the total count.

import { extractKeywords, topicToTagSlug } from "./keywords";

interface CategoryBank {
  keywords: string[]; // topic words that trigger this bucket
  popular: string[];
  niche: string[];
}

// Deliberately a moderate, reviewable set of categories rather than an
// attempt at exhaustive coverage of every possible topic — unmatched
// topics still get useful hashtags from the derived-from-topic step.
const CATEGORY_BANKS: CategoryBank[] = [
  {
    keywords: ["fitness", "gym", "workout", "training", "exercise", "muscle", "strength"],
    popular: ["fitness", "workout", "gym", "fitnessmotivation", "training", "strengthtraining", "fitfam", "healthylifestyle"],
    niche: ["gymlife", "fitnessjourney", "workoutmotivation", "trainhard", "fitnessgoals", "gymmotivation", "strongnotskinny", "consistencyiskey"],
  },
  {
    keywords: ["travel", "trip", "vacation", "wanderlust", "explore", "adventure", "backpacking"],
    popular: ["travel", "travelgram", "wanderlust", "vacation", "explore", "travelphotography", "adventure", "instatravel"],
    niche: ["travelmore", "offthebeatenpath", "traveldiaries", "solotravel", "traveltheworld", "wanderer", "exploremore", "travelblogger"],
  },
  {
    keywords: ["food", "recipe", "cooking", "baking", "chef", "kitchen", "foodie", "meal"],
    popular: ["food", "foodie", "foodphotography", "instafood", "homecooking", "recipe", "delicious", "foodblogger"],
    niche: ["homemadefood", "cookingathome", "foodstyling", "eatlocal", "yummyfood", "foodlover", "bakinglove", "kitchenlife"],
  },
  {
    keywords: ["fashion", "outfit", "style", "clothing", "wardrobe", "ootd"],
    popular: ["fashion", "style", "ootd", "fashionblogger", "outfitoftheday", "styleinspo", "fashionstyle", "instafashion"],
    niche: ["everydaystyle", "styleoftheday", "fashionlover", "outfitinspo", "wardrobestaples", "personalstyle", "styleblogger", "lookbook"],
  },
  {
    keywords: ["beauty", "makeup", "skincare", "cosmetics", "beautytips"],
    popular: ["beauty", "makeup", "skincare", "beautyblogger", "makeuplover", "skincareroutine", "beautytips", "glowingskin"],
    niche: ["cleanbeauty", "skincarecommunity", "makeupartist", "naturalbeauty", "skincaretips", "beautyroutine", "selfcaresunday", "glowup"],
  },
  {
    keywords: ["business", "entrepreneur", "startup", "marketing", "smallbusiness", "hustle"],
    popular: ["business", "entrepreneur", "smallbusiness", "startup", "marketing", "entrepreneurlife", "businessowner", "hustle"],
    niche: ["smallbusinessowner", "businessgrowth", "entrepreneurmindset", "startuplife", "businesstips", "womaninbusiness", "solopreneur", "businessgoals"],
  },
  {
    keywords: ["tech", "technology", "coding", "software", "startup", "developer", "ai", "programming"],
    popular: ["tech", "technology", "coding", "programming", "software", "developer", "innovation", "techlife"],
    niche: ["codinglife", "softwaredeveloper", "techcommunity", "buildinpublic", "devlife", "techstartup", "programmerlife", "codenewbie"],
  },
  {
    keywords: ["art", "painting", "drawing", "illustration", "artist", "sketch", "creative"],
    popular: ["art", "artist", "artwork", "drawing", "illustration", "artistsoninstagram", "creativity", "instaart"],
    niche: ["artoftheday", "sketchbook", "digitalart", "artprocess", "traditionalart", "artcommunity", "workinprogress", "artlover"],
  },
  {
    keywords: ["music", "song", "musician", "singer", "band", "producer", "beat"],
    popular: ["music", "musician", "newmusic", "musicproducer", "singer", "musiclife", "songwriter", "livemusic"],
    niche: ["musiccommunity", "unsignedartist", "independentmusic", "studiolife", "musicproduction", "newartist", "musicvideo", "originalmusic"],
  },
  {
    keywords: ["photography", "photo", "photographer", "camera", "portrait", "landscape"],
    popular: ["photography", "photooftheday", "photographer", "instaphoto", "photoshoot", "portraitphotography", "landscapephotography", "capturedmoments"],
    niche: ["photographylovers", "shotoftheday", "naturalight", "moodygrams", "visualsoflife", "createexplore", "photographyislife", "artofvisuals"],
  },
  {
    keywords: ["pet", "dog", "cat", "puppy", "kitten", "animal", "petsofinstagram"],
    popular: ["dogsofinstagram", "catsofinstagram", "petstagram", "puppylove", "dogs", "cats", "petsofig", "animalphotography"],
    niche: ["rescuedog", "dogmom", "catmom", "petlife", "dogoftheday", "catlover", "adoptdontshop", "furbaby"],
  },
  {
    keywords: ["gaming", "gamer", "game", "esports", "streamer", "twitch"],
    popular: ["gaming", "gamer", "videogames", "gamingcommunity", "esports", "gamerlife", "twitch", "gamestagram"],
    niche: ["indiegame", "gamingsetup", "streamerlife", "pcgaming", "consolegaming", "gamedev", "gamingnews", "retrogaming"],
  },
  {
    keywords: ["home", "interior", "decor", "diy", "renovation", "house", "design"],
    popular: ["homedecor", "interiordesign", "diy", "homedesign", "homesweethome", "interiorstyling", "renovation", "homeinspo"],
    niche: ["homedecorideas", "cozyhome", "smallspaceliving", "interiorinspo", "diyhomedecor", "homedecorinspo", "modernhome", "housetohome"],
  },
  {
    keywords: ["health", "wellness", "mindfulness", "selfcare", "mentalhealth", "nutrition"],
    popular: ["wellness", "selfcare", "mentalhealth", "healthylifestyle", "mindfulness", "nutrition", "wellbeing", "healthyliving"],
    niche: ["selfcarejourney", "wellnessjourney", "mindfuleating", "mentalhealthmatters", "holistichealth", "wellnesstips", "healthyhabits", "innerpeace"],
  },
  {
    keywords: ["motivation", "inspiration", "mindset", "goals", "success", "productivity"],
    popular: ["motivation", "inspiration", "mindset", "motivationalquotes", "successmindset", "positivevibes", "goalsetting", "productivity"],
    niche: ["dailymotivation", "growthmindset", "selfimprovement", "mindsetmatters", "keepgoing", "focusonyourgoals", "levelup", "personalgrowth"],
  },
];

// Small, clearly-labeled fallback used only when a topic doesn't match
// any curated category — capped so it never dominates the result and
// never presented as topic-specific.
const GENERIC_FALLBACK = ["community", "sharethelove", "createeveryday", "smallcreators", "passionproject"];

export interface HashtagResult {
  hashtags: string[];
  matchedCategories: string[];
}

/**
 * Generates a hashtag set for a topic. Returns hashtags in priority
 * order: derived-from-topic first (always specific to what was typed),
 * then curated matches for any recognized category, then a small
 * generic fallback only if needed to reach a reasonable minimum count.
 *
 * `count` caps the result (default 20) — deliberately not unlimited, to
 * avoid the "wall of hashtags" spam pattern.
 */
export function generateHashtags(topic: string, count = 20): HashtagResult {
  if (topic.trim().length === 0) return { hashtags: [], matchedCategories: [] };

  const keywords = extractKeywords(topic);
  const result: string[] = [];
  const seen = new Set<string>();

  function add(tag: string) {
    const clean = tag.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (clean.length < 2 || seen.has(clean)) return;
    seen.add(clean);
    result.push(clean);
  }

  // 1. Derived directly from the topic itself.
  const slug = topicToTagSlug(topic);
  if (slug.length >= 2) add(slug);
  for (const word of keywords) add(word);

  // 2. Curated category matches.
  const matchedCategories: string[] = [];
  for (const bank of CATEGORY_BANKS) {
    const isMatch = bank.keywords.some((k) => keywords.includes(k));
    if (!isMatch) continue;
    matchedCategories.push(bank.keywords[0]!);
    for (const tag of [...bank.popular, ...bank.niche]) {
      if (result.length >= count) break;
      add(tag);
    }
  }

  // 3. Small generic fallback, only if still short of a usable count.
  for (const tag of GENERIC_FALLBACK) {
    if (result.length >= Math.min(count, 8)) break;
    add(tag);
  }

  return { hashtags: result.slice(0, count), matchedCategories };
}
