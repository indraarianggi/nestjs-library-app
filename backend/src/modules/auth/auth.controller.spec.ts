import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, BadRequestException } from '@nestjs/common';
import { Response } from 'express';

// Mock the better-auth decorator to avoid ESM module issues in Jest
jest.mock('@thallesp/nestjs-better-auth', () => ({
  AllowAnonymous:
    () =>
    (
      target: any,
      propertyKey: string | symbol | undefined,
      descriptor: PropertyDescriptor,
    ) =>
      descriptor,
}));

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController - Registration', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockRegistrationResult = {
    user: {
      id: 'user-uuid',
      email: 'john.doe@example.com',
      name: 'John Doe',
      role: 'MEMBER',
      isActive: true,
    },
    memberProfile: {
      id: 'profile-uuid',
      userId: 'user-uuid',
      firstName: 'John',
      lastName: 'Doe',
      phone: null,
      address: null,
      status: 'ACTIVE',
    },
    session: {
      userId: 'user-uuid',
      token: 'session-token',
      expiresAt: new Date('2025-01-22'),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const registerDto = {
        email: 'john.doe@example.com',
        password: 'SecureP@ssw0rd',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+62812345678',
        address: 'Jl. Merdeka No. 123, Jakarta',
      };

      // eslint-disable-next-line @typescript-eslint/unbound-method
      jest
        .spyOn(service, 'register')
        .mockResolvedValueOnce(mockRegistrationResult);

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        cookie: jest.fn().mockReturnThis(),
      } as unknown as Response;

      await controller.register(registerDto, mockRes);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.register).toHaveBeenCalledWith(registerDto);
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'session',
        'session-token',
        expect.objectContaining({
          httpOnly: true,
          maxAge: 7 * 24 * 60 * 60 * 1000,
          path: '/',
        }),
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(mockRegistrationResult);
    });

    it('should return 409 Conflict when email already exists', async () => {
      const registerDto = {
        email: 'existing@example.com',
        password: 'SecureP@ssw0rd',
        firstName: 'John',
        lastName: 'Doe',
      };

      // eslint-disable-next-line @typescript-eslint/unbound-method
      jest
        .spyOn(service, 'register')
        .mockRejectedValueOnce(
          new ConflictException('Email already registered'),
        );

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        cookie: jest.fn().mockReturnThis(),
      } as unknown as Response;

      await controller.register(registerDto, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(409);
    });

    it('should return 400 Bad Request for validation errors', async () => {
      const registerDto = {
        email: 'invalid-email',
        password: 'weak',
        firstName: 'John',
        lastName: 'Doe',
      };

      // eslint-disable-next-line @typescript-eslint/unbound-method
      jest
        .spyOn(service, 'register')
        .mockRejectedValueOnce(new BadRequestException('Validation failed'));

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        cookie: jest.fn().mockReturnThis(),
      } as unknown as Response;

      await controller.register(registerDto, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should handle optional phone and address fields', async () => {
      const registerDto = {
        email: 'jane.doe@example.com',
        password: 'SecureP@ssw0rd123',
        firstName: 'Jane',
        lastName: 'Doe',
      };

      // eslint-disable-next-line @typescript-eslint/unbound-method
      jest
        .spyOn(service, 'register')
        .mockResolvedValueOnce(mockRegistrationResult);

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        cookie: jest.fn().mockReturnThis(),
      } as unknown as Response;

      await controller.register(registerDto, mockRes);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.register).toHaveBeenCalledWith(registerDto);
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });
  });
});
