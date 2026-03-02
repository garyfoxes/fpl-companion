const { getConfig } = require('../src/config');

describe('getConfig', () => {
  it('returns defaults when env vars are missing', () => {
    const config = getConfig({});

    expect(config.port).toBe(4000);
    expect(config.upstreamBaseUrl).toBe('https://fpl-api-tau.vercel.app');
    expect(config.upstreamTimeoutMs).toBe(8000);
    expect(config.ttlPlayersSec).toBe(300);
    expect(config.ttlTeamsSec).toBe(900);
    expect(config.ttlFixturesSec).toBe(120);
    expect(config.ttlEventsSec).toBe(900);
  });

  it('parses integer env vars and custom base url', () => {
    const config = getConfig({
      PORT: '5001',
      UPSTREAM_FPL_BASE_URL: 'https://example.test',
      UPSTREAM_TIMEOUT_MS: '3000',
      CACHE_TTL_PLAYERS_SEC: '100',
      CACHE_TTL_TEAMS_SEC: '200',
      CACHE_TTL_FIXTURES_SEC: '300',
      CACHE_TTL_EVENTS_SEC: '400'
    });

    expect(config.port).toBe(5001);
    expect(config.upstreamBaseUrl).toBe('https://example.test');
    expect(config.upstreamTimeoutMs).toBe(3000);
    expect(config.ttlPlayersSec).toBe(100);
    expect(config.ttlTeamsSec).toBe(200);
    expect(config.ttlFixturesSec).toBe(300);
    expect(config.ttlEventsSec).toBe(400);
  });

  it('normalizes README docs url to upstream root host', () => {
    const config = getConfig({
      UPSTREAM_FPL_BASE_URL: 'https://fpl-api-tau.vercel.app/README'
    });

    expect(config.upstreamBaseUrl).toBe('https://fpl-api-tau.vercel.app');
  });
});
