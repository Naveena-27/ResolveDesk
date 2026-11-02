import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { AiService } from './ai/ai.service.js';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly db: DataSource,
    private readonly ai: AiService,
  ) {}

  @Get()
  async check() {
    await this.db.query('SELECT 1');
    return { status: 'ok', database: 'up', ai: this.ai.isEnabled ? 'openai' : 'rules' };
  }
}
