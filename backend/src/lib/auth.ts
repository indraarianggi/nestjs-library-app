import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: false,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days in seconds
    updateAge: 60 * 60 * 24, // 1 day - rolling session
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  advanced: {
    database: {
      generateId: false,
    },
    cookiePrefix: process.env.BETTER_AUTH_COOKIE_PREFIX || 'libray-app',
    cookies: {
      session_token: {
        name: process.env.BETTER_AUTH_COOKIE_NAME || 'session_token',
      },
    },
    cookieOptions: {
      httpOnly: true,
      sameSite:
        process.env.NODE_ENV === 'production' ? 'strict' : ('lax' as const),
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
    useSecureCookies: process.env.NODE_ENV === 'production',
    crossSubDomainCookies: {
      enabled: false,
    },
  },
  trustedOrigins: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    ...(process.env.NODE_ENV === 'production' ? [] : ['*']),
  ],
  secret: process.env.BETTER_AUTH_SECRET || 'secret-key-change-in-production',
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  basePath: '/api/auth',
});
