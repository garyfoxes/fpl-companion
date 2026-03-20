import { gql } from '@apollo/client';

export const DASHBOARD_QUERY = gql`
  query Dashboard {
    players(limit: 1000, offset: 0) {
      id
      webName
      totalPoints
      transfersInEvent
    }
    teams {
      id
      name
    }
    fixtures(limit: 1000, offset: 0) {
      id
    }
    events {
      id
      name
      isCurrent
      isNext
    }
  }
`;

export const PLAYERS_QUERY = gql`
  query Players(
    $search: String
    $teamId: Int
    $position: String
    $orderBy: PlayerOrderBy
    $limit: Int!
    $offset: Int!
  ) {
    players(
      search: $search
      teamId: $teamId
      position: $position
      orderBy: $orderBy
      limit: $limit
      offset: $offset
    ) {
      id
      firstName
      lastName
      webName
      teamId
      position
      nowCost
      totalPoints
      form
      status
      transfersInEvent
      transfersOutEvent
    }
  }
`;

export const PLAYER_QUERY = gql`
  query Player($id: Int!) {
    player(id: $id) {
      id
      firstName
      lastName
      webName
      teamId
      position
      nowCost
      totalPoints
      form
      status
      selectedByPercent
      goals
      assists
      minutes
      cleanSheets
      yellowCards
      redCards
      bps
      bonusPoints
      influence
      creativity
      threat
      ictIndex
      influenceRank
      creativityRank
      threatRank
      ictIndexRank
      expectedGoals
      expectedAssists
      expectedGoalInvolvements
      costChangeEvent
      costChangeStart
      news
      chanceOfPlayingThisRound
      chanceOfPlayingNextRound
      transfersInEvent
      transfersOutEvent
    }
  }
`;

export const TEAMS_QUERY = gql`
  query Teams {
    teams {
      id
      name
      shortName
      strength
      form
      position
    }
  }
`;

export const TEAM_QUERY = gql`
  query Team($id: Int!) {
    team(id: $id) {
      id
      name
      shortName
      strength
      form
      position
      win
      draw
      loss
      points
      strengthOverallHome
      strengthOverallAway
      strengthAttackHome
      strengthAttackAway
      strengthDefenceHome
      strengthDefenceAway
    }
  }
`;

export const FIXTURES_QUERY = gql`
  query Fixtures($eventId: Int, $teamId: Int, $finished: Boolean, $limit: Int!, $offset: Int!) {
    fixtures(
      eventId: $eventId
      teamId: $teamId
      finished: $finished
      limit: $limit
      offset: $offset
    ) {
      id
      event
      kickoffTime
      teamH
      teamA
      teamHScore
      teamAScore
      finished
      started
      teamHDifficulty
      teamADifficulty
    }
  }
`;

export const FIXTURE_QUERY = gql`
  query Fixture($id: Int!) {
    fixture(id: $id) {
      id
      event
      kickoffTime
      teamH
      teamA
      teamHScore
      teamAScore
      finished
      started
      teamHDifficulty
      teamADifficulty
    }
  }
`;

export const EVENTS_QUERY = gql`
  query Events {
    events {
      id
      name
      deadlineTime
      averageEntryScore
      finished
      dataChecked
      isCurrent
      isNext
      isPrevious
    }
  }
`;

export const EVENT_QUERY = gql`
  query Event($id: Int!) {
    event(id: $id) {
      id
      name
      deadlineTime
      averageEntryScore
      finished
      dataChecked
      isCurrent
      isNext
      isPrevious
    }
  }
`;

export const PLAYERS_BY_IDS_QUERY = gql`
  query PlayersByIds($ids: [Int!]!) {
    playersByIds(ids: $ids) {
      id
      webName
      totalPoints
      form
      nowCost
      goals
      assists
      cleanSheets
      yellowCards
      redCards
      bonusPoints
      bps
      ictIndex
    }
  }
`;
