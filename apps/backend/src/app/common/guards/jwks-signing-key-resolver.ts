import { JwksClient } from 'jwks-rsa';

import { SigningKeyPemResolver } from './jwt-auth.guard';

export const createJwksSigningKeyResolver = (jwksUri: string): SigningKeyPemResolver => {
  const client = new JwksClient({
    jwksUri,
    cache: true,
    cacheMaxEntries: 5,
    cacheMaxAge: 10 * 60 * 1000,
    rateLimit: true,
    jwksRequestsPerMinute: 10,
  });

  return async (kid: string | undefined): Promise<string> => (await client.getSigningKey(kid)).getPublicKey();
};
