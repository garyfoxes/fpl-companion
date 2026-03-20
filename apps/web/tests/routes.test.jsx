import { screen } from '@testing-library/react';
import App from '../src/App';
import {
  DASHBOARD_QUERY,
  EVENTS_QUERY,
  FIXTURES_QUERY,
  PLAYERS_QUERY,
  TEAM_QUERY,
  TEAMS_QUERY,
} from '../src/lib/queries';
import { renderWithProviders } from './testUtils';

const baseMocks = [
  {
    request: {
      query: DASHBOARD_QUERY,
    },
    result: {
      data: {
        players: [],
        teams: [],
        fixtures: [],
        events: [],
        topScorers: [],
        mostTransferred: [],
      },
    },
  },
  {
    request: {
      query: PLAYERS_QUERY,
      variables: {
        search: null,
        teamId: null,
        position: null,
        orderBy: null,
        limit: 200,
        offset: 0,
      },
    },
    result: {
      data: {
        players: [],
      },
    },
  },
  {
    request: {
      query: TEAMS_QUERY,
    },
    result: {
      data: {
        teams: [{ id: 1, name: 'Arsenal', shortName: 'ARS', strength: 4, form: null, position: 2 }],
      },
    },
  },
  {
    request: {
      query: FIXTURES_QUERY,
      variables: { eventId: null, teamId: null, finished: null, limit: 300, offset: 0 },
    },
    result: {
      data: {
        fixtures: [],
      },
    },
  },
  {
    request: {
      query: EVENTS_QUERY,
    },
    result: {
      data: {
        events: [
          {
            id: 1,
            name: 'Gameweek 1',
            isCurrent: true,
            isNext: false,
            isPrevious: false,
            dataChecked: true,
            deadlineTime: null,
            averageEntryScore: null,
            finished: false,
          },
        ],
      },
    },
  },
  {
    request: {
      query: TEAM_QUERY,
      variables: { id: 1 },
    },
    result: {
      data: {
        team: {
          id: 1,
          name: 'Arsenal',
          shortName: 'ARS',
          strength: 4,
          form: null,
          position: 2,
          win: 20,
          draw: 5,
          loss: 3,
          points: 65,
          strengthOverallHome: 1350,
          strengthOverallAway: 1300,
          strengthAttackHome: 1370,
          strengthAttackAway: 1310,
          strengthDefenceHome: 1330,
          strengthDefenceAway: 1280,
        },
      },
    },
  },
];

describe('App routes', () => {
  it('renders dashboard route', async () => {
    renderWithProviders(<App />, { mocks: baseMocks, route: '/' });
    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
  });

  it('renders teams route', async () => {
    renderWithProviders(<App />, { mocks: baseMocks, route: '/teams?selected=1' });
    expect(await screen.findByRole('heading', { name: 'Teams' })).toBeInTheDocument();
    expect(await screen.findByText('Team details: Arsenal')).toBeInTheDocument();
  });
});
