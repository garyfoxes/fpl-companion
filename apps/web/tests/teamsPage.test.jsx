import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TeamsPage } from '../src/pages/TeamsPage';
import { TEAM_QUERY, TEAMS_QUERY } from '../src/lib/queries';
import { renderWithProviders } from './testUtils';

const teams = [
  { id: 1, name: 'Man City', shortName: 'MCI', strength: 5, form: 'W', position: 1 },
  { id: 2, name: 'Arsenal', shortName: 'ARS', strength: 4, form: 'W', position: 2 },
];

const teamDetail = {
  id: 1,
  name: 'Man City',
  shortName: 'MCI',
  strength: 5,
  form: 'W',
  position: 1,
  win: 20,
  draw: 5,
  loss: 3,
  points: 65,
  strengthOverallHome: 1320,
  strengthOverallAway: 1290,
  strengthAttackHome: 1350,
  strengthAttackAway: 1310,
  strengthDefenceHome: 1300,
  strengthDefenceAway: 1280,
};

describe('TeamsPage', () => {
  it('renders list of teams', async () => {
    const mocks = [{ request: { query: TEAMS_QUERY }, result: { data: { teams } } }];

    renderWithProviders(<TeamsPage />, { mocks });

    expect(await screen.findByText('Man City')).toBeInTheDocument();
    expect(screen.getByText('Arsenal')).toBeInTheDocument();
  });

  it('clicking a team shows the detail panel with win/draw/loss/points and strength fields', async () => {
    const user = userEvent.setup();
    const mocks = [
      { request: { query: TEAMS_QUERY }, result: { data: { teams } } },
      {
        request: { query: TEAM_QUERY, variables: { id: 1 } },
        result: { data: { team: teamDetail } },
      },
    ];

    renderWithProviders(<TeamsPage />, { mocks, route: '/teams' });

    await screen.findByText('Man City');
    await user.click(screen.getByText('Man City'));

    expect(await screen.findByText('Team details: Man City')).toBeInTheDocument();
    expect(screen.getByText('Win')).toBeInTheDocument();
    expect(screen.getByText('Draw')).toBeInTheDocument();
    expect(screen.getByText('Loss')).toBeInTheDocument();
    expect(screen.getByText('Points')).toBeInTheDocument();
    expect(screen.getByText('Strength Attack (H)')).toBeInTheDocument();
    expect(screen.getByText('1350')).toBeInTheDocument();
  });
});
