import 'reflect-metadata';

import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { createPublicKey, createSign, generateKeyPairSync } from 'node:crypto';
import * as jwt from 'jsonwebtoken';

import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { JwtAuthGuard, KeycloakVerifyOptions, SigningKeyPemResolver } from './jwt-auth.guard';

type Claims = Record<string, unknown>;

type MintOptions = {
  signingKey?: string;
  algorithm?: jwt.Algorithm;
  kid?: string | null;
  header?: Record<string, unknown>;
  omitIssuedAt?: boolean;
};

type MutableRequest = {
  method: string;
  url: string;
  headers: Record<string, unknown>;
  query?: Record<string, unknown>;
  cookies?: Record<string, unknown>;
  user?: unknown;
};

type ContextTarget = {
  handler?: (...args: unknown[]) => unknown;
  controller?: new () => unknown;
};

const ISSUER = 'http://localhost:8080/realms/demo_shop';
const AUDIENCE = 'demo-shop-api';
const TRUSTED_KID = 'realm-signing-key-2026';
const ROGUE_KID = 'rogue-signing-key';
const NOW = new Date('2026-01-15T12:00:00.000Z');
const NOW_SECONDS = Math.floor(NOW.getTime() / 1000);

const generateRsaKeyPair = () =>
  generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

const realmKeyPair = generateRsaKeyPair();
const rogueKeyPair = generateRsaKeyPair();

const rogueKeyAsJwk = createPublicKey(rogueKeyPair.publicKey).export({ format: 'jwk' });

const encodeSegment = (value: unknown): string => Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');

const encodeRaw = (value: string): string => Buffer.from(value, 'utf8').toString('base64url');

const segmentsOf = (token: string): [string, string, string] => {
  const [header, payload, signature] = token.split('.');
  return [header, payload, signature];
};

const mint = (claims: Claims, options: MintOptions = {}): string => {
  const algorithm = options.algorithm ?? 'RS256';
  const kid = options.kid === null ? {} : { kid: options.kid ?? TRUSTED_KID };
  const header = { alg: algorithm, ...kid, ...options.header } as unknown as jwt.JwtHeader;

  return jwt.sign(claims, options.signingKey ?? realmKeyPair.privateKey, {
    algorithm,
    noTimestamp: options.omitIssuedAt === true,
    header,
  });
};

const signRs256 = (header: Record<string, unknown>, claims: Claims, privateKeyPem: string): string => {
  const signingInput = `${encodeSegment(header)}.${encodeSegment(claims)}`;
  const signature = createSign('RSA-SHA256').update(signingInput).sign(privateKeyPem).toString('base64url');
  return `${signingInput}.${signature}`;
};

const accessTokenClaims = (overrides: Claims = {}): Claims => ({
  exp: NOW_SECONDS + 300,
  iat: NOW_SECONDS - 30,
  auth_time: NOW_SECONDS - 60,
  jti: 'b1d1a0f4-0000-4000-8000-000000000001',
  iss: ISSUER,
  aud: AUDIENCE,
  sub: '9f6b2c10-0000-4000-8000-0000000000ab',
  typ: 'Bearer',
  azp: AUDIENCE,
  session_state: '5a1f0c22-0000-4000-8000-0000000000cd',
  acr: '1',
  scope: 'openid email profile',
  realm_access: { roles: ['user'] },
  resource_access: { [AUDIENCE]: { roles: ['customer'] } },
  email_verified: true,
  preferred_username: 'shopper',
  email: 'shopper@example.test',
  ...overrides,
});

const mintAccessToken = (overrides: Claims = {}, options: MintOptions = {}): string =>
  mint(accessTokenClaims(overrides), options);

const withoutClaim = (claims: Claims, name: string): Claims => {
  const remaining = { ...claims };
  delete remaining[name];
  return remaining;
};

const withHeader = (token: string, header: Record<string, unknown>): string => {
  const [, payload, signature] = segmentsOf(token);
  return `${encodeSegment(header)}.${payload}.${signature}`;
};

const withClaims = (token: string, claims: Claims): string => {
  const [header, , signature] = segmentsOf(token);
  return `${header}.${encodeSegment(claims)}.${signature}`;
};

const withRawPayload = (token: string, raw: string): string => {
  const [header, , signature] = segmentsOf(token);
  return `${header}.${encodeRaw(raw)}.${signature}`;
};

const withSignature = (token: string, signature: string): string => {
  const [header, payload] = segmentsOf(token);
  return `${header}.${payload}.${signature}`;
};

const unsigned = (claims: Claims, header: Record<string, unknown>): string =>
  `${encodeSegment(header)}.${encodeSegment(claims)}.`;

const validAccessToken = mintAccessToken();

class ProtectedController {}
class PublicController {}

const protectedHandler = function findOrders() {
  return undefined;
};

const publicHandler = function findProducts() {
  return undefined;
};

const publicControllerHandler = function findBanners() {
  return undefined;
};

Reflect.defineMetadata(IS_PUBLIC_KEY, true, publicHandler);
Reflect.defineMetadata(IS_PUBLIC_KEY, true, PublicController);

const responseStub = { statusCode: 200 };
const nextStub = () => undefined;

const requestWith = (headers: Record<string, unknown> = {}): MutableRequest => ({
  method: 'GET',
  url: '/api/v1/orders',
  headers,
});

const requestBearing = (token: string): MutableRequest => requestWith({ authorization: `Bearer ${token}` });

const createContext = (request: MutableRequest, target: ContextTarget = {}): ExecutionContext => {
  const handler = target.handler ?? protectedHandler;
  const controller = target.controller ?? ProtectedController;
  const args = [request, responseStub, nextStub];

  return {
    getType: () => 'http',
    getClass: () => controller,
    getHandler: () => handler,
    getArgs: () => args,
    getArgByIndex: (index: number) => args[index],
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => responseStub,
      getNext: () => nextStub,
    }),
    switchToRpc: () => {
      throw new Error('the guard must not treat an HTTP request as an RPC context');
    },
    switchToWs: () => {
      throw new Error('the guard must not treat an HTTP request as a WebSocket context');
    },
  } as unknown as ExecutionContext;
};

describe('JwtAuthGuard', () => {
  let resolveSigningKeyPem: jest.MockedFunction<SigningKeyPemResolver>;
  let fetchSpy: jest.SpyInstance;
  let guard: JwtAuthGuard;

  const createGuard = (options: KeycloakVerifyOptions = { issuer: ISSUER, audience: AUDIENCE }): JwtAuthGuard =>
    new JwtAuthGuard(new Reflector(), resolveSigningKeyPem, options);

  const expectUnauthorized = async (context: ExecutionContext, subject: JwtAuthGuard = guard): Promise<void> => {
    await expect(Promise.resolve().then(() => subject.canActivate(context))).rejects.toBeInstanceOf(
      UnauthorizedException
    );
  };

  const expectAdmitted = async (context: ExecutionContext, subject: JwtAuthGuard = guard): Promise<void> => {
    await expect(Promise.resolve().then(() => subject.canActivate(context))).resolves.toBe(true);
  };

  beforeEach(() => {
    jest.useFakeTimers({ now: NOW, doNotFake: ['nextTick', 'queueMicrotask', 'setImmediate'] });

    resolveSigningKeyPem = jest.fn(async (kid: string | undefined) => {
      if (kid === TRUSTED_KID) {
        return realmKeyPair.publicKey;
      }
      throw new Error(`no signing key published for kid ${String(kid)}`);
    }) as jest.MockedFunction<SigningKeyPemResolver>;

    fetchSpy = jest
      .spyOn(globalThis, 'fetch')
      .mockRejectedValue(new Error('this suite validates offline; no request may leave the process'));

    guard = createGuard();
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('a valid Keycloak access token', () => {
    it('admits the request', async () => {
      await expectAdmitted(createContext(requestBearing(validAccessToken)));
    });

    it('assigns the verified claims to request.user', async () => {
      const request = requestBearing(validAccessToken);

      await guard.canActivate(createContext(request));

      expect(request.user).toMatchObject({
        sub: '9f6b2c10-0000-4000-8000-0000000000ab',
        preferred_username: 'shopper',
        typ: 'Bearer',
        iss: ISSUER,
      });
    });

    it('resolves the signing key named by the token header kid', async () => {
      await expectAdmitted(createContext(requestBearing(validAccessToken)));

      expect(resolveSigningKeyPem).toHaveBeenCalledWith(TRUSTED_KID);
    });

    it('resolves the signing key exactly once per request', async () => {
      await expectAdmitted(createContext(requestBearing(validAccessToken)));

      expect(resolveSigningKeyPem).toHaveBeenCalledTimes(1);
    });

    it('validates offline, without any outbound request', async () => {
      await expectAdmitted(createContext(requestBearing(validAccessToken)));

      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('admits a token whose aud array contains the configured audience', async () => {
      const token = mintAccessToken({ aud: ['account', AUDIENCE, 'broker'] });

      await expectAdmitted(createContext(requestBearing(token)));
    });

    it('admits a token whose nbf has already passed', async () => {
      const token = mintAccessToken({ nbf: NOW_SECONDS - 10 });

      await expectAdmitted(createContext(requestBearing(token)));
    });

    it('admits a token carrying no roles, because role checks belong to RolesGuard', async () => {
      const token = mintAccessToken({ realm_access: { roles: [] }, resource_access: {} });

      await expectAdmitted(createContext(requestBearing(token)));
    });
  });

  describe('Authorization header parsing', () => {
    it.each<[string, Record<string, unknown>]>([
      ['no Authorization header at all', {}],
      ['an empty Authorization header', { authorization: '' }],
      ['a whitespace-only Authorization header', { authorization: '   ' }],
      ['an Authorization header of only the scheme name', { authorization: 'Bearer' }],
      ['an Authorization header of the scheme followed by whitespace', { authorization: 'Bearer   ' }],
      ['a null Authorization header value', { authorization: null }],
      ['a numeric Authorization header value', { authorization: 42 }],
    ])('rejects a request with %s', async (_label, headers) => {
      await expectUnauthorized(createContext(requestWith(headers)));
    });

    it.each<[string, string]>([
      ['the Basic scheme', `Basic ${validAccessToken}`],
      ['the Negotiate scheme', `Negotiate ${validAccessToken}`],
      ['the Token scheme', `Token ${validAccessToken}`],
      ['a bare token with no scheme', validAccessToken],
      ['the scheme name repeated before the token', `Bearer Bearer ${validAccessToken}`],
      ['trailing junk after the token', `Bearer ${validAccessToken} extra`],
      ['a tab separating the scheme from the token', `Bearer\t${validAccessToken}`],
      ['a newline separating the scheme from the token', `Bearer\n${validAccessToken}`],
      ['a null byte appended to the token', `Bearer ${validAccessToken}\u0000`],
    ])('rejects an Authorization header using %s', async (_label, authorization) => {
      await expectUnauthorized(createContext(requestWith({ authorization })));
    });

    it('rejects a request carrying two credentials in one Authorization header', async () => {
      const rogueToken = mintAccessToken({ sub: 'attacker' }, { signingKey: rogueKeyPair.privateKey, kid: ROGUE_KID });
      const authorization = `Bearer ${validAccessToken}, Bearer ${rogueToken}`;

      await expectUnauthorized(createContext(requestWith({ authorization })));
    });

    it('rejects a request whose Authorization header arrived more than once', async () => {
      const authorization = [`Bearer ${validAccessToken}`, `Bearer ${validAccessToken}`];

      await expectUnauthorized(createContext(requestWith({ authorization })));
    });

    it.each<[string]>([['bearer'], ['BEARER'], ['BeArEr']])(
      'treats the scheme name %s as the Bearer scheme',
      async scheme => {
        await expectAdmitted(createContext(requestWith({ authorization: `${scheme} ${validAccessToken}` })));
      }
    );

    it('does not resolve a signing key when no bearer token is present', async () => {
      await expectUnauthorized(createContext(requestWith({})));

      expect(resolveSigningKeyPem).not.toHaveBeenCalled();
    });

    it('rejects a token presented in the query string instead of the header', async () => {
      const request = requestWith({});
      request.query = { access_token: validAccessToken };

      await expectUnauthorized(createContext(request));
    });

    it('rejects a token presented in a cookie instead of the header', async () => {
      const request = requestWith({});
      request.cookies = { access_token: validAccessToken };

      await expectUnauthorized(createContext(request));
    });
  });

  describe('token structure', () => {
    it.each<[string, string]>([
      ['a single segment', segmentsOf(validAccessToken)[0]],
      ['two segments', segmentsOf(validAccessToken).slice(0, 2).join('.')],
      ['four segments', `${validAccessToken}.extra`],
      ['five segments, as a JWE would have', `${validAccessToken}.encryptedKey.tag`],
      ['segments that are not base64url', '!!!.@@@.###'],
      ['an empty header segment', `.${segmentsOf(validAccessToken)[1]}.${segmentsOf(validAccessToken)[2]}`],
      ['an empty payload segment', `${segmentsOf(validAccessToken)[0]}..${segmentsOf(validAccessToken)[2]}`],
    ])('rejects a token with %s', async (_label, token) => {
      await expectUnauthorized(createContext(requestBearing(token)));
    });

    it.each<[string, string]>([
      ['not JSON at all', 'this is not json'],
      ['a JSON array', '["Bearer"]'],
      ['a JSON string', '"Bearer"'],
      ['a JSON number', '7'],
      ['JSON null', 'null'],
    ])('rejects a token whose payload is %s', async (_label, raw) => {
      await expectUnauthorized(createContext(requestBearing(withRawPayload(validAccessToken, raw))));
    });

    it('rejects a token whose header segment is not JSON', async () => {
      const [, payload, signature] = segmentsOf(validAccessToken);
      const token = `${encodeRaw('not json')}.${payload}.${signature}`;

      await expectUnauthorized(createContext(requestBearing(token)));
    });

    it('rejects a JWE-shaped token whose header asks for key encryption', async () => {
      const header = encodeSegment({ alg: 'RSA-OAEP', enc: 'A256GCM', kid: TRUSTED_KID });
      const token = `${header}.encryptedKey.iv.ciphertext.tag`;

      await expectUnauthorized(createContext(requestBearing(token)));
    });
  });

  describe('algorithm confusion', () => {
    it('rejects an unsigned token presented with alg none', async () => {
      const token = unsigned(accessTokenClaims(), { alg: 'none', kid: TRUSTED_KID });

      await expectUnauthorized(createContext(requestBearing(token)));
    });

    it('rejects an alg none token that still carries a signature segment', async () => {
      const token = withHeader(validAccessToken, { alg: 'none', kid: TRUSTED_KID });

      await expectUnauthorized(createContext(requestBearing(token)));
    });

    it.each<[string]>([['None'], ['NONE'], ['nOnE']])('rejects alg %s whatever its casing', async alg => {
      const token = unsigned(accessTokenClaims(), { alg, kid: TRUSTED_KID });

      await expectUnauthorized(createContext(requestBearing(token)));
    });

    it('rejects a token HMAC-signed with the realm public key as the shared key', async () => {
      const token = mint(accessTokenClaims(), {
        algorithm: 'HS256',
        signingKey: realmKeyPair.publicKey,
      });

      await expectUnauthorized(createContext(requestBearing(token)));
    });

    it('rejects a token HMAC-signed with the realm public key stripped of its PEM armour', async () => {
      const stripped = realmKeyPair.publicKey.replace(/-----(BEGIN|END) PUBLIC KEY-----/g, '').replace(/\s/g, '');
      const token = mint(accessTokenClaims(), { algorithm: 'HS256', signingKey: stripped });

      await expectUnauthorized(createContext(requestBearing(token)));
    });

    it.each<[jwt.Algorithm]>([['HS256'], ['HS384'], ['HS512']])(
      'rejects a token signed with the symmetric algorithm %s',
      async algorithm => {
        const token = mint(accessTokenClaims(), { algorithm, signingKey: 'a-shared-key-the-realm-never-issued' });

        await expectUnauthorized(createContext(requestBearing(token)));
      }
    );

    it('rejects a token whose header omits alg', async () => {
      const token = withHeader(validAccessToken, { kid: TRUSTED_KID, typ: 'JWT' });

      await expectUnauthorized(createContext(requestBearing(token)));
    });

    it.each<[string]>([['PS256'], ['ES256'], ['RS512'], ['EdDSA'], ['RS256 ']])(
      'rejects a validly signed token whose header alg was rewritten to %s',
      async alg => {
        const token = withHeader(validAccessToken, { alg, kid: TRUSTED_KID });

        await expectUnauthorized(createContext(requestBearing(token)));
      }
    );

    it('rejects a token whose header alg is an array', async () => {
      const token = withHeader(validAccessToken, { alg: ['RS256', 'none'], kid: TRUSTED_KID });

      await expectUnauthorized(createContext(requestBearing(token)));
    });
  });

  describe('signature and key identity', () => {
    it('rejects a token signed by a key the realm does not publish', async () => {
      const token = mintAccessToken({}, { signingKey: rogueKeyPair.privateKey, kid: ROGUE_KID });

      await expectUnauthorized(createContext(requestBearing(token)));
    });

    it('rejects a token signed by a rogue key but presenting the trusted kid', async () => {
      const token = mintAccessToken({}, { signingKey: rogueKeyPair.privateKey, kid: TRUSTED_KID });

      await expectUnauthorized(createContext(requestBearing(token)));
    });

    it('rejects a token whose signature segment is truncated', async () => {
      const [, , signature] = segmentsOf(validAccessToken);

      await expectUnauthorized(createContext(requestBearing(withSignature(validAccessToken, signature.slice(0, -8)))));
    });

    it('rejects a token whose signature segment is empty', async () => {
      await expectUnauthorized(createContext(requestBearing(withSignature(validAccessToken, ''))));
    });

    it('rejects a token wearing the signature of a different token', async () => {
      const other = mintAccessToken({ sub: 'someone-else', jti: 'a-different-token' });
      const [, , otherSignature] = segmentsOf(other);

      await expectUnauthorized(createContext(requestBearing(withSignature(validAccessToken, otherSignature))));
    });

    it('rejects a token whose claims were rewritten after signing', async () => {
      const token = withClaims(validAccessToken, accessTokenClaims({ sub: 'administrator' }));

      await expectUnauthorized(createContext(requestBearing(token)));
    });

    it('rejects a token whose header kid was rewritten after signing', async () => {
      const token = withHeader(validAccessToken, { alg: 'RS256', kid: ROGUE_KID });

      await expectUnauthorized(createContext(requestBearing(token)));
    });

    it('rejects a token carrying no kid when the resolver publishes no default key', async () => {
      const token = mintAccessToken({}, { kid: null });

      await expectUnauthorized(createContext(requestBearing(token)));
    });

    it('passes an attacker-shaped kid to the resolver verbatim and rejects the token', async () => {
      const traversalKid = '../../realm-signing-key-2026';
      const token = mintAccessToken({}, { signingKey: rogueKeyPair.privateKey, kid: traversalKid });

      await expectUnauthorized(createContext(requestBearing(token)));
      expect(resolveSigningKeyPem).toHaveBeenCalledWith(traversalKid);
    });

    it('surfaces a signing key resolver failure as UnauthorizedException, not as the raw error', async () => {
      resolveSigningKeyPem.mockRejectedValue(new Error('JWKS endpoint unreachable'));

      await expectUnauthorized(createContext(requestBearing(validAccessToken)));
    });

    it('rejects the request when the resolver returns an unusable key', async () => {
      resolveSigningKeyPem.mockResolvedValue('not a pem');

      await expectUnauthorized(createContext(requestBearing(validAccessToken)));
    });

    it.each<[string, Record<string, unknown>]>([
      ['jku', { jku: 'https://attacker.test/.well-known/jwks.json' }],
      ['x5u', { x5u: 'https://attacker.test/chain.pem' }],
      ['jwk', { jwk: rogueKeyAsJwk }],
      ['x5c', { x5c: ['MIIB-not-a-real-certificate'] }],
    ])('ignores the %s header on a token signed by an untrusted key', async (_label, header) => {
      const token = mintAccessToken({}, { signingKey: rogueKeyPair.privateKey, kid: ROGUE_KID, header });

      await expectUnauthorized(createContext(requestBearing(token)));
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  describe('issuer', () => {
    it.each<[string, string]>([
      ['a different Keycloak host', 'http://keycloak.attacker.test/realms/demo_shop'],
      ['a different realm on the same host', 'http://localhost:8080/realms/master'],
      ['an issuer that merely starts with the expected one', `${ISSUER}_evil`],
      ['an issuer that merely contains the expected one', `https://attacker.test/?next=${ISSUER}`],
      ['an issuer with the expected one as a path prefix', `${ISSUER}/../master`],
      ['an issuer differing only by a trailing slash', `${ISSUER}/`],
      ['an issuer differing only by case', 'http://localhost:8080/realms/DEMO_SHOP'],
      ['an issuer differing only by scheme', 'https://localhost:8080/realms/demo_shop'],
      ['an issuer differing only by port', 'http://localhost:8081/realms/demo_shop'],
    ])('rejects a token whose iss is %s', async (_label, iss) => {
      const token = mintAccessToken({ iss });

      await expectUnauthorized(createContext(requestBearing(token)));
    });

    it('rejects a token carrying no iss claim', async () => {
      const token = mint(withoutClaim(accessTokenClaims(), 'iss'));

      await expectUnauthorized(createContext(requestBearing(token)));
    });

    it('rejects a token whose iss is an array containing the expected issuer', async () => {
      const token = mintAccessToken({ iss: [ISSUER] });

      await expectUnauthorized(createContext(requestBearing(token)));
    });

    it('rejects a token whose iss is not a string', async () => {
      const token = mintAccessToken({ iss: 8080 });

      await expectUnauthorized(createContext(requestBearing(token)));
    });
  });

  describe('audience', () => {
    it('rejects a token issued for another client', async () => {
      const token = mintAccessToken({ aud: 'demo-shop-admin', azp: 'demo-shop-admin' });

      await expectUnauthorized(createContext(requestBearing(token)));
    });

    it('rejects a Keycloak token carrying only the default account audience', async () => {
      const token = mintAccessToken({ aud: 'account' });

      await expectUnauthorized(createContext(requestBearing(token)));
    });

    it('rejects a token carrying no aud claim', async () => {
      const token = mint(withoutClaim(accessTokenClaims(), 'aud'));

      await expectUnauthorized(createContext(requestBearing(token)));
    });

    it('rejects a token whose aud array omits the configured audience', async () => {
      const token = mintAccessToken({ aud: ['account', 'demo-shop-admin'] });

      await expectUnauthorized(createContext(requestBearing(token)));
    });

    it('rejects a token whose azp matches the configured audience but whose aud does not', async () => {
      const token = mintAccessToken({ aud: 'account', azp: AUDIENCE });

      await expectUnauthorized(createContext(requestBearing(token)));
    });

    it.each<[string, unknown]>([
      ['a number', 1234],
      ['an object', { client: AUDIENCE }],
      ['an array of objects', [{ client: AUDIENCE }]],
      ['an audience that merely starts with the expected one', `${AUDIENCE}-staging`],
    ])('rejects a token whose aud is %s', async (_label, aud) => {
      const token = mintAccessToken({ aud });

      await expectUnauthorized(createContext(requestBearing(token)));
    });

    it('does not enforce audience when none is configured', async () => {
      const token = mintAccessToken({ aud: 'account', azp: 'account' });

      await expectAdmitted(createContext(requestBearing(token)), createGuard({ issuer: ISSUER }));
    });

    it('still enforces the issuer when no audience is configured', async () => {
      const token = mintAccessToken({ iss: 'http://keycloak.attacker.test/realms/demo_shop' });

      await expectUnauthorized(createContext(requestBearing(token)), createGuard({ issuer: ISSUER }));
    });

    it('still enforces the signature when no audience is configured', async () => {
      const token = mintAccessToken({}, { signingKey: rogueKeyPair.privateKey, kid: TRUSTED_KID });

      await expectUnauthorized(createContext(requestBearing(token)), createGuard({ issuer: ISSUER }));
    });
  });

  describe('token type confusion', () => {
    it('rejects a correctly signed Keycloak ID token', async () => {
      const token = mintAccessToken({
        typ: 'ID',
        nonce: 'd7f0a1b2',
        at_hash: 'v2rP1Q5rG0m1a9Zk',
        sid: '5a1f0c22-0000-4000-8000-0000000000cd',
      });

      await expectUnauthorized(createContext(requestBearing(token)));
    });

    it('rejects a correctly signed refresh token', async () => {
      const token = mintAccessToken({ typ: 'Refresh', scope: 'openid' });

      await expectUnauthorized(createContext(requestBearing(token)));
    });

    it.each<[string]>([['Offline'], ['Logout'], ['Serialized-ID'], ['JWT'], ['bearer']])(
      'rejects a correctly signed token whose typ claim is %s',
      async typ => {
        const token = mintAccessToken({ typ });

        await expectUnauthorized(createContext(requestBearing(token)));
      }
    );

    it('rejects a correctly signed token carrying no typ claim', async () => {
      const token = mint(withoutClaim(accessTokenClaims(), 'typ'));

      await expectUnauthorized(createContext(requestBearing(token)));
    });

    it('rejects an ID token that claims to be a Bearer token in its JOSE header only', async () => {
      const token = mint(accessTokenClaims({ typ: 'ID' }), { header: { typ: 'Bearer' } });

      await expectUnauthorized(createContext(requestBearing(token)));
    });
  });

  describe('token lifetime', () => {
    it('rejects a token that expired an hour ago', async () => {
      const token = mintAccessToken({ exp: NOW_SECONDS - 3600, iat: NOW_SECONDS - 7200 });

      await expectUnauthorized(createContext(requestBearing(token)));
    });

    it('rejects a token that expired one second ago', async () => {
      const token = mintAccessToken({ exp: NOW_SECONDS - 1 });

      await expectUnauthorized(createContext(requestBearing(token)));
    });

    it('rejects a token whose exp is the current second', async () => {
      const token = mintAccessToken({ exp: NOW_SECONDS });

      await expectUnauthorized(createContext(requestBearing(token)));
    });

    it('rejects a token carrying no exp claim', async () => {
      const token = mint(withoutClaim(accessTokenClaims(), 'exp'));

      await expectUnauthorized(createContext(requestBearing(token)));
    });

    it.each<[string, unknown]>([
      ['a string', '9999999999'],
      ['null', null],
      ['an object', { seconds: 9999999999 }],
    ])('rejects a correctly signed token whose exp is %s', async (_label, exp) => {
      const token = signRs256({ alg: 'RS256', kid: TRUSTED_KID }, accessTokenClaims({ exp }), realmKeyPair.privateKey);

      await expectUnauthorized(createContext(requestBearing(token)));
    });

    it('rejects a token whose nbf is in the future', async () => {
      const token = mintAccessToken({ nbf: NOW_SECONDS + 120 });

      await expectUnauthorized(createContext(requestBearing(token)));
    });

    it('rejects an expired token even when its signature and claims are otherwise perfect', async () => {
      const token = mintAccessToken({ exp: NOW_SECONDS - 5, iat: NOW_SECONDS - 305 });
      const request = requestBearing(token);

      await expectUnauthorized(createContext(request));
      expect(request.user).toBeUndefined();
    });
  });

  describe('the @Public() bypass', () => {
    const publicTarget: ContextTarget = { handler: publicHandler };

    it('admits a request carrying no Authorization header', async () => {
      await expectAdmitted(createContext(requestWith({}), publicTarget));
    });

    it('admits a request carrying a malformed Authorization header', async () => {
      await expectAdmitted(createContext(requestWith({ authorization: 'Bearer not.a.token' }), publicTarget));
    });

    it('admits a request carrying an expired token', async () => {
      const token = mintAccessToken({ exp: NOW_SECONDS - 3600 });

      await expectAdmitted(createContext(requestBearing(token), publicTarget));
    });

    it('admits a request carrying a token signed by an untrusted key', async () => {
      const token = mintAccessToken({}, { signingKey: rogueKeyPair.privateKey, kid: ROGUE_KID });

      await expectAdmitted(createContext(requestBearing(token), publicTarget));
    });

    it('admits a request on a handler whose controller is marked public', async () => {
      await expectAdmitted(
        createContext(requestWith({}), { handler: publicControllerHandler, controller: PublicController })
      );
    });

    it('does not resolve a signing key', async () => {
      await expectAdmitted(createContext(requestBearing(validAccessToken), publicTarget));

      expect(resolveSigningKeyPem).not.toHaveBeenCalled();
    });

    it('does not assign request.user from an unverified token', async () => {
      const token = mintAccessToken({ sub: 'administrator' }, { signingKey: rogueKeyPair.privateKey, kid: ROGUE_KID });
      const request = requestBearing(token);

      await expectAdmitted(createContext(request, publicTarget));

      expect(request.user).toBeUndefined();
    });

    it('still rejects an unauthenticated request on a handler that is not public', async () => {
      await expectUnauthorized(createContext(requestWith({})));
    });
  });

  describe('rejection behaviour', () => {
    it('leaves request.user unset when the token is rejected', async () => {
      const token = mintAccessToken({ sub: 'administrator' }, { signingKey: rogueKeyPair.privateKey, kid: ROGUE_KID });
      const request = requestBearing(token);

      await expectUnauthorized(createContext(request));

      expect(request.user).toBeUndefined();
    });

    it('does not reveal the verification failure in the exception message', async () => {
      const token = mintAccessToken({}, { signingKey: rogueKeyPair.privateKey, kid: TRUSTED_KID });

      const rejection = await guard
        .canActivate(createContext(requestBearing(token)))
        .then(() => new Error('the guard admitted a forged token'))
        .catch((error: unknown) => error);

      expect(rejection).toBeInstanceOf(UnauthorizedException);
      expect(String((rejection as Error).message)).not.toMatch(/signature|kid|pem|private key/i);
    });

    it('makes no outbound request while rejecting a forged token', async () => {
      const token = mintAccessToken({}, { signingKey: rogueKeyPair.privateKey, kid: ROGUE_KID });

      await expectUnauthorized(createContext(requestBearing(token)));

      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });
});
