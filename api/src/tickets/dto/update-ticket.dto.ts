import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { TicketCategory, TicketPriority, TicketStatus } from '../ticket.enums.js';

/** What a support agent can change on a ticket. All fields are optional. */
export class UpdateTicketDto {
  @ApiPropertyOptional({ enum: TicketStatus })
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @ApiPropertyOptional({ enum: TicketCategory, description: 'Override the AI category' })
  @IsOptional()
  @IsEnum(TicketCategory)
  category?: TicketCategory;

  @ApiPropertyOptional({ enum: TicketPriority, description: 'Override the AI priority' })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @ApiPropertyOptional({ description: 'The reply the agent sends to the customer' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  finalReply?: string;
}
