const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type Query {
    players(
      search: String
      teamId: Int
      position: String
      limit: Int = 50
      offset: Int = 0
    ): [Player!]!
    player(id: Int!): Player
    teams(orderBy: TeamOrderBy, first: Int, limit: Int = 50, offset: Int = 0): [Team!]!
    teamsConnection(orderBy: TeamOrderBy, first: Int = 50, offset: Int = 0): TeamConnection!
    team(id: Int!): Team
    fixtures(
      eventId: Int
      teamId: Int
      finished: Boolean
      limit: Int = 50
      offset: Int = 0
    ): [Fixture!]!
    fixture(id: Int!): Fixture
    events: [Event!]!
    event(id: Int!): Event
  }

  enum SortDirection {
    ASC
    DESC
  }

  enum TeamOrderField {
    id
    name
    short_name
    code
    played
    win
    draw
    loss
    points
    position
    strength
    strength_overall_home
    strength_overall_away
    strength_attack_home
    strength_attack_away
    strength_defence_home
    strength_defence_away
    pulse_id
  }

  input TeamOrderBy {
    field: TeamOrderField!
    direction: SortDirection = ASC
  }

  type TeamConnection {
    items: [Team!]!
    total: Int!
  }

  type Player {
    id: Int!
    firstName: String!
    lastName: String!
    webName: String!
    teamId: Int
    position: String
    nowCost: Float
    selectedByPercent: String
    form: String
    totalPoints: Float
    status: String
  }

  type Team {
    id: Int!
    name: String!
    shortName: String
    short_name: String
    code: Int
    played: Int
    win: Int
    draw: Int
    loss: Int
    points: Int
    strength: Float
    strengthOverallHome: Int
    strength_overall_home: Int
    strengthOverallAway: Int
    strength_overall_away: Int
    strengthAttackHome: Int
    strength_attack_home: Int
    strengthAttackAway: Int
    strength_attack_away: Int
    strengthDefenceHome: Int
    strength_defence_home: Int
    strengthDefenceAway: Int
    strength_defence_away: Int
    pulseId: Int
    pulse_id: Int
    form: String
    position: Int
  }

  type Fixture {
    id: Int!
    event: Int
    kickoffTime: String
    teamH: Int
    teamA: Int
    teamHScore: Int
    teamAScore: Int
    finished: Boolean!
    started: Boolean!
    teamHDifficulty: Int
    teamADifficulty: Int
  }

  type Event {
    id: Int!
    name: String!
    deadlineTime: String
    averageEntryScore: Float
    finished: Boolean!
    dataChecked: Boolean!
    isCurrent: Boolean!
    isNext: Boolean!
    isPrevious: Boolean!
  }
`;

module.exports = {
  typeDefs,
};
