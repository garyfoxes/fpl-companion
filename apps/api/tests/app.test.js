const request = require('supertest');
const { createApp } = require('../src/app');

describe('createApp', () => {
  let apolloServer;
  const mockedDataSource = {
    listPlayers: jest
      .fn()
      .mockResolvedValue([{ id: 1, firstName: 'Erling', lastName: 'Haaland', webName: 'Haaland' }]),
    getPlayerById: jest
      .fn()
      .mockResolvedValue({ id: 1, firstName: 'Erling', lastName: 'Haaland', webName: 'Haaland' }),
    listTeams: jest.fn().mockResolvedValue([{ id: 1, name: 'Man City' }]),
    getTeamById: jest.fn().mockResolvedValue({ id: 1, name: 'Man City' }),
    listFixtures: jest.fn().mockResolvedValue([{ id: 1, event: 1, finished: false }]),
    getFixtureById: jest.fn().mockResolvedValue({ id: 1, event: 1, finished: false }),
    listEvents: jest.fn().mockResolvedValue([
      {
        id: 1,
        name: 'Gameweek 1',
        finished: false,
        dataChecked: false,
        isCurrent: true,
        isNext: false,
        isPrevious: false,
      },
    ]),
    getEventById: jest.fn().mockResolvedValue({
      id: 1,
      name: 'Gameweek 1',
      finished: false,
      dataChecked: false,
      isCurrent: true,
      isNext: false,
      isPrevious: false,
    }),
    readiness: jest.fn().mockResolvedValue({ status: 'ok', upstreamReachable: true }),
  };

  afterEach(async () => {
    if (apolloServer) {
      await apolloServer.stop();
      apolloServer = null;
    }
  });

  it('serves health and readiness endpoints', async () => {
    const setup = await createApp({
      dataSource: mockedDataSource,
      config: {
        port: 4000,
        upstreamBaseUrl: 'https://example.test',
        upstreamTimeoutMs: 1000,
        ttlPlayersSec: 10,
        ttlTeamsSec: 10,
        ttlFixturesSec: 10,
        ttlEventsSec: 10,
      },
    });
    const { app } = setup;
    apolloServer = setup.apolloServer;

    const health = await request(app).get('/healthz');
    const ready = await request(app).get('/readyz');

    expect(health.statusCode).toBe(200);
    expect(ready.statusCode).toBe(200);
    expect(ready.body.status).toBe('ok');
  });

  it('serves graphql queries', async () => {
    const setup = await createApp({
      dataSource: mockedDataSource,
      config: {
        port: 4000,
        upstreamBaseUrl: 'https://example.test',
        upstreamTimeoutMs: 1000,
        ttlPlayersSec: 10,
        ttlTeamsSec: 10,
        ttlFixturesSec: 10,
        ttlEventsSec: 10,
      },
    });
    const { app } = setup;
    apolloServer = setup.apolloServer;

    const playersResponse = await request(app)
      .post('/graphql')
      .send({ query: '{ players(limit: 10, offset: 0) { id webName } }' });

    const teamsResponse = await request(app)
      .post('/graphql')
      .send({ query: '{ teams { id name } }' });
    const teamsConnectionResponse = await request(app)
      .post('/graphql')
      .send({ query: '{ teamsConnection(first: 1) { total items { id name } } }' });
    const fixturesResponse = await request(app)
      .post('/graphql')
      .send({ query: '{ fixtures { id event } }' });
    const eventsResponse = await request(app)
      .post('/graphql')
      .send({ query: '{ events { id name } }' });

    expect(playersResponse.statusCode).toBe(200);
    expect(playersResponse.body.data.players[0].id).toBe(1);
    expect(teamsResponse.body.data.teams[0].name).toBe('Man City');
    expect(teamsConnectionResponse.body.data.teamsConnection.total).toBe(1);
    expect(teamsConnectionResponse.body.data.teamsConnection.items[0].name).toBe('Man City');
    expect(fixturesResponse.body.data.fixtures[0].id).toBe(1);
    expect(eventsResponse.body.data.events[0].name).toBe('Gameweek 1');
  });
});
