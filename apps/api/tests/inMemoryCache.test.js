const { InMemoryCache } = require('../src/cache/inMemoryCache');

describe('InMemoryCache', () => {
  it('stores and returns non-expired values', async () => {
    let now = 1000;
    const cache = new InMemoryCache(() => now);

    await cache.set('key', { ok: true }, 10);

    const record = await cache.get('key');
    expect(record.value).toEqual({ ok: true });
    expect(record.isStale).toBe(false);
  });

  it('does not return expired values by default', async () => {
    let now = 1000;
    const cache = new InMemoryCache(() => now);

    await cache.set('key', { ok: true }, 1);
    now += 1001;

    const record = await cache.get('key');
    expect(record).toBeNull();
  });

  it('returns stale values when allowStale is true', async () => {
    let now = 1000;
    const cache = new InMemoryCache(() => now);

    await cache.set('key', { ok: true }, 1);
    now += 1001;

    const record = await cache.get('key', { allowStale: true });
    expect(record.value).toEqual({ ok: true });
    expect(record.isStale).toBe(true);
  });
});
