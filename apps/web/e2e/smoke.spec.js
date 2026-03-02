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
    selectedByPercent: '55.1'
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
    selectedByPercent: '38.1'
  }
];

const teams = [
  { id: 1, name: 'Man City', shortName: 'MCI', strength: 5, form: 'W', position: 1 },
  { id: 2, name: 'Arsenal', shortName: 'ARS', strength: 4, form: 'W', position: 2 }
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
    teamADifficulty: 3
  }
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
    isPrevious: false
  }
];

function responseFor(operationName, variables) {
  switch (operationName) {
    case 'Dashboard':
      return {
        data: {
          players,
          teams,
          fixtures,
          events
        }
      };
    case 'Players':
      return {
        data: {
          players: players.filter((player) => {
            const search = variables?.search?.toLowerCase() || '';
            if (search && !player.webName.toLowerCase().includes(search)) {
              return false;
            }
            return true;
          })
        }
      };
    case 'Player':
      return {
        data: {
          player: players.find((player) => player.id === variables.id) || null
        }
      };
    case 'Teams':
      return { data: { teams } };
    case 'Team':
      return {
        data: {
          team: teams.find((team) => team.id === variables.id) || null
        }
      };
    case 'Fixtures':
      return {
        data: {
          fixtures: fixtures.filter((fixture) => {
            if (variables?.eventId && fixture.event !== variables.eventId) {
              return false;
            }
            if (variables?.teamId && fixture.teamH !== variables.teamId && fixture.teamA !== variables.teamId) {
              return false;
            }
            return true;
          })
        }
      };
    case 'Fixture':
      return {
        data: {
          fixture: fixtures.find((fixture) => fixture.id === variables.id) || null
        }
      };
    case 'Events':
      return { data: { events } };
    case 'Event':
      return {
        data: {
          event: events.find((event) => event.id === variables.id) || null
        }
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
      body: JSON.stringify(body)
    });
  });
});

test('players search flow @smoke', async ({ page }) => {
  await page.goto('/players');
  await expect(page.getByRole('heading', { name: 'Players' })).toBeVisible();
  await page.getByLabel('Search player').fill('Haaland');
  await expect(page.getByText('Haaland')).toBeVisible();
});

test('teams list to detail flow @smoke', async ({ page }) => {
  await page.goto('/teams');
  await page.getByText('Arsenal').click();
  await expect(page.getByText('Team details: Arsenal')).toBeVisible();
});

test('fixtures filter by gameweek @smoke', async ({ page }) => {
  await page.goto('/fixtures');
  await page.getByLabel('Gameweek').click();
  await page.getByRole('option', { name: 'Gameweek 1' }).click();
  await expect(page.getByText('2026-08-12T15:00:00Z')).toBeVisible();
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
      body: JSON.stringify({ errors: [{ message: 'upstream down' }] })
    });
  });

  await page.goto('/events');
  await expect(page.getByRole('alert')).toContainText('Unable to load data');
});
