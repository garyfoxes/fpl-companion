const express = require('express');
const cors = require('cors');
const { ApolloServer } = require('apollo-server-express');
const { typeDefs } = require('./graphql/schema');
const { resolvers } = require('./graphql/resolvers');
const { FplDataSource } = require('./upstream/fplDataSource');
const { getConfig } = require('./config');

async function createApp(options = {}) {
  const config = options.config || getConfig();
  const dataSource =
    options.dataSource ||
    new FplDataSource({
      baseUrl: config.upstreamBaseUrl,
      timeoutMs: config.upstreamTimeoutMs,
      ttl: {
        players: config.ttlPlayersSec,
        teams: config.ttlTeamsSec,
        fixtures: config.ttlFixturesSec,
        events: config.ttlEventsSec,
      },
      cache: options.cache,
      fetchImpl: options.fetchImpl,
    });

  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    context: () => ({
      dataSource,
    }),
  });

  await apolloServer.start();

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/healthz', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'fpl-companion-api',
    });
  });

  app.get('/readyz', async (_req, res) => {
    const readiness = await dataSource.readiness();
    const status = readiness.status === 'ok' ? 200 : 503;
    res.status(status).json(readiness);
  });

  apolloServer.applyMiddleware({
    app,
    path: '/graphql',
  });

  return {
    app,
    apolloServer,
    dataSource,
    config,
  };
}

module.exports = {
  createApp,
};
