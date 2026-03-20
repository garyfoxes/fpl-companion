const { GraphQLError } = require('graphql');
const { UpstreamError } = require('../errors/upstreamErrors');
const { filterPlayers, filterFixtures } = require('../utils/filter');
const { paginate } = require('../utils/paginate');
const { sortTeams, sortPlayers } = require('../utils/sort');

const MAX_PLAYERIDS_PER_QUERY = 10;

const TEAM_ALIAS_FIELDS = {
  short_name: 'shortName',
  strength_overall_home: 'strengthOverallHome',
  strength_overall_away: 'strengthOverallAway',
  strength_attack_home: 'strengthAttackHome',
  strength_attack_away: 'strengthAttackAway',
  strength_defence_home: 'strengthDefenceHome',
  strength_defence_away: 'strengthDefenceAway',
  pulse_id: 'pulseId',
};

function getTeamWindow(args = {}) {
  return {
    limit: args.first ?? args.limit,
    offset: args.offset,
  };
}

function toGraphQLError(error) {
  if (error instanceof UpstreamError) {
    return new GraphQLError(error.message, {
      extensions: {
        code: error.code,
        upstreamStatus: error.statusCode,
      },
    });
  }

  return new GraphQLError('Unexpected internal error', {
    extensions: {
      code: 'INTERNAL_SERVER_ERROR',
    },
  });
}

const resolvers = {
  Query: {
    players: async (_parent, args, context) => {
      try {
        const players = await context.dataSource.listPlayers();
        const filtered = filterPlayers(players, args);
        const sorted = sortPlayers(filtered, args.orderBy);
        return paginate(sorted, args.limit, args.offset);
      } catch (error) {
        throw toGraphQLError(error);
      }
    },

    player: async (_parent, args, context) => {
      try {
        return context.dataSource.getPlayerById(args.id);
      } catch (error) {
        throw toGraphQLError(error);
      }
    },

    playersByIds: async (_parent, args, context) => {
      const ids = [...new Set(args.ids)];
      if (ids.length > MAX_PLAYERIDS_PER_QUERY) {
        throw new GraphQLError(
          `playersByIds accepts at most ${MAX_PLAYERIDS_PER_QUERY} IDs per request`,
          { extensions: { code: 'BAD_USER_INPUT' } }
        );
      }
      try {
        const results = await Promise.all(ids.map((id) => context.dataSource.getPlayerById(id)));
        return results.filter(Boolean);
      } catch (error) {
        throw toGraphQLError(error);
      }
    },

    teams: async (_parent, args, context) => {
      try {
        const teams = await context.dataSource.listTeams();
        const ordered = sortTeams(teams, args.orderBy);
        const window = getTeamWindow(args);
        return paginate(ordered, window.limit, window.offset);
      } catch (error) {
        throw toGraphQLError(error);
      }
    },

    teamsConnection: async (_parent, args, context) => {
      try {
        const teams = await context.dataSource.listTeams();
        const ordered = sortTeams(teams, args.orderBy);
        const window = getTeamWindow(args);
        return {
          items: paginate(ordered, window.limit, window.offset),
          total: ordered.length,
        };
      } catch (error) {
        throw toGraphQLError(error);
      }
    },

    team: async (_parent, args, context) => {
      try {
        return context.dataSource.getTeamById(args.id);
      } catch (error) {
        throw toGraphQLError(error);
      }
    },

    fixtures: async (_parent, args, context) => {
      try {
        const fixtures = await context.dataSource.listFixtures();
        const filtered = filterFixtures(fixtures, args);
        return paginate(filtered, args.limit, args.offset);
      } catch (error) {
        throw toGraphQLError(error);
      }
    },

    fixture: async (_parent, args, context) => {
      try {
        return context.dataSource.getFixtureById(args.id);
      } catch (error) {
        throw toGraphQLError(error);
      }
    },

    events: async (_parent, _args, context) => {
      try {
        return context.dataSource.listEvents();
      } catch (error) {
        throw toGraphQLError(error);
      }
    },

    event: async (_parent, args, context) => {
      try {
        return context.dataSource.getEventById(args.id);
      } catch (error) {
        throw toGraphQLError(error);
      }
    },
  },
  Team: Object.fromEntries(
    Object.entries(TEAM_ALIAS_FIELDS).map(([fieldName, sourceField]) => [
      fieldName,
      (team) => team[sourceField] ?? null,
    ])
  ),
};

module.exports = {
  resolvers,
  toGraphQLError,
};
