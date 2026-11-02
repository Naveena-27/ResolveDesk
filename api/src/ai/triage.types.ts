import { z } from 'zod';
import {
  TicketCategory,
  TicketPriority,
  TicketSentiment,
} from '../tickets/ticket.enums.js';

/**
 * The exact shape we ask the LLM to return. OpenAI's structured outputs
 * guarantee the response matches this schema, so we never parse free text.
 */
export const TriageSchema = z.object({
  category: z.enum(TicketCategory),
  priority: z.enum(TicketPriority),
  sentiment: z.enum(TicketSentiment),
  summary: z
    .string()
    .describe('One sentence, max 20 words, describing the problem'),
  suggestedReply: z
    .string()
    .describe('A short, polite reply to the customer, signed "ResolveDesk Support"'),
});

export type Triage = z.infer<typeof TriageSchema>;

export interface TriageInput {
  customerName: string;
  subject: string;
  message: string;
}
