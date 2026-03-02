const { filterPlayers, filterFixtures } = require('../src/utils/filter');
const { paginate } = require('../src/utils/paginate');

describe('filterPlayers', () => {
  const players = [
    {
      id: 1,
      firstName: 'Erling',
      lastName: 'Haaland',
      webName: 'Haaland',
      teamId: 1,
      position: 'FWD',
    },
    { id: 2, firstName: 'Bukayo', lastName: 'Saka', webName: 'Saka', teamId: 2, position: 'MID' },
  ];

  it('filters by text search', () => {
    const filtered = filterPlayers(players, { search: 'haal', position: null, teamId: null });
    expect(filtered).toEqual([players[0]]);
  });

  it('filters by team and position', () => {
    const filtered = filterPlayers(players, { teamId: 2, position: 'mid', search: '' });
    expect(filtered).toEqual([players[1]]);
  });
});

describe('filterFixtures', () => {
  const fixtures = [
    { id: 1, event: 1, teamH: 1, teamA: 2, finished: false },
    { id: 2, event: 2, teamH: 3, teamA: 4, finished: true },
  ];

  it('filters by event and finished state', () => {
    const filtered = filterFixtures(fixtures, { eventId: 2, finished: true, teamId: null });
    expect(filtered).toEqual([fixtures[1]]);
  });

  it('filters by team id across home and away', () => {
    const filtered = filterFixtures(fixtures, { teamId: 2, finished: undefined, eventId: null });
    expect(filtered).toEqual([fixtures[0]]);
  });
});

describe('paginate', () => {
  it('returns a bounded slice', () => {
    const items = [1, 2, 3, 4, 5];
    expect(paginate(items, 2, 1)).toEqual([2, 3]);
  });

  it('applies safe defaults when limit and offset are invalid', () => {
    const items = Array.from({ length: 100 }, (_v, i) => i + 1);
    const paged = paginate(items, 'x', 'x');
    expect(paged.length).toBe(50);
    expect(paged[0]).toBe(1);
  });
});
