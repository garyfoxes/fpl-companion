const { InMemoryCache } = require('../cache/inMemoryCache');
const { RedisCacheAdapter } = require('../cache/redisCacheAdapter');
const {
  UpstreamTimeoutError,
  UpstreamUnavailableError,
  BadUpstreamResponseError
} = require('../errors/upstreamErrors');
const { mapPlayer, mapTeam, mapFixture, mapEvent, mapArray } = require('./mappers');

function extractList(payload, key) {
  if (Array.isArray(payload)) {
    return payload;
  }

  const keyCandidates = {
    players: ['players', 'elements'],
    teams: ['teams'],
    fixtures: ['fixtures'],
    events: ['events']
  }[key] || [key];

  const candidates = [payload?.data, ...keyCandidates.map((candidateKey) => payload?.[candidateKey]), payload?.results, payload?.response];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }

    if (candidate && typeof candidate === 'object') {
      for (const candidateKey of keyCandidates) {
        if (Array.isArray(candidate[candidateKey])) {
          return candidate[candidateKey];
        }
      }
    }
  }

  return null;
}

function extractObject(payload, key) {
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    if (payload[key] && typeof payload[key] === 'object') {
      return payload[key];
    }

    if (payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
      return payload.data;
    }

    return payload;
  }

  return null;
}

class FplDataSource {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl;
    const fallbackBaseUrls = Array.isArray(options.fallbackBaseUrls)
      ? options.fallbackBaseUrls
      : ['https://fantasy.premierleague.com'];
    this.baseUrls = [this.baseUrl, ...fallbackBaseUrls].filter(Boolean).filter((value, index, values) => {
      return values.indexOf(value) === index;
    });
    this.timeoutMs = options.timeoutMs;
    this.fetchImpl = options.fetchImpl || fetch;
    this.cache = options.cache || (options.redisUrl ? new RedisCacheAdapter() : new InMemoryCache());
    this.ttl = options.ttl;
    this.health = {
      lastSuccessAt: null,
      lastFailureAt: null,
      lastError: null
    };
  }

  getPathCandidates(pathname) {
    const pathFallbacks = {
      '/api/players': [
        '/players',
        '/api/v1/players',
        '/v1/players',
        '/api/bootstrap-static/',
        '/api/bootstrap-static',
        '/bootstrap-static/',
        '/bootstrap-static'
      ],
      '/api/teams': [
        '/teams',
        '/api/v1/teams',
        '/v1/teams',
        '/api/bootstrap-static/',
        '/api/bootstrap-static',
        '/bootstrap-static/',
        '/bootstrap-static'
      ],
      '/api/events': [
        '/events',
        '/api/v1/events',
        '/v1/events',
        '/api/bootstrap-static/',
        '/api/bootstrap-static',
        '/bootstrap-static/',
        '/bootstrap-static'
      ],
      '/api/fixtures': ['/fixtures', '/api/fixtures/', '/api/v1/fixtures', '/v1/fixtures']
    };

    const candidates = [pathname];
    for (const fallbackPath of pathFallbacks[pathname] || []) {
      if (!candidates.includes(fallbackPath)) {
        candidates.push(fallbackPath);
      }
    }

    return candidates;
  }

  async request(pathname) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const pathCandidates = this.getPathCandidates(pathname);
      const requestTargets = [];
      for (const baseUrl of this.baseUrls) {
        for (const pathCandidate of pathCandidates) {
          requestTargets.push({
            baseUrl,
            path: pathCandidate
          });
        }
      }
      let payload;
      let allCandidatesWereNotFound = true;
      let lastFailureMessage = null;

      for (let i = 0; i < requestTargets.length; i += 1) {
        const target = requestTargets[i];
        const response = await this.fetchImpl(`${target.baseUrl}${target.path}`, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            Accept: 'application/json'
          }
        });

        const isLastCandidate = i === requestTargets.length - 1;

        if (!response.ok) {
          lastFailureMessage = `Upstream returned ${response.status} for ${target.path}`;

          if (response.status !== 404) {
            allCandidatesWereNotFound = false;
          }

          const shouldTryFallback = response.status === 404 && !isLastCandidate;

          if (shouldTryFallback) {
            continue;
          }

          throw new UpstreamUnavailableError(lastFailureMessage, response.status);
        }

        allCandidatesWereNotFound = false;

        try {
          payload = await response.json();
          break;
        } catch {
          lastFailureMessage = `Failed to parse upstream JSON for ${target.path}`;

          if (!isLastCandidate) {
            continue;
          }

          throw new BadUpstreamResponseError(lastFailureMessage);
        }
      }

      if (payload === undefined) {
        const triedPaths = requestTargets.map((target) => `${target.baseUrl}${target.path}`);
        const message = allCandidatesWereNotFound
          ? `Upstream returned 404 for ${pathname}; tried URLs: ${triedPaths.join(', ')}`
          : `Upstream request failed for ${pathname}${lastFailureMessage ? `: ${lastFailureMessage}` : ''}`;
        const statusCode = allCandidatesWereNotFound ? 404 : 503;
        throw new UpstreamUnavailableError(message, statusCode);
      }

      this.health.lastSuccessAt = new Date().toISOString();
      this.health.lastError = null;
      return payload;
    } catch (error) {
      this.health.lastFailureAt = new Date().toISOString();
      this.health.lastError = error.message;

      if (error.name === 'AbortError') {
        throw new UpstreamTimeoutError(`Upstream timed out for ${pathname}`);
      }

      if (error.code && error.code.startsWith('UPSTREAM_')) {
        throw error;
      }

      throw new UpstreamUnavailableError(`Failed upstream request for ${pathname}: ${error.message}`);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async getCollection({ cacheKey, ttlSec, endpoint, mapper, payloadKey }) {
    const fresh = await this.cache.get(cacheKey);
    if (fresh) {
      return fresh.value;
    }

    const stale = await this.cache.get(cacheKey, { allowStale: true });

    try {
      const payload = await this.request(endpoint);
      const items = extractList(payload, payloadKey);
      if (!items) {
        throw new BadUpstreamResponseError(`Expected list payload for ${endpoint}`);
      }

      const normalized = mapArray(items, mapper, payloadKey);
      await this.cache.set(cacheKey, normalized, ttlSec);
      return normalized;
    } catch (error) {
      if (stale) {
        return stale.value;
      }
      throw error;
    }
  }

  async getItem({ cacheKey, ttlSec, endpoint, mapper, payloadKey }) {
    const fresh = await this.cache.get(cacheKey);
    if (fresh) {
      return fresh.value;
    }

    const stale = await this.cache.get(cacheKey, { allowStale: true });

    try {
      const payload = await this.request(endpoint);
      const item = extractObject(payload, payloadKey);
      if (!item) {
        throw new BadUpstreamResponseError(`Expected object payload for ${endpoint}`);
      }

      const normalized = mapper(item);
      if (!normalized) {
        throw new BadUpstreamResponseError(`Invalid object payload for ${endpoint}`);
      }

      await this.cache.set(cacheKey, normalized, ttlSec);
      return normalized;
    } catch (error) {
      if (stale) {
        return stale.value;
      }

      if (error.statusCode === 404) {
        return null;
      }

      throw error;
    }
  }

  async listPlayers() {
    return this.getCollection({
      cacheKey: 'players:list',
      ttlSec: this.ttl.players,
      endpoint: '/api/players',
      mapper: mapPlayer,
      payloadKey: 'players'
    });
  }

  async getPlayerById(id) {
    const player = await this.getItem({
      cacheKey: `players:${id}`,
      ttlSec: this.ttl.players,
      endpoint: `/api/player/${id}`,
      mapper: mapPlayer,
      payloadKey: 'player'
    });

    if (player) {
      return player;
    }

    const players = await this.listPlayers();
    return players.find((item) => item.id === id) || null;
  }

  async listTeams() {
    return this.getCollection({
      cacheKey: 'teams:list',
      ttlSec: this.ttl.teams,
      endpoint: '/api/teams',
      mapper: mapTeam,
      payloadKey: 'teams'
    });
  }

  async getTeamById(id) {
    const team = await this.getItem({
      cacheKey: `teams:${id}`,
      ttlSec: this.ttl.teams,
      endpoint: `/api/team/${id}`,
      mapper: mapTeam,
      payloadKey: 'team'
    });

    if (team) {
      return team;
    }

    const teams = await this.listTeams();
    return teams.find((item) => item.id === id) || null;
  }

  async listFixtures() {
    return this.getCollection({
      cacheKey: 'fixtures:list',
      ttlSec: this.ttl.fixtures,
      endpoint: '/api/fixtures',
      mapper: mapFixture,
      payloadKey: 'fixtures'
    });
  }

  async getFixtureById(id) {
    const fixture = await this.getItem({
      cacheKey: `fixtures:${id}`,
      ttlSec: this.ttl.fixtures,
      endpoint: `/api/fixture/${id}`,
      mapper: mapFixture,
      payloadKey: 'fixture'
    });

    if (fixture) {
      return fixture;
    }

    const fixtures = await this.listFixtures();
    return fixtures.find((item) => item.id === id) || null;
  }

  async listEvents() {
    return this.getCollection({
      cacheKey: 'events:list',
      ttlSec: this.ttl.events,
      endpoint: '/api/events',
      mapper: mapEvent,
      payloadKey: 'events'
    });
  }

  async getEventById(id) {
    const event = await this.getItem({
      cacheKey: `events:${id}`,
      ttlSec: this.ttl.events,
      endpoint: `/api/event/${id}`,
      mapper: mapEvent,
      payloadKey: 'event'
    });

    if (event) {
      return event;
    }

    const events = await this.listEvents();
    return events.find((item) => item.id === id) || null;
  }

  async readiness() {
    try {
      await this.request('/api/events');
      return {
        status: 'ok',
        upstreamReachable: true,
        lastSuccessAt: this.health.lastSuccessAt,
        lastFailureAt: this.health.lastFailureAt,
        lastError: this.health.lastError
      };
    } catch {
      return {
        status: 'degraded',
        upstreamReachable: false,
        lastSuccessAt: this.health.lastSuccessAt,
        lastFailureAt: this.health.lastFailureAt,
        lastError: this.health.lastError
      };
    }
  }
}

module.exports = {
  FplDataSource
};
