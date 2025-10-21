import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
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

@ApiTags('Auth')
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
  @ApiOperation({
    summary: 'Register a new member',
    description:
      'Creates a new user account and member profile. Returns the created user, member profile, and JWT access/refresh tokens for immediate authentication.',
  })
  @ApiBody({
    description:
      'Registration data including email, password, and profile information',
    schema: {
      type: 'object',
      required: ['email', 'password', 'firstName', 'lastName'],
      properties: {
        email: {
          type: 'string',
          format: 'email',
          description: 'Valid email address for the user account',
          example: 'john.doe@example.com',
        },
        password: {
          type: 'string',
          minLength: 8,
          maxLength: 128,
          description:
            'Password must be 8-128 characters with at least one uppercase, lowercase, digit, and special character',
          example: 'SecurePass123!',
        },
        firstName: {
          type: 'string',
          minLength: 1,
          maxLength: 100,
          description: 'Member first name',
          example: 'John',
        },
        lastName: {
          type: 'string',
          minLength: 1,
          maxLength: 100,
          description: 'Member last name',
          example: 'Doe',
        },
        phone: {
          type: 'string',
          nullable: true,
          description: 'Optional phone number',
          example: '+1234567890',
        },
        address: {
          type: 'string',
          nullable: true,
          description: 'Optional residential address',
          example: '123 Main St, City, State 12345',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Member successfully registered',
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john.doe@example.com',
            },
            role: {
              type: 'string',
              enum: ['ADMIN', 'MEMBER'],
              example: 'MEMBER',
            },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        memberProfile: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            membershipNumber: { type: 'string', example: 'LIB-2024-0001' },
            firstName: { type: 'string', example: 'John' },
            lastName: { type: 'string', example: 'Doe' },
            phone: { type: 'string', nullable: true, example: '+1234567890' },
            address: { type: 'string', nullable: true },
            membershipStatus: {
              type: 'string',
              enum: ['ACTIVE', 'SUSPENDED', 'EXPIRED'],
              example: 'ACTIVE',
            },
            membershipStartDate: { type: 'string', format: 'date-time' },
            membershipEndDate: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        accessToken: {
          type: 'string',
          description: 'JWT access token (15 minutes expiry)',
        },
        refreshToken: {
          type: 'string',
          description: 'JWT refresh token (7 days expiry)',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or email already exists',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Email already exists' },
        errors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              field: { type: 'string', example: 'email' },
              message: { type: 'string', example: 'Email already exists' },
            },
          },
        },
      },
    },
  })
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
  @ApiOperation({
    summary: 'Login with email and password',
    description:
      'Authenticates a user with email and password. Returns JWT access and refresh tokens. Rate limited to 10 requests per minute to prevent brute force attacks.',
  })
  @ApiBody({
    description: 'Login credentials',
    schema: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: {
          type: 'string',
          format: 'email',
          description: 'User email address',
          example: 'john.doe@example.com',
        },
        password: {
          type: 'string',
          minLength: 8,
          description: 'User password',
          example: 'SecurePass123!',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login successful',
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['ADMIN', 'MEMBER'] },
            isActive: { type: 'boolean' },
          },
        },
        memberProfile: {
          type: 'object',
          nullable: true,
          description: 'Member profile (only for MEMBER role)',
        },
        accessToken: { type: 'string', description: 'JWT access token' },
        refreshToken: { type: 'string', description: 'JWT refresh token' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials or account suspended',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Invalid email or password' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.TOO_MANY_REQUESTS,
    description: 'Too many login attempts',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 429 },
        message: { type: 'string', example: 'Too Many Requests' },
      },
    },
  })
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
  @ApiOperation({
    summary: 'Refresh access and refresh tokens',
    description:
      'Uses a valid refresh token to generate new access and refresh tokens. The old refresh token is revoked after successful refresh.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiBody({
    description: 'Refresh token to generate new tokens',
    schema: {
      type: 'object',
      properties: {
        refreshToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tokens refreshed successfully',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string', description: 'New JWT access token' },
        refreshToken: { type: 'string', description: 'New JWT refresh token' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or expired refresh token',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Invalid refresh token' },
      },
    },
  })
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
  @ApiOperation({
    summary: 'Logout user',
    description:
      'Logs out the user by revoking their refresh token. The access token will remain valid until it expires (15 minutes).',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiBody({
    description: 'Refresh token to revoke',
    schema: {
      type: 'object',
      properties: {
        refreshToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Logout successful',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Logout successful' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or expired refresh token',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
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
