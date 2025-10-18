import {
  Injectable,
  Logger,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import type { RegisterDto } from './dto/register.dto';
import { registerSchema } from './dto/register.dto';
import type { LoginDto } from './dto/login.dto';
import { loginSchema } from './dto/login.dto';
import { auth } from '../../lib/auth';

export interface RegistrationResult {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    isActive: boolean;
  };
  memberProfile: {
    id: string;
    userId: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    address: string | null;
    status: string;
  };
  message: string;
}

export interface LoginResult {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    isActive: boolean;
    lastLoginAt: Date | null;
  };
  memberProfile?: {
    id: string;
    userId: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    address: string | null;
    status: string;
  };
  message: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Register a new user with email/password and create associated member profile
   * Uses Better Auth for user creation (no auto sign-in), then creates MemberProfile
   * Note: autoSignIn is disabled, users must sign in separately after registration
   * @param registerDto Registration data with email, password, and profile information
   * @returns Registration result with user and memberProfile
   * @throws BadRequestException for validation errors
   * @throws ConflictException if email already exists
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
        message: 'Validation failed',
        details: errors,
      });
    }

    const validatedData = validationResult.data;
    const emailLowercase = validatedData.email.toLowerCase();

    // 2. Use Better Auth to create user (no auto sign-in)
    let betterAuthResult: {
      token: null; // because autoSignIn after registration is disabled
      user: {
        id: string;
        email: string;
        name: string;
        image: string | null | undefined;
        emailVerified: boolean;
        createdAt: Date;
        updatedAt: Date;
      };
    };

    try {
      // Better Auth signUp.email handles:
      // - Email validation and duplication check
      // - Password hashing
      // - User creation in database
      // - Account creation with password
      // Note: With autoSignIn: false, no session is created
      const result = await auth.api.signUpEmail({
        body: {
          email: emailLowercase,
          password: validatedData.password,
          name: `${validatedData.firstName} ${validatedData.lastName}`,
        },
      });

      // Type guard to ensure we have the expected response
      if (!result || typeof result !== 'object' || !('user' in result)) {
        throw new Error('Invalid response from Better Auth');
      }

      betterAuthResult = result as typeof betterAuthResult;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Better Auth registration failed: ${errorMessage}`);

      // Check if it's a duplicate email error
      const isDuplicate =
        errorMessage.includes('already exists') ||
        errorMessage.includes('duplicate');

      if (isDuplicate) {
        this.logger.warn(
          `Registration attempted with existing email: ${emailLowercase}`,
        );
        throw new ConflictException({
          statusCode: 409,
          message: 'Email already registered',
          error: 'Conflict',
        });
      }

      throw new BadRequestException({
        message: 'Registration failed',
        details: errorMessage,
      });
    }

    const userId = betterAuthResult.user.id;

    // 3. Create MemberProfile and audit log in transaction
    let createdMemberProfile;
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        // Update user role to MEMBER and set as active
        await tx.user.update({
          where: { id: userId },
          data: {
            role: 'MEMBER',
            isActive: true,
          },
        });

        // Create member profile with ACTIVE status
        const memberProfile = await tx.memberProfile.create({
          data: {
            userId: userId,
            firstName: validatedData.firstName,
            lastName: validatedData.lastName,
            phone: validatedData.phone || null,
            address: validatedData.address || null,
            status: 'ACTIVE',
          },
        });

        // Create audit log entry
        await tx.auditLog.create({
          data: {
            userId: userId,
            action: 'user.registered',
            entityType: 'user',
            entityId: userId,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            metadata: {
              email: betterAuthResult.user.email,
              firstName: validatedData.firstName,
              lastName: validatedData.lastName,
            } as any,
          },
        });

        return { memberProfile };
      });

      createdMemberProfile = result.memberProfile;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to create member profile: ${errorMessage}`);
      throw new BadRequestException('Failed to create member profile');
    }

    this.logger.log(`User registered successfully: ${emailLowercase}`);

    // 4. Return registration result (no session - user must sign in separately)
    return {
      user: {
        id: betterAuthResult.user.id,
        email: betterAuthResult.user.email,
        name: betterAuthResult.user.name,
        role: 'MEMBER',
        isActive: true,
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
      message: 'Registration successful. Please sign in to continue.',
    };
  }

  /**
   * Login user with email/password using Better Auth
   * Better Auth handles password verification and session creation
   * After authentication, check user.isActive status and update lastLoginAt
   * Manually sets session cookie using Better Auth's token
   * @param loginDto Login credentials (email and password)
   * @param res Express Response object for setting cookies
   * @returns Login result with user, memberProfile (if MEMBER)
   * @throws BadRequestException for validation errors
   * @throws UnauthorizedException for invalid credentials or inactive account
   */
  async login(loginDto: LoginDto, res: Response): Promise<LoginResult> {
    // 1. Validate input using Zod schema
    const validationResult = loginSchema.safeParse(loginDto);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      this.logger.warn(`Login validation failed: ${JSON.stringify(errors)}`);
      throw new BadRequestException({
        message: 'Validation failed',
        details: errors,
      });
    }

    const validatedData = validationResult.data;
    const emailLowercase = validatedData.email.toLowerCase();

    // 2. Use Better Auth to authenticate user and get session
    let betterAuthResult: {
      redirect: boolean;
      token: string;
      url: string | undefined;
      user: {
        id: string;
        email: string;
        name: string;
        image: string | null | undefined;
        emailVerified: boolean;
        createdAt: Date;
        updatedAt: Date;
      };
    };

    try {
      // Better Auth signIn.email handles:
      // - Email validation
      // - Password verification (bcrypt comparison)
      // Note: Using auth.api doesn't set cookies automatically
      // We need to manually set the cookie using the session token
      betterAuthResult = await auth.api.signInEmail({
        body: {
          email: emailLowercase,
          password: validatedData.password,
        },
      });

      // Type guard to ensure we have the expected response with
      // if (
      //   !result ||
      //   typeof result !== 'object' ||
      //   !('user' in result)
      // ) {
      //   throw new Error('Invalid response from Better Auth');
      // }

      // betterAuthResult = result as typeof betterAuthResult;

      // Manually set the session cookie in the response
      const cookiePrefix =
        process.env.BETTER_AUTH_COOKIE_PREFIX || 'library-app';
      const cookieName = process.env.BETTER_AUTH_COOKIE_NAME || 'session_token';
      const isProduction = process.env.NODE_ENV === 'production';

      // Set session cookie with Better Auth's configuration
      res.cookie(`${cookiePrefix}.${cookieName}`, betterAuthResult.token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'strict' : 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 * 1000, // 7 days in milliseconds
      });

      this.logger.log(
        `Session cookie set for user: ${emailLowercase} (token: ${betterAuthResult.token.substring(0, 10)}...)`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Login failed for ${emailLowercase}: ${errorMessage}`);

      // Use generic error message to prevent user enumeration
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Invalid email or password',
        error: 'Unauthorized',
      });
    }

    const userId = betterAuthResult.user.id;

    // 3. Get user from database to check isActive status and role
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberProfile: true,
      },
    });

    if (!user) {
      this.logger.error(`User not found after Better Auth success: ${userId}`);
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Invalid email or password',
        error: 'Unauthorized',
      });
    }

    // 4. Check if user account is active
    if (!user.isActive) {
      this.logger.warn(
        `Login attempted for inactive account: ${emailLowercase}`,
      );
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Your account has been deactivated. Please contact support.',
        error: 'Unauthorized',
      });
    }

    // 5. Update lastLoginAt and create audit log in transaction
    try {
      await this.prisma.$transaction(async (tx) => {
        // Update lastLoginAt timestamp
        await tx.user.update({
          where: { id: userId },
          data: { lastLoginAt: new Date() },
        });

        // Create audit log entry
        await tx.auditLog.create({
          data: {
            userId: userId,
            action: 'user.login',
            entityType: 'user',
            entityId: userId,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            metadata: {
              email: user.email,
              role: user.role,
            } as any,
          },
        });
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to update login metadata: ${errorMessage}`);
      // Don't fail the login if metadata update fails
    }

    this.logger.log(`User logged in successfully: ${emailLowercase}`);

    // 6. Prepare response with user, memberProfile (if MEMBER), and session
    const loginResult: LoginResult = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name || '',
        role: user.role,
        isActive: user.isActive,
        lastLoginAt: new Date(), // Return the updated timestamp
      },
      message: 'Login successful',
    };

    // Include memberProfile if user is a MEMBER
    if (user.role === 'MEMBER' && user.memberProfile) {
      loginResult.memberProfile = {
        id: user.memberProfile.id,
        userId: user.memberProfile.userId,
        firstName: user.memberProfile.firstName,
        lastName: user.memberProfile.lastName,
        phone: user.memberProfile.phone,
        address: user.memberProfile.address,
        status: user.memberProfile.status,
      };
    }

    return loginResult;
  }
}
