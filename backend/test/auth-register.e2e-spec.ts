import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Auth Registration (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    // Clean up database before tests
    await prisma.cleanDatabase();
  });

  afterAll(async () => {
    await prisma.cleanDatabase();
    await app.close();
  });

  describe('POST /api/auth/register', () => {
    it('should successfully register a new user with required fields', async () => {
      const registerData = {
        email: 'john.doe@example.com',
        password: 'SecureP@ssw0rd',
        firstName: 'John',
        lastName: 'Doe',
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(registerData)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('memberProfile');
      expect(response.body).toHaveProperty('session');

      expect(response.body.user).toMatchObject({
        email: 'john.doe@example.com',
        name: 'John Doe',
        role: 'MEMBER',
        isActive: true,
      });

      expect(response.body.memberProfile).toMatchObject({
        firstName: 'John',
        lastName: 'Doe',
        status: 'ACTIVE',
      });

      expect(response.body.session).toHaveProperty('userId');
      expect(response.body.session).toHaveProperty('token');
      expect(response.body.session).toHaveProperty('expiresAt');

      // Verify session cookie is set
      expect(response.headers['set-cookie']).toBeDefined();
      const setCookieHeaders = response.headers['set-cookie'] as string[];
      const sessionCookie = setCookieHeaders.find((cookie) =>
        cookie.startsWith('session='),
      );
      expect(sessionCookie).toBeDefined();
      expect(sessionCookie).toContain('HttpOnly');
    });

    it('should successfully register with optional phone and address', async () => {
      const registerData = {
        email: 'jane.doe@example.com',
        password: 'SecureP@ssw0rd123',
        firstName: 'Jane',
        lastName: 'Doe',
        phone: '+62812345678',
        address: 'Jl. Merdeka No. 123, Jakarta',
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(registerData)
        .expect(201);

      expect(response.body.memberProfile).toMatchObject({
        firstName: 'Jane',
        lastName: 'Doe',
        phone: '+62812345678',
        address: 'Jl. Merdeka No. 123, Jakarta',
        status: 'ACTIVE',
      });
    });

    it('should return 409 Conflict when email already exists', async () => {
      const registerData = {
        email: 'existing@example.com',
        password: 'SecureP@ssw0rd',
        firstName: 'First',
        lastName: 'User',
      };

      // Register first user
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(registerData)
        .expect(201);

      // Try to register with same email
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(registerData)
        .expect(409);

      expect(response.body.statusCode).toBe(409);
      expect(response.body.message).toContain('Email already registered');
    });

    it('should return 409 Conflict for case-insensitive email duplicate', async () => {
      const firstEmail = {
        email: 'case.test@example.com',
        password: 'SecureP@ssw0rd',
        firstName: 'Case',
        lastName: 'Test',
      };

      const duplicateEmail = {
        email: 'CASE.TEST@EXAMPLE.COM',
        password: 'DifferentP@ssw0rd123',
        firstName: 'Different',
        lastName: 'Name',
      };

      // Register with first email
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(firstEmail)
        .expect(201);

      // Try to register with uppercase version
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(duplicateEmail)
        .expect(409);

      expect(response.body.statusCode).toBe(409);
    });

    it('should return 400 for invalid email format', async () => {
      const registerData = {
        email: 'invalid-email',
        password: 'SecureP@ssw0rd',
        firstName: 'John',
        lastName: 'Doe',
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(registerData)
        .expect(400);

      expect(response.body.statusCode).toBe(400);
      expect(response.body.message).toContain('Validation failed');
      expect(response.body.details).toBeDefined();
      expect(
        response.body.details.some((d: any) =>
          d.message.includes('Invalid email'),
        ),
      ).toBe(true);
    });

    it('should return 400 for password without uppercase letter', async () => {
      const registerData = {
        email: 'test@example.com',
        password: 'securep@ssw0rd',
        firstName: 'John',
        lastName: 'Doe',
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(registerData)
        .expect(400);

      expect(response.body.details).toBeDefined();
      expect(
        response.body.details.some((d: any) => d.message.includes('uppercase')),
      ).toBe(true);
    });

    it('should return 400 for password without lowercase letter', async () => {
      const registerData = {
        email: 'test@example.com',
        password: 'SECUREP@SSW0RD',
        firstName: 'John',
        lastName: 'Doe',
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(registerData)
        .expect(400);

      expect(response.body.details).toBeDefined();
      expect(
        response.body.details.some((d: any) => d.message.includes('lowercase')),
      ).toBe(true);
    });

    it('should return 400 for password without digit', async () => {
      const registerData = {
        email: 'test@example.com',
        password: 'SecureP@ssword',
        firstName: 'John',
        lastName: 'Doe',
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(registerData)
        .expect(400);

      expect(response.body.details).toBeDefined();
      expect(
        response.body.details.some((d: any) => d.message.includes('digit')),
      ).toBe(true);
    });

    it('should return 400 for password without special character', async () => {
      const registerData = {
        email: 'test@example.com',
        password: 'SecurePassword0',
        firstName: 'John',
        lastName: 'Doe',
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(registerData)
        .expect(400);

      expect(response.body.details).toBeDefined();
      expect(
        response.body.details.some((d: any) =>
          d.message.includes('special character'),
        ),
      ).toBe(true);
    });

    it('should return 400 for password shorter than 8 characters', async () => {
      const registerData = {
        email: 'test@example.com',
        password: 'Short@1',
        firstName: 'John',
        lastName: 'Doe',
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(registerData)
        .expect(400);

      expect(response.body.details).toBeDefined();
      expect(
        response.body.details.some((d: any) =>
          d.message.includes('8 characters'),
        ),
      ).toBe(true);
    });

    it('should return 400 for missing firstName', async () => {
      const registerData = {
        email: 'test@example.com',
        password: 'SecureP@ssw0rd',
        lastName: 'Doe',
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(registerData)
        .expect(400);

      expect(response.body.details).toBeDefined();
    });

    it('should return 400 for missing lastName', async () => {
      const registerData = {
        email: 'test@example.com',
        password: 'SecureP@ssw0rd',
        firstName: 'John',
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(registerData)
        .expect(400);

      expect(response.body.details).toBeDefined();
    });

    it('should return 400 for empty firstName', async () => {
      const registerData = {
        email: 'test@example.com',
        password: 'SecureP@ssw0rd',
        firstName: '',
        lastName: 'Doe',
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(registerData)
        .expect(400);

      expect(response.body.details).toBeDefined();
    });

    it('should return 400 for empty lastName', async () => {
      const registerData = {
        email: 'test@example.com',
        password: 'SecureP@ssw0rd',
        firstName: 'John',
        lastName: '',
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(registerData)
        .expect(400);

      expect(response.body.details).toBeDefined();
    });

    it('should store email in lowercase', async () => {
      const registerData = {
        email: 'John.Doe@EXAMPLE.COM',
        password: 'SecureP@ssw0rd',
        firstName: 'John',
        lastName: 'Doe',
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(registerData)
        .expect(201);

      expect(response.body.user.email).toBe('john.doe@example.com');

      // Verify in database
      const user = await prisma.user.findFirst({
        where: { email: 'john.doe@example.com' },
      });

      expect(user).toBeDefined();
      expect(user?.email).toBe('john.doe@example.com');
    });

    it('should create user and member profile in a transaction', async () => {
      const registerData = {
        email: 'transaction.test@example.com',
        password: 'SecureP@ssw0rd123',
        firstName: 'Transaction',
        lastName: 'Test',
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(registerData)
        .expect(201);

      const userId = response.body.user.id;

      // Verify user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      expect(user).toBeDefined();
      expect(user?.email).toBe('transaction.test@example.com');
      expect(user?.role).toBe('MEMBER');
      expect(user?.isActive).toBe(true);

      // Verify member profile exists
      const memberProfile = await prisma.memberProfile.findUnique({
        where: { userId },
      });

      expect(memberProfile).toBeDefined();
      expect(memberProfile?.firstName).toBe('Transaction');
      expect(memberProfile?.lastName).toBe('Test');
      expect(memberProfile?.status).toBe('ACTIVE');
    });

    it('should create audit log entry', async () => {
      const registerData = {
        email: 'audit.test@example.com',
        password: 'SecureP@ssw0rd123',
        firstName: 'Audit',
        lastName: 'Test',
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(registerData)
        .expect(201);

      const userId = response.body.user.id;

      // Verify audit log exists
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          userId,
          action: 'user.registered',
        },
      });

      expect(auditLog).toBeDefined();
      expect(auditLog?.action).toBe('user.registered');
      expect(auditLog?.entityType).toBe('user');
      expect(auditLog?.entityId).toBe(userId);
      expect(auditLog?.metadata).toHaveProperty('email');
      expect(auditLog?.metadata).toHaveProperty('firstName');
      expect(auditLog?.metadata).toHaveProperty('lastName');
    });

    it('should create session record', async () => {
      const registerData = {
        email: 'session.test@example.com',
        password: 'SecureP@ssw0rd123',
        firstName: 'Session',
        lastName: 'Test',
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(registerData)
        .expect(201);

      const userId = response.body.user.id;

      // Verify session exists
      const session = await prisma.session.findFirst({
        where: { userId },
      });

      expect(session).toBeDefined();
      expect(session?.userId).toBe(userId);
      expect(session?.token).toBeDefined();
      expect(session?.expiresAt).toBeDefined();
    });
  });
});
