import {
  TicketCategory,
  TicketPriority,
  TicketSentiment,
} from '../tickets/ticket.enums.js';
import type { Triage, TriageInput } from './triage.types.js';

/**
 * Keyword-based fallback used when no OpenAI key is set or the API call fails.
 * It keeps the app usable offline and makes the AI path easy to compare against.
 */

const CATEGORY_KEYWORDS: Record<Exclude<TicketCategory, TicketCategory.OTHER>, string[]> = {
  [TicketCategory.BILLING]: ['charge', 'charged', 'refund', 'invoice', 'payment', 'bill', 'price', 'subscription'],
  [TicketCategory.TECHNICAL]: ['error', 'bug', 'crash', 'not working', "doesn't work", 'broken', 'slow', 'login', 'app'],
  [TicketCategory.ACCOUNT]: ['account', 'password', 'email change', 'locked', 'username', 'delete my'],
  [TicketCategory.DELIVERY]: ['delivery', 'shipping', 'shipped', 'package', 'arrived', 'courier', 'tracking'],
  [TicketCategory.PRODUCT]: ['quality', 'damaged', 'defective', 'size', 'feature', 'product'],
};

const URGENT_WORDS = ['urgent', 'immediately', 'asap', 'lawyer', 'legal', 'fraud', 'security', 'hacked'];
const HIGH_WORDS = ['twice', 'still', 'again', 'unacceptable', 'cancel', 'refund', 'locked'];
const NEGATIVE_WORDS = ['angry', 'terrible', 'worst', 'unacceptable', 'disappointed', 'frustrated', 'annoyed', 'never', 'awful'];
const POSITIVE_WORDS = ['thanks', 'thank you', 'great', 'love', 'appreciate', 'happy'];

function countHits(text: string, words: string[]): number {
  return words.filter((w) => text.includes(w)).length;
}

export function ruleBasedTriage(input: TriageInput): Triage {
  const text = `${input.subject} ${input.message}`.toLowerCase();

  let category = TicketCategory.OTHER;
  let best = 0;
  for (const [cat, words] of Object.entries(CATEGORY_KEYWORDS)) {
    const hits = countHits(text, words);
    if (hits > best) {
      best = hits;
      category = cat as TicketCategory;
    }
  }

  const negative = countHits(text, NEGATIVE_WORDS);
  const positive = countHits(text, POSITIVE_WORDS);
  const sentiment =
    negative > positive
      ? TicketSentiment.NEGATIVE
      : positive > negative
        ? TicketSentiment.POSITIVE
        : TicketSentiment.NEUTRAL;

  let priority = TicketPriority.LOW;
  if (countHits(text, URGENT_WORDS) > 0) priority = TicketPriority.URGENT;
  else if (countHits(text, HIGH_WORDS) > 0 || negative >= 2) priority = TicketPriority.HIGH;
  else if (sentiment === TicketSentiment.POSITIVE) priority = TicketPriority.LOW;
  else if (category !== TicketCategory.OTHER || negative > 0) priority = TicketPriority.MEDIUM;

  const firstName = input.customerName.trim().split(/\s+/)[0] || 'there';
  // Use the first sentence of the message as a rough summary.
  const firstSentence = input.message.trim().split(/(?<=[.!?])\s+/)[0] ?? input.subject;
  const summary =
    firstSentence.length > 140 ? `${firstSentence.slice(0, 137).trimEnd()}...` : firstSentence;
  const suggestedReply =
    `Hi ${firstName},\n\n` +
    `Thanks for reaching out about "${input.subject.trim()}". We're sorry for the trouble. ` +
    `Our ${category === TicketCategory.OTHER ? 'support' : category} team is looking into it and will get back to you shortly.\n\n` +
    `ResolveDesk Support`;

  return { category, priority, sentiment, summary, suggestedReply };
}
