import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  AuthService,
  type RegistrationResult,
  type TokenPair,
  type UserWithProfile,
} from './auth.service';
import type { RegisterDto } from './dto/register.dto';
import { Public } from '../../common/decorators/public.decorator';
import { LocalAuthGuard } from '../../common/guards/local-auth.guard';
import { RefreshTokenGuard } from '../../common/guards/refresh-token.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { ValidatedRefreshUser } from '../auth/strategies/refresh-token.strategy';

@Controller('members')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * POST /api/members/register
   * Register a new member with email, password, and profile information
   * Creates user account and member profile, returns JWT tokens
   *
   * @param registerDto Registration data
   * @returns User, memberProfile, and JWT tokens
   */
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() registerDto: RegisterDto,
  ): Promise<RegistrationResult> {
    return this.authService.register(registerDto);
  }

  /**
   * POST /api/members/login
   * Login user with email and password using Passport Local Strategy
   * Rate limited to 10 requests per minute per IP to prevent brute force attacks
   * Returns JWT access and refresh tokens
   *
   * @param req Request object with validated user from LocalStrategy
   * @returns User, memberProfile (if MEMBER), and JWT tokens
   */
  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  async login(@CurrentUser() user: UserWithProfile): Promise<TokenPair> {
    // User is already validated by LocalAuthGuard
    return this.authService.login(user);
  }

  /**
   * POST /api/members/refresh
   * Refresh access and refresh tokens using valid refresh token
   * Returns new JWT token pair and revokes old refresh token
   *
   * @param user Validated user from RefreshTokenStrategy
   * @returns New access and refresh tokens
   */
  @Public()
  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@CurrentUser() user: ValidatedRefreshUser): Promise<TokenPair> {
    return this.authService.refreshTokens(user.userId, user.refreshToken);
  }

  /**
   * POST /api/members/logout
   * Logout user by revoking refresh token
   *
   * @param user Validated user from RefreshTokenStrategy
   * @returns Success message
   */
  @Public()
  @UseGuards(RefreshTokenGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: ValidatedRefreshUser,
  ): Promise<{ message: string }> {
    await this.authService.logout(user.userId, user.refreshToken);
    return { message: 'Logout successful' };
  }
}
