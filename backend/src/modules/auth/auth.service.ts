import {
  Injectable,
  Logger,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import type { RegisterDto } from './dto/register.dto';
import { registerSchema } from './dto/register.dto';
import { Role, User, MemberProfile } from '@prisma/client';

/**
 * User with member profile
 */
export interface UserWithProfile extends Omit<User, 'passwordHash'> {
  memberProfile: MemberProfile | null;
}

/**
 * JWT Access Token Payload
 */
export interface JwtAccessPayload {
  sub: string; // userId
  email: string;
  role: Role;
}

/**
 * JWT Refresh Token Payload
 */
export interface JwtRefreshPayload {
  sub: string; // userId
}

/**
 * Token pair returned to client
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * User entity without sensitive data
 */
export interface UserResponse {
  id: string;
  email: string;
  role: Role;
  isActive: boolean;
  lastLoginAt: Date | null;
}

/**
 * Member profile response
 */
export interface MemberProfileResponse {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  address: string | null;
  status: string;
}

/**
 * Registration result
 */
export interface RegistrationResult {
  user: UserResponse;
  memberProfile: MemberProfileResponse;
  tokens: TokenPair;
  message: string;
}

/**
 * Login result
 */
export interface LoginResult {
  user: UserResponse;
  memberProfile?: MemberProfileResponse;
  tokens: TokenPair;
  message: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly SALT_ROUNDS = 10;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Validate user credentials for local strategy
   * Used by LocalStrategy during login
   * @param email User's email
   * @param password User's password
   * @returns User object if valid, null otherwise
   */
  async validateUser(
    email: string,
    password: string,
  ): Promise<UserWithProfile | null> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        memberProfile: true,
      },
    });

    if (!user) {
      return null;
    }

    // Check if account is active
    if (!user.isActive) {
      this.logger.warn(`Login attempted for inactive account: ${email}`);
      return null;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return null;
    }

    // Remove sensitive data
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = user;
    return result;
  }

  /**
   * Generate access and refresh token pair
   * @param user User object
   * @returns Token pair
   */
  async login(user: UserWithProfile): Promise<TokenPair> {
    const accessPayload: JwtAccessPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const refreshPayload: JwtRefreshPayload = {
      sub: user.id,
    };

    const accessToken = this.jwtService.sign(accessPayload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: (this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') ||
        '1h') as `${number}${'s' | 'm' | 'h' | 'd'}`,
    });

    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: (this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ||
        '7d') as `${number}${'s' | 'm' | 'h' | 'd'}`,
    });

    // Store hashed refresh token in database
    await this.storeRefreshToken(user.id, refreshToken);

    // Update lastLoginAt
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'user.login',
        entityType: 'user',
        entityId: user.id,
        metadata: {
          email: user.email,
          role: user.role,
        },
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Register a new user with email/password and create member profile
   * @param registerDto Registration data
   * @returns Registration result with user, profile, and tokens
   */
  async register(registerDto: RegisterDto): Promise<RegistrationResult> {
    // 1. Validate input using Zod schema
    const validationResult = registerSchema.safeParse(registerDto);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      this.logger.warn(
        `Registration validation failed: ${JSON.stringify(errors)}`,
      );
      throw new BadRequestException({
        statusCode: 400,
        message: 'Validation failed',
        errors: errors,
      });
    }

    const validatedData = validationResult.data;
    const emailLowercase = validatedData.email.toLowerCase();

    // 2. Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: emailLowercase },
    });

    if (existingUser) {
      this.logger.warn(
        `Registration attempted with existing email: ${emailLowercase}`,
      );
      throw new ConflictException({
        statusCode: 409,
        message: 'Email already registered',
        error: 'Conflict',
      });
    }

    // 3. Hash password
    const passwordHash = await bcrypt.hash(
      validatedData.password,
      this.SALT_ROUNDS,
    );

    // 4. Create user and member profile in transaction
    let createdUser: User;
    let createdMemberProfile: MemberProfile;

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        // Create user
        const user = await tx.user.create({
          data: {
            email: emailLowercase,
            passwordHash: passwordHash,
            role: 'MEMBER',
            isActive: true,
          },
        });

        // Create member profile
        const memberProfile = await tx.memberProfile.create({
          data: {
            userId: user.id,
            firstName: validatedData.firstName,
            lastName: validatedData.lastName,
            phone: validatedData.phone || null,
            address: validatedData.address || null,
            status: 'ACTIVE',
          },
        });

        // Create audit log
        await tx.auditLog.create({
          data: {
            userId: user.id,
            action: 'user.registered',
            entityType: 'user',
            entityId: user.id,
            metadata: {
              email: user.email,
              firstName: validatedData.firstName,
              lastName: validatedData.lastName,
            },
          },
        });

        return { user, memberProfile };
      });

      createdUser = result.user;
      createdMemberProfile = result.memberProfile;
    } catch (error) {
      this.logger.error(
        `Failed to create user and profile: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw new BadRequestException('Registration failed');
    }

    this.logger.log(`User registered successfully: ${emailLowercase}`);

    // 5. Generate tokens (need to include memberProfile for login)
    const userWithProfile = {
      ...createdUser,
      memberProfile: createdMemberProfile,
    };
    const tokens = await this.login(userWithProfile);

    // 6. Return registration result
    return {
      user: {
        id: createdUser.id,
        email: createdUser.email,
        role: createdUser.role,
        isActive: createdUser.isActive,
        lastLoginAt: createdUser.lastLoginAt,
      },
      memberProfile: {
        id: createdMemberProfile.id,
        userId: createdMemberProfile.userId,
        firstName: createdMemberProfile.firstName,
        lastName: createdMemberProfile.lastName,
        phone: createdMemberProfile.phone,
        address: createdMemberProfile.address,
        status: createdMemberProfile.status,
      },
      tokens,
      message: 'Registration successful',
    };
  }

  /**
   * Refresh access and refresh tokens
   * @param userId User ID from validated refresh token
   * @param refreshToken Current refresh token
   * @returns New token pair
   */
  async refreshTokens(
    userId: string,
    refreshToken: string,
  ): Promise<TokenPair> {
    // Get user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Revoke old refresh token
    await this.revokeRefreshToken(userId, refreshToken);

    // Generate new token pair
    const accessPayload: JwtAccessPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const refreshPayload: JwtRefreshPayload = {
      sub: user.id,
    };

    const newAccessToken = this.jwtService.sign(accessPayload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: (this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') ||
        '1h') as `${number}${'s' | 'm' | 'h' | 'd'}`,
    });

    const newRefreshToken = this.jwtService.sign(refreshPayload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: (this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ||
        '7d') as `${number}${'s' | 'm' | 'h' | 'd'}`,
    });

    // Store new refresh token
    await this.storeRefreshToken(user.id, newRefreshToken);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Logout user by revoking refresh token
   * @param userId User ID
   * @param refreshToken Refresh token to revoke
   */
  async logout(userId: string, refreshToken: string): Promise<void> {
    await this.revokeRefreshToken(userId, refreshToken);

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        userId: userId,
        action: 'user.logout',
        entityType: 'user',
        entityId: userId,
        metadata: {},
      },
    });

    this.logger.log(`User logged out: ${userId}`);
  }

  /**
   * Store hashed refresh token in database
   * @param userId User ID
   * @param refreshToken Refresh token (plain text)
   */
  private async storeRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    const hashedToken = await this.hashRefreshToken(refreshToken);
    const expiresIn =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';

    // Calculate expiration date (7 days from now)
    const expiresAt = new Date();
    // Parse expiresIn (e.g., "7d" -> 7 days)
    const days = parseInt(expiresIn.replace('d', ''), 10);
    expiresAt.setDate(expiresAt.getDate() + days);

    await this.prisma.refreshToken.create({
      data: {
        userId: userId,
        token: hashedToken,
        expiresAt: expiresAt,
        isRevoked: false,
      },
    });
  }

  /**
   * Revoke refresh token by marking it as revoked
   * @param userId User ID
   * @param refreshToken Refresh token (plain text)
   */
  private async revokeRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    // Find all non-revoked tokens for this user
    const userTokens = await this.prisma.refreshToken.findMany({
      where: {
        userId: userId,
        isRevoked: false,
      },
    });

    // Find the matching token by comparing hashes
    for (const dbToken of userTokens) {
      const isMatch = await bcrypt.compare(refreshToken, dbToken.token);
      if (isMatch) {
        await this.prisma.refreshToken.update({
          where: { id: dbToken.id },
          data: { isRevoked: true },
        });
        break;
      }
    }
  }

  /**
   * Hash refresh token using bcrypt
   * @param token Refresh token (plain text)
   * @returns Hashed token
   */
  private async hashRefreshToken(token: string): Promise<string> {
    return bcrypt.hash(token, this.SALT_ROUNDS);
  }

  /**
   * Verify refresh token against hashed token
   * @param token Refresh token (plain text)
   * @param hashedToken Hashed token from database
   * @returns True if tokens match
   */
  async verifyRefreshToken(
    token: string,
    hashedToken: string,
  ): Promise<boolean> {
    return bcrypt.compare(token, hashedToken);
  }
}
