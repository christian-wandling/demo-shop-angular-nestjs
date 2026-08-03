import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export type SigningKeyPemResolver = (kid: string | undefined) => Promise<string>;

export type KeycloakVerifyOptions = {
  issuer: string;
  audience?: string;
};

export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly resolveSigningKeyPem: SigningKeyPemResolver,
    private readonly options: KeycloakVerifyOptions
  ) {}

  async canActivate(_context: ExecutionContext): Promise<boolean> {
    throw new Error('JwtAuthGuard is not implemented yet');
  }
}
