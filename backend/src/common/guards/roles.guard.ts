import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '@prisma/client';

/**
 * RolesGuard - Guard for role-based access control
 * Checks if user has required roles set by @Roles() decorator
 * Should be used after JwtAuthGuard to ensure user is authenticated
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as { role?: Role } | undefined;

    if (!user || !user.role) {
      return false;
    }

    return requiredRoles.some((role) => user.role === role);
  }
}
