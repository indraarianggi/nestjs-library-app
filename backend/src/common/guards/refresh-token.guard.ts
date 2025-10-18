import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * RefreshTokenGuard - Guard for refresh token endpoint
 * Extends AuthGuard('jwt-refresh') from Passport
 * Validates refresh token using RefreshTokenStrategy
 */
@Injectable()
export class RefreshTokenGuard extends AuthGuard('jwt-refresh') {}
