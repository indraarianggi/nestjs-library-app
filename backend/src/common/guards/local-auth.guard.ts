import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { loginSchema } from 'src/modules/auth/dto/login.dto';

/**
 * LocalAuthGuard - Guard for login endpoint
 * Extends AuthGuard('local') from Passport
 * First validates email/password using zod schema, then validates credentials using LocalStrategy
 */
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') implements CanActivate {
  private readonly logger = new Logger(LocalAuthGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const request = context.switchToHttp().getRequest();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const validationResult = loginSchema.safeParse(request.body);

    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      this.logger.warn(`Login validation failed: ${JSON.stringify(errors)}`);
      throw new BadRequestException({
        message: 'Validation failed',
        errors: errors,
      });
    }

    return super.canActivate(context) as Promise<boolean>;
  }
}
