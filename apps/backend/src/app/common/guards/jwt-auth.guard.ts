import { CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService, JwtVerifyOptions } from '@nestjs/jwt';

import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

export type SigningKeyPemResolver = (kid: string | undefined) => Promise<string>;

export type KeycloakVerifyOptions = {
  issuer: string;
  audience?: string;
};

type JoseHeader = {
  kid: string | undefined;
};

type Claims = Record<string, unknown>;

const SIGNING_ALGORITHM = 'RS256';
const ACCESS_TOKEN_TYPE = 'Bearer';
const BEARER_SCHEME = 'bearer';

const CREDENTIAL = /^([A-Za-z]+) ([A-Za-z0-9\-._~+/]+=*)$/;

const rejected = (): UnauthorizedException => new UnauthorizedException();

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const decodeJsonSegment = (segment: string): Record<string, unknown> | undefined => {
  try {
    const parsed: unknown = JSON.parse(Buffer.from(segment, 'base64url').toString('utf8'));

    return isPlainObject(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
};

const readBearerToken = (value: unknown): string => {
  if (typeof value !== 'string') {
    throw rejected();
  }

  const credential = CREDENTIAL.exec(value);

  if (!credential || credential[1].toLowerCase() !== BEARER_SCHEME) {
    throw rejected();
  }

  return credential[2];
};

const readJoseHeader = (token: string): JoseHeader => {
  const segments = token.split('.');

  if (segments.length !== 3 || segments.some(segment => segment.length === 0)) {
    throw rejected();
  }

  const header = decodeJsonSegment(segments[0]);

  if (!header || header.alg !== SIGNING_ALGORITHM) {
    throw rejected();
  }

  return { kid: typeof header.kid === 'string' ? header.kid : undefined };
};

export class JwtAuthGuard implements CanActivate {
  private readonly jwtService = new JwtService({});

  constructor(
    private readonly reflector: Reflector,
    private readonly resolveSigningKeyPem: SigningKeyPemResolver,
    private readonly options: KeycloakVerifyOptions
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.isPublic(context)) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ headers?: Record<string, unknown>; user?: Claims }>();
    const token = readBearerToken(request.headers?.['authorization']);
    const { kid } = readJoseHeader(token);
    const claims = await this.verify(token, kid);

    request.user = claims;

    return true;
  }

  private isPublic(context: ExecutionContext): boolean {
    return (
      this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]) === true
    );
  }

  private async verify(token: string, kid: string | undefined): Promise<Claims> {
    const { issuer, audience } = this.options;
    const verifyOptions: JwtVerifyOptions = {
      algorithms: [SIGNING_ALGORITHM],
      issuer,
      ...(audience === undefined ? {} : { audience }),
    };

    let claims: unknown;

    try {
      const signingKeyPem = await this.resolveSigningKeyPem(kid);
      claims = await this.jwtService.verifyAsync<Claims>(token, { ...verifyOptions, secret: signingKeyPem });
    } catch {
      throw rejected();
    }

    if (!isPlainObject(claims)) {
      throw rejected();
    }

    if (claims.typ !== ACCESS_TOKEN_TYPE || claims.iss !== issuer || typeof claims.exp !== 'number') {
      throw rejected();
    }

    return claims;
  }
}
