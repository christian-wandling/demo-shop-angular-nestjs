export function toPublicKeyPem(rawKey: string | undefined): string {
  if (!rawKey) {
    throw new Error('KEYCLOAK_REALM_PUBLIC_KEY is not set');
  }

  const body = rawKey.match(/.{1,64}/g)?.join('\n') ?? rawKey;

  return `-----BEGIN PUBLIC KEY-----\n${body}\n-----END PUBLIC KEY-----`;
}
