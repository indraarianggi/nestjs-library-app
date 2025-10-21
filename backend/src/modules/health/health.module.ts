import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

/**
 * HealthModule - Handles health check endpoints
 * Provides public endpoint for monitoring and deployment orchestration
 */
@Module({
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
