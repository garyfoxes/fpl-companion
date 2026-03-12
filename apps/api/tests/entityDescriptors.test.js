const {
  ENTITY_DESCRIPTORS,
  getListConfig,
  getItemConfig,
} = require('../src/upstream/entityDescriptors');
const { mapPlayer, mapFixture } = require('../src/upstream/mappers');

describe('entityDescriptors', () => {
  const ttl = {
    players: 10,
    teams: 20,
    fixtures: 30,
    events: 40,
  };

  it('defines descriptors for all supported entities', () => {
    expect(Object.keys(ENTITY_DESCRIPTORS).sort()).toEqual([
      'events',
      'fixtures',
      'players',
      'teams',
    ]);
  });

  it('builds list config for players', () => {
    expect(getListConfig('players', ttl)).toEqual({
      cacheKey: 'players:list',
      ttlSec: 10,
      endpoint: '/api/players',
      mapper: mapPlayer,
      payloadKey: 'players',
    });
  });

  it('builds item config for fixtures', () => {
    expect(getItemConfig('fixtures', 9, ttl)).toEqual({
      cacheKey: 'fixtures:9',
      ttlSec: 30,
      endpoint: '/api/fixture/9',
      mapper: mapFixture,
      payloadKey: 'fixture',
    });
  });

  it('throws for unknown entities', () => {
    expect(() => getListConfig('unknown', ttl)).toThrow('Unknown entity descriptor: unknown');
    expect(() => getItemConfig('unknown', 1, ttl)).toThrow('Unknown entity descriptor: unknown');
  });
});
