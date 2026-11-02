import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';

import { AiModule } from './ai/ai.module.js';
import { HealthController } from './health.controller.js';
import { Ticket } from './tickets/ticket.entity.js';
import { TicketsModule } from './tickets/tickets.module.js';
import { AuthModule } from './auth/auth.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // Rate limiting configuration
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.getOrThrow<string>('DATABASE_URL'),
        entities: [Ticket],
        // Development only: use migrations before production.
        synchronize: config.get('DB_SYNC', 'true') === 'true',
        ssl:
        config.get('DB_SSL') === 'true'
          ? { rejectUnauthorized: true }
          : false,
            }),
    }),

    AiModule,
    TicketsModule,
    AuthModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
