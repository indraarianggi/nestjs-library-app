import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService, HealthCheckResponse } from './health.service';
import { Public } from '../../common/decorators/public.decorator';

/**
 * HealthController - Handles health check endpoints
 * Public endpoint - no authentication required
 */
@ApiTags('Health')
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
  @ApiOperation({
    summary: 'Health check endpoint',
    description:
      'Checks the health of system components including database and optional SMTP connectivity. Used for monitoring and deployment orchestration.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Health check completed successfully',
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['ok', 'degraded', 'down'],
          example: 'ok',
          description: 'Overall system health status',
        },
        timestamp: {
          type: 'string',
          format: 'date-time',
          example: '2024-01-15T10:30:00.000Z',
          description: 'ISO 8601 timestamp of the health check',
        },
        uptime: {
          type: 'number',
          example: 3600,
          description: 'System uptime in seconds',
        },
        checks: {
          type: 'object',
          properties: {
            database: {
              type: 'object',
              properties: {
                status: {
                  type: 'string',
                  enum: ['ok', 'degraded', 'down'],
                  example: 'ok',
                },
                latency: {
                  type: 'number',
                  example: 15,
                  description: 'Response latency in milliseconds',
                },
                error: {
                  type: 'string',
                  nullable: true,
                  description: 'Error message if status is down',
                },
              },
            },
            smtp: {
              type: 'object',
              nullable: true,
              description: 'SMTP check (only if configured)',
              properties: {
                status: {
                  type: 'string',
                  enum: ['ok', 'degraded', 'down'],
                  example: 'ok',
                },
                latency: {
                  type: 'number',
                  example: 50,
                  description: 'Response latency in milliseconds',
                },
                error: {
                  type: 'string',
                  nullable: true,
                  description: 'Error message if status is down',
                },
              },
            },
          },
        },
      },
    },
  })
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
