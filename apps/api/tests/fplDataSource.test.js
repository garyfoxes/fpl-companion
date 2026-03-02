const { FplDataSource } = require('../src/upstream/fplDataSource');
const { InMemoryCache } = require('../src/cache/inMemoryCache');
const {
  BadUpstreamResponseError,
  UpstreamTimeoutError,
  UpstreamUnavailableError
} = require('../src/errors/upstreamErrors');

function createMockResponse(payload, ok = true, status = 200) {
  return {
    ok,
    status,
    json: jest.fn().mockResolvedValue(payload)
  };
}

function createInvalidJsonResponse(status = 200) {
  return {
    ok: true,
    status,
    json: jest.fn().mockRejectedValue(new Error('Unexpected token < in JSON'))
  };
}

function createDataSource(fetchImpl, cache = new InMemoryCache(), options = {}) {
  return new FplDataSource({
    baseUrl: 'https://example.test',
    timeoutMs: 500,
    ttl: { players: 60, teams: 60, fixtures: 60, events: 60 },
    fetchImpl,
    cache,
    fallbackBaseUrls: options.fallbackBaseUrls || []
  });
}

describe('FplDataSource', () => {
  it('maps list players from upstream and caches results', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(
      createMockResponse({
        players: [{ id: 1, first_name: 'Erling', second_name: 'Haaland', web_name: 'Haaland', element_type: 4 }]
      })
    );

    const dataSource = createDataSource(fetchImpl);

    const first = await dataSource.listPlayers();
    const second = await dataSource.listPlayers();

    expect(first[0]).toMatchObject({ id: 1, webName: 'Haaland', position: 'FWD' });
    expect(second).toEqual(first);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('maps teams, fixtures, and events list endpoints', async () => {
    const fetchImpl = jest.fn((url) => {
      if (url.endsWith('/api/teams')) {
        return Promise.resolve(createMockResponse({ teams: [{ id: 1, name: 'Arsenal', short_name: 'ARS' }] }));
      }

      if (url.endsWith('/api/fixtures')) {
        return Promise.resolve(
          createMockResponse({ fixtures: [{ id: 99, event: 5, team_h: 1, team_a: 2, finished: false }] })
        );
      }

      return Promise.resolve(createMockResponse({ events: [{ id: 10, name: 'Gameweek 10', is_current: true }] }));
    });

    const dataSource = createDataSource(fetchImpl);

    await expect(dataSource.listTeams()).resolves.toEqual([
      expect.objectContaining({ id: 1, name: 'Arsenal', shortName: 'ARS' })
    ]);
    await expect(dataSource.listFixtures()).resolves.toEqual([
      expect.objectContaining({ id: 99, event: 5, teamH: 1, teamA: 2 })
    ]);
    await expect(dataSource.listEvents()).resolves.toEqual([
      expect.objectContaining({ id: 10, name: 'Gameweek 10', isCurrent: true })
    ]);
  });

  it('supports detail endpoints and fallback to list endpoints on 404', async () => {
    const fetchImpl = jest.fn((url) => {
      if (url.endsWith('/api/player/1')) {
        return Promise.resolve(createMockResponse({}, false, 404));
      }
      if (url.endsWith('/api/players')) {
        return Promise.resolve(
          createMockResponse({ players: [{ id: 1, first_name: 'Bukayo', second_name: 'Saka', web_name: 'Saka', element_type: 3 }] })
        );
      }
      if (url.endsWith('/api/team/2')) {
        return Promise.resolve(createMockResponse({ team: { id: 2, name: 'Man City', short_name: 'MCI' } }));
      }
      if (url.endsWith('/api/fixture/3')) {
        return Promise.resolve(createMockResponse({ fixture: { id: 3, event: 1, team_h: 1, team_a: 2, finished: true } }));
      }

      return Promise.resolve(createMockResponse({ event: { id: 4, name: 'Gameweek 4', is_next: true } }));
    });

    const dataSource = createDataSource(fetchImpl);

    await expect(dataSource.getPlayerById(1)).resolves.toEqual(
      expect.objectContaining({ id: 1, webName: 'Saka' })
    );
    await expect(dataSource.getTeamById(2)).resolves.toEqual(
      expect.objectContaining({ id: 2, name: 'Man City' })
    );
    await expect(dataSource.getFixtureById(3)).resolves.toEqual(
      expect.objectContaining({ id: 3, finished: true })
    );
    await expect(dataSource.getEventById(4)).resolves.toEqual(
      expect.objectContaining({ id: 4, isNext: true })
    );
  });

  it('returns stale cache data when upstream fails', async () => {
    let now = 1000;
    const cache = new InMemoryCache(() => now);
    await cache.set(
      'events:list',
      [
        {
          id: 1,
          name: 'Gameweek 1',
          deadlineTime: null,
          averageEntryScore: null,
          finished: false,
          dataChecked: false,
          isCurrent: false,
          isNext: false,
          isPrevious: false
        }
      ],
      1
    );
    now += 2000;

    const fetchImpl = jest.fn().mockRejectedValue(new Error('upstream offline'));
    const dataSource = createDataSource(fetchImpl, cache);

    const events = await dataSource.listEvents();
    expect(events).toHaveLength(1);
    expect(events[0].name).toBe('Gameweek 1');
  });

  it('throws timeout error when fetch aborts', async () => {
    const fetchImpl = jest.fn().mockRejectedValue({ name: 'AbortError' });
    const dataSource = createDataSource(fetchImpl);

    await expect(dataSource.listEvents()).rejects.toBeInstanceOf(UpstreamTimeoutError);
  });

  it('throws bad response error when payload shape is invalid', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(createMockResponse({ unexpected: true }));
    const dataSource = createDataSource(fetchImpl);

    await expect(dataSource.listTeams()).rejects.toBeInstanceOf(BadUpstreamResponseError);
  });

  it('maps network errors to upstream unavailable', async () => {
    const fetchImpl = jest.fn().mockRejectedValue(new Error('socket hang up'));
    const dataSource = createDataSource(fetchImpl);

    await expect(dataSource.listPlayers()).rejects.toBeInstanceOf(UpstreamUnavailableError);
  });

  it('returns readiness status for healthy and degraded states', async () => {
    const okFetch = jest.fn().mockResolvedValue(createMockResponse({ events: [{ id: 1, name: 'GW1' }] }));
    const okDataSource = createDataSource(okFetch);

    const okReadiness = await okDataSource.readiness();
    expect(okReadiness.status).toBe('ok');
    expect(okReadiness.upstreamReachable).toBe(true);

    const badFetch = jest.fn().mockRejectedValue(new Error('failed'));
    const degradedDataSource = createDataSource(badFetch);

    const degradedReadiness = await degradedDataSource.readiness();
    expect(degradedReadiness.status).toBe('degraded');
    expect(degradedReadiness.upstreamReachable).toBe(false);
  });

  it('retries list endpoints without /api prefix when upstream returns 404', async () => {
    const fetchImpl = jest.fn((url) => {
      if (url.endsWith('/api/players')) {
        return Promise.resolve(createMockResponse({}, false, 404));
      }

      if (url.endsWith('/players')) {
        return Promise.resolve(
          createMockResponse({
            players: [{ id: 7, first_name: 'Son', second_name: 'Heung-min', web_name: 'Son', element_type: 3 }]
          })
        );
      }

      return Promise.resolve(createMockResponse({}, false, 500));
    });

    const dataSource = createDataSource(fetchImpl);
    const players = await dataSource.listPlayers();

    expect(players).toEqual([expect.objectContaining({ id: 7, webName: 'Son', position: 'MID' })]);
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://example.test/api/players',
      expect.objectContaining({ method: 'GET' })
    );
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://example.test/players',
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('falls back to bootstrap-static endpoint when list aliases are unavailable', async () => {
    const fetchImpl = jest.fn((url) => {
      if (
        url.endsWith('/api/players') ||
        url.endsWith('/players') ||
        url.endsWith('/api/v1/players') ||
        url.endsWith('/v1/players')
      ) {
        return Promise.resolve(createMockResponse({}, false, 404));
      }

      if (url.endsWith('/api/bootstrap-static/')) {
        return Promise.resolve(
          createMockResponse({
            elements: [{ id: 9, first_name: 'Darwin', second_name: 'Nunez', web_name: 'Nunez', element_type: 4 }]
          })
        );
      }

      return Promise.resolve(createMockResponse({}, false, 500));
    });

    const dataSource = createDataSource(fetchImpl);
    const players = await dataSource.listPlayers();

    expect(players).toEqual([expect.objectContaining({ id: 9, webName: 'Nunez', position: 'FWD' })]);
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://example.test/api/bootstrap-static/',
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('falls back to official FPL host when configured upstream returns 404 for fixtures', async () => {
    const fetchImpl = jest.fn((url) => {
      if (url.startsWith('https://example.test')) {
        return Promise.resolve(createMockResponse({}, false, 404));
      }

      if (url === 'https://fantasy.premierleague.com/api/fixtures/') {
        return Promise.resolve(
          createMockResponse({
            fixtures: [{ id: 11, event: 2, team_h: 1, team_a: 3, finished: false }]
          })
        );
      }

      return Promise.resolve(createMockResponse({}, false, 404));
    });

    const dataSource = createDataSource(fetchImpl, new InMemoryCache(), {
      fallbackBaseUrls: ['https://fantasy.premierleague.com']
    });
    const fixtures = await dataSource.listFixtures();

    expect(fixtures).toEqual([expect.objectContaining({ id: 11, event: 2, teamH: 1, teamA: 3 })]);
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://fantasy.premierleague.com/api/fixtures/',
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('continues to later fallback paths when an intermediate candidate returns non-JSON', async () => {
    const fetchImpl = jest.fn((url) => {
      if (url.endsWith('/api/teams')) {
        return Promise.resolve(createMockResponse({}, false, 404));
      }

      if (url.endsWith('/teams')) {
        return Promise.resolve(createInvalidJsonResponse());
      }

      if (url.endsWith('/api/v1/teams') || url.endsWith('/v1/teams')) {
        return Promise.resolve(createMockResponse({}, false, 404));
      }

      if (url.endsWith('/api/bootstrap-static/')) {
        return Promise.resolve(createMockResponse({ teams: [{ id: 1, name: 'Arsenal', short_name: 'ARS' }] }));
      }

      return Promise.resolve(createMockResponse({}, false, 404));
    });

    const dataSource = createDataSource(fetchImpl);
    const teams = await dataSource.listTeams();

    expect(teams).toEqual([expect.objectContaining({ id: 1, name: 'Arsenal', shortName: 'ARS' })]);
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://example.test/api/bootstrap-static/',
      expect.objectContaining({ method: 'GET' })
    );
  });
});
