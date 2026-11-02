export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
}

export enum TicketCategory {
  BILLING = 'billing',
  TECHNICAL = 'technical',
  ACCOUNT = 'account',
  DELIVERY = 'delivery',
  PRODUCT = 'product',
  OTHER = 'other',
}

export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum TicketSentiment {
  POSITIVE = 'positive',
  NEUTRAL = 'neutral',
  NEGATIVE = 'negative',
}

/** Where the triage result came from: the LLM, or the rule-based fallback. */
export enum TriageSource {
  OPENAI = 'openai',
  RULES = 'rules',
}
