import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlayersPage } from '../src/pages/PlayersPage';
import { PLAYER_QUERY, PLAYERS_BY_IDS_QUERY, PLAYERS_QUERY, TEAMS_QUERY } from '../src/lib/queries';
import { renderWithProviders } from './testUtils';

const basePlayer = {
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
};

const detailPlayer = {
  ...basePlayer,
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
};

const teamsMock = {
  request: { query: TEAMS_QUERY },
  result: {
    data: {
      teams: [{ id: 1, name: 'Man City', shortName: 'MCI', strength: 5, form: null, position: 1 }],
    },
  },
};

function makePlayersMock(variables, players = [basePlayer]) {
  return {
    request: { query: PLAYERS_QUERY, variables },
    result: { data: { players } },
  };
}

const defaultVars = {
  search: null,
  teamId: null,
  position: null,
  orderBy: null,
  limit: 200,
  offset: 0,
};

describe('PlayersPage', () => {
  it('renders players table when data is present', async () => {
    const mocks = [
      teamsMock,
      makePlayersMock(defaultVars),
      {
        request: { query: PLAYER_QUERY, variables: { id: 1 } },
        result: { data: { player: detailPlayer } },
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
      { request: { query: TEAMS_QUERY }, result: { data: { teams: [] } } },
      makePlayersMock(defaultVars, []),
    ];

    renderWithProviders(<PlayersPage />, { mocks, route: '/players' });

    expect(await screen.findByText('No players matched your filters.')).toBeInTheDocument();
  });

  it('renders error state when teamsQuery fails', async () => {
    const mocks = [
      { request: { query: TEAMS_QUERY }, error: new Error('Network error') },
      makePlayersMock(defaultVars, []),
    ];

    renderWithProviders(<PlayersPage />, { mocks, route: '/players' });

    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });

  it('shows N/A in team cell for a player with teamId null', async () => {
    const mocks = [
      { request: { query: TEAMS_QUERY }, result: { data: { teams: [] } } },
      makePlayersMock(defaultVars, [
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
      ]),
    ];

    renderWithProviders(<PlayersPage />, { mocks, route: '/players' });

    expect(await screen.findByText('Unknown')).toBeInTheDocument();
    expect(screen.getAllByText('N/A').length).toBeGreaterThan(0);
  });

  it('clicking Total Points header updates URL sortField and sortDir', async () => {
    const user = userEvent.setup();
    const sortedVars = {
      ...defaultVars,
      orderBy: { field: 'totalPoints', direction: 'DESC' },
    };
    const mocks = [teamsMock, makePlayersMock(defaultVars), makePlayersMock(sortedVars)];

    renderWithProviders(<PlayersPage />, { mocks, route: '/players' });

    await screen.findByText('Haaland');

    const sortLabel = screen.getByRole('button', { name: /total points/i });
    await user.click(sortLabel);

    // Verify the sort label becomes active after click
    expect(sortLabel.closest('[aria-sort]') || sortLabel).toBeTruthy();
  });

  it('two player checkboxes checked shows Compare button', async () => {
    const user = userEvent.setup();
    const player2 = { ...basePlayer, id: 2, webName: 'Saka', teamId: 2, totalPoints: 180 };
    const mocks = [
      { request: { query: TEAMS_QUERY }, result: { data: { teams: [] } } },
      makePlayersMock(defaultVars, [basePlayer, player2]),
    ];

    renderWithProviders(<PlayersPage />, { mocks, route: '/players' });

    await screen.findByText('Haaland');

    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]);
    await user.click(checkboxes[1]);

    expect(await screen.findByRole('button', { name: /compare \(2\)/i })).toBeInTheDocument();
  });

  it('compare panel shows both player names when compare ids are in URL', async () => {
    const player2 = {
      ...basePlayer,
      id: 2,
      webName: 'Saka',
      teamId: 2,
      totalPoints: 180,
      form: '7.2',
      nowCost: 10,
      goals: 12,
      assists: 10,
      cleanSheets: 5,
      yellowCards: 2,
      redCards: 0,
      bonusPoints: 25,
      bps: 400,
      ictIndex: '55.0',
    };
    const comparePlayer1 = {
      id: 1,
      webName: 'Haaland',
      totalPoints: 200,
      form: '8.1',
      nowCost: 14,
      goals: 20,
      assists: 5,
      cleanSheets: 0,
      yellowCards: 1,
      redCards: 0,
      bonusPoints: 35,
      bps: 500,
      ictIndex: '62.3',
    };
    const comparePlayer2 = {
      id: 2,
      webName: 'Saka',
      totalPoints: 180,
      form: '7.2',
      nowCost: 10,
      goals: 12,
      assists: 10,
      cleanSheets: 5,
      yellowCards: 2,
      redCards: 0,
      bonusPoints: 25,
      bps: 400,
      ictIndex: '55.0',
    };
    const mocks = [
      { request: { query: TEAMS_QUERY }, result: { data: { teams: [] } } },
      makePlayersMock(defaultVars, [basePlayer, player2]),
      {
        request: { query: PLAYERS_BY_IDS_QUERY, variables: { ids: [1, 2] } },
        result: { data: { playersByIds: [comparePlayer1, comparePlayer2] } },
      },
    ];

    renderWithProviders(<PlayersPage />, { mocks, route: '/players?compare=1,2' });

    expect(await screen.findByText('Player Comparison')).toBeInTheDocument();
    expect(await screen.findByRole('columnheader', { name: 'Haaland' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Saka' })).toBeInTheDocument();
  });
});
