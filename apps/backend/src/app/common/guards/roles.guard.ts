import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ROLES_KEY, RoleOptions } from '../decorators/roles.decorator';

type Claims = {
  realm_access?: { roles?: string[] };
  resource_access?: Record<string, { roles?: string[] } | undefined>;
};

const REALM_SCOPE = 'realm';

const hasRealmRole = (claims: Claims, role: string): boolean => claims.realm_access?.roles?.includes(role) === true;

const hasClientRole = (claims: Claims, client: string, role: string): boolean =>
  claims.resource_access?.[client]?.roles?.includes(role) === true;

export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly clientId: string
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<RoleOptions>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])?.roles;

    if (!roles || roles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<{ user?: Claims }>();

    return user !== undefined && roles.some(role => this.hasRole(user, role));
  }

  private hasRole(claims: Claims, role: string): boolean {
    const [scope, name] = role.split(':');

    if (name === undefined) {
      return hasClientRole(claims, this.clientId, scope);
    }

    return scope === REALM_SCOPE ? hasRealmRole(claims, name) : hasClientRole(claims, scope, name);
  }
}
