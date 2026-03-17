import { screen } from '@testing-library/react';
import { PlayersPage } from '../src/pages/PlayersPage';
import { PLAYER_QUERY, PLAYERS_QUERY, TEAMS_QUERY } from '../src/lib/queries';
import { renderWithProviders } from './testUtils';

describe('PlayersPage', () => {
  it('renders players table when data is present', async () => {
    const mocks = [
      {
        request: {
          query: TEAMS_QUERY,
        },
        result: {
          data: {
            teams: [
              { id: 1, name: 'Man City', shortName: 'MCI', strength: 5, form: null, position: 1 },
            ],
          },
        },
      },
      {
        request: {
          query: PLAYERS_QUERY,
          variables: { search: null, teamId: null, position: null, limit: 200, offset: 0 },
        },
        result: {
          data: {
            players: [
              {
                id: 1,
                firstName: 'Erling',
                lastName: 'Haaland',
                webName: 'Haaland',
                teamId: 1,
                position: 'FWD',
                nowCost: 14,
                totalPoints: 200,
                form: '8.1',
                status: 'a',
                transfersInEvent: 50000,
                transfersOutEvent: 10000,
              },
            ],
          },
        },
      },
      {
        request: {
          query: PLAYER_QUERY,
          variables: { id: 1 },
        },
        result: {
          data: {
            player: {
              id: 1,
              firstName: 'Erling',
              lastName: 'Haaland',
              webName: 'Haaland',
              teamId: 1,
              position: 'FWD',
              nowCost: 14,
              totalPoints: 200,
              form: '8.1',
              status: 'a',
              selectedByPercent: '55.0',
              goals: 20,
              assists: 5,
              minutes: 2800,
              cleanSheets: 0,
              yellowCards: 1,
              redCards: 0,
              bps: 500,
              bonusPoints: 35,
              influence: '180.5',
              creativity: '60.2',
              threat: '300.1',
              ictIndex: '62.3',
              influenceRank: 2,
              creativityRank: 10,
              threatRank: 1,
              ictIndexRank: 1,
              expectedGoals: '18.50',
              expectedAssists: '4.20',
              expectedGoalInvolvements: '22.70',
              costChangeEvent: 1,
              costChangeStart: 5,
              news: null,
              chanceOfPlayingThisRound: null,
              chanceOfPlayingNextRound: null,
              transfersInEvent: 50000,
              transfersOutEvent: 10000,
            },
          },
        },
      },
    ];

    renderWithProviders(<PlayersPage />, { mocks, route: '/players?selected=1' });

    expect(screen.getByText('Loading data...')).toBeInTheDocument();
    expect(await screen.findByText('Haaland')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Team' })).toBeInTheDocument();
    expect(await screen.findByText('MCI')).toBeInTheDocument();
    expect(await screen.findByText('Player details: Haaland')).toBeInTheDocument();
    expect(await screen.findByText('Goals')).toBeInTheDocument();
    expect(await screen.findByText('Transfers In (Event)')).toBeInTheDocument();
  });

  it('renders empty state', async () => {
    const mocks = [
      {
        request: {
          query: TEAMS_QUERY,
        },
        result: {
          data: {
            teams: [],
          },
        },
      },
      {
        request: {
          query: PLAYERS_QUERY,
          variables: { search: null, teamId: null, position: null, limit: 200, offset: 0 },
        },
        result: {
          data: {
            players: [],
          },
        },
      },
    ];

    renderWithProviders(<PlayersPage />, { mocks, route: '/players' });

    expect(await screen.findByText('No players matched your filters.')).toBeInTheDocument();
  });

  it('renders error state when teamsQuery fails', async () => {
    const mocks = [
      {
        request: { query: TEAMS_QUERY },
        error: new Error('Network error'),
      },
      {
        request: {
          query: PLAYERS_QUERY,
          variables: { search: null, teamId: null, position: null, limit: 200, offset: 0 },
        },
        result: { data: { players: [] } },
      },
    ];

    renderWithProviders(<PlayersPage />, { mocks, route: '/players' });

    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });

  it('shows N/A in team cell for a player with teamId null', async () => {
    const mocks = [
      {
        request: { query: TEAMS_QUERY },
        result: { data: { teams: [] } },
      },
      {
        request: {
          query: PLAYERS_QUERY,
          variables: { search: null, teamId: null, position: null, limit: 200, offset: 0 },
        },
        result: {
          data: {
            players: [
              {
                id: 99,
                firstName: 'Unknown',
                lastName: 'Player',
                webName: 'Unknown',
                teamId: null,
                position: 'MID',
                nowCost: 5,
                totalPoints: 0,
                form: null,
                status: 'u',
                transfersInEvent: null,
                transfersOutEvent: null,
              },
            ],
          },
        },
      },
    ];

    renderWithProviders(<PlayersPage />, { mocks, route: '/players' });

    expect(await screen.findByText('Unknown')).toBeInTheDocument();
    expect(screen.getAllByText('N/A').length).toBeGreaterThan(0);
  });
});
