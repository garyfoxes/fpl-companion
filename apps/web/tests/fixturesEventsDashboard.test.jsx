import { screen } from '@testing-library/react';
import { DashboardPage } from '../src/pages/DashboardPage';
import { EventsPage } from '../src/pages/EventsPage';
import { FixturesPage } from '../src/pages/FixturesPage';
import {
  DASHBOARD_QUERY,
  EVENT_QUERY,
  EVENTS_QUERY,
  FIXTURE_QUERY,
  FIXTURES_QUERY,
  TEAMS_QUERY,
} from '../src/lib/queries';
import { renderWithProviders } from './testUtils';

describe('DashboardPage', () => {
  it('renders summary stats', async () => {
    const mocks = [
      {
        request: { query: DASHBOARD_QUERY },
        result: {
          data: {
            players: [{ id: 1 }],
            teams: [{ id: 1, name: 'Man City' }],
            fixtures: [{ id: 1 }],
            events: [
              { id: 1, name: 'Gameweek 1', isCurrent: true, isNext: false },
              { id: 2, name: 'Gameweek 2', isCurrent: false, isNext: true },
            ],
            topScorers: [{ id: 1, webName: 'Haaland', totalPoints: 210 }],
            mostTransferred: [{ id: 1, webName: 'Haaland', transfersInEvent: 50000 }],
          },
        },
      },
    ];

    renderWithProviders(<DashboardPage />, { mocks });

    expect(await screen.findByText('Current gameweek status')).toBeInTheDocument();
    expect(screen.getByText('Current: Gameweek 1')).toBeInTheDocument();
    expect(screen.getByText('Next: Gameweek 2')).toBeInTheDocument();
    expect(await screen.findByText('Top Scorers this Gameweek')).toBeInTheDocument();
    expect((await screen.findAllByText(/Haaland/)).length).toBeGreaterThan(0);
    expect(await screen.findByText('Most Transferred In')).toBeInTheDocument();
  });
});

describe('FixturesPage', () => {
  it('renders fixture list and detail panel', async () => {
    const mocks = [
      {
        request: {
          query: FIXTURES_QUERY,
          variables: { eventId: null, teamId: null, finished: null, limit: 300, offset: 0 },
        },
        result: {
          data: {
            fixtures: [
              {
                id: 1,
                event: 1,
                kickoffTime: '2026-08-12T15:00:00Z',
                teamH: 1,
                teamA: 2,
                teamHScore: null,
                teamAScore: null,
                finished: false,
                started: false,
                teamHDifficulty: 2,
                teamADifficulty: 3,
              },
            ],
          },
        },
      },
      {
        request: {
          query: TEAMS_QUERY,
        },
        result: {
          data: {
            teams: [
              { id: 1, name: 'Man City', shortName: 'MCI', strength: 5, form: null, position: 1 },
              { id: 2, name: 'Arsenal', shortName: 'ARS', strength: 4, form: null, position: 2 },
            ],
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
                deadlineTime: null,
                averageEntryScore: null,
                finished: false,
                dataChecked: true,
                isCurrent: true,
                isNext: false,
                isPrevious: false,
              },
            ],
          },
        },
      },
      {
        request: {
          query: FIXTURE_QUERY,
          variables: { id: 1 },
        },
        result: {
          data: {
            fixture: {
              id: 1,
              event: 1,
              kickoffTime: '2026-08-12T15:00:00Z',
              teamH: 1,
              teamA: 2,
              teamHScore: null,
              teamAScore: null,
              finished: false,
              started: false,
              teamHDifficulty: 2,
              teamADifficulty: 3,
            },
          },
        },
      },
    ];

    renderWithProviders(<FixturesPage />, { mocks, route: '/fixtures?selected=1' });

    expect(await screen.findByText('Fixture details: #1')).toBeInTheDocument();
    expect(screen.getByText(/Aug/)).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Score' })).toBeInTheDocument();
    expect(screen.getByText('–')).toBeInTheDocument();
    expect(screen.getByText('MCI')).toBeInTheDocument();
    expect(screen.getByText('ARS')).toBeInTheDocument();
  });

  it('falls back to raw team ID when team is not in teams list', async () => {
    const mocks = [
      {
        request: {
          query: FIXTURES_QUERY,
          variables: { eventId: null, teamId: null, finished: null, limit: 300, offset: 0 },
        },
        result: {
          data: {
            fixtures: [
              {
                id: 10,
                event: 1,
                kickoffTime: '2026-08-12T15:00:00Z',
                teamH: 99,
                teamA: null,
                teamHScore: null,
                teamAScore: null,
                finished: false,
                started: false,
                teamHDifficulty: 2,
                teamADifficulty: 3,
              },
            ],
          },
        },
      },
      {
        request: { query: TEAMS_QUERY },
        result: { data: { teams: [] } },
      },
      {
        request: { query: EVENTS_QUERY },
        result: {
          data: {
            events: [
              {
                id: 1,
                name: 'Gameweek 1',
                deadlineTime: null,
                averageEntryScore: null,
                finished: false,
                dataChecked: true,
                isCurrent: true,
                isNext: false,
                isPrevious: false,
              },
            ],
          },
        },
      },
    ];

    renderWithProviders(<FixturesPage />, { mocks, route: '/fixtures' });

    expect(await screen.findByText('99')).toBeInTheDocument();
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('shows final score for a finished fixture', async () => {
    const mocks = [
      {
        request: {
          query: FIXTURES_QUERY,
          variables: { eventId: null, teamId: null, finished: null, limit: 300, offset: 0 },
        },
        result: {
          data: {
            fixtures: [
              {
                id: 5,
                event: 1,
                kickoffTime: '2026-08-12T15:00:00Z',
                teamH: 1,
                teamA: 2,
                teamHScore: 2,
                teamAScore: 1,
                finished: true,
                started: true,
                teamHDifficulty: 2,
                teamADifficulty: 3,
              },
            ],
          },
        },
      },
      {
        request: { query: TEAMS_QUERY },
        result: {
          data: {
            teams: [
              { id: 1, name: 'Man City', shortName: 'MCI', strength: 5, form: null, position: 1 },
              { id: 2, name: 'Arsenal', shortName: 'ARS', strength: 4, form: null, position: 2 },
            ],
          },
        },
      },
      {
        request: { query: EVENTS_QUERY },
        result: {
          data: {
            events: [
              {
                id: 1,
                name: 'Gameweek 1',
                deadlineTime: null,
                averageEntryScore: null,
                finished: false,
                dataChecked: true,
                isCurrent: true,
                isNext: false,
                isPrevious: false,
              },
            ],
          },
        },
      },
    ];

    renderWithProviders(<FixturesPage />, { mocks, route: '/fixtures' });

    expect(await screen.findByText('2 – 1')).toBeInTheDocument();
  });

  it('renders H Diff and A Diff columns with colored chips', async () => {
    const mocks = [
      {
        request: {
          query: FIXTURES_QUERY,
          variables: { eventId: null, teamId: null, finished: null, limit: 300, offset: 0 },
        },
        result: {
          data: {
            fixtures: [
              {
                id: 1,
                event: 1,
                kickoffTime: '2026-08-12T15:00:00Z',
                teamH: 1,
                teamA: 2,
                teamHScore: null,
                teamAScore: null,
                finished: false,
                started: false,
                teamHDifficulty: 3,
                teamADifficulty: null,
              },
            ],
          },
        },
      },
      { request: { query: TEAMS_QUERY }, result: { data: { teams: [] } } },
      {
        request: { query: EVENTS_QUERY },
        result: {
          data: {
            events: [
              {
                id: 1,
                name: 'Gameweek 1',
                deadlineTime: null,
                averageEntryScore: null,
                finished: false,
                dataChecked: true,
                isCurrent: true,
                isNext: false,
                isPrevious: false,
              },
            ],
          },
        },
      },
    ];

    renderWithProviders(<FixturesPage />, { mocks, route: '/fixtures' });

    expect(await screen.findByRole('columnheader', { name: 'H Diff' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'A Diff' })).toBeInTheDocument();
    // Difficulty 3 renders a chip with the number
    expect(await screen.findByText('3')).toBeInTheDocument();
    // Null difficulty renders a dash
    expect(screen.getAllByText('–').length).toBeGreaterThan(0);
  });
});

describe('EventsPage', () => {
  it('renders event list and selected detail', async () => {
    const mocks = [
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
                deadlineTime: '2026-08-10T17:30:00Z',
                averageEntryScore: 55,
                finished: false,
                dataChecked: true,
                isCurrent: true,
                isNext: false,
                isPrevious: false,
              },
            ],
          },
        },
      },
      {
        request: {
          query: EVENT_QUERY,
          variables: { id: 1 },
        },
        result: {
          data: {
            event: {
              id: 1,
              name: 'Gameweek 1',
              deadlineTime: '2026-08-10T17:30:00Z',
              averageEntryScore: 55,
              finished: false,
              dataChecked: true,
              isCurrent: true,
              isNext: false,
              isPrevious: false,
            },
          },
        },
      },
    ];

    renderWithProviders(<EventsPage />, { mocks, route: '/events?selected=1' });

    expect(await screen.findByText('Gameweek details: Gameweek 1')).toBeInTheDocument();
    expect(screen.getAllByText(/Aug/).length).toBeGreaterThan(0);
  });

  it('shows TBC in detail panel when deadlineTime is null', async () => {
    const mocks = [
      {
        request: { query: EVENTS_QUERY },
        result: {
          data: {
            events: [
              {
                id: 2,
                name: 'Gameweek 2',
                deadlineTime: null,
                averageEntryScore: null,
                finished: false,
                dataChecked: false,
                isCurrent: false,
                isNext: true,
                isPrevious: false,
              },
            ],
          },
        },
      },
      {
        request: { query: EVENT_QUERY, variables: { id: 2 } },
        result: {
          data: {
            event: {
              id: 2,
              name: 'Gameweek 2',
              deadlineTime: null,
              averageEntryScore: null,
              finished: false,
              dataChecked: false,
              isCurrent: false,
              isNext: true,
              isPrevious: false,
            },
          },
        },
      },
    ];

    renderWithProviders(<EventsPage />, { mocks, route: '/events?selected=2' });

    expect(await screen.findByText('Gameweek details: Gameweek 2')).toBeInTheDocument();
    expect(screen.getAllByText('TBC').length).toBeGreaterThan(0);
  });
});
