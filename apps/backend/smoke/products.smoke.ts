const baseUrl = process.env.SMOKE_BASE_URL ?? 'http://localhost:3000';

describe('products endpoint', () => {
  it('serves seeded products', async () => {
    const response = await fetch(`${baseUrl}/api/v1/products`);

    expect(response.status).toBe(200);

    const body = (await response.json()) as { items: unknown[] };

    expect(Array.isArray(body.items)).toBe(true);
    expect(body.items.length).toBeGreaterThan(0);
  });
});
