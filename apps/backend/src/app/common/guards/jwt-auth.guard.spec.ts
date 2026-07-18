import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: { getAllAndOverride: jest.Mock };
  let jwtService: { verifyAsync: jest.Mock };

  const buildContext = (authorization?: string) => {
    const req: { headers: Record<string, string>; user?: unknown } = {
      headers: authorization ? { authorization } : {},
    };
    const context = {
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({ getRequest: () => req }),
    } as unknown as ExecutionContext;

    return { context, req };
  };

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    jwtService = { verifyAsync: jest.fn() };
    guard = new JwtAuthGuard(reflector as unknown as Reflector, jwtService as unknown as JwtService);
  });

  it('allows a public route without inspecting the token', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);

    await expect(guard.canActivate(buildContext().context)).resolves.toBe(true);
    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
  });

  it('rejects a protected route with no bearer token', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);

    await expect(guard.canActivate(buildContext().context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects a non-bearer authorization scheme', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);

    await expect(guard.canActivate(buildContext('Basic abc').context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects a token that fails verification', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    jwtService.verifyAsync.mockRejectedValue(new Error('bad signature'));

    await expect(guard.canActivate(buildContext('Bearer tampered').context)).rejects.toBeInstanceOf(
      UnauthorizedException
    );
  });

  it('verifies with RS256 and attaches the payload to the request', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const payload = { sub: 'user-1' };
    jwtService.verifyAsync.mockResolvedValue(payload);
    const { context, req } = buildContext('Bearer good');

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(jwtService.verifyAsync).toHaveBeenCalledWith('good', { algorithms: ['RS256'] });
    expect(req.user).toBe(payload);
  });
});
