const { test, expect } = require('@playwright/test');

const players = [
  {
    id: 1,
    firstName: 'Erling',
    lastName: 'Haaland',
    webName: 'Haaland',
    teamId: 1,
    position: 'FWD',
    nowCost: 14,
    totalPoints: 210,
    form: '8.2',
    status: 'a',
    selectedByPercent: '55.1',
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
  {
    id: 2,
    firstName: 'Bukayo',
    lastName: 'Saka',
    webName: 'Saka',
    teamId: 2,
    position: 'MID',
    nowCost: 10,
    totalPoints: 180,
    form: '7.2',
    status: 'a',
    selectedByPercent: '38.1',
    goals: 12,
    assists: 10,
    minutes: 2700,
    cleanSheets: 5,
    yellowCards: 2,
    redCards: 0,
    bps: 400,
    bonusPoints: 25,
    influence: '120.3',
    creativity: '150.5',
    threat: '180.2',
    ictIndex: '55.0',
    influenceRank: 10,
    creativityRank: 3,
    threatRank: 5,
    ictIndexRank: 3,
    expectedGoals: '10.20',
    expectedAssists: '9.10',
    expectedGoalInvolvements: '19.30',
    costChangeEvent: 0,
    costChangeStart: 2,
    news: null,
    chanceOfPlayingThisRound: null,
    chanceOfPlayingNextRound: null,
    transfersInEvent: 30000,
    transfersOutEvent: 8000,
  },
];

const teams = [
  {
    id: 1,
    name: 'Man City',
    shortName: 'MCI',
    strength: 5,
    form: 'W',
    position: 1,
    win: 20,
    draw: 5,
    loss: 5,
    points: 65,
    strengthOverallHome: 1280,
    strengthOverallAway: 1250,
    strengthAttackHome: 1350,
    strengthAttackAway: 1300,
    strengthDefenceHome: 1210,
    strengthDefenceAway: 1200,
  },
  {
    id: 2,
    name: 'Arsenal',
    shortName: 'ARS',
    strength: 4,
    form: 'W',
    position: 2,
    win: 18,
    draw: 6,
    loss: 6,
    points: 60,
    strengthOverallHome: 1230,
    strengthOverallAway: 1200,
    strengthAttackHome: 1280,
    strengthAttackAway: 1250,
    strengthDefenceHome: 1180,
    strengthDefenceAway: 1160,
  },
];

const fixtures = [
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
];

const events = [
  {
    id: 1,
    name: 'Gameweek 1',
    deadlineTime: '2026-08-10T17:30:00Z',
    averageEntryScore: null,
    finished: false,
    dataChecked: true,
    isCurrent: true,
    isNext: false,
    isPrevious: false,
  },
];

function responseFor(operationName, variables) {
  switch (operationName) {
    case 'Dashboard':
      return {
        data: {
          players,
          teams,
          fixtures,
          events,
          topScorers: [players[0]],
          mostTransferred: [players[0]],
        },
      };
    case 'Players':
      return {
        data: {
          players: players.filter((player) => {
            const search = variables?.search?.toLowerCase() || '';
            return !(search && !player.webName.toLowerCase().includes(search));
          }),
        },
      };
    case 'Player':
      return {
        data: {
          player: players.find((player) => player.id === variables.id) || null,
        },
      };
    case 'Teams':
      return { data: { teams } };
    case 'Team':
      return {
        data: {
          team: teams.find((team) => team.id === variables.id) || null,
        },
      };
    case 'Fixtures':
      return {
        data: {
          fixtures: fixtures.filter((fixture) => {
            if (variables?.eventId && fixture.event !== variables.eventId) {
              return false;
            }
            if (
              variables?.teamId &&
              fixture.teamH !== variables.teamId &&
              fixture.teamA !== variables.teamId
            ) {
              return false;
            }
            return true;
          }),
        },
      };
    case 'Fixture':
      return {
        data: {
          fixture: fixtures.find((fixture) => fixture.id === variables.id) || null,
        },
      };
    case 'PlayersByIds':
      return {
        data: {
          playersByIds: players.filter((p) => (variables?.ids || []).includes(p.id)),
        },
      };
    case 'Events':
      return { data: { events } };
    case 'Event':
      return {
        data: {
          event: events.find((event) => event.id === variables.id) || null,
        },
      };
    default:
      return { data: {} };
  }
}

test.beforeEach(async ({ page }) => {
  await page.route('**/graphql', async (route) => {
    const payload = route.request().postDataJSON();
    const body = responseFor(payload.operationName, payload.variables || {});
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });
});

test('players search flow @smoke', async ({ page }) => {
  await page.goto('/players');
  await expect(page.getByRole('heading', { name: 'Players' })).toBeVisible();
  await page.getByLabel('Search player').fill('Haaland');
  await expect(page.getByText('Haaland')).toBeVisible();
});

test('player detail panel shows stats @smoke', async ({ page }) => {
  await page.goto('/players?selected=1');
  await expect(page.getByText('Player details: Haaland')).toBeVisible();
  await expect(page.getByText('Goals')).toBeVisible();
  await expect(page.getByText('xG', { exact: true })).toBeVisible();
});

test('teams list to detail flow @smoke', async ({ page }) => {
  await page.goto('/teams');
  await page.getByText('Arsenal').click();
  await expect(page.getByText('Team details: Arsenal')).toBeVisible();
  await expect(page.getByText('Win')).toBeVisible();
  await expect(page.getByText('Strength Attack (H)')).toBeVisible();
});

test('fixtures filter by gameweek @smoke', async ({ page }) => {
  await page.goto('/fixtures');
  await page.getByLabel('Gameweek').click();
  await page.getByRole('option', { name: 'Gameweek 1' }).click();
  await expect(page.getByText(/Aug/)).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Score' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Home' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Away' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'MCI' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'ARS' })).toBeVisible();
});

test('events render and detail view @smoke', async ({ page }) => {
  await page.goto('/events');
  await page.getByText('Gameweek 1').click();
  await expect(page.getByText('Gameweek details: Gameweek 1')).toBeVisible();
});

test('api-down error state @smoke', async ({ page }) => {
  await page.unroute('**/graphql');
  await page.route('**/graphql', async (route) => {
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ errors: [{ message: 'upstream down' }] }),
    });
  });

  await page.goto('/events');
  await expect(page.getByRole('alert')).toContainText('Unable to load data');
});

test('dashboard gameweek widgets @smoke', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Top Scorers this Gameweek')).toBeVisible();
  await expect(page.getByText('Most Transferred In')).toBeVisible();
  await expect(page.getByText(/Haaland/).first()).toBeVisible();
});

test('players column sort updates aria-sort @smoke', async ({ page }) => {
  await page.goto('/players');
  await expect(page.getByText('Haaland')).toBeVisible();
  await page.getByRole('button', { name: /total points/i }).click();
  await expect(page.locator('[aria-sort="descending"]').first()).toBeVisible();
});

test('player comparison panel shows two players @smoke', async ({ page }) => {
  await page.goto('/players?compare=1,2');
  await expect(page.getByText('Player Comparison')).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Haaland' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Saka' })).toBeVisible();
});
