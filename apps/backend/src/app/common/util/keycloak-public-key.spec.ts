import { toPublicKeyPem } from './keycloak-public-key';

describe('toPublicKeyPem', () => {
  it('throws when the key is not set', () => {
    expect(() => toPublicKeyPem(undefined)).toThrow('KEYCLOAK_REALM_PUBLIC_KEY is not set');
  });

  it('wraps a raw base64 key in a PEM envelope', () => {
    const pem = toPublicKeyPem('A'.repeat(130));

    expect(pem.startsWith('-----BEGIN PUBLIC KEY-----\n')).toBe(true);
    expect(pem.endsWith('\n-----END PUBLIC KEY-----')).toBe(true);
  });

  it('splits the body into 64-character lines', () => {
    const pem = toPublicKeyPem('A'.repeat(130));

    const body = pem.replace('-----BEGIN PUBLIC KEY-----\n', '').replace('\n-----END PUBLIC KEY-----', '');

    expect(body.split('\n')).toEqual(['A'.repeat(64), 'A'.repeat(64), 'A'.repeat(2)]);
  });
});
