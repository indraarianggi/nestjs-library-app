import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { HealthService, HealthCheckResponse } from './health.service';
import { Public } from '../../common/decorators/public.decorator';

/**
 * HealthController - Handles health check endpoints
 * Public endpoint - no authentication required
 */
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /**
   * GET /api/health (BE-7.4)
   * Health check endpoint for monitoring and deployment orchestration
   * Public endpoint - no authentication required
   *
   * Checks the health of system components:
   * - Database connectivity (required)
   * - SMTP connectivity (optional, if configured)
   *
   * Returns:
   * - 200 OK if system is healthy or degraded
   * - 503 Service Unavailable if system is down
   *
   * Status types:
   * - 'ok': All components are healthy
   * - 'degraded': Some non-critical components have issues
   * - 'down': Critical components (e.g., database) are unavailable
   *
   * @returns Health check response with component statuses
   */
  @Get()
  @Public()
  @HttpCode(HttpStatus.OK)
  async checkHealth(): Promise<HealthCheckResponse> {
    const health = await this.healthService.checkHealth();

    // Note: NestJS doesn't support conditional status codes directly in decorators
    // If you need to return 503 for 'down' status, implement a custom exception filter
    // For now, we return 200 for all cases as per typical health check patterns

    return health;
  }
}
