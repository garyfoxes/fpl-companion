const { resolvers, toGraphQLError } = require('../src/graphql/resolvers');
const { UpstreamUnavailableError } = require('../src/errors/upstreamErrors');

describe('resolvers', () => {
  const context = {
    dataSource: {
      listPlayers: jest.fn().mockResolvedValue([
        {
          id: 1,
          webName: 'Haaland',
          firstName: 'Erling',
          lastName: 'Haaland',
          teamId: 1,
          position: 'FWD',
        },
      ]),
      getPlayerById: jest.fn().mockResolvedValue({ id: 1, webName: 'Haaland' }),
      listTeams: jest.fn().mockResolvedValue([
        { id: 1, name: 'Man City', points: 70, strengthDefenceAway: 1280, shortName: 'MCI' },
        { id: 2, name: 'Arsenal', points: 68, strengthDefenceAway: 1210, shortName: 'ARS' },
        { id: 3, name: 'Liverpool', points: 72, strengthDefenceAway: 1300, shortName: 'LIV' },
      ]),
      getTeamById: jest.fn().mockResolvedValue({ id: 1, name: 'Man City' }),
      listFixtures: jest
        .fn()
        .mockResolvedValue([{ id: 1, event: 1, teamH: 1, teamA: 2, finished: false }]),
      getFixtureById: jest.fn().mockResolvedValue({ id: 1 }),
      listEvents: jest.fn().mockResolvedValue([{ id: 1, name: 'Gameweek 1' }]),
      getEventById: jest.fn().mockResolvedValue({ id: 1, name: 'Gameweek 1' }),
    },
  };

  it('resolves players query', async () => {
    const result = await resolvers.Query.players(
      null,
      { search: 'haal', limit: 10, offset: 0 },
      context
    );
    expect(result).toHaveLength(1);
  });

  it('resolves all detail queries', async () => {
    const player = await resolvers.Query.player(null, { id: 1 }, context);
    const team = await resolvers.Query.team(null, { id: 1 }, context);
    const fixture = await resolvers.Query.fixture(null, { id: 1 }, context);
    const event = await resolvers.Query.event(null, { id: 1 }, context);

    expect(player.id).toBe(1);
    expect(team.id).toBe(1);
    expect(fixture.id).toBe(1);
    expect(event.id).toBe(1);
  });

  it('resolves teams, fixtures, and events list queries', async () => {
    const teams = await resolvers.Query.teams(null, {}, context);
    const fixtures = await resolvers.Query.fixtures(
      null,
      { eventId: 1, teamId: null, finished: false, limit: 10, offset: 0 },
      context
    );
    const events = await resolvers.Query.events(null, {}, context);

    expect(teams[0].name).toBe('Man City');
    expect(fixtures[0].id).toBe(1);
    expect(events[0].name).toBe('Gameweek 1');
  });

  it('orders and paginates teams list query', async () => {
    const teams = await resolvers.Query.teams(
      null,
      { orderBy: { field: 'strength_defence_away', direction: 'ASC' }, first: 2, offset: 0 },
      context
    );

    expect(teams).toHaveLength(2);
    expect(teams[0].name).toBe('Arsenal');
    expect(teams[1].name).toBe('Man City');
  });

  it('resolves teamsConnection query', async () => {
    const result = await resolvers.Query.teamsConnection(
      null,
      { orderBy: { field: 'points', direction: 'DESC' }, first: 1, offset: 0 },
      context
    );

    expect(result.total).toBe(3);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].name).toBe('Liverpool');
  });

  it('resolves snake_case Team aliases', () => {
    const team = {
      shortName: 'MCI',
      strengthDefenceAway: 1280,
    };

    expect(resolvers.Team.short_name(team)).toBe('MCI');
    expect(resolvers.Team.strength_defence_away(team)).toBe(1280);
  });

  it('maps upstream errors to graphql error codes', () => {
    const graphQLError = toGraphQLError(new UpstreamUnavailableError('down', 503));
    expect(graphQLError.extensions.code).toBe('UPSTREAM_UNAVAILABLE');
  });

  it('maps unknown errors to internal server code', () => {
    const graphQLError = toGraphQLError(new Error('unknown'));
    expect(graphQLError.extensions.code).toBe('INTERNAL_SERVER_ERROR');
  });

  it('throws graphql errors from query resolvers when datasource fails', async () => {
    const failingContext = {
      dataSource: {
        ...context.dataSource,
        listPlayers: jest.fn().mockRejectedValue(new UpstreamUnavailableError('down', 503)),
      },
    };

    await expect(
      resolvers.Query.players(
        null,
        { search: null, teamId: null, position: null, limit: 10, offset: 0 },
        failingContext
      )
    ).rejects.toMatchObject({ extensions: { code: 'UPSTREAM_UNAVAILABLE' } });
  });

  it('sorts players by totalPoints DESC via orderBy arg', async () => {
    const ctx = {
      dataSource: {
        listPlayers: jest.fn().mockResolvedValue([
          {
            id: 1,
            webName: 'Haaland',
            firstName: 'Erling',
            lastName: 'Haaland',
            teamId: 1,
            position: 'FWD',
            totalPoints: 210,
            form: '8.1',
            nowCost: 14,
          },
          {
            id: 2,
            webName: 'Saka',
            firstName: 'Bukayo',
            lastName: 'Saka',
            teamId: 2,
            position: 'MID',
            totalPoints: 180,
            form: '7.2',
            nowCost: 10,
          },
        ]),
      },
    };
    const result = await resolvers.Query.players(
      null,
      { limit: 10, offset: 0, orderBy: { field: 'totalPoints', direction: 'DESC' } },
      ctx
    );
    expect(result[0].id).toBe(1);
    expect(result[1].id).toBe(2);
  });

  it('playersByIds returns both players', async () => {
    const ctx = {
      dataSource: {
        getPlayerById: jest
          .fn()
          .mockImplementation((id) =>
            Promise.resolve(id === 1 ? { id: 1, webName: 'Haaland' } : { id: 2, webName: 'Saka' })
          ),
      },
    };
    const result = await resolvers.Query.playersByIds(null, { ids: [1, 2] }, ctx);
    expect(result).toHaveLength(2);
    expect(result.map((p) => p.id)).toEqual([1, 2]);
  });

  it('playersByIds filters null when an id does not exist', async () => {
    const ctx = {
      dataSource: {
        getPlayerById: jest
          .fn()
          .mockImplementation((id) =>
            Promise.resolve(id === 1 ? { id: 1, webName: 'Haaland' } : null)
          ),
      },
    };
    const result = await resolvers.Query.playersByIds(null, { ids: [1, 999] }, ctx);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });
});
