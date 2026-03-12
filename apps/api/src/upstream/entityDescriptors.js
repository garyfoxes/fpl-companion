const { mapPlayer, mapTeam, mapFixture, mapEvent } = require('./mappers');

const ENTITY_DESCRIPTORS = {
  players: {
    list: {
      cacheKey: 'players:list',
      ttlKey: 'players',
      endpoint: '/api/players',
      mapper: mapPlayer,
      payloadKey: 'players',
    },
    item: {
      cacheKeyPrefix: 'players:',
      ttlKey: 'players',
      endpoint: (id) => `/api/player/${id}`,
      mapper: mapPlayer,
      payloadKey: 'player',
    },
  },
  teams: {
    list: {
      cacheKey: 'teams:list',
      ttlKey: 'teams',
      endpoint: '/api/teams',
      mapper: mapTeam,
      payloadKey: 'teams',
    },
    item: {
      cacheKeyPrefix: 'teams:',
      ttlKey: 'teams',
      endpoint: (id) => `/api/team/${id}`,
      mapper: mapTeam,
      payloadKey: 'team',
    },
  },
  fixtures: {
    list: {
      cacheKey: 'fixtures:list',
      ttlKey: 'fixtures',
      endpoint: '/api/fixtures',
      mapper: mapFixture,
      payloadKey: 'fixtures',
    },
    item: {
      cacheKeyPrefix: 'fixtures:',
      ttlKey: 'fixtures',
      endpoint: (id) => `/api/fixture/${id}`,
      mapper: mapFixture,
      payloadKey: 'fixture',
    },
  },
  events: {
    list: {
      cacheKey: 'events:list',
      ttlKey: 'events',
      endpoint: '/api/events',
      mapper: mapEvent,
      payloadKey: 'events',
    },
    item: {
      cacheKeyPrefix: 'events:',
      ttlKey: 'events',
      endpoint: (id) => `/api/event/${id}`,
      mapper: mapEvent,
      payloadKey: 'event',
    },
  },
};

function getListConfig(entity, ttl) {
  const descriptor = ENTITY_DESCRIPTORS[entity]?.list;
  if (!descriptor) {
    throw new Error(`Unknown entity descriptor: ${entity}`);
  }

  return {
    cacheKey: descriptor.cacheKey,
    ttlSec: ttl[descriptor.ttlKey],
    endpoint: descriptor.endpoint,
    mapper: descriptor.mapper,
    payloadKey: descriptor.payloadKey,
  };
}

function getItemConfig(entity, id, ttl) {
  const descriptor = ENTITY_DESCRIPTORS[entity]?.item;
  if (!descriptor) {
    throw new Error(`Unknown entity descriptor: ${entity}`);
  }

  return {
    cacheKey: `${descriptor.cacheKeyPrefix}${id}`,
    ttlSec: ttl[descriptor.ttlKey],
    endpoint: descriptor.endpoint(id),
    mapper: descriptor.mapper,
    payloadKey: descriptor.payloadKey,
  };
}

module.exports = {
  ENTITY_DESCRIPTORS,
  getListConfig,
  getItemConfig,
};
