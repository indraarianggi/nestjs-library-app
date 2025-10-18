import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService, type UserWithProfile } from '../auth.service';

/**
 * LocalStrategy - Passport strategy for email/password authentication
 * Used for login endpoint to validate user credentials
 * Extends PassportStrategy with 'local' identifier
 */
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email', // Use email instead of username
      passwordField: 'password',
    });
  }

  /**
   * Validate user credentials
   * Called automatically by Passport during authentication
   * @param email User's email address
   * @param password User's password
   * @returns User object if validation succeeds
   * @throws UnauthorizedException if validation fails
   */
  async validate(email: string, password: string): Promise<UserWithProfile> {
    const user = await this.authService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return user;
  }
}
