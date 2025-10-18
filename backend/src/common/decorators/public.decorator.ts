import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key for public routes
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Public decorator - Mark routes as public (bypass JWT authentication)
 * When applied, JwtAuthGuard will allow access without authentication
 *
 * @example
 * ```typescript
 * @Public()
 * @Post('login')
 * login(@Body() loginDto: LoginDto) {
 *   return this.authService.login(loginDto);
 * }
 * ```
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
