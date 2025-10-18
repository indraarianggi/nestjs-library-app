import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

/**
 * JWT Payload structure for access tokens
 */
export interface JwtPayload {
  sub: string; // userId
  email: string;
  role: 'ADMIN' | 'MEMBER';
  iat?: number;
  exp?: number;
}

/**
 * User object returned after JWT validation
 */
export interface ValidatedUser {
  userId: string;
  email: string;
  role: 'ADMIN' | 'MEMBER';
}

/**
 * JwtStrategy - Passport strategy for JWT access token authentication
 * Validates access tokens from Authorization Bearer header
 * Extends PassportStrategy with 'jwt' identifier
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_ACCESS_SECRET') || 'default-secret',
    });
  }

  /**
   * Validate JWT payload
   * Called automatically by Passport after token is verified
   * @param payload Decoded JWT payload
   * @returns User object with userId, email, and role
   */
  validate(payload: JwtPayload): ValidatedUser {
    if (!payload.sub || !payload.email || !payload.role) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
