import { screen } from '@testing-library/react';
import { PlayersPage } from '../src/pages/PlayersPage';
import { PLAYER_QUERY, PLAYERS_QUERY, TEAMS_QUERY } from '../src/lib/queries';
import { renderWithProviders } from './testUtils';

describe('PlayersPage', () => {
  it('renders players table when data is present', async () => {
    const mocks = [
      {
        request: {
          query: TEAMS_QUERY
        },
        result: {
          data: {
            teams: [{ id: 1, name: 'Man City', shortName: 'MCI' }]
          }
        }
      },
      {
        request: {
          query: PLAYERS_QUERY,
          variables: { search: null, teamId: null, position: null, limit: 200, offset: 0 }
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
                status: 'a'
              }
            ]
          }
        }
      },
      {
        request: {
          query: PLAYER_QUERY,
          variables: { id: 1 }
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
              selectedByPercent: '55.0'
            }
          }
        }
      }
    ];

    renderWithProviders(<PlayersPage />, { mocks, route: '/players?selected=1' });

    expect(screen.getByText('Loading data...')).toBeInTheDocument();
    expect(await screen.findByText('Haaland')).toBeInTheDocument();
    expect(await screen.findByText('Player details: Haaland')).toBeInTheDocument();
  });

  it('renders empty state', async () => {
    const mocks = [
      {
        request: {
          query: TEAMS_QUERY
        },
        result: {
          data: {
            teams: []
          }
        }
      },
      {
        request: {
          query: PLAYERS_QUERY,
          variables: { search: null, teamId: null, position: null, limit: 200, offset: 0 }
        },
        result: {
          data: {
            players: []
          }
        }
      }
    ];

    renderWithProviders(<PlayersPage />, { mocks, route: '/players' });

    expect(await screen.findByText('No players matched your filters.')).toBeInTheDocument();
  });
});
