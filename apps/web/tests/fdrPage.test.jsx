import { screen, within } from '@testing-library/react';
import { FdrPage } from '../src/pages/FdrPage';
import { FDR_FIXTURES_QUERY, TEAMS_QUERY } from '../src/lib/queries';
import { renderWithProviders } from './testUtils';
import { theme } from '../src/theme';

const teamsData = [
  { id: 1, name: 'Man City', shortName: 'MCI', strength: 5, form: 'W', position: 1 },
  { id: 2, name: 'Arsenal', shortName: 'ARS', strength: 4, form: 'W', position: 2 },
];

// 5 fixtures: ARS (id=2) is always home with teamHDifficulty=4,
// MCI (id=1) is always away with teamADifficulty=2.
// → MCI aggregate=10 (avg=2.0, isEasyRun), ARS aggregate=20 (avg=4.0, isHardRun)
const fixturesData = [
  {
    id: 1,
    event: 1,
    kickoffTime: '2026-08-12T15:00:00Z',
    teamH: 2,
    teamA: 1,
    teamHDifficulty: 4,
    teamADifficulty: 2,
  },
  {
    id: 2,
    event: 2,
    kickoffTime: '2026-08-19T15:00:00Z',
    teamH: 2,
    teamA: 1,
    teamHDifficulty: 4,
    teamADifficulty: 2,
  },
  {
    id: 3,
    event: 3,
    kickoffTime: '2026-08-26T15:00:00Z',
    teamH: 2,
    teamA: 1,
    teamHDifficulty: 4,
    teamADifficulty: 2,
  },
  {
    id: 4,
    event: 4,
    kickoffTime: '2026-09-02T15:00:00Z',
    teamH: 2,
    teamA: 1,
    teamHDifficulty: 4,
    teamADifficulty: 2,
  },
  {
    id: 5,
    event: 5,
    kickoffTime: '2026-09-09T15:00:00Z',
    teamH: 2,
    teamA: 1,
    teamHDifficulty: 4,
    teamADifficulty: 2,
  },
];

function makeDefaultMocks(fixtures = fixturesData, teams = teamsData) {
  return [
    { request: { query: FDR_FIXTURES_QUERY }, result: { data: { fixtures } } },
    { request: { query: TEAMS_QUERY }, result: { data: { teams } } },
  ];
}

describe('FdrPage', () => {
  it('shows loading state while queries are in-flight', () => {
    renderWithProviders(<FdrPage />, { mocks: makeDefaultMocks(), route: '/fdr' });
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('shows error state when a query fails', async () => {
    const mocks = [
      { request: { query: FDR_FIXTURES_QUERY }, error: new Error('upstream error') },
      { request: { query: TEAMS_QUERY }, result: { data: { teams: teamsData } } },
    ];
    renderWithProviders(<FdrPage />, { mocks, route: '/fdr' });
    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load data');
  });

  it('shows empty state when no fixtures are returned', async () => {
    renderWithProviders(<FdrPage />, { mocks: makeDefaultMocks([]), route: '/fdr' });
    expect(await screen.findByText('No upcoming fixtures found.')).toBeInTheDocument();
  });

  it('renders team short names in rows', async () => {
    renderWithProviders(<FdrPage />, { mocks: makeDefaultMocks(), route: '/fdr' });
    expect(await screen.findByText('MCI')).toBeInTheDocument();
    expect(screen.getByText('ARS')).toBeInTheDocument();
  });

  it('sorts easier team (lower aggregate) before harder team', async () => {
    renderWithProviders(<FdrPage />, { mocks: makeDefaultMocks(), route: '/fdr' });
    await screen.findByText('MCI');
    const rows = screen.getAllByRole('row');
    // rows[0] = header row; rows[1] = first data row; rows[2] = second data row
    expect(rows[1]).toHaveTextContent('MCI'); // aggregate=10 (easier)
    expect(rows[2]).toHaveTextContent('ARS'); // aggregate=20 (harder)
  });

  it('shows (H) indicator for home fixtures', async () => {
    renderWithProviders(<FdrPage />, { mocks: makeDefaultMocks(), route: '/fdr' });
    await screen.findByText('MCI');
    // ARS is always home (teamH=2) — cells should contain "(H)"
    const arsRow = screen.getByTestId('fdr-row-ARS');
    expect(arsRow).toHaveTextContent('(H)');
  });

  it('shows (A) indicator for away fixtures', async () => {
    renderWithProviders(<FdrPage />, { mocks: makeDefaultMocks(), route: '/fdr' });
    await screen.findByText('MCI');
    // MCI is always away (teamA=1) — cells should contain "(A)"
    const mciRow = screen.getByTestId('fdr-row-MCI');
    expect(mciRow).toHaveTextContent('(A)');
  });

  it('shows correct aggregate difficulty in the Total column', async () => {
    renderWithProviders(<FdrPage />, { mocks: makeDefaultMocks(), route: '/fdr' });
    await screen.findByText('MCI');
    // MCI: 5 fixtures × difficulty 2 = 10
    expect(within(screen.getByTestId('fdr-row-MCI')).getByTestId('fdr-total')).toHaveTextContent(
      '10'
    );
    // ARS: 5 fixtures × difficulty 4 = 20
    expect(within(screen.getByTestId('fdr-row-ARS')).getByTestId('fdr-total')).toHaveTextContent(
      '20'
    );
  });

  it('easy run row (avgDifficulty ≤ 2.5) is rendered with correct aggregate', async () => {
    renderWithProviders(<FdrPage />, { mocks: makeDefaultMocks(), route: '/fdr' });
    await screen.findByText('MCI');
    // MCI avg=2.0 → isEasyRun; verify row and total are present
    const mciRow = screen.getByTestId('fdr-row-MCI');
    expect(within(mciRow).getByTestId('fdr-total')).toHaveTextContent('10');
  });

  it('hard run row (avgDifficulty > 3.5) is rendered with correct aggregate', async () => {
    renderWithProviders(<FdrPage />, { mocks: makeDefaultMocks(), route: '/fdr' });
    await screen.findByText('ARS');
    // ARS avg=4.0 → isHardRun; verify row and total are present
    const arsRow = screen.getByTestId('fdr-row-ARS');
    expect(within(arsRow).getByTestId('fdr-total')).toHaveTextContent('20');
  });

  it('renders Window label for the window selector', async () => {
    renderWithProviders(<FdrPage />, { mocks: makeDefaultMocks(), route: '/fdr' });
    await screen.findByText('MCI');
    expect(screen.getAllByText('Window').length).toBeGreaterThan(0);
  });

  it('defaults to window=5 rendering 7 column headers (Team + 5 slots + Total)', async () => {
    renderWithProviders(<FdrPage />, { mocks: makeDefaultMocks(), route: '/fdr' });
    await screen.findByText('MCI');
    expect(screen.getAllByRole('columnheader')).toHaveLength(7);
  });

  it('uses window=3 from URL param rendering 5 column headers (Team + 3 slots + Total)', async () => {
    renderWithProviders(<FdrPage />, { mocks: makeDefaultMocks(), route: '/fdr?window=3' });
    await screen.findByText('MCI');
    expect(screen.getAllByRole('columnheader')).toHaveLength(5);
  });

  it('renders dash placeholder cells when team has fewer fixtures than window', async () => {
    const sparseFixtures = [
      {
        id: 1,
        event: 1,
        kickoffTime: '2026-08-12T15:00:00Z',
        teamH: 2,
        teamA: 1,
        teamHDifficulty: 3,
        teamADifficulty: 3,
      },
      {
        id: 2,
        event: 2,
        kickoffTime: '2026-08-19T15:00:00Z',
        teamH: 2,
        teamA: 1,
        teamHDifficulty: 3,
        teamADifficulty: 3,
      },
    ];
    renderWithProviders(<FdrPage />, { mocks: makeDefaultMocks(sparseFixtures), route: '/fdr' });
    await screen.findByText('MCI');
    // Default window=5, MCI has 2 fixtures → 3 placeholder cells
    const mciRow = screen.getByTestId('fdr-row-MCI');
    expect(within(mciRow).getAllByTestId('fdr-placeholder')).toHaveLength(3);
  });

  it('clamps invalid window param (window=99) to default 5', async () => {
    renderWithProviders(<FdrPage />, { mocks: makeDefaultMocks(), route: '/fdr?window=99' });
    await screen.findByText('MCI');
    // window=99 is not in WINDOW_OPTIONS [3,5,8] → clamped to 5 → 7 headers (Team + 5 + Total)
    expect(screen.getAllByRole('columnheader')).toHaveLength(7);
  });

  it('clamps invalid window param (window=0) to default 5', async () => {
    renderWithProviders(<FdrPage />, { mocks: makeDefaultMocks(), route: '/fdr?window=0' });
    await screen.findByText('MCI');
    // window=0 is not in WINDOW_OPTIONS [3,5,8] → clamped to 5 → 7 headers (Team + 5 + Total)
    expect(screen.getAllByRole('columnheader')).toHaveLength(7);
  });

  it('shows empty state when teams resolves empty but fixtures are present', async () => {
    const mocks = [
      { request: { query: FDR_FIXTURES_QUERY }, result: { data: { fixtures: fixturesData } } },
      { request: { query: TEAMS_QUERY }, result: { data: { teams: [] } } },
    ];
    renderWithProviders(<FdrPage />, { mocks, route: '/fdr' });
    expect(await screen.findByText('No upcoming fixtures found.')).toBeInTheDocument();
  });

  it('neutral run row (avgDifficulty 3.0) renders without easy or hard highlight', async () => {
    const neutralFixtures = [
      {
        id: 1,
        event: 1,
        kickoffTime: '2026-08-12T15:00:00Z',
        teamH: 2,
        teamA: 1,
        teamHDifficulty: 3,
        teamADifficulty: 3,
      },
      {
        id: 2,
        event: 2,
        kickoffTime: '2026-08-19T15:00:00Z',
        teamH: 2,
        teamA: 1,
        teamHDifficulty: 3,
        teamADifficulty: 3,
      },
      {
        id: 3,
        event: 3,
        kickoffTime: '2026-08-26T15:00:00Z',
        teamH: 2,
        teamA: 1,
        teamHDifficulty: 3,
        teamADifficulty: 3,
      },
      {
        id: 4,
        event: 4,
        kickoffTime: '2026-09-02T15:00:00Z',
        teamH: 2,
        teamA: 1,
        teamHDifficulty: 3,
        teamADifficulty: 3,
      },
      {
        id: 5,
        event: 5,
        kickoffTime: '2026-09-09T15:00:00Z',
        teamH: 2,
        teamA: 1,
        teamHDifficulty: 3,
        teamADifficulty: 3,
      },
    ];
    renderWithProviders(<FdrPage />, { mocks: makeDefaultMocks(neutralFixtures), route: '/fdr' });
    await screen.findByText('MCI');
    // avg difficulty = 3.0 → not ≤ 2.5 (easy) and not > 3.5 (hard) → rowBg = 'inherit'
    const mciRow = screen.getByTestId('fdr-row-MCI');
    expect(mciRow).not.toHaveStyle({ backgroundColor: theme.palette.success.light });
    expect(mciRow).not.toHaveStyle({ backgroundColor: theme.palette.error.light });
  });
});
