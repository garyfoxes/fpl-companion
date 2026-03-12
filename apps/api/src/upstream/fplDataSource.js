const { InMemoryCache } = require('../cache/inMemoryCache');
const { RedisCacheAdapter } = require('../cache/redisCacheAdapter');
const { BadUpstreamResponseError } = require('../errors/upstreamErrors');
const { mapArray } = require('./mappers');
const { requestUpstreamJson, getPathCandidates } = require('./upstreamTransport');
const { extractList, extractObject } = require('./payloadExtractors');
const { getListConfig, getItemConfig } = require('./entityDescriptors');
const {
  createHealthState,
  markHealthSuccess,
  markHealthFailure,
  createReadinessPayload,
} = require('./healthState');

class FplDataSource {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl;
    const fallbackBaseUrls = Array.isArray(options.fallbackBaseUrls)
      ? options.fallbackBaseUrls
      : ['https://fantasy.premierleague.com'];
    this.baseUrls = [this.baseUrl, ...fallbackBaseUrls]
      .filter(Boolean)
      .filter((value, index, values) => {
        return values.indexOf(value) === index;
      });
    this.timeoutMs = options.timeoutMs;
    this.fetchImpl = options.fetchImpl || fetch;
    this.cache =
      options.cache || (options.redisUrl ? new RedisCacheAdapter() : new InMemoryCache());
    this.ttl = options.ttl;
    this.health = createHealthState();
  }

  getPathCandidates(pathname) {
    return getPathCandidates(pathname);
  }

  async request(pathname) {
    try {
      const payload = await requestUpstreamJson({
        fetchImpl: this.fetchImpl,
        baseUrls: this.baseUrls,
        timeoutMs: this.timeoutMs,
        pathname,
      });
      markHealthSuccess(this.health);
      return payload;
    } catch (error) {
      markHealthFailure(this.health, error);
      throw error;
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
    return this.getCollection(getListConfig('players', this.ttl));
  }

  async getPlayerById(id) {
    const player = await this.getItem(getItemConfig('players', id, this.ttl));

    if (player) {
      return player;
    }

    const players = await this.listPlayers();
    return players.find((item) => item.id === id) || null;
  }

  async listTeams() {
    return this.getCollection(getListConfig('teams', this.ttl));
  }

  async getTeamById(id) {
    const team = await this.getItem(getItemConfig('teams', id, this.ttl));

    if (team) {
      return team;
    }

    const teams = await this.listTeams();
    return teams.find((item) => item.id === id) || null;
  }

  async listFixtures() {
    return this.getCollection(getListConfig('fixtures', this.ttl));
  }

  async getFixtureById(id) {
    const fixture = await this.getItem(getItemConfig('fixtures', id, this.ttl));

    if (fixture) {
      return fixture;
    }

    const fixtures = await this.listFixtures();
    return fixtures.find((item) => item.id === id) || null;
  }

  async listEvents() {
    return this.getCollection(getListConfig('events', this.ttl));
  }

  async getEventById(id) {
    const event = await this.getItem(getItemConfig('events', id, this.ttl));

    if (event) {
      return event;
    }

    const events = await this.listEvents();
    return events.find((item) => item.id === id) || null;
  }

  async readiness() {
    try {
      await this.request('/api/events');
      return createReadinessPayload(this.health, true);
    } catch {
      return createReadinessPayload(this.health, false);
    }
  }
}

module.exports = {
  FplDataSource,
};
