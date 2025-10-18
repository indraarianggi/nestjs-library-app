import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import { Request } from 'express';
import * as bcrypt from 'bcrypt';

/**
 * Refresh Token Payload structure
 */
export interface RefreshTokenPayload {
  sub: string; // userId
  iat?: number;
  exp?: number;
}

/**
 * User object returned after refresh token validation
 */
export interface ValidatedRefreshUser {
  userId: string;
  refreshToken: string;
}

/**
 * RefreshTokenStrategy - Passport strategy for JWT refresh token authentication
 * Validates refresh tokens and checks database for revocation
 * Extends PassportStrategy with 'jwt-refresh' identifier
 */
@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          // Extract refresh token from request body
          const body = request?.body as { refreshToken?: string } | undefined;
          const token = body?.refreshToken;
          return token || null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_REFRESH_SECRET') ||
        'default-refresh-secret',
      passReqToCallback: true, // Pass the request to validate method
    });
  }

  /**
   * Validate refresh token payload and check database
   * Called automatically by Passport after token is verified
   * @param req Express request object
   * @param payload Decoded JWT payload
   * @returns User object with userId and refreshToken
   * @throws UnauthorizedException if token is revoked or not found
   */
  async validate(
    req: Request,
    payload: RefreshTokenPayload,
  ): Promise<ValidatedRefreshUser> {
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid refresh token payload');
    }

    const body = req.body as { refreshToken?: string } | undefined;
    const refreshToken = body?.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not provided');
    }

    // Find the refresh token in database (token is hashed)
    // We need to find all tokens for this user and compare hashes
    const userTokens = await this.prisma.refreshToken.findMany({
      where: {
        userId: payload.sub,
        isRevoked: false,
        expiresAt: {
          gte: new Date(), // Not expired
        },
      },
    });

    // Compare the provided token with stored hashed tokens
    let validToken = null;
    for (const dbToken of userTokens) {
      const isValid = await bcrypt.compare(refreshToken, dbToken.token);
      if (isValid) {
        validToken = dbToken;
        break;
      }
    }

    if (!validToken) {
      throw new UnauthorizedException('Invalid or revoked refresh token');
    }

    return {
      userId: payload.sub,
      refreshToken: refreshToken,
    };
  }
}
