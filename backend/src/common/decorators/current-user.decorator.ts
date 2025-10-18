import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

/**
 * CurrentUser decorator - Extract authenticated user from request
 * Used in route handlers to get the current user object
 * User object is populated by JwtStrategy after successful authentication
 *
 * @example
 * ```typescript
 * @Get('profile')
 * @UseGuards(JwtAuthGuard)
 * getProfile(@CurrentUser() user: ValidatedUser) {
 *   return user;
 * }
 * ```
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.user as unknown;
  },
);
