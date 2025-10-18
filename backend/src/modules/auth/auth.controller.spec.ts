import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, BadRequestException } from '@nestjs/common';
import { Response } from 'express';

// Mock Better Auth before importing other modules
jest.mock('../../lib/auth', () => ({
  auth: {
    api: {
      signUpEmail: jest.fn(),
      signInEmail: jest.fn(),
    },
  },
}));

// Mock the better-auth decorators to avoid ESM module issues in Jest
jest.mock('@thallesp/nestjs-better-auth', () => ({
  AllowAnonymous:
    () =>
    (
      target: any,
      propertyKey: string | symbol | undefined,
      descriptor: PropertyDescriptor,
    ) =>
      descriptor,
  Session:
    () =>
    (
      target: any,
      propertyKey: string | symbol | undefined,
      parameterIndex: number,
    ) =>
      parameterIndex,
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
    message: 'Registration successful. Please sign in to continue.',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
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

      jest
        .spyOn(service, 'register')
        .mockResolvedValueOnce(mockRegistrationResult);

      const result = await controller.register(registerDto);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.register).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(mockRegistrationResult);
    });

    it('should return 409 Conflict when email already exists', async () => {
      const registerDto = {
        email: 'existing@example.com',
        password: 'SecureP@ssw0rd',
        firstName: 'John',
        lastName: 'Doe',
      };

      jest
        .spyOn(service, 'register')
        .mockRejectedValueOnce(
          new ConflictException('Email already registered'),
        );

      await expect(controller.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should return 400 Bad Request for validation errors', async () => {
      const registerDto = {
        email: 'invalid-email',
        password: 'weak',
        firstName: 'John',
        lastName: 'Doe',
      };

      jest
        .spyOn(service, 'register')
        .mockRejectedValueOnce(new BadRequestException('Validation failed'));

      await expect(controller.register(registerDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle optional phone and address fields', async () => {
      const registerDto = {
        email: 'jane.doe@example.com',
        password: 'SecureP@ssw0rd123',
        firstName: 'Jane',
        lastName: 'Doe',
      };

      jest
        .spyOn(service, 'register')
        .mockResolvedValueOnce(mockRegistrationResult);

      const result = await controller.register(registerDto);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.register).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(mockRegistrationResult);
    });
  });
});

describe('AuthController - Login', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockLoginResult = {
    user: {
      id: 'user-uuid',
      email: 'john.doe@example.com',
      name: 'John Doe',
      role: 'MEMBER',
      isActive: true,
      lastLoginAt: new Date(),
    },
    memberProfile: {
      id: 'profile-uuid',
      userId: 'user-uuid',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+62812345678',
      address: '123 Main St',
      status: 'ACTIVE',
    },
    message: 'Login successful',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
            logout: jest.fn(),
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

  describe('login', () => {
    const mockRes = {
      cookie: jest.fn(),
    } as unknown as Response;

    it('should successfully login a user and set session cookie', async () => {
      const loginDto = {
        email: 'john.doe@example.com',
        password: 'SecureP@ssw0rd',
      };

      jest.spyOn(service, 'login').mockResolvedValueOnce(mockLoginResult);

      const result = await controller.login(loginDto, mockRes);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.login).toHaveBeenCalledWith(loginDto, mockRes);
      expect(result).toEqual(mockLoginResult);
    });

    it('should handle login for ADMIN role without memberProfile', async () => {
      const loginDto = {
        email: 'admin@library.com',
        password: 'Admin@123',
      };

      const mockAdminResult = {
        user: {
          id: 'admin-uuid',
          email: 'admin@library.com',
          name: 'Admin User',
          role: 'ADMIN',
          isActive: true,
          lastLoginAt: new Date(),
        },
        message: 'Login successful',
      };

      jest.spyOn(service, 'login').mockResolvedValueOnce(mockAdminResult);

      const result = await controller.login(loginDto, mockRes);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.login).toHaveBeenCalledWith(loginDto, mockRes);
      expect(result).toEqual(mockAdminResult);
      expect(result.memberProfile).toBeUndefined();
    });
  });
});
