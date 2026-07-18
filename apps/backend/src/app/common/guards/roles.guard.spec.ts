import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: { getAllAndOverride: jest.Mock };

  const buildContext = (user?: unknown) => {
    const req = { user };
    return {
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({ getRequest: () => req }),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    guard = new RolesGuard(reflector as unknown as Reflector);
  });

  it('allows a public route', () => {
    reflector.getAllAndOverride.mockReturnValueOnce(true);

    expect(guard.canActivate(buildContext())).toBe(true);
  });

  it('allows a route with no role requirement', () => {
    reflector.getAllAndOverride.mockReturnValueOnce(false).mockReturnValueOnce(undefined);

    expect(guard.canActivate(buildContext())).toBe(true);
  });

  it('allows when the token carries the required realm role', () => {
    reflector.getAllAndOverride.mockReturnValueOnce(false).mockReturnValueOnce({ roles: ['realm:buy_products'] });

    expect(guard.canActivate(buildContext({ realm_access: { roles: ['buy_products'] } }))).toBe(true);
  });

  it('forbids when the required realm role is missing', () => {
    reflector.getAllAndOverride.mockReturnValueOnce(false).mockReturnValueOnce({ roles: ['realm:buy_products'] });

    expect(() => guard.canActivate(buildContext({ realm_access: { roles: ['browse'] } }))).toThrow(ForbiddenException);
  });

  it('forbids when there is no authenticated user', () => {
    reflector.getAllAndOverride.mockReturnValueOnce(false).mockReturnValueOnce({ roles: ['realm:buy_products'] });

    expect(() => guard.canActivate(buildContext(undefined))).toThrow(ForbiddenException);
  });

  it('matches a client role via resource_access', () => {
    reflector.getAllAndOverride.mockReturnValueOnce(false).mockReturnValueOnce({ roles: ['api:admin'] });

    expect(guard.canActivate(buildContext({ resource_access: { api: { roles: ['admin'] } } }))).toBe(true);
  });
});
