import {
  Injectable,
  Logger,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { RegisterDto } from './dto/register.dto';
import { registerSchema } from './dto/register.dto';
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
      user: { id: string; email: string; name: string };
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
}
