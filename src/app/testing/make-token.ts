/** Builds an unsigned JWT-shaped string; the browser only reads its claims, so no signature is needed. */
export function makeToken(claims: Record<string, unknown>): string {
  const encode = (value: unknown): string =>
    btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(claims)}.signature`;
}

export function validClaims(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    sub: '11111111-1111-4111-8111-111111111111',
    email: 'ana@example.com',
    name: 'Ana',
    role: 'Customer',
    exp: Math.floor(Date.now() / 1000) + 1800,
    ...overrides,
  };
}