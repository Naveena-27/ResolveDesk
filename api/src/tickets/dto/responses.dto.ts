import { ApiProperty } from '@nestjs/swagger';
import { Ticket } from '../ticket.entity.js';

export class PaginatedTicketsDto {
  @ApiProperty({ type: [Ticket] })
  data: Ticket[];

  @ApiProperty({ example: 42 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;
}

export class TicketStatsDto {
  @ApiProperty() total: number;
  @ApiProperty() open: number;
  @ApiProperty() inProgress: number;
  @ApiProperty() resolved: number;
  @ApiProperty({ description: 'Open or in-progress tickets marked urgent' }) urgentOpen: number;

  @ApiProperty({
    description: 'Ticket count per category',
    example: { billing: 4, technical: 2 },
    additionalProperties: { type: 'number' },
  })
  byCategory: Record<string, number>;

  @ApiProperty({
    description: 'Ticket count per sentiment',
    example: { negative: 5, neutral: 3 },
    additionalProperties: { type: 'number' },
  })
  bySentiment: Record<string, number>;

  @ApiProperty({
    description: 'Open + in-progress tickets per priority (the queue pressure)',
    example: { urgent: 1, high: 3 },
    additionalProperties: { type: 'number' },
  })
  unresolvedByPriority: Record<string, number>;

  @ApiProperty({ nullable: true, description: 'Average hours from creation to resolution' })
  avgResolutionHours: number | null;
}
