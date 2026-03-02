const DEFAULTS = {
  port: 4000,
  upstreamBaseUrl: 'https://fpl-api-tau.vercel.app',
  upstreamTimeoutMs: 8000,
  ttlPlayersSec: 300,
  ttlTeamsSec: 900,
  ttlFixturesSec: 120,
  ttlEventsSec: 900,
};

function parseIntOrDefault(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeBaseUrl(value) {
  if (!value) {
    return value;
  }

  try {
    const parsed = new URL(value);
    if (/^\/readme\/?$/i.test(parsed.pathname)) {
      parsed.pathname = '/';
    }

    if (parsed.pathname.length > 1 && parsed.pathname.endsWith('/')) {
      parsed.pathname = parsed.pathname.slice(0, -1);
    }

    return parsed.toString().replace(/\/$/, '');
  } catch {
    return value;
  }
}

function getConfig(env = process.env) {
  return {
    port: parseIntOrDefault(env.PORT, DEFAULTS.port),
    nodeEnv: env.NODE_ENV || 'development',
    upstreamBaseUrl: normalizeBaseUrl(env.UPSTREAM_FPL_BASE_URL || DEFAULTS.upstreamBaseUrl),
    upstreamTimeoutMs: parseIntOrDefault(env.UPSTREAM_TIMEOUT_MS, DEFAULTS.upstreamTimeoutMs),
    ttlPlayersSec: parseIntOrDefault(env.CACHE_TTL_PLAYERS_SEC, DEFAULTS.ttlPlayersSec),
    ttlTeamsSec: parseIntOrDefault(env.CACHE_TTL_TEAMS_SEC, DEFAULTS.ttlTeamsSec),
    ttlFixturesSec: parseIntOrDefault(env.CACHE_TTL_FIXTURES_SEC, DEFAULTS.ttlFixturesSec),
    ttlEventsSec: parseIntOrDefault(env.CACHE_TTL_EVENTS_SEC, DEFAULTS.ttlEventsSec),
  };
}

module.exports = {
  getConfig,
};
