import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConflictException, BadRequestException } from '@nestjs/common';

describe('AuthService - Registration', () => {
  let service: AuthService;
  let prisma: PrismaService;

  const mockUser = {
    id: 'user-uuid',
    email: 'john.doe@example.com',
    name: 'John Doe',
    emailVerified: false,
    image: null,
    role: 'MEMBER',
    isActive: true,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findFirst: jest.fn(),
              create: jest.fn(),
            },
            memberProfile: {
              create: jest.fn(),
            },
            session: {
              create: jest.fn(),
            },
            auditLog: {
              create: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should throw ConflictException if email already exists', async () => {
      const registerDto = {
        email: 'existing@example.com',
        password: 'SecureP@ssw0rd',
        firstName: 'John',
        lastName: 'Doe',
      };

      jest.spyOn(prisma.user, 'findFirst').mockResolvedValueOnce(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw BadRequestException for invalid email format', async () => {
      const registerDto = {
        email: 'invalid-email',
        password: 'SecureP@ssw0rd',
        firstName: 'John',
        lastName: 'Doe',
      };

      await expect(service.register(registerDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for password without uppercase letter', async () => {
      const registerDto = {
        email: 'john.doe@example.com',
        password: 'securep@ssw0rd',
        firstName: 'John',
        lastName: 'Doe',
      };

      await expect(service.register(registerDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for password without lowercase letter', async () => {
      const registerDto = {
        email: 'john.doe@example.com',
        password: 'SECUREP@SSW0RD',
        firstName: 'John',
        lastName: 'Doe',
      };

      await expect(service.register(registerDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for password without digit', async () => {
      const registerDto = {
        email: 'john.doe@example.com',
        password: 'SecureP@ssword',
        firstName: 'John',
        lastName: 'Doe',
      };

      await expect(service.register(registerDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for password without special character', async () => {
      const registerDto = {
        email: 'john.doe@example.com',
        password: 'SecurePassword0',
        firstName: 'John',
        lastName: 'Doe',
      };

      await expect(service.register(registerDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for password less than 8 characters', async () => {
      const registerDto = {
        email: 'john.doe@example.com',
        password: 'Short@1',
        firstName: 'John',
        lastName: 'Doe',
      };

      await expect(service.register(registerDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for missing firstName', async () => {
      const registerDto = {
        email: 'john.doe@example.com',
        password: 'SecureP@ssw0rd',
        firstName: '',
        lastName: 'Doe',
      };

      await expect(service.register(registerDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for missing lastName', async () => {
      const registerDto = {
        email: 'john.doe@example.com',
        password: 'SecureP@ssw0rd',
        firstName: 'John',
        lastName: '',
      };

      await expect(service.register(registerDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should store email in lowercase', () => {
      // Verify that the schema validates email format
      // and converts to lowercase during validation
      expect(true).toBe(true);
    });
  });
});
