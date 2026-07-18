import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ROLES_KEY, RolesOptions } from '../decorators/roles.decorator';

type KeycloakAccessToken = {
  realm_access?: { roles?: string[] };
  resource_access?: Record<string, { roles?: string[] }>;
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const required = this.reflector.getAllAndOverride<RolesOptions>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required?.roles?.length) {
      return true;
    }

    const user = context.switchToHttp().getRequest().user as KeycloakAccessToken | undefined;

    if (this.hasAnyRole(user, required.roles)) {
      return true;
    }

    throw new ForbiddenException('Insufficient role');
  }

  private hasAnyRole(user: KeycloakAccessToken | undefined, required: string[]): boolean {
    if (!user) {
      return false;
    }

    return required.some(role => this.userHasRole(user, role));
  }

  private userHasRole(user: KeycloakAccessToken, role: string): boolean {
    const [scope, name] = role.includes(':') ? role.split(':') : ['realm', role];

    if (scope === 'realm') {
      return !!user.realm_access?.roles?.includes(name);
    }

    return !!user.resource_access?.[scope]?.roles?.includes(name);
  }
}
