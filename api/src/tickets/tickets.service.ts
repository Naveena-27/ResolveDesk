import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { AiService } from '../ai/ai.service.js';
import { CreateTicketDto } from './dto/create-ticket.dto.js';
import { QueryTicketsDto } from './dto/query-tickets.dto.js';
import { PaginatedTicketsDto, TicketStatsDto } from './dto/responses.dto.js';
import { UpdateTicketDto } from './dto/update-ticket.dto.js';
import { Ticket } from './ticket.entity.js';
import { TicketPriority, TicketStatus } from './ticket.enums.js';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private readonly tickets: Repository<Ticket>,
    private readonly ai: AiService,
  ) {}

  async create(dto: CreateTicketDto): Promise<Ticket> {
    const triage = await this.ai.triage(dto);
    const { customerName, customerEmail, subject, message } = dto;
    const ticket = this.tickets.create({
      customerName,
      customerEmail,
      subject,
      message,
      ...triage,
    });
    return this.tickets.save(ticket);
  }

  async findAll(query: QueryTicketsDto): Promise<PaginatedTicketsDto> {
    const { status, category, priority, search, page, limit } = query;

    const qb = this.tickets.createQueryBuilder('t');
    if (status) qb.andWhere('t.status = :status', { status });
    if (category) qb.andWhere('t.category = :category', { category });
    if (priority) qb.andWhere('t.priority = :priority', { priority });
    if (search) {
      qb.andWhere(
        new Brackets((w) => {
          const term = `%${search}%`;
          w.where('t.subject ILIKE :term', { term })
            .orWhere('t.message ILIKE :term', { term })
            .orWhere('t.customerName ILIKE :term', { term })
            .orWhere('t.customerEmail ILIKE :term', { term });
        }),
      );
    }

    // Most important tickets first: urgent > high > medium > low, then newest.
    qb.addSelect(
      `CASE t.priority
         WHEN 'urgent' THEN 0 WHEN 'high' THEN 1
         WHEN 'medium' THEN 2 ELSE 3 END`,
      'priority_rank',
    )
      .orderBy('priority_rank', 'ASC')
      .addOrderBy('t.createdAt', 'DESC')
      .offset((page - 1) * limit)
      .limit(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<Ticket> {
    const ticket = await this.tickets.findOneBy({ id });
    if (!ticket) throw new NotFoundException(`Ticket ${id} not found`);
    return ticket;
  }

  async update(id: string, dto: UpdateTicketDto): Promise<Ticket> {
    const ticket = await this.findOne(id);

    if (dto.status && dto.status !== ticket.status) {
      ticket.resolvedAt =
        dto.status === TicketStatus.RESOLVED ? new Date() : null;
    }
    Object.assign(ticket, dto);

    return this.tickets.save(ticket);
  }

  /** Runs AI triage again, e.g. after the customer's message was unclear or the key was added later. */
  async retriage(id: string): Promise<Ticket> {
    const ticket = await this.findOne(id);
    const triage = await this.ai.triage(ticket);
    Object.assign(ticket, triage);
    return this.tickets.save(ticket);
  }

  async remove(id: string): Promise<void> {
    const result = await this.tickets.delete({ id });
    if (!result.affected) throw new NotFoundException(`Ticket ${id} not found`);
  }

  async stats(): Promise<TicketStatsDto> {
    const countBy = async (
      column: 'status' | 'category' | 'sentiment' | 'priority',
      unresolvedOnly = false,
    ) => {
      const qb = this.tickets.createQueryBuilder('t');
      if (unresolvedOnly)
        qb.where('t.status != :s', { s: TicketStatus.RESOLVED });
      const rows = await qb
        .select(`t.${column}`, 'key')
        .addSelect('COUNT(*)::int', 'count')
        .groupBy(`t.${column}`)
        .getRawMany<{ key: string; count: number }>();
      return Object.fromEntries(rows.map((r) => [r.key, r.count])) as Record<
        string,
        number
      >;
    };

    const [
      byStatus,
      byCategory,
      bySentiment,
      unresolvedByPriority,
      urgentOpen,
      avg,
    ] = await Promise.all([
      countBy('status'),
      countBy('category'),
      countBy('sentiment'),
      countBy('priority', true),
      this.tickets
        .createQueryBuilder('t')
        .where('t.priority = :p', { p: TicketPriority.URGENT })
        .andWhere('t.status != :s', { s: TicketStatus.RESOLVED })
        .getCount(),
      this.tickets
        .createQueryBuilder('t')
        .select(
          'AVG(EXTRACT(EPOCH FROM (t.resolvedAt - t.createdAt)) / 3600)::float',
          'hours',
        )
        .where('t.resolvedAt IS NOT NULL')
        .getRawOne<{ hours: number | null }>(),
    ]);

    const open = byStatus[TicketStatus.OPEN] ?? 0;
    const inProgress = byStatus[TicketStatus.IN_PROGRESS] ?? 0;
    const resolved = byStatus[TicketStatus.RESOLVED] ?? 0;

    return {
      total: open + inProgress + resolved,
      open,
      inProgress,
      resolved,
      urgentOpen,
      byCategory,
      bySentiment,
      unresolvedByPriority,
      avgResolutionHours:
        avg?.hours != null ? Math.round(avg.hours * 10) / 10 : null,
    };
  }
}
