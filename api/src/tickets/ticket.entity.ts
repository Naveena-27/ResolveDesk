import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  TicketCategory,
  TicketPriority,
  TicketSentiment,
  TicketStatus,
  TriageSource,
} from './ticket.enums.js';

@Entity('tickets')
export class Ticket {
  @ApiProperty({ format: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // --- What the customer submitted ---

  @ApiProperty({ example: 'Amaya Perera' })
  @Column({ length: 120 })
  customerName: string;

  @ApiProperty({ example: 'amaya@example.com' })
  @Column({ length: 200 })
  customerEmail: string;

  @ApiProperty({ example: 'Charged twice for my order' })
  @Column({ length: 200 })
  subject: string;

  @ApiProperty()
  @Column('text')
  message: string;

  // --- Workflow ---

  @ApiProperty({ enum: TicketStatus })
  @Index()
  @Column({ type: 'enum', enum: TicketStatus, default: TicketStatus.OPEN })
  status: TicketStatus;

  @ApiPropertyOptional({ description: 'Reply the agent actually sent' })
  @Column('text', { nullable: true })
  finalReply: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @Column({ type: 'timestamptz', nullable: true })
  resolvedAt: Date | null;

  // --- AI triage ---

  @ApiProperty({ enum: TicketCategory })
  @Index()
  @Column({ type: 'enum', enum: TicketCategory })
  category: TicketCategory;

  @ApiProperty({ enum: TicketPriority })
  @Index()
  @Column({ type: 'enum', enum: TicketPriority })
  priority: TicketPriority;

  @ApiProperty({ enum: TicketSentiment })
  @Column({ type: 'enum', enum: TicketSentiment })
  sentiment: TicketSentiment;

  @ApiProperty({ description: 'One-line summary written by the AI' })
  @Column('text')
  summary: string;

  @ApiProperty({ description: 'Draft reply written by the AI' })
  @Column('text')
  suggestedReply: string;

  @ApiProperty({ enum: TriageSource })
  @Column({ type: 'enum', enum: TriageSource })
  triageSource: TriageSource;

  @ApiProperty()
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
