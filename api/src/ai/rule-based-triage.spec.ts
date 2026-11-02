import { describe, expect, it } from 'vitest';
import {
  TicketCategory,
  TicketPriority,
  TicketSentiment,
} from '../tickets/ticket.enums.js';
import { ruleBasedTriage } from './rule-based-triage.js';

describe('ruleBasedTriage', () => {
  it('flags a double charge as a high-priority, negative billing issue', () => {
    const result = ruleBasedTriage({
      customerName: 'Amaya Perera',
      subject: 'Charged twice',
      message: 'I was charged twice for my subscription. This is unacceptable and I am frustrated.',
    });

    expect(result.category).toBe(TicketCategory.BILLING);
    expect(result.priority).toBe(TicketPriority.HIGH);
    expect(result.sentiment).toBe(TicketSentiment.NEGATIVE);
    expect(result.suggestedReply).toContain('Hi Amaya');
  });

  it('marks security problems as urgent', () => {
    const result = ruleBasedTriage({
      customerName: 'Kasun',
      subject: 'My account was hacked',
      message: 'Someone changed my password. Please help immediately.',
    });

    expect(result.priority).toBe(TicketPriority.URGENT);
    expect(result.category).toBe(TicketCategory.ACCOUNT);
  });

  it('keeps friendly feedback at low priority', () => {
    const result = ruleBasedTriage({
      customerName: 'Dilini',
      subject: 'Love the new app',
      message: 'Just wanted to say the new app is great. Could you add a dark mode? Thanks!',
    });

    expect(result.sentiment).toBe(TicketSentiment.POSITIVE);
    expect(result.priority).toBe(TicketPriority.LOW);
    expect(result.summary).toBe('Just wanted to say the new app is great.');
  });

  it('falls back to "other" with low priority for vague messages', () => {
    const result = ruleBasedTriage({
      customerName: 'Nimal',
      subject: 'Question',
      message: 'Do you have an office in Kandy?',
    });

    expect(result.category).toBe(TicketCategory.OTHER);
    expect(result.priority).toBe(TicketPriority.LOW);
  });
});
