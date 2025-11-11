import { SupportedLanguage } from "./language";
import { normalizeText } from "./text";

type DenylistEntry = {
  term: string;
  regex: RegExp;
};

const DENYLIST_ENTRIES: DenylistEntry[] = [
  { term: "politics", regex: /\bpolitic(?:s|al)?\b/i },
  { term: "election", regex: /\belection\b/i },
  { term: "president", regex: /\bpresident\b/i },
  { term: "government", regex: /\bgovern(?:ment|ance)\b/i },
  { term: "hitler", regex: /\bhitler\b/i },
  { term: "nazi", regex: /\bnazi\b/i },
  { term: "isis", regex: /\bisis\b/i },
  { term: "terror", regex: /\bterror(?:ism|ist)?\b/i },
  { term: "extremism", regex: /\bextrem(?:ism|ist)\b/i },
  { term: "racism", regex: /\braci(?:sm|st)\b/i },
  { term: "hate speech", regex: /\bhate\s+(?:speech|group|crime)\b/i },
  { term: "sex", regex: /\bsex(?:ual|\b)/i },
  { term: "porn", regex: /\bporn(?:ography|\b)/i },
  { term: "nsfw", regex: /\bnsfw\b/i },
  { term: "adult", regex: /\badult\s+(?:content|video|film)s?\b/i },
  { term: "fetish", regex: /\bfetish\b/i },
  { term: "violence", regex: /\bviolence\b/i },
  { term: "weapons", regex: /\bweapon(?:s|ry)?\b/i },
  { term: "suicide", regex: /\bsuicid(?:e|al)\b/i },
  { term: "self harm", regex: /self\s*harm/i },
  { term: "politics-he", regex: /פוליט/i },
  { term: "elections-he", regex: /בחירות/i },
  { term: "government-he", regex: /ממשלה/i },
  { term: "president-he", regex: /נשיא/i },
  { term: "terror-he", regex: /טרור/i },
  { term: "extremism-he", regex: /קיצונ/i },
  { term: "hitler-he", regex: /היטלר/i },
  { term: "nazi-he", regex: /נאצי/i },
  { term: "sex-he", regex: /סקס|מין/i },
  { term: "porn-he", regex: /פורנ/i },
  { term: "nsfw-he", regex: /ארוט/i },
  { term: "violence-he", regex: /אלימות/i },
  { term: "weapons-he", regex: /נשק/i },
  { term: "hate-he", regex: /שנאה/i },
];

export const BLOCKED_TOPIC_MESSAGES: Record<SupportedLanguage, string> = {
  he: "מצטערים, לא ניתן לענות על הנושא הזה. אפשר לשאול שאלות על כושר, תזונה ובריאות כללית בלבד.",
  en: "Sorry, I can't help with that topic. Please ask about fitness, nutrition, or general wellness instead.",
};

export const matchDenylistedTopic = (rawText: string): string | null => {
  const text = normalizeText(rawText);

  if (!text) {
    return null;
  }

  const entry = DENYLIST_ENTRIES.find((item) => item.regex.test(text));
  return entry ? entry.term : null;
};
