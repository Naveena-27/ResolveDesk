
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { AuthGuard } from '../auth/auth.guard.js';
import { CreateTicketDto } from './dto/create-ticket.dto.js';
import { QueryTicketsDto } from './dto/query-tickets.dto.js';
import {
  PaginatedTicketsDto,
  TicketStatsDto,
} from './dto/responses.dto.js';
import { UpdateTicketDto } from './dto/update-ticket.dto.js';
import { Ticket } from './ticket.entity.js';
import { TicketsService } from './tickets.service.js';

@ApiTags('tickets')
@Controller('tickets')
export class TicketsController {
  constructor(private readonly tickets: TicketsService) {}

  // PUBLIC: Customers can submit tickets without logging in.
  @Post()
  @ApiOperation({
    summary: 'Submit a ticket. AI triage runs before it is saved.',
  })
  @ApiCreatedResponse({ type: Ticket })
  create(@Body() dto: CreateTicketDto): Promise<Ticket> {
    return this.tickets.create(dto);
  }

  // PROTECTED: Agents can list tickets.
  @Get()
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'List tickets with filters, search and pagination (most urgent first)',
  })
  @ApiOkResponse({ type: PaginatedTicketsDto })
  findAll(
    @Query() query: QueryTicketsDto,
  ): Promise<PaginatedTicketsDto> {
    return this.tickets.findAll(query);
  }

  // PROTECTED: Agents can view dashboard statistics.
  // Declared before ':id' so "stats" is not treated as an ID.
  @Get('stats')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Dashboard numbers: counts by status, category and sentiment',
  })
  @ApiOkResponse({ type: TicketStatsDto })
  stats(): Promise<TicketStatsDto> {
    return this.tickets.stats();
  }

  // PROTECTED: Agents can view individual tickets.
  @Get(':id')
  @UseGuards(AuthGuard)
  @ApiOkResponse({ type: Ticket })
  @ApiNotFoundResponse()
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Ticket> {
    return this.tickets.findOne(id);
  }

  // PROTECTED: Agents can update tickets.
  @Patch(':id')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Agent update: status, reply, or override the AI category/priority',
  })
  @ApiOkResponse({ type: Ticket })
  @ApiNotFoundResponse()
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTicketDto,
  ): Promise<Ticket> {
    return this.tickets.update(id, dto);
  }

  // PROTECTED: Agents can run AI triage again.
  @Post(':id/retriage')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Run AI triage again on an existing ticket',
  })
  @ApiOkResponse({ type: Ticket })
  @ApiNotFoundResponse()
  retriage(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Ticket> {
    return this.tickets.retriage(id);
  }

  // PROTECTED: Agents can delete tickets.
  @Delete(':id')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  @ApiNotFoundResponse()
  remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.tickets.remove(id);
  }
}
