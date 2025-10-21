import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Health check status types
 */
export type HealthStatus = 'ok' | 'degraded' | 'down';

/**
 * Component check result
 */
export interface ComponentCheck {
  status: HealthStatus;
  latency?: number;
  error?: string;
}

/**
 * Health check response
 */
export interface HealthCheckResponse {
  status: HealthStatus;
  timestamp: string;
  uptime: number;
  checks: {
    database: ComponentCheck;
    smtp?: ComponentCheck;
  };
}

/**
 * HealthService - Handles health check business logic
 */
@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly startTime: number;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.startTime = Date.now();
  }

  /**
   * Perform health check on all system components
   * Checks database connectivity and optionally SMTP
   *
   * @returns Health check response with component statuses
   */
  async checkHealth(): Promise<HealthCheckResponse> {
    this.logger.log('Performing health check...');

    // Check database connectivity
    const databaseCheck = await this.checkDatabase();

    // Optionally check SMTP (if configured)
    const smtpCheck = await this.checkSmtp();

    // Determine overall status
    let overallStatus: HealthStatus = 'ok';

    if (databaseCheck.status === 'down') {
      overallStatus = 'down';
    } else if (
      databaseCheck.status === 'degraded' ||
      (smtpCheck && smtpCheck.status === 'degraded')
    ) {
      overallStatus = 'degraded';
    }

    // Calculate uptime in seconds
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);

    const response: HealthCheckResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime,
      checks: {
        database: databaseCheck,
      },
    };

    // Include SMTP check if configured
    if (smtpCheck) {
      response.checks.smtp = smtpCheck;
    }

    this.logger.log(`Health check completed: ${overallStatus}`);

    return response;
  }

  /**
   * Check database connectivity
   * Uses a simple query to verify the connection
   *
   * @returns Database component check result
   */
  private async checkDatabase(): Promise<ComponentCheck> {
    const startTime = Date.now();

    try {
      // Perform a simple query to check database connectivity
      await this.prisma.$queryRaw`SELECT 1`;

      const latency = Date.now() - startTime;

      this.logger.log(`Database check passed (latency: ${latency}ms)`);

      return {
        status: 'ok',
        latency,
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(
        `Database check failed (latency: ${latency}ms): ${errorMessage}`,
      );

      return {
        status: 'down',
        latency,
        error: errorMessage,
      };
    }
  }

  /**
   * Check SMTP connectivity (optional)
   * Only checks if SMTP is configured in environment
   *
   * @returns SMTP component check result or undefined if not configured
   */
  private async checkSmtp(): Promise<ComponentCheck | undefined> {
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpPort = this.configService.get<string>('SMTP_PORT');

    // Skip SMTP check if not configured
    if (!smtpHost || !smtpPort) {
      this.logger.log('SMTP not configured, skipping check');
      return undefined;
    }

    // TODO: Implement actual SMTP connectivity check using Nodemailer
    // For MVP, we just return 'ok' status if SMTP is configured
    this.logger.log('SMTP configured, assuming ok');

    return {
      status: 'ok',
    };

    // Implementation note:
    // To properly check SMTP, you would use Nodemailer's verify() method:
    //
    // try {
    //   const transporter = nodemailer.createTransport({
    //     host: smtpHost,
    //     port: parseInt(smtpPort, 10),
    //     auth: {
    //       user: this.configService.get<string>('SMTP_USER'),
    //       pass: this.configService.get<string>('SMTP_PASS'),
    //     },
    //   });
    //   await transporter.verify();
    //   return { status: 'ok' };
    // } catch (error) {
    //   return { status: 'down', error: error.message };
    // }
  }
}
