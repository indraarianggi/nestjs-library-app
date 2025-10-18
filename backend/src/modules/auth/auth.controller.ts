import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import {
  AuthService,
  type RegistrationResult,
  type LoginResult,
} from './auth.service';
import type { RegisterDto } from './dto/register.dto';
import type { LoginDto } from './dto/login.dto';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';

@Controller('members')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * POST /api/members/register
   * Register a new member with email, password, and profile information
   * Uses Better Auth for user creation (without auto sign-in) and creates MemberProfile
   * Note: Users must sign in separately after registration
   *
   * @param registerDto Registration data
   * @returns User and memberProfile information with success message
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @AllowAnonymous()
  async register(
    @Body() registerDto: RegisterDto,
  ): Promise<RegistrationResult> {
    // NestJS automatically:
    // - Serializes the return value to JSON
    // - Sets the HTTP status to 201 (via @HttpCode)
    // - Handles exceptions via exception filters
    return this.authService.register(registerDto);
  }

  /**
   * POST /api/members/login
   * Login user with email and password using Better Auth
   * Rate limited to 10 requests per minute per IP to prevent brute force attacks
   * Manually sets session cookie in response after Better Auth authentication
   *
   * @param loginDto Login credentials (email and password)
   * @param res Express Response object (for setting cookies)
   * @returns User, memberProfile (if MEMBER), and session information
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @AllowAnonymous()
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResult> {
    // Call auth service to authenticate and get result with session
    const result = await this.authService.login(loginDto, res);

    // NestJS with passthrough: true automatically:
    // - Enforces rate limiting via @Throttle decorator
    return result;
  }
}
