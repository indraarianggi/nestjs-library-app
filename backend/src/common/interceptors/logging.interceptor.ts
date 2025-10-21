import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';

/**
 * Logging interceptor for request/response logging
 * Logs all HTTP requests and responses with context
 * Excludes sensitive data (passwords, tokens)
 * Includes request ID for tracing
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  // Routes where request body should not be logged
  private readonly sensitiveRoutes = [
    '/api/auth/login',
    '/api/members/register',
    '/api/auth/register',
  ];

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    // Generate unique request ID for tracing
    const requestId = randomUUID();

    // Store request ID in request object for use in other parts of the app
    (request as unknown as { requestId: string }).requestId = requestId;

    const { method, url } = request;
    const body = (request as { body?: unknown }).body;
    const startTime = Date.now();

    // Extract user info if authenticated (set by JWT guard)
    const user = (
      request as unknown as {
        user?: { userId?: string; id?: string; email?: string };
      }
    ).user;
    const userId = user?.userId ?? user?.id ?? user?.email ?? 'anonymous';

    // Log request details
    this.logRequest(requestId, method, url, userId, body);

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;
          this.logResponse(
            requestId,
            method,
            url,
            userId,
            statusCode,
            duration,
          );
        },
        error: (error: Error) => {
          const duration = Date.now() - startTime;
          // Status code might be set by exception filter
          const statusCode = response.statusCode || 500;
          this.logResponse(
            requestId,
            method,
            url,
            userId,
            statusCode,
            duration,
            error,
          );
        },
      }),
    );
  }

  /**
   * Log incoming request
   */
  private logRequest(
    requestId: string,
    method: string,
    url: string,
    userId: string,
    body?: unknown,
  ): void {
    const shouldLogBody =
      body &&
      typeof body === 'object' &&
      Object.keys(body).length > 0 &&
      !this.isSensitiveRoute(url);

    const bodyInfo = shouldLogBody
      ? ` - Body: ${JSON.stringify(this.sanitizeBody(body))}`
      : '';

    this.logger.log(
      `[RequestId: ${requestId}] ${method} ${url} - User: ${userId}${bodyInfo}`,
    );
  }

  /**
   * Log response with appropriate log level based on status code
   */
  private logResponse(
    requestId: string,
    method: string,
    url: string,
    userId: string,
    statusCode: number,
    duration: number,
    error?: Error,
  ): void {
    const message = `[RequestId: ${requestId}] ${method} ${url} - User: ${userId} - ${statusCode} - ${duration}ms`;

    // Use appropriate log level based on status code
    if (statusCode >= 500) {
      this.logger.error(message, error?.stack);
    } else if (statusCode >= 400) {
      this.logger.warn(message);
    } else {
      this.logger.log(message);
    }
  }

  /**
   * Check if route is sensitive and should not log body
   */
  private isSensitiveRoute(url: string): boolean {
    return this.sensitiveRoutes.some((route) => url.includes(route));
  }

  /**
   * Sanitize request body to remove sensitive fields
   * Don't log passwords, tokens, or authorization headers
   */
  private sanitizeBody(body: unknown): unknown {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sanitized = { ...body } as Record<string, unknown>;
    const sensitiveFields = [
      'password',
      'newPassword',
      'oldPassword',
      'confirmPassword',
      'token',
      'refreshToken',
      'accessToken',
      'authorization',
    ];

    // Remove sensitive fields
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '***REDACTED***';
      }
    }

    return sanitized;
  }
}
