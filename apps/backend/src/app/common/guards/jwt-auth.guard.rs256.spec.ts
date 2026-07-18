import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { generateKeyPairSync } from 'node:crypto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { toPublicKeyPem } from '../util/keycloak-public-key';

describe('JwtAuthGuard (RS256 against a real key)', () => {
  const reflector = { getAllAndOverride: () => false } as unknown as Reflector;

  const buildContext = (authorization: string) => {
    const req: { headers: Record<string, string>; user?: { sub: string } } = {
      headers: { authorization },
    };
    const context = {
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({ getRequest: () => req }),
    } as unknown as ExecutionContext;

    return { context, req };
  };

  const keypair = () => {
    const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
    return {
      privatePem: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
      realmPublicKey: publicKey.export({ type: 'spki', format: 'der' }).toString('base64'),
    };
  };

  it('accepts a token signed by the realm key and attaches its payload', async () => {
    const { privatePem, realmPublicKey } = keypair();
    const signer = new JwtService({ privateKey: privatePem, signOptions: { algorithm: 'RS256' } });
    const guard = new JwtAuthGuard(reflector, new JwtService({ publicKey: toPublicKeyPem(realmPublicKey) }));

    const token = await signer.signAsync({ sub: 'user-1', realm_access: { roles: ['buy_products'] } });
    const { context, req } = buildContext(`Bearer ${token}`);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(req.user?.sub).toBe('user-1');
  });

  it('rejects a token signed by a different key', async () => {
    const realm = keypair();
    const attacker = keypair();
    const signer = new JwtService({
      privateKey: attacker.privatePem,
      signOptions: { algorithm: 'RS256' },
    });
    const guard = new JwtAuthGuard(reflector, new JwtService({ publicKey: toPublicKeyPem(realm.realmPublicKey) }));

    const token = await signer.signAsync({ sub: 'user-1' });
    const { context } = buildContext(`Bearer ${token}`);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
