import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService, type RegistrationResult } from './auth.service';
import type { RegisterDto } from './dto/register.dto';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';

@Controller('members')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * POST /api/members/register
   * Register a new member with email, password, and profile information
   * Uses Better Auth for user creation (without auto sign-in) and creates MemberProfile
   * Note: Users must sign in separately at /api/auth/sign-in after registration
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
}
