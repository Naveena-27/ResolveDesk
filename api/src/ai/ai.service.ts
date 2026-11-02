import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { TriageSource } from '../tickets/ticket.enums.js';
import { ruleBasedTriage } from './rule-based-triage.js';
import { type Triage, type TriageInput, TriageSchema } from './triage.types.js';

const SYSTEM_PROMPT = `You are a customer support triage assistant for an online store.
Read the customer's ticket and classify it.

Priority guide:
- urgent: security issues, fraud, legal threats, or the customer cannot use the service at all
- high: money taken incorrectly, repeated failures, or a very upset customer
- medium: a real problem with a normal tone
- low: questions, feedback or minor issues

Write the suggested reply in plain, friendly English. Address the customer by first name,
acknowledge the specific problem, say what happens next, and do not promise refunds or
dates you cannot guarantee. Keep it under 120 words.`;

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly client: OpenAI | null;
  private readonly model: string;

  constructor(config: ConfigService) {
    const apiKey = config.get<string>('OPENAI_API_KEY');
    this.model = config.get<string>('OPENAI_MODEL') ?? 'gpt-5-mini';
    this.client = apiKey ? new OpenAI({ apiKey }) : null;

    if (!this.client) {
      this.logger.warn('OPENAI_API_KEY not set: using rule-based triage only.');
    }
  }

  /**
   * Classifies a ticket with OpenAI. If there is no key, or the call fails,
   * it falls back to keyword rules so ticket creation never breaks.
   */
  async triage(input: TriageInput): Promise<Triage & { triageSource: TriageSource }> {
    if (this.client) {
      try {
        const response = await this.client.responses.parse({
          model: this.model,
          instructions: SYSTEM_PROMPT,
          input: `Customer name: ${input.customerName}\nSubject: ${input.subject}\n\nMessage:\n${input.message}`,
          text: { format: zodTextFormat(TriageSchema, 'ticket_triage') },
        });

        if (response.output_parsed) {
          return { ...response.output_parsed, triageSource: TriageSource.OPENAI };
        }
        this.logger.warn('OpenAI returned no parsed output; using rules instead.');
      } catch (error) {
        this.logger.error(`OpenAI triage failed: ${(error as Error).message}`);
      }
    }

    return { ...ruleBasedTriage(input), triageSource: TriageSource.RULES };
  }

  get isEnabled(): boolean {
    return this.client !== null;
  }
}
