# Better Auth Integration - Setup Complete ✅

## Overview

Task BE-2.1 (Better Auth Integration) has been successfully completed for the Library Management System backend. Better Auth is now fully integrated with session-based authentication using email/password strategy.

## What Was Implemented

### 1. **Packages Installed**

- `better-auth@1.3.27` - Core Better Auth library
- `@thallesp/nestjs-better-auth@2.1.0` - NestJS integration package

### 2. **Better Auth Instance** (`src/lib/auth.ts`)

Created comprehensive Better Auth configuration with:

- **Database Adapter**: Prisma adapter for PostgreSQL
- **Authentication Provider**: Email/password (min: 8 chars, max: 128 chars)
- **Session Management**:
  - 7-day expiration (rolling sessions)
  - Session refresh every 24 hours
  - Cookie cache enabled (5 minutes) for performance
- **Cookie Security**:
  - `httpOnly: true` - Prevents XSS attacks
  - `sameSite: 'lax'` (dev) / `'strict'` (prod) - CSRF protection
  - `secure: true` in production - HTTPS only
  - 7-day maxAge
- **CSRF Protection**: Via trustedOrigins (FRONTEND_URL)
- **Base Path**: `/api/auth`

### 3. **Database Schema Updates**

Migration `20251016071729_add_better_auth_tables` added:

**Session Table:**

- Stores active user sessions
- Fields: id, userId, token, expiresAt, ipAddress, userAgent, timestamps
- Indexed on userId and token for fast lookups
- CASCADE delete when user is deleted

**Account Table:**

- Supports multiple auth providers (email/password, OAuth)
- Fields: id, userId, accountId, providerId, access/refresh tokens, password, timestamps
- Indexed on userId and providerId+accountId
- CASCADE delete when user is deleted

**Verification Table:**

- Email verification and password reset tokens
- Fields: id, identifier, value, expiresAt, timestamps
- Unique constraint on identifier+value
- Indexed on identifier

**User Table Extensions:**

- Added `name` field (required by Better Auth)
- Added `emailVerified` boolean (default: false)
- Added `image` field for profile pictures (optional)

### 4. **NestJS Integration**

**main.ts:**

- Disabled body parser (`bodyParser: false`) - Required by Better Auth

**app.module.ts:**

- Imported `AuthModule.forRoot({ auth })`
- Global guard automatically registered for route protection

### 5. **Environment Variables** (`.env.example`)

```env
BETTER_AUTH_SECRET=your-secret-key-at-least-32-characters-long-change-in-production
BETTER_AUTH_URL=http://localhost:3000
```

## Available Endpoints

Better Auth automatically provides these endpoints at `/api/auth/*`:

### Authentication

- **POST** `/api/auth/sign-up/email` - Register new user

  ```json
  {
    "email": "user@example.com",
    "password": "SecurePass123",
    "name": "John Doe"
  }
  ```

- **POST** `/api/auth/sign-in/email` - Login

  ```json
  {
    "email": "user@example.com",
    "password": "SecurePass123"
  }
  ```

- **POST** `/api/auth/sign-out` - Logout (requires session cookie)

### Session Management

- **GET** `/api/auth/session` - Get current session
  - Returns user data if authenticated
  - Returns `null` if not authenticated

### Additional Features

- Email verification endpoints
- Password reset endpoints
- Session refresh (automatic via cookie cache)

## Usage in Controllers

### Protecting Routes

```typescript
import { Controller, Get } from '@nestjs/common';
import { Session, UserSession } from '@thallesp/nestjs-better-auth';

@Controller('users')
export class UserController {
  // Protected route (default - global guard is active)
  @Get('me')
  async getProfile(@Session() session: UserSession) {
    return { user: session.user };
  }
}
```

### Public Routes

```typescript
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';

@Get('public')
@AllowAnonymous()
async getPublic() {
  return { message: 'Public route' };
}
```

### Optional Authentication

```typescript
import { OptionalAuth } from '@thallesp/nestjs-better-auth';

@Get('optional')
@OptionalAuth()
async getOptional(@Session() session: UserSession) {
  return { authenticated: !!session };
}
```

## Security Features

✅ **Password Security**

- Hashed with industry-standard bcrypt
- Minimum 8 characters, maximum 128 characters
- Better Auth handles all password hashing internally

✅ **Session Security**

- Database-backed sessions (persist across server restarts)
- HTTPOnly cookies (prevent JavaScript access)
- Secure cookies in production (HTTPS only)
- SameSite cookies (CSRF protection)
- 7-day expiration with automatic refresh

✅ **CSRF Protection**

- Trusted origins validation
- SameSite cookie attribute
- Origin header checking

✅ **XSS Protection**

- HTTPOnly cookies prevent client-side access
- Secure cookie transmission

## Testing the Integration

### 1. Start the Server

```bash
cd backend
pnpm run dev
```

### 2. Test Registration

```bash
curl -X POST http://localhost:3000/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123",
    "name": "Test User"
  }'
```

### 3. Test Login

```bash
curl -X POST http://localhost:3000/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123"
  }' \
  -c cookies.txt  # Save session cookie
```

### 4. Test Session

```bash
curl -X GET http://localhost:3000/api/auth/session \
  -b cookies.txt  # Use session cookie
```

### 5. Test Logout

```bash
curl -X POST http://localhost:3000/api/auth/sign-out \
  -b cookies.txt
```

## Database Verification

To verify the schema was applied correctly:

```bash
cd backend
pnpm prisma studio
```

Check that these tables exist:

- `user` (with name, emailVerified, image columns)
- `session`
- `account`
- `verification`

## Troubleshooting

### Issue: Session cookie not being set

- Verify `FRONTEND_URL` is in trustedOrigins
- Check CORS configuration in main.ts
- Ensure `credentials: true` in CORS options

### Issue: "Invalid session" errors

- Verify `BETTER_AUTH_SECRET` is set and consistent
- Check database connection
- Ensure session table exists and is accessible

### Issue: TypeScript errors

- Run `pnpm prisma generate` to regenerate Prisma Client
- Restart TypeScript server in your IDE

## References

- [Better Auth Documentation](https://www.better-auth.com/docs)
- [Better Auth NestJS Integration](https://www.better-auth.com/docs/integrations/nestjs)
- [NestJS Better Auth GitHub](https://github.com/ThallesP/nestjs-better-auth)
- Project TDD: `/TDD.md`
- Project ERD: `/ERD.md`
- API Contract: `/api-contract.yaml`

---

**Status**: ✅ Task BE-2.1 Completed
**Date**: January 16, 2025
**Migration**: `20251016071729_add_better_auth_tables`
**Build Status**: Passing ✓
**Lint Status**: Clean ✓
